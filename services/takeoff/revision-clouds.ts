'use server';

import { revalidatePath } from 'next/cache';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logTakeoffRevision } from '@/services/takeoff/ensure-layers';
import type { TakeoffGeometry, TakeoffRevisionCloud } from '@/types/takeoff';
import type { Json } from '@/types/database';

const CLOUD_SELECT = `
  id, project_id, sheet_id, label, color, geometry, notes,
  created_by, created_by_name, created_at, updated_at
`;

function mapCloud(row: Record<string, unknown>): TakeoffRevisionCloud {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    sheet_id: String(row.sheet_id),
    label: (row.label as string | null) ?? null,
    color: String(row.color ?? '#ef4444'),
    geometry: (row.geometry ?? {}) as TakeoffGeometry,
    notes: (row.notes as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_by_name: (row.created_by_name as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listTakeoffRevisionClouds(
  projectId: string,
  sheetId?: string
): Promise<TakeoffRevisionCloud[]> {
  const supabase = await createClient();
  let query = supabase
    .from('takeoff_revision_clouds')
    .select(CLOUD_SELECT)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (sheetId) query = query.eq('sheet_id', sheetId);

  const { data, error } = await query;
  if (error) {
    if (
      error.message.includes('does not exist') ||
      error.code === '42P01' ||
      error.message.includes('schema cache')
    ) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => mapCloud(r as Record<string, unknown>));
}

export async function createTakeoffRevisionCloud(input: {
  projectId: string;
  sheetId: string;
  geometry: TakeoffGeometry;
  label?: string;
  color?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  error?: string;
  cloud?: TakeoffRevisionCloud;
}> {
  let profile;
  try {
    profile = await requireProvisionedUserProfile();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('takeoff_revision_clouds')
    .insert({
      project_id: input.projectId,
      sheet_id: input.sheetId,
      geometry: input.geometry as unknown as Json,
      label: input.label ?? 'Revision',
      color: input.color ?? '#ef4444',
      notes: input.notes ?? null,
      created_by: profile.id,
      created_by_name: profile.full_name,
      updated_by: profile.id,
    })
    .select(CLOUD_SELECT)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Create failed.' };
  }

  await logTakeoffRevision({
    projectId: input.projectId,
    entityType: 'revision_cloud',
    entityId: data.id,
    action: 'revision_cloud.created',
    actorId: profile.id,
  });

  revalidatePath(ROUTES.projectTakeoff(input.projectId));
  return {
    success: true,
    cloud: mapCloud(data as Record<string, unknown>),
  };
}

export async function softDeleteTakeoffRevisionCloud(input: {
  projectId: string;
  cloudId: string;
}): Promise<{ success: boolean; error?: string }> {
  let profile;
  try {
    profile = await requireProvisionedUserProfile();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('takeoff_revision_clouds')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq('id', input.cloudId)
    .eq('project_id', input.projectId);

  if (error) return { success: false, error: error.message };
  revalidatePath(ROUTES.projectTakeoff(input.projectId));
  return { success: true };
}
