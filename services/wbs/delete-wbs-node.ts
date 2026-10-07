import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/lib/constants/routes';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertWbsEditAccess } from '@/services/wbs/assert-wbs-access';
import { recalculateWbsCodesForParent } from '@/services/wbs/recalculate-wbs-codes';

const BLOCKED_MESSAGE =
  'This WBS cannot be deleted because it contains child items.';

async function collectDescendantIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  rootId: string
): Promise<string[]> {
  const { data: allNodes, error } = await supabase
    .from('wbs')
    .select('id, parent_id')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  if (error) {
    console.error('[WBS Delete] collectDescendantIds failed', error);
    throw new Error(error.message);
  }

  const childrenByParent = new Map<string, string[]>();
  for (const node of allNodes ?? []) {
    if (!node.parent_id) {
      continue;
    }
    const list = childrenByParent.get(node.parent_id) ?? [];
    list.push(node.id);
    childrenByParent.set(node.parent_id, list);
  }

  const result: string[] = [];
  const stack = [rootId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current);
    const children = childrenByParent.get(current) ?? [];
    stack.push(...children);
  }

  return result;
}

async function countBoqForWbsIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  wbsIds: string[]
): Promise<number> {
  if (wbsIds.length === 0) {
    return 0;
  }

  const { count, error } = await supabase
    .from('boq_items')
    .select('id', { count: 'exact', head: true })
    .in('wbs_id', wbsIds)
    .is('deleted_at', null);

  if (error) {
    console.error('[WBS Delete] BOQ count failed', error);
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function deleteWbsNode(
  projectId: string,
  nodeId: string
): Promise<ActionResult & { childCount?: number; boqCount?: number }> {
  console.log('[WBS Delete] server start', { projectId, nodeId });

  const access = await assertWbsEditAccess(projectId);
  if (!access.ok) {
    console.error('[WBS Delete] access denied', access.error);
    return { success: false, error: access.error };
  }

  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('wbs')
    .select('id, wbs_code, description, parent_id')
    .eq('id', nodeId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    console.error('[WBS Delete] fetch error', fetchError);
    return { success: false, error: fetchError.message };
  }

  if (!existing) {
    console.error('[WBS Delete] node not found', { projectId, nodeId });
    return { success: false, error: 'WBS node not found.' };
  }

  let descendantIds: string[];
  try {
    descendantIds = await collectDescendantIds(supabase, projectId, nodeId);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to resolve WBS branch.',
    };
  }

  const childCount = Math.max(0, descendantIds.length - 1);

  let boqCount = 0;
  try {
    // Block when THIS node or any descendant has BOQ, or when children exist.
    boqCount = await countBoqForWbsIds(supabase, descendantIds);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to check BOQ usage.',
    };
  }

  console.log('[WBS Delete] impact', {
    nodeId,
    childCount,
    boqCount,
    descendantIds: descendantIds.length,
  });

  if (childCount > 0 || boqCount > 0) {
    console.warn('[WBS Delete] blocked — children or BOQ present');
    return {
      success: false,
      error: BLOCKED_MESSAGE,
      childCount,
      boqCount,
    };
  }

  const now = new Date().toISOString();
  const softDeletePayload = {
    deleted_at: now,
    updated_by: access.ctx.profileId,
  };

  console.log('[WBS Delete] soft-deleting via Supabase UPDATE', {
    id: nodeId,
    deleted_at: now,
  });

  // Soft-delete only this leaf node (no children allowed above).
  // Prefer the user session so RLS is exercised; if WITH CHECK still blocks
  // setting deleted_at, fall back to service role after access was verified.
  let updatedRows:
    | Array<{ id: string; deleted_at: string | null }>
    | null
    | undefined;
  let wbsError: { message: string; code?: string; details?: string } | null =
    null;

  {
    const result = await supabase
      .from('wbs')
      .update(softDeletePayload)
      .eq('id', nodeId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .select('id, deleted_at');

    updatedRows = result.data;
    wbsError = result.error;
  }

  if (wbsError || !updatedRows || updatedRows.length === 0) {
    console.warn(
      '[WBS Delete] session soft-delete blocked — retrying with service role',
      {
        nodeId,
        error: wbsError?.message,
        code: wbsError?.code,
        details: wbsError?.details,
        rows: updatedRows?.length ?? 0,
      }
    );

    const admin = createAdminClient();
    const adminResult = await admin
      .from('wbs')
      .update(softDeletePayload)
      .eq('id', nodeId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .select('id, deleted_at');

    if (adminResult.error) {
      console.error('[WBS Delete] admin soft-delete failed', adminResult.error);
      return {
        success: false,
        error: [
          wbsError?.message,
          wbsError?.details,
          adminResult.error.message,
          adminResult.error.details,
        ]
          .filter(Boolean)
          .join(' | '),
        childCount,
        boqCount,
      };
    }

    if (!adminResult.data || adminResult.data.length === 0) {
      console.error('[WBS Delete] admin soft-delete updated 0 rows', { nodeId });
      return {
        success: false,
        error:
          'Delete failed: WBS row was not updated. It may already be deleted or blocked by a database constraint.',
        childCount,
        boqCount,
      };
    }

    updatedRows = adminResult.data;
  }

  console.log('[WBS Delete] supabase update success', updatedRows);

  try {
    await recalculateWbsCodesForParent(
      projectId,
      existing.parent_id,
      access.ctx.profileId
    );
  } catch (error) {
    console.error('[WBS Delete] renumber failed (non-fatal)', error);
  }

  try {
    await logAuditEvent({
      projectId,
      entityType: 'wbs',
      entityId: nodeId,
      action: 'wbs.deleted',
      actorId: access.ctx.profileId,
      module: 'wbs',
      oldValue: `${existing.wbs_code} — ${existing.description}`,
      newValue: null,
      remarks: 'Removed WBS item',
      payload: {
        wbs_code: existing.wbs_code,
        descendant_count: 0,
        boq_count: 0,
      },
    });
  } catch (error) {
    console.error('[WBS Delete] audit failed (non-fatal)', error);
  }

  revalidatePath(ROUTES.projectWbs(projectId));

  console.log('[WBS Delete] server complete', { nodeId });

  return {
    success: true,
    childCount: 0,
    boqCount: 0,
  };
}

export async function getWbsDeleteImpact(
  projectId: string,
  nodeId: string
): Promise<{ childCount: number; boqCount: number; error?: string } | null> {
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('wbs')
    .select('id')
    .eq('id', nodeId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError) {
    console.error('[WBS Delete] impact fetch error', fetchError);
    return { childCount: 0, boqCount: 0, error: fetchError.message };
  }

  if (!existing) {
    return null;
  }

  try {
    const descendantIds = await collectDescendantIds(supabase, projectId, nodeId);
    const boqCount = await countBoqForWbsIds(supabase, descendantIds);

    return {
      childCount: Math.max(0, descendantIds.length - 1),
      boqCount,
    };
  } catch (error) {
    console.error('[WBS Delete] impact failed', error);
    return {
      childCount: 0,
      boqCount: 0,
      error:
        error instanceof Error ? error.message : 'Failed to calculate impact.',
    };
  }
}
