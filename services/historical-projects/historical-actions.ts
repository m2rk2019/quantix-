'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireProvisionedUserProfile, requireUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { isAdminOrAbove } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { captureHistoricalArchive } from '@/services/historical-projects/capture-historical-archive';
import { cloneHistoricalProject } from '@/services/historical-projects/clone-historical-project';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import type { ActionResult } from '@/services/projects/create-project';
import { canCreateProjectRole } from '@/types/project';

export async function cloneHistoricalProjectAction(
  historicalProjectId: string,
  formData?: FormData
): Promise<ActionResult> {
  const projectName = formData?.get('project_name');
  const clientName = formData?.get('client_name');
  const location = formData?.get('location');

  return cloneHistoricalProject({
    historicalProjectId,
    project_name:
      typeof projectName === 'string' ? projectName : undefined,
    client_name: typeof clientName === 'string' ? clientName : undefined,
    location: typeof location === 'string' ? location : undefined,
  });
}

export async function cloneHistoricalProjectAndRedirect(
  historicalProjectId: string
): Promise<void> {
  const result = await cloneHistoricalProject({ historicalProjectId });
  if (result.success && result.projectId) {
    redirect(ROUTES.project(result.projectId));
  }
  redirect(
    `${ROUTES.historicalProject(historicalProjectId)}?error=${encodeURIComponent(result.error ?? 'Clone failed')}`
  );
}

export async function archiveProjectToHistoricalAction(
  projectId: string
): Promise<ActionResult> {
  const profile = await requireUserProfile();
  if (!isAdminOrAbove(profile.role) && profile.role !== 'quantity_surveyor') {
    return { success: false, error: 'Permission denied.' };
  }

  const result = await captureHistoricalArchive(projectId, profile.id, {
    trigger: 'manual',
  });

  if (result.success && result.historicalProjectId) {
    await logAuditEvent({
      projectId,
      entityType: 'historical_project',
      entityId: result.historicalProjectId,
      action: 'historical.captured',
      actorId: profile.id,
      module: 'historical',
      remarks: 'Manual historical archive capture',
      payload: { trigger: 'manual' },
    });
  }

  revalidatePath(ROUTES.historical);
  revalidatePath(ROUTES.project(projectId));
  return {
    success: result.success,
    error: result.error,
    projectId: result.historicalProjectId,
  };
}

/** Backfill knowledge from all approved/archived projects missing an active archive. */
export async function syncHistoricalRepositoryAction(): Promise<{
  success: boolean;
  archived: number;
  skipped: number;
  error?: string;
}> {
  let profile;
  try {
    profile = await requireProvisionedUserProfile();
  } catch (error) {
    return {
      success: false,
      archived: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  if (!isAdminOrAbove(profile.role)) {
    return {
      success: false,
      archived: 0,
      skipped: 0,
      error: 'Only admins can sync the historical repository.',
    };
  }

  if (!canCreateProjectRole(profile.role) && !isAdminOrAbove(profile.role)) {
    return {
      success: false,
      archived: 0,
      skipped: 0,
      error: 'Permission denied.',
    };
  }

  const supabase = await createClient();
  const { data: completed, error } = await supabase
    .from('projects')
    .select('id')
    .is('deleted_at', null)
    .in('status', ['approved', 'archived']);

  if (error) {
    return { success: false, archived: 0, skipped: 0, error: error.message };
  }

  let archived = 0;
  let skipped = 0;

  for (const row of completed ?? []) {
    const { data: existing } = await supabase
      .from('historical_projects')
      .select('id')
      .eq('source_project_id', row.id)
      .eq('is_knowledge_active', true)
      .maybeSingle();

    if (existing) {
      skipped += 1;
      continue;
    }

    const result = await captureHistoricalArchive(row.id, profile.id, {
      trigger: 'manual',
    });
    if (result.success && !result.skipped) {
      archived += 1;
    } else {
      skipped += 1;
    }
  }

  revalidatePath(ROUTES.historical);
  return { success: true, archived, skipped };
}
