'use server';

import { revalidatePath } from 'next/cache';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { logTakeoffRevision } from '@/services/takeoff/ensure-layers';
import type { TakeoffLayer, TakeoffScale, TakeoffSheet } from '@/types/takeoff';
import type { Json } from '@/types/database';

export async function listTakeoffLayers(
  projectId: string
): Promise<TakeoffLayer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('takeoff_layers')
    .select(
      'id, project_id, name, color, is_visible, is_locked, opacity, sort_order, is_system'
    )
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (error) {
    if (
      error.message.includes('does not exist') ||
      error.code === '42P01' ||
      error.message.includes('opacity') ||
      error.message.includes('schema cache')
    ) {
      const legacy = await supabase
        .from('takeoff_layers')
        .select(
          'id, project_id, name, color, is_visible, is_locked, sort_order, is_system'
        )
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });
      return (legacy.data ?? []).map((l) => ({
        ...(l as Omit<TakeoffLayer, 'opacity'>),
        opacity: 1,
      }));
    }
    throw new Error(error.message);
  }
  return (data ?? []).map((l) => ({
    ...(l as TakeoffLayer),
    opacity:
      (l as { opacity?: number | null }).opacity != null
        ? Number((l as { opacity?: number | null }).opacity)
        : 1,
  }));
}

export async function updateTakeoffLayerVisibility(input: {
  projectId: string;
  layerId: string;
  is_visible: boolean;
}): Promise<{ success: boolean; error?: string }> {
  return updateTakeoffLayer({
    projectId: input.projectId,
    layerId: input.layerId,
    patch: { is_visible: input.is_visible },
  });
}

export async function updateTakeoffLayer(input: {
  projectId: string;
  layerId: string;
  patch: {
    is_visible?: boolean;
    is_locked?: boolean;
    color?: string;
    opacity?: number;
    name?: string;
  };
}): Promise<{ success: boolean; error?: string; layer?: TakeoffLayer }> {
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
    .from('takeoff_layers')
    .update({
      ...input.patch,
      updated_by: profile.id,
    })
    .eq('id', input.layerId)
    .eq('project_id', input.projectId)
    .select(
      'id, project_id, name, color, is_visible, is_locked, opacity, sort_order, is_system'
    )
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Update failed.' };
  }
  revalidatePath(ROUTES.projectTakeoff(input.projectId));
  return {
    success: true,
    layer: {
      ...(data as TakeoffLayer),
      opacity:
        (data as { opacity?: number | null }).opacity != null
          ? Number((data as { opacity?: number | null }).opacity)
          : 1,
    },
  };
}

export async function saveSheetCalibration(input: {
  projectId: string;
  sheetId: string;
  pixelsPerMeter: number;
  scaleName?: string;
  rotationDegrees?: 0 | 90 | 180 | 270;
}): Promise<{ success: boolean; error?: string; sheet?: TakeoffSheet }> {
  let profile;
  try {
    profile = await requireProvisionedUserProfile();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  if (!(input.pixelsPerMeter > 0)) {
    return { success: false, error: 'Invalid calibration.' };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('takeoff_sheets')
    .select('id, scales, rotation_degrees')
    .eq('id', input.sheetId)
    .eq('project_id', input.projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!existing) {
    return { success: false, error: 'Sheet not found.' };
  }

  const prevScales = Array.isArray(existing.scales)
    ? (existing.scales as unknown as TakeoffScale[])
    : [];
  const scaleId = crypto.randomUUID();
  const nextScales: TakeoffScale[] = [
    ...prevScales.map((s) => ({ ...s, is_active: false })),
    {
      id: scaleId,
      name: input.scaleName?.trim() || `Scale ${prevScales.length + 1}`,
      pixels_per_meter: input.pixelsPerMeter,
      is_active: true,
    },
  ];

  const { data: sheet, error } = await supabase
    .from('takeoff_sheets')
    .update({
      pixels_per_meter: input.pixelsPerMeter,
      scales: nextScales as unknown as Json,
      rotation_degrees:
        input.rotationDegrees ?? existing.rotation_degrees ?? 0,
      updated_by: profile.id,
    })
    .eq('id', input.sheetId)
    .eq('project_id', input.projectId)
    .select(
      'id, drawing_id, project_id, sheet_index, sheet_name, rotation_degrees, pixels_per_meter, scales, thumbnail_base64, sort_order'
    )
    .single();

  if (error || !sheet) {
    return { success: false, error: error?.message ?? 'Save failed.' };
  }

  await logTakeoffRevision({
    projectId: input.projectId,
    entityType: 'calibration',
    entityId: input.sheetId,
    action: 'sheet.calibrated',
    snapshot: {
      pixels_per_meter: input.pixelsPerMeter,
      scale_id: scaleId,
    },
    actorId: profile.id,
  });

  revalidatePath(ROUTES.projectTakeoff(input.projectId));

  return {
    success: true,
    sheet: {
      ...sheet,
      discipline:
        (existing as { discipline?: string | null }).discipline ?? null,
      rotation_degrees: (sheet.rotation_degrees ?? 0) as 0 | 90 | 180 | 270,
      scales: Array.isArray(sheet.scales)
        ? (sheet.scales as unknown as TakeoffScale[])
        : nextScales,
      pixels_per_meter: Number(sheet.pixels_per_meter),
    },
  };
}

export async function updateSheetRotation(input: {
  projectId: string;
  sheetId: string;
  rotationDegrees: 0 | 90 | 180 | 270;
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
    .from('takeoff_sheets')
    .update({
      rotation_degrees: input.rotationDegrees,
      updated_by: profile.id,
    })
    .eq('id', input.sheetId)
    .eq('project_id', input.projectId);

  if (error) return { success: false, error: error.message };
  revalidatePath(ROUTES.projectTakeoff(input.projectId));
  return { success: true };
}

export async function updateSheetMeta(input: {
  projectId: string;
  sheetId: string;
  sheetName?: string;
  discipline?: string | null;
  thumbnailBase64?: string | null;
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
    .from('takeoff_sheets')
    .update({
      updated_by: profile.id,
      ...(input.sheetName !== undefined ? { sheet_name: input.sheetName } : {}),
      ...(input.discipline !== undefined
        ? { discipline: input.discipline }
        : {}),
      ...(input.thumbnailBase64 !== undefined
        ? { thumbnail_base64: input.thumbnailBase64 }
        : {}),
    })
    .eq('id', input.sheetId)
    .eq('project_id', input.projectId);

  if (error) return { success: false, error: error.message };
  revalidatePath(ROUTES.projectTakeoff(input.projectId));
  return { success: true };
}
