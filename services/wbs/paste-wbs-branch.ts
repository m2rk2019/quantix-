'use server';

import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/lib/constants/routes';
import { buildWbsCode } from '@/lib/wbs/codes';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertWbsEditAccess } from '@/services/wbs/assert-wbs-access';
import { fetchWbsBranch } from '@/services/wbs/fetch-wbs-branch';
import { recalculateWbsCodesForParent } from '@/services/wbs/recalculate-wbs-codes';
import type { WbsClipboardBranch } from '@/types/wbs';

async function insertBranchNode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    projectId: string;
    parentId: string | null;
    parentCode: string | null;
    parentLevel: number;
    sortOrder: number;
    branch: WbsClipboardBranch;
    profileId: string;
  }
): Promise<string> {
  const wbsCode = buildWbsCode(params.parentCode, params.sortOrder + 1);

  const { data: node, error } = await supabase
    .from('wbs')
    .insert({
      project_id: params.projectId,
      parent_id: params.parentId,
      level: params.parentId === null ? 1 : params.parentLevel + 1,
      wbs_code: wbsCode,
      description: params.branch.description,
      sort_order: params.sortOrder,
      created_by: params.profileId,
      updated_by: params.profileId,
    })
    .select('id')
    .single();

  if (error || !node) {
    throw new Error(error?.message ?? 'Failed to paste WBS node.');
  }

  for (let index = 0; index < params.branch.children.length; index += 1) {
    const childLevel = params.parentId === null ? 1 : params.parentLevel + 1;
    await insertBranchNode(supabase, {
      projectId: params.projectId,
      parentId: node.id,
      parentCode: wbsCode,
      parentLevel: childLevel,
      sortOrder: index,
      branch: params.branch.children[index]!,
      profileId: params.profileId,
    });
  }

  return node.id;
}

export async function pasteWbsBranch(
  projectId: string,
  targetParentId: string | null,
  branch: WbsClipboardBranch
): Promise<ActionResult & { rootNodeId?: string }> {
  const access = await assertWbsEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();

  if (targetParentId) {
    const { data: parent } = await supabase
      .from('wbs')
      .select('id, wbs_code, level')
      .eq('id', targetParentId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .maybeSingle();

    if (!parent) {
      return { success: false, error: 'Target parent not found.' };
    }
  }

  let siblingsQuery = supabase
    .from('wbs')
    .select('id')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  siblingsQuery =
    targetParentId === null
      ? siblingsQuery.is('parent_id', null)
      : siblingsQuery.eq('parent_id', targetParentId);

  const { data: siblings } = await siblingsQuery;
  const nextSortOrder = siblings?.length ?? 0;

  let parentCode: string | null = null;
  let parentLevel = 0;

  if (targetParentId) {
    const { data: parent } = await supabase
      .from('wbs')
      .select('wbs_code, level')
      .eq('id', targetParentId)
      .maybeSingle();
    parentCode = parent?.wbs_code ?? null;
    parentLevel = parent?.level ?? 0;
  }

  try {
    const rootNodeId = await insertBranchNode(supabase, {
      projectId,
      parentId: targetParentId,
      parentCode,
      parentLevel: targetParentId ? parentLevel : 0,
      sortOrder: nextSortOrder,
      branch,
      profileId: access.ctx.profileId,
    });

    await recalculateWbsCodesForParent(
      projectId,
      targetParentId,
      access.ctx.profileId
    );

    await logAuditEvent({
      projectId,
      entityType: 'wbs',
      entityId: rootNodeId,
      action: 'wbs.pasted',
      actorId: access.ctx.profileId,
      module: 'wbs',
      oldValue: null,
      newValue: 'WBS branch pasted',
      remarks: targetParentId ? 'Pasted under parent node' : 'Pasted at root',
      payload: { target_parent_id: targetParentId },
    });

    revalidatePath(ROUTES.projectWbs(projectId));

    return { success: true, rootNodeId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Paste failed.',
    };
  }
}

export async function duplicateWbsBranch(
  projectId: string,
  nodeId: string
): Promise<ActionResult & { rootNodeId?: string }> {
  const access = await assertWbsEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();

  const { data: source } = await supabase
    .from('wbs')
    .select('id, parent_id, description')
    .eq('id', nodeId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!source) {
    return { success: false, error: 'WBS node not found.' };
  }

  const branch = await fetchWbsBranch(projectId, nodeId);
  if (!branch) {
    return { success: false, error: 'Failed to read WBS branch.' };
  }

  const duplicated: WbsClipboardBranch = {
    description: `${branch.description} (Copy)`,
    children: branch.children,
  };

  return pasteWbsBranch(projectId, source.parent_id, duplicated);
}
