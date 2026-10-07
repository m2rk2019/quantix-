import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { assertProjectRateEditAccess } from '@/services/project-rate-library/assert-project-rate-access';

export async function deleteProjectRateItem(
  projectId: string,
  itemId: string
): Promise<ActionResult> {
  const access = await assertProjectRateEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('project_rate_library_items')
    .update({
      deleted_at: now,
      updated_by: access.ctx.profileId,
    })
    .eq('id', itemId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .select('id, code, description')
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }
  if (!data) {
    return { success: false, error: 'Project rate item not found.' };
  }

  try {
    await logAuditEvent({
      projectId,
      entityType: 'project_rate_library_item',
      entityId: itemId,
      action: 'project_rate.deleted',
      actorId: access.ctx.profileId,
      module: 'project_rate',
      oldValue: `${data.code} — ${data.description}`,
      remarks: 'Soft-deleted project rate resource',
    });
  } catch (auditError) {
    console.error('[Project Rate Library] delete audit failed', auditError);
  }

  return { success: true };
}
