'use server';

import { revalidatePath } from 'next/cache';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import {
  ensureDefaultTakeoffLayers,
  logTakeoffRevision,
} from '@/services/takeoff/ensure-layers';
import { MAX_TAKEOFF_PDF_BYTES } from '@/types/takeoff';
import type { TakeoffDrawing, TakeoffSheet } from '@/types/takeoff';

export interface UploadTakeoffDrawingResult {
  success: boolean;
  error?: string;
  drawing?: TakeoffDrawing;
  sheets?: TakeoffSheet[];
}

function parsePageCountHint(formData: FormData): number {
  const raw = formData.get('page_count');
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), 200);
}

export async function uploadTakeoffDrawing(
  projectId: string,
  formData: FormData
): Promise<UploadTakeoffDrawingResult> {
  let profile;
  try {
    profile = await requireProvisionedUserProfile();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { success: false, error: 'No PDF file uploaded.' };
  }
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    return { success: false, error: 'Only PDF drawings are supported.' };
  }
  if (file.size > MAX_TAKEOFF_PDF_BYTES) {
    return {
      success: false,
      error: `PDF exceeds ${Math.round(MAX_TAKEOFF_PDF_BYTES / (1024 * 1024))} MB limit.`,
    };
  }

  const title =
    String(formData.get('title') ?? '').trim() ||
    file.name.replace(/\.pdf$/i, '');
  const discipline =
    String(formData.get('discipline') ?? '').trim() || 'General';
  const pageCount = parsePageCountHint(formData);
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentBase64 = buffer.toString('base64');

  const supabase = await createClient();
  await ensureDefaultTakeoffLayers(projectId, profile.id);

  const { data: drawing, error } = await supabase
    .from('takeoff_drawings')
    .insert({
      project_id: projectId,
      title,
      original_filename: file.name,
      mime_type: file.type || 'application/pdf',
      file_size_bytes: file.size,
      content_base64: contentBase64,
      page_count: pageCount,
      discipline,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select(
      'id, project_id, title, original_filename, mime_type, file_size_bytes, page_count, revision_label, notes, discipline, created_by, created_at, updated_at'
    )
    .single();

  if (error || !drawing) {
    if (
      error?.message?.includes('does not exist') ||
      error?.message?.includes('schema cache') ||
      error?.code === '42P01'
    ) {
      return {
        success: false,
        error:
          'Quantity Takeoff tables are not applied yet. Run supabase/fixes/quantity-takeoff-v1-1.sql',
      };
    }
    return { success: false, error: error?.message ?? 'Upload failed.' };
  }

  const sheetRows = Array.from({ length: pageCount }, (_, index) => ({
    drawing_id: drawing.id,
    project_id: projectId,
    sheet_index: index,
    sheet_name: `Sheet ${index + 1}`,
    discipline,
    rotation_degrees: 0,
    scales: [],
    sort_order: index,
    created_by: profile.id,
    updated_by: profile.id,
  }));

  const { data: sheets, error: sheetError } = await supabase
    .from('takeoff_sheets')
    .insert(sheetRows)
    .select(
      'id, drawing_id, project_id, sheet_index, sheet_name, discipline, rotation_degrees, pixels_per_meter, scales, thumbnail_base64, sort_order'
    );

  if (sheetError) {
    return { success: false, error: sheetError.message };
  }

  await logTakeoffRevision({
    projectId,
    entityType: 'drawing',
    entityId: drawing.id,
    action: 'drawing.uploaded',
    snapshot: {
      title: drawing.title,
      filename: drawing.original_filename,
      page_count: pageCount,
    },
    actorId: profile.id,
  });

  revalidatePath(ROUTES.projectTakeoff(projectId));

  return {
    success: true,
    drawing: drawing as TakeoffDrawing,
    sheets: (sheets ?? []).map((s) => ({
      ...s,
      discipline: (s as { discipline?: string | null }).discipline ?? discipline,
      rotation_degrees: (s.rotation_degrees ?? 0) as 0 | 90 | 180 | 270,
      scales: Array.isArray(s.scales)
        ? (s.scales as unknown as TakeoffSheet['scales'])
        : [],
      pixels_per_meter:
        s.pixels_per_meter != null ? Number(s.pixels_per_meter) : null,
    })),
  };
}

export async function listTakeoffDrawings(
  projectId: string
): Promise<TakeoffDrawing[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('takeoff_drawings')
    .select(
      'id, project_id, title, original_filename, mime_type, file_size_bytes, page_count, revision_label, notes, discipline, created_by, created_at, updated_at'
    )
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    if (
      error.message.includes('does not exist') ||
      error.code === '42P01'
    ) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data ?? []).map((row) => ({
    ...row,
    discipline: (row as { discipline?: string | null }).discipline ?? null,
  })) as TakeoffDrawing[];
}

export async function getTakeoffDrawingContent(
  projectId: string,
  drawingId: string
): Promise<{ content_base64: string; mime_type: string } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('takeoff_drawings')
    .select('content_base64, mime_type')
    .eq('id', drawingId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();
  if (!data?.content_base64) return null;
  return {
    content_base64: data.content_base64,
    mime_type: data.mime_type || 'application/pdf',
  };
}

export async function listTakeoffSheets(
  projectId: string,
  drawingId?: string
): Promise<TakeoffSheet[]> {
  const supabase = await createClient();
  let query = supabase
    .from('takeoff_sheets')
    .select(
      'id, drawing_id, project_id, sheet_index, sheet_name, discipline, rotation_degrees, pixels_per_meter, scales, thumbnail_base64, sort_order'
    )
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (drawingId) {
    query = query.eq('drawing_id', drawingId);
  }

  const { data, error } = await query;
  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      return [];
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((s) => ({
    ...s,
    discipline: (s as { discipline?: string | null }).discipline ?? null,
    rotation_degrees: (s.rotation_degrees ?? 0) as 0 | 90 | 180 | 270,
    scales: Array.isArray(s.scales)
      ? (s.scales as unknown as TakeoffSheet['scales'])
      : [],
    pixels_per_meter:
      s.pixels_per_meter != null ? Number(s.pixels_per_meter) : null,
  }));
}
