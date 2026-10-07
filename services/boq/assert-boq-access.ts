import { requireUserProfile } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { canEditWbs } from '@/types/wbs';
import { isProjectStatus } from '@/types/project';
import type { ProjectStatus } from '@/types/project';

export interface BoqProjectContext {
  projectId: string;
  status: ProjectStatus;
  isOwner: boolean;
  profileId: string;
}

export async function assertBoqEditAccess(
  projectId: string
): Promise<{ ok: true; ctx: BoqProjectContext } | { ok: false; error: string }> {
  const profile = await requireUserProfile();
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, status, created_by')
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !project) {
    return { ok: false, error: 'Project not found.' };
  }

  const status = isProjectStatus(project.status) ? project.status : 'draft';
  const isOwner = project.created_by === profile.id;

  if (!canEditWbs(profile.role, status, isOwner)) {
    return { ok: false, error: 'You do not have permission to edit BOQ.' };
  }

  return {
    ok: true,
    ctx: {
      projectId,
      status,
      isOwner,
      profileId: profile.id,
    },
  };
}

export async function assertBoqReadAccess(
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !project) {
    return { ok: false, error: 'Project not found.' };
  }

  return { ok: true };
}
