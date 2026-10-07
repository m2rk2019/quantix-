import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertWbsEditAccess } from '@/services/wbs/assert-wbs-access';
import { recalculateWbsCodesForParent } from '@/services/wbs/recalculate-wbs-codes';

export async function moveWbsNode(
  projectId: string,
  nodeId: string,
  direction: 'up' | 'down'
): Promise<ActionResult> {
  const access = await assertWbsEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();

  const { data: node, error: nodeError } = await supabase
    .from('wbs')
    .select('id, parent_id, sort_order, wbs_code')
    .eq('id', nodeId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (nodeError || !node) {
    return { success: false, error: 'WBS node not found.' };
  }

  let siblingsQuery = supabase
    .from('wbs')
    .select('id, sort_order')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  siblingsQuery =
    node.parent_id === null
      ? siblingsQuery.is('parent_id', null)
      : siblingsQuery.eq('parent_id', node.parent_id);

  const { data: siblings } = await siblingsQuery;

  if (!siblings || siblings.length < 2) {
    return { success: false, error: 'Node cannot be moved.' };
  }

  const currentIndex = siblings.findIndex((sibling) => sibling.id === nodeId);
  const targetIndex =
    direction === 'up' ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= siblings.length) {
    return { success: false, error: 'Node cannot be moved further.' };
  }

  const current = siblings[currentIndex]!;
  const target = siblings[targetIndex]!;

  const { error: firstError } = await supabase
    .from('wbs')
    .update({
      sort_order: target.sort_order,
      updated_by: access.ctx.profileId,
    })
    .eq('id', current.id);

  if (firstError) {
    return { success: false, error: firstError.message };
  }

  const { error: secondError } = await supabase
    .from('wbs')
    .update({
      sort_order: current.sort_order,
      updated_by: access.ctx.profileId,
    })
    .eq('id', target.id);

  if (secondError) {
    return { success: false, error: secondError.message };
  }

  await recalculateWbsCodesForParent(
    projectId,
    node.parent_id,
    access.ctx.profileId
  );

  await logAuditEvent({
    projectId,
    entityType: 'wbs',
    entityId: nodeId,
    action: 'wbs.reordered',
    actorId: access.ctx.profileId,
    module: 'wbs',
    oldValue: node.wbs_code,
    newValue: node.wbs_code,
    remarks: `Moved ${direction}`,
    payload: { direction, wbs_code: node.wbs_code },
  });

  revalidatePath(ROUTES.projectWbs(projectId));

  return { success: true };
}
