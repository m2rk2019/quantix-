import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertWbsEditAccess } from '@/services/wbs/assert-wbs-access';
import type { UpdateWbsNodeInput } from '@/types/wbs';

export async function updateWbsNode(
  projectId: string,
  nodeId: string,
  input: UpdateWbsNodeInput
): Promise<ActionResult> {
  const access = await assertWbsEditAccess(projectId);
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

  const { data: existing, error: fetchError } = await supabase
    .from('wbs')
    .select('id, wbs_code, description')
    .eq('id', nodeId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: 'WBS node not found.' };
  }

  const { error } = await supabase
    .from('wbs')
    .update({
      description,
      updated_by: access.ctx.profileId,
    })
    .eq('id', nodeId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditEvent({
    projectId,
    entityType: 'wbs',
    entityId: nodeId,
    action: 'wbs.updated',
    actorId: access.ctx.profileId,
    module: 'wbs',
    oldValue: existing.description,
    newValue: description,
    remarks: `WBS ${existing.wbs_code}`,
    payload: { wbs_code: existing.wbs_code, field: 'description' },
  });

  revalidatePath(ROUTES.projectWbs(projectId));
  revalidatePath(ROUTES.projectAudit(projectId));

  return { success: true };
}
