import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/lib/constants/routes';
import { buildWbsCode } from '@/lib/wbs/codes';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertWbsEditAccess } from '@/services/wbs/assert-wbs-access';
import type { CreateWbsNodeInput } from '@/types/wbs';

export async function createWbsNode(
  input: CreateWbsNodeInput
): Promise<ActionResult & { nodeId?: string }> {
  const access = await assertWbsEditAccess(input.project_id);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const description = input.description.trim();
  if (!description) {
    return { success: false, error: 'Description is required.' };
  }

  if (description.length > 500) {
    return { success: false, error: 'Description must be 500 characters or less.' };
  }

  const supabase = await createClient();
  const parentId = input.parent_id ?? null;

  if (parentId) {
    const { data: parent } = await supabase
      .from('wbs')
      .select('id, project_id, level, wbs_code')
      .eq('id', parentId)
      .eq('project_id', input.project_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!parent) {
      return { success: false, error: 'Parent WBS node not found.' };
    }
  }

  let siblingsQuery = supabase
    .from('wbs')
    .select('id, sort_order')
    .eq('project_id', input.project_id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  siblingsQuery =
    parentId === null
      ? siblingsQuery.is('parent_id', null)
      : siblingsQuery.eq('parent_id', parentId);

  const { data: siblings } = await siblingsQuery;
  const nextSortOrder = siblings?.length ?? 0;
  const nextIndex = nextSortOrder + 1;

  let parentCode: string | null = null;
  let level = 1;

  if (parentId) {
    const { data: parent } = await supabase
      .from('wbs')
      .select('wbs_code, level')
      .eq('id', parentId)
      .maybeSingle();
    parentCode = parent?.wbs_code ?? null;
    level = (parent?.level ?? 0) + 1;
  }

  const wbsCode = buildWbsCode(parentCode, nextIndex);

  const { data: node, error } = await supabase
    .from('wbs')
    .insert({
      project_id: input.project_id,
      parent_id: parentId,
      level,
      wbs_code: wbsCode,
      description,
      sort_order: nextSortOrder,
      created_by: access.ctx.profileId,
      updated_by: access.ctx.profileId,
    })
    .select('id')
    .single();

  if (error || !node) {
    return { success: false, error: error?.message ?? 'Failed to create WBS node.' };
  }

  await logAuditEvent({
    projectId: input.project_id,
    entityType: 'wbs',
    entityId: node.id,
    action: 'wbs.created',
    actorId: access.ctx.profileId,
    module: 'wbs',
    oldValue: null,
    newValue: `${wbsCode} — ${description}`,
    payload: { wbs_code: wbsCode },
  });

  revalidatePath(ROUTES.projectWbs(input.project_id));

  return { success: true, nodeId: node.id };
}
