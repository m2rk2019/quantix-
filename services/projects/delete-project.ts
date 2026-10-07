'use server';

import { revalidatePath } from 'next/cache';

import { requireUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { canDeleteProject } from '@/types/project';

import type { ActionResult } from '@/services/projects/create-project';

export async function deleteProject(projectId: string): Promise<ActionResult> {
  const profile = await requireUserProfile();
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('projects')
    .select('id, project_code, status, created_by')
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: 'Project not found.' };
  }

  const isOwner = existing.created_by === profile.id;

  if (!canDeleteProject(profile.role, isOwner)) {
    return { success: false, error: 'You do not have permission to delete this project.' };
  }

  if (existing.status === 'for_review') {
    return {
      success: false,
      error: 'Projects in review cannot be deleted. Reject the review first.',
    };
  }

  const { error } = await supabase
    .from('projects')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq('id', projectId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditEvent({
    projectId,
    entityType: 'project',
    entityId: projectId,
    action: 'project.deleted',
    actorId: profile.id,
    module: 'lifecycle',
    oldValue: existing.project_code,
    newValue: null,
    remarks: `Status was ${existing.status}`,
    payload: {
      project_code: existing.project_code,
      project_status: existing.status,
    },
  });

  revalidatePath(ROUTES.projects);
  revalidatePath(ROUTES.dashboard);

  return { success: true };
}
