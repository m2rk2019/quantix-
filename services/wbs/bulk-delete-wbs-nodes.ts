import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/lib/constants/routes';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertWbsEditAccess } from '@/services/wbs/assert-wbs-access';
import type { Json } from '@/types/database';

export interface BulkDeleteWbsResult extends ActionResult {
  deletedCount?: number;
  boqCount?: number;
  deletedIds?: string[];
}

interface BulkDeleteRpcPayload {
  wbs_count?: number;
  boq_count?: number;
  deleted_ids?: string[] | null;
}

function parseRpcPayload(data: unknown): BulkDeleteRpcPayload | null {
  if (!data || typeof data !== 'object') {
    return null;
  }
  return data as BulkDeleteRpcPayload;
}

async function collectDescendantIdsAdmin(
  projectId: string,
  rootIds: string[]
): Promise<string[]> {
  const admin = createAdminClient();
  const { data: allNodes, error } = await admin
    .from('wbs')
    .select('id, parent_id')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  if (error) {
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

  const result = new Set<string>();
  const stack = [...rootIds];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (result.has(current)) {
      continue;
    }
    result.add(current);
    const children = childrenByParent.get(current) ?? [];
    stack.push(...children);
  }

  return Array.from(result);
}

async function bulkSoftDeleteViaAdmin(
  projectId: string,
  nodeIds: string[],
  actorId: string
): Promise<{ deletedIds: string[]; boqCount: number }> {
  const admin = createAdminClient();
  const targetIds = await collectDescendantIdsAdmin(projectId, nodeIds);

  if (targetIds.length === 0) {
    return { deletedIds: [], boqCount: 0 };
  }

  const now = new Date().toISOString();

  const { data: boqRows, error: boqError } = await admin
    .from('boq_items')
    .update({
      deleted_at: now,
      updated_by: actorId,
    })
    .eq('project_id', projectId)
    .in('wbs_id', targetIds)
    .is('deleted_at', null)
    .select('id');

  if (boqError) {
    throw new Error(boqError.message);
  }

  const { data: wbsRows, error: wbsError } = await admin
    .from('wbs')
    .update({
      deleted_at: now,
      updated_by: actorId,
    })
    .eq('project_id', projectId)
    .in('id', targetIds)
    .is('deleted_at', null)
    .select('id');

  if (wbsError) {
    throw new Error(wbsError.message);
  }

  return {
    deletedIds: (wbsRows ?? []).map((row) => row.id),
    boqCount: boqRows?.length ?? 0,
  };
}

/**
 * Soft-delete selected WBS nodes and all descendants (+ related BOQ) in one call.
 * Prefers `bulk_soft_delete_wbs` RPC (single recursive SQL transaction).
 */
export async function bulkDeleteWbsNodes(
  projectId: string,
  nodeIds: string[]
): Promise<BulkDeleteWbsResult> {
  const uniqueIds = Array.from(new Set(nodeIds.filter(Boolean)));

  console.log('[WBS Bulk Delete] start', {
    projectId,
    selectedCount: uniqueIds.length,
  });

  if (uniqueIds.length === 0) {
    return { success: false, error: 'No WBS items selected.' };
  }

  const access = await assertWbsEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  let deletedIds: string[] = [];
  let boqCount = 0;
  let via: 'rpc' | 'admin' = 'rpc';

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'bulk_soft_delete_wbs',
    {
      p_project_id: projectId,
      p_node_ids: uniqueIds,
    }
  );

  if (rpcError) {
    console.warn(
      '[WBS Bulk Delete] RPC unavailable — falling back to admin batch',
      rpcError.message
    );
    via = 'admin';
    try {
      const fallback = await bulkSoftDeleteViaAdmin(
        projectId,
        uniqueIds,
        access.ctx.profileId
      );
      deletedIds = fallback.deletedIds;
      boqCount = fallback.boqCount;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Bulk delete failed.';
      console.error('[WBS Bulk Delete] admin fallback failed', error);
      return {
        success: false,
        error: [rpcError.message, message].filter(Boolean).join(' | '),
      };
    }
  } else {
    const payload = parseRpcPayload(rpcData);
    deletedIds = Array.isArray(payload?.deleted_ids)
      ? payload.deleted_ids.filter((id): id is string => typeof id === 'string')
      : [];
    boqCount = payload?.boq_count ?? 0;

    // If RPC returned zero unexpectedly, verify via admin path for resilience.
    if (deletedIds.length === 0 && uniqueIds.length > 0) {
      console.warn(
        '[WBS Bulk Delete] RPC returned 0 rows — retrying with admin batch'
      );
      via = 'admin';
      try {
        const fallback = await bulkSoftDeleteViaAdmin(
          projectId,
          uniqueIds,
          access.ctx.profileId
        );
        deletedIds = fallback.deletedIds;
        boqCount = fallback.boqCount;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Bulk delete failed.';
        return { success: false, error: message };
      }
    }
  }

  console.log('[WBS Bulk Delete] complete', {
    via,
    deletedCount: deletedIds.length,
    boqCount,
  });

  if (deletedIds.length === 0) {
    return {
      success: false,
      error: 'No WBS items were deleted. They may already be removed.',
    };
  }

  try {
    await logAuditEvent({
      projectId,
      entityType: 'wbs',
      entityId: uniqueIds[0]!,
      action: 'wbs.bulk_deleted',
      actorId: access.ctx.profileId,
      module: 'wbs',
      oldValue: null,
      newValue: null,
      remarks: `Bulk deleted ${deletedIds.length} WBS item(s)`,
      payload: {
        selected_count: uniqueIds.length,
        deleted_count: deletedIds.length,
        boq_count: boqCount,
        selected_ids: uniqueIds,
      } as Record<string, Json>,
    });
  } catch (error) {
    console.error('[WBS Bulk Delete] audit failed (non-fatal)', error);
  }

  revalidatePath(ROUTES.projectWbs(projectId));

  return {
    success: true,
    deletedCount: deletedIds.length,
    boqCount,
    deletedIds,
  };
}
