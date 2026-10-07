'use server';

import { revalidatePath } from 'next/cache';

import { requireUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { captureHistoricalArchive } from '@/services/historical-projects/capture-historical-archive';
import type { ActionResult } from '@/services/projects/create-project';
import type { Database } from '@/types/database';
import type { ProjectLifecycleAction } from '@/types/project';
import {
  canPerformLifecycleAction,
  getNextStatus,
  isProjectStatus,
} from '@/types/project';

export async function transitionProjectStatus(
  projectId: string,
  action: ProjectLifecycleAction,
  reason?: string
): Promise<ActionResult> {
  const profile = await requireUserProfile();
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('projects')
    .select('id, status, created_by, project_code')
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: 'Project not found.' };
  }

  const currentStatus = isProjectStatus(existing.status)
    ? existing.status
    : 'draft';
  const isOwner = existing.created_by === profile.id;

  if (!canPerformLifecycleAction(profile.role, action, currentStatus, isOwner)) {
    return { success: false, error: 'You do not have permission for this action.' };
  }

  const nextStatus = getNextStatus(action, currentStatus);

  if (!nextStatus) {
    return { success: false, error: 'Invalid status transition.' };
  }

  const requiresReason =
    action === 'reject' || action === 'restore' || action === 'approve';
  if (requiresReason && action !== 'approve' && (!reason || reason.trim().length < 10)) {
    return {
      success: false,
      error: 'A reason of at least 10 characters is required.',
    };
  }

  const now = new Date().toISOString();
  const updatePayload: Database['public']['Tables']['projects']['Update'] = {
    status: nextStatus,
    updated_by: profile.id,
  };

  if (nextStatus === 'for_review') {
    updatePayload.submitted_at = now;
    updatePayload.submitted_by = profile.id;
  }

  if (nextStatus === 'approved') {
    updatePayload.approved_at = now;
    updatePayload.approved_by = profile.id;
  }

  if (nextStatus === 'archived') {
    updatePayload.archived_at = now;
    updatePayload.archived_by = profile.id;
  }

  if (action === 'reject' && nextStatus === 'in_progress') {
    updatePayload.submitted_at = null;
    updatePayload.submitted_by = null;
  }

  if (action === 'restore' && nextStatus === 'approved') {
    updatePayload.archived_at = null;
    updatePayload.archived_by = null;
  }

  if (
    (action === 'reject' && currentStatus === 'for_review') ||
    (action === 'restore' && currentStatus === 'approved')
  ) {
    if (nextStatus === 'in_progress') {
      updatePayload.approved_at = null;
      updatePayload.approved_by = null;
    }
  }

  const { error } = await supabase
    .from('projects')
    .update(updatePayload)
    .eq('id', projectId);

  if (error) {
    return { success: false, error: error.message };
  }

  await logAuditEvent({
    projectId,
    entityType: 'project',
    entityId: projectId,
    action:
      action === 'reject' || action === 'restore'
        ? 'project.status.rollback'
        : `project.status.${nextStatus}`,
    actorId: profile.id,
    module: 'lifecycle',
    oldValue: currentStatus,
    newValue: nextStatus,
    remarks: reason?.trim() ?? null,
    payload: {
      previous_status: currentStatus,
      new_status: nextStatus,
      reason: reason?.trim() ?? null,
      project_code: existing.project_code,
    },
  });

  // Phase 4: completed estimates become reusable company knowledge.
  if (nextStatus === 'approved' || nextStatus === 'archived') {
    const archiveResult = await captureHistoricalArchive(projectId, profile.id, {
      trigger: nextStatus === 'archived' ? 'archived' : 'approved',
    });
    if (archiveResult.success && archiveResult.historicalProjectId) {
      await logAuditEvent({
        projectId,
        entityType: 'historical_project',
        entityId: archiveResult.historicalProjectId,
        action: 'historical.captured',
        actorId: profile.id,
        module: 'historical',
        remarks: `Captured on ${nextStatus}`,
        payload: {
          trigger: nextStatus,
          historical_project_id: archiveResult.historicalProjectId,
        },
      });
      revalidatePath(ROUTES.historical);
    }
  }

  revalidatePath(ROUTES.projects);
  revalidatePath(ROUTES.project(projectId));
  revalidatePath(ROUTES.projectAudit(projectId));

  return { success: true, projectId };
}
