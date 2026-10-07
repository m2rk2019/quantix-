import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertWbsEditAccess } from '@/services/wbs/assert-wbs-access';
import { recalculateWbsCodesForParent } from '@/services/wbs/recalculate-wbs-codes';

import type { WbsDropPosition } from '@/types/wbs';

interface WbsNodeRef {
  id: string;
  parent_id: string | null;
  sort_order: number;
  wbs_code: string;
  level: number;
}

async function collectDescendantIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  rootId: string
): Promise<Set<string>> {
  const { data: allNodes } = await supabase
    .from('wbs')
    .select('id, parent_id')
    .eq('project_id', projectId)
    .is('deleted_at', null);

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
  const stack = [rootId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    result.add(current);
    stack.push(...(childrenByParent.get(current) ?? []));
  }

  return result;
}

async function updateSubtreeLevels(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  rootId: string,
  rootLevel: number,
  profileId: string
): Promise<void> {
  const { data: allNodes } = await supabase
    .from('wbs')
    .select('id, parent_id')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  const childrenByParent = new Map<string, string[]>();
  for (const node of allNodes ?? []) {
    if (!node.parent_id) {
      continue;
    }
    const list = childrenByParent.get(node.parent_id) ?? [];
    list.push(node.id);
    childrenByParent.set(node.parent_id, list);
  }

  const queue: Array<{ id: string; level: number }> = [{ id: rootId, level: rootLevel }];

  while (queue.length > 0) {
    const current = queue.shift()!;

    await supabase
      .from('wbs')
      .update({ level: current.level, updated_by: profileId })
      .eq('id', current.id);

    for (const childId of childrenByParent.get(current.id) ?? []) {
      queue.push({ id: childId, level: current.level + 1 });
    }
  }
}

async function reorderSiblings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  parentId: string | null,
  orderedIds: string[],
  profileId: string
): Promise<void> {
  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index]!;
    await supabase
      .from('wbs')
      .update({ sort_order: index, updated_by: profileId })
      .eq('id', id);
  }
}

async function loadSiblings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  parentId: string | null
): Promise<WbsNodeRef[]> {
  let query = supabase
    .from('wbs')
    .select('id, parent_id, sort_order, wbs_code, level')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  query =
    parentId === null
      ? query.is('parent_id', null)
      : query.eq('parent_id', parentId);

  const { data } = await query;
  return (data ?? []) as WbsNodeRef[];
}

export async function reparentWbsNode(
  projectId: string,
  nodeId: string,
  referenceNodeId: string | null,
  position: WbsDropPosition
): Promise<ActionResult> {
  const access = await assertWbsEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();

  const { data: node, error: nodeError } = await supabase
    .from('wbs')
    .select('id, parent_id, sort_order, wbs_code, level')
    .eq('id', nodeId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (nodeError || !node) {
    return { success: false, error: 'WBS node not found.' };
  }

  const descendants = await collectDescendantIds(supabase, projectId, nodeId);

  let newParentId: string | null;
  let insertIndex: number;

  if (position === 'inside') {
    if (!referenceNodeId) {
      return { success: false, error: 'Invalid drop target.' };
    }
    if (referenceNodeId === nodeId || descendants.has(referenceNodeId)) {
      return { success: false, error: 'Cannot move a node into itself or its descendants.' };
    }

    const { data: target } = await supabase
      .from('wbs')
      .select('id')
      .eq('id', referenceNodeId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .maybeSingle();

    if (!target) {
      return { success: false, error: 'Drop target not found.' };
    }

    newParentId = referenceNodeId;
    const targetSiblings = await loadSiblings(supabase, projectId, newParentId);
    insertIndex = targetSiblings.filter((sibling) => sibling.id !== nodeId).length;
  } else {
    if (!referenceNodeId) {
      return { success: false, error: 'Invalid drop target.' };
    }

    const { data: reference } = await supabase
      .from('wbs')
      .select('id, parent_id, sort_order')
      .eq('id', referenceNodeId)
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .maybeSingle();

    if (!reference) {
      return { success: false, error: 'Drop target not found.' };
    }

    if (referenceNodeId === nodeId || descendants.has(referenceNodeId)) {
      return { success: false, error: 'Cannot move a node relative to itself or its descendants.' };
    }

    newParentId = reference.parent_id;
    const siblings = (await loadSiblings(supabase, projectId, newParentId)).filter(
      (sibling) => sibling.id !== nodeId
    );
    const referenceIndex = siblings.findIndex((sibling) => sibling.id === referenceNodeId);
    insertIndex = position === 'before' ? referenceIndex : referenceIndex + 1;
  }

  const oldParentId = node.parent_id;
  const newParentLevel =
    newParentId === null
      ? 0
      : (
          await supabase
            .from('wbs')
            .select('level')
            .eq('id', newParentId)
            .maybeSingle()
        ).data?.level ?? 0;

  const newLevel = newParentLevel + 1;

  const newSiblings = (await loadSiblings(supabase, projectId, newParentId)).filter(
    (sibling) => sibling.id !== nodeId
  );
  const orderedIds = newSiblings.map((sibling) => sibling.id);
  orderedIds.splice(insertIndex, 0, nodeId);

  await supabase
    .from('wbs')
    .update({
      parent_id: newParentId,
      updated_by: access.ctx.profileId,
    })
    .eq('id', nodeId);

  await reorderSiblings(supabase, projectId, newParentId, orderedIds, access.ctx.profileId);
  await updateSubtreeLevels(supabase, projectId, nodeId, newLevel, access.ctx.profileId);

  if (oldParentId !== newParentId) {
    const oldSiblings = (await loadSiblings(supabase, projectId, oldParentId)).filter(
      (sibling) => sibling.id !== nodeId
    );
    await reorderSiblings(
      supabase,
      projectId,
      oldParentId,
      oldSiblings.map((sibling) => sibling.id),
      access.ctx.profileId
    );
    await recalculateWbsCodesForParent(projectId, oldParentId, access.ctx.profileId);
  }

  await recalculateWbsCodesForParent(projectId, newParentId, access.ctx.profileId);

  await logAuditEvent({
    projectId,
    entityType: 'wbs',
    entityId: nodeId,
    action: 'wbs.reordered',
    actorId: access.ctx.profileId,
    module: 'wbs',
    oldValue: node.wbs_code,
    newValue: node.wbs_code,
    remarks: `Moved branch (${position})`,
    payload: { position, wbs_code: node.wbs_code },
  });

  revalidatePath(ROUTES.projectWbs(projectId));

  return { success: true };
}
