'use server';

import { revalidatePath } from 'next/cache';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logTakeoffRevision } from '@/services/takeoff/ensure-layers';
import type { TakeoffComment } from '@/types/takeoff';

const COMMENT_SELECT = `
  id, project_id, sheet_id, measurement_id, parent_id, body, is_resolved,
  created_by, created_by_name, created_at, updated_at
`;

function mapComment(row: Record<string, unknown>): TakeoffComment {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    sheet_id: (row.sheet_id as string | null) ?? null,
    measurement_id: (row.measurement_id as string | null) ?? null,
    parent_id: (row.parent_id as string | null) ?? null,
    body: String(row.body ?? ''),
    is_resolved: Boolean(row.is_resolved),
    created_by: (row.created_by as string | null) ?? null,
    created_by_name: (row.created_by_name as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listTakeoffComments(
  projectId: string,
  opts?: { measurementId?: string; sheetId?: string }
): Promise<TakeoffComment[]> {
  const supabase = await createClient();
  let query = supabase
    .from('takeoff_comments')
    .select(COMMENT_SELECT)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (opts?.measurementId) {
    query = query.eq('measurement_id', opts.measurementId);
  }
  if (opts?.sheetId) {
    query = query.eq('sheet_id', opts.sheetId);
  }

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
  return (data ?? []).map((r) => mapComment(r as Record<string, unknown>));
}

export async function createTakeoffComment(input: {
  projectId: string;
  body: string;
  sheetId?: string | null;
  measurementId?: string | null;
  parentId?: string | null;
}): Promise<{ success: boolean; error?: string; comment?: TakeoffComment }> {
  let profile;
  try {
    profile = await requireProvisionedUserProfile();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  const body = input.body.trim();
  if (!body) return { success: false, error: 'Comment cannot be empty.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('takeoff_comments')
    .insert({
      project_id: input.projectId,
      sheet_id: input.sheetId ?? null,
      measurement_id: input.measurementId ?? null,
      parent_id: input.parentId ?? null,
      body,
      is_resolved: false,
      created_by: profile.id,
      created_by_name: profile.full_name,
      updated_by: profile.id,
    })
    .select(COMMENT_SELECT)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Create failed.' };
  }

  await logTakeoffRevision({
    projectId: input.projectId,
    entityType: 'comment',
    entityId: data.id,
    action: input.parentId ? 'comment.reply' : 'comment.created',
    actorId: profile.id,
  });

  revalidatePath(ROUTES.projectTakeoff(input.projectId));
  return {
    success: true,
    comment: mapComment(data as Record<string, unknown>),
  };
}

export async function setTakeoffCommentResolved(input: {
  projectId: string;
  commentId: string;
  isResolved: boolean;
}): Promise<{ success: boolean; error?: string; comment?: TakeoffComment }> {
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
    .from('takeoff_comments')
    .update({
      is_resolved: input.isResolved,
      updated_by: profile.id,
    })
    .eq('id', input.commentId)
    .eq('project_id', input.projectId)
    .is('deleted_at', null)
    .select(COMMENT_SELECT)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Update failed.' };
  }

  revalidatePath(ROUTES.projectTakeoff(input.projectId));
  return {
    success: true,
    comment: mapComment(data as Record<string, unknown>),
  };
}
