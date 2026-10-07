'use server';

import { revalidatePath } from 'next/cache';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import { computeMeasurementMetrics } from '@/lib/takeoff/geometry';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import { syncLinkedBoqForMeasurement } from '@/services/takeoff/boq-link';
import { logTakeoffRevision } from '@/services/takeoff/ensure-layers';
import type {
  TakeoffGeometry,
  TakeoffMeasureTool,
  TakeoffMeasurement,
  TakeoffReviewStatus,
} from '@/types/takeoff';
import type { Json } from '@/types/database';

const MEASUREMENT_SELECT = `
  id, project_id, sheet_id, layer_id, takeoff_item_id,
  name, discipline, unit, preset_key,
  tool_type, color, geometry, length_m, area_m2, count_value,
  text_content, notes, scale_id, pixels_per_meter, review_status,
  created_by, created_by_name, created_at, updated_at
`;

function mapMeasurement(row: Record<string, unknown>): TakeoffMeasurement {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    sheet_id: String(row.sheet_id),
    layer_id: (row.layer_id as string | null) ?? null,
    takeoff_item_id: (row.takeoff_item_id as string | null) ?? null,
    name: (row.name as string | null) ?? null,
    discipline: (row.discipline as string | null) ?? null,
    unit: String(row.unit ?? 'm'),
    preset_key: (row.preset_key as string | null) ?? null,
    tool_type: row.tool_type as TakeoffMeasureTool,
    color: String(row.color ?? '#2563eb'),
    geometry: (row.geometry ?? {}) as TakeoffGeometry,
    length_m: row.length_m != null ? Number(row.length_m) : null,
    area_m2: row.area_m2 != null ? Number(row.area_m2) : null,
    count_value: row.count_value != null ? Number(row.count_value) : null,
    text_content: (row.text_content as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    scale_id: (row.scale_id as string | null) ?? null,
    pixels_per_meter:
      row.pixels_per_meter != null ? Number(row.pixels_per_meter) : null,
    review_status: (row.review_status as TakeoffReviewStatus) ?? 'draft',
    created_by: (row.created_by as string | null) ?? null,
    created_by_name: (row.created_by_name as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listTakeoffMeasurements(
  projectId: string,
  sheetId?: string
): Promise<TakeoffMeasurement[]> {
  const supabase = await createClient();
  let query = supabase
    .from('takeoff_measurements')
    .select(MEASUREMENT_SELECT)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (sheetId) query = query.eq('sheet_id', sheetId);

  const { data, error } = await query;
  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      return [];
    }
    // Schema fallback without Phase 2/4 columns
    if (
      error.message.includes('name') ||
      error.message.includes('discipline') ||
      error.message.includes('review_status') ||
      error.message.includes('schema cache')
    ) {
      const legacy = await supabase
        .from('takeoff_measurements')
        .select(
          'id, project_id, sheet_id, layer_id, takeoff_item_id, tool_type, color, geometry, length_m, area_m2, count_value, text_content, notes, scale_id, pixels_per_meter, created_by, created_at, updated_at'
        )
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });
      return (legacy.data ?? []).map((row) =>
        mapMeasurement({
          ...row,
          name: null,
          discipline: null,
          unit: 'm',
          preset_key: null,
          created_by_name: null,
          review_status: 'draft',
        })
      );
    }
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapMeasurement(row as Record<string, unknown>));
}

export async function createTakeoffMeasurement(input: {
  projectId: string;
  sheetId: string;
  layerId: string | null;
  toolType: TakeoffMeasureTool;
  color: string;
  geometry: TakeoffGeometry;
  name?: string | null;
  discipline?: string | null;
  unit?: string;
  presetKey?: string | null;
  notes?: string;
  textContent?: string;
  pixelsPerMeter?: number | null;
  scaleId?: string | null;
}): Promise<{ success: boolean; error?: string; measurement?: TakeoffMeasurement }> {
  let profile;
  try {
    profile = await requireProvisionedUserProfile();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unauthorized',
    };
  }

  const metrics = computeMeasurementMetrics(
    input.toolType,
    input.geometry,
    input.pixelsPerMeter ?? null
  );

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('takeoff_measurements')
    .insert({
      project_id: input.projectId,
      sheet_id: input.sheetId,
      layer_id: input.layerId,
      name: input.name ?? null,
      discipline: input.discipline ?? null,
      unit: input.unit ?? 'm',
      preset_key: input.presetKey ?? null,
      tool_type: input.toolType,
      color: input.color,
      geometry: input.geometry as unknown as Json,
      length_m: metrics.length_m,
      area_m2: metrics.area_m2,
      count_value: metrics.count_value,
      text_content: input.textContent ?? input.geometry.text ?? null,
      notes: input.notes ?? null,
      scale_id: input.scaleId ?? null,
      pixels_per_meter: input.pixelsPerMeter ?? null,
      review_status: 'draft',
      created_by: profile.id,
      created_by_name: profile.full_name,
      updated_by: profile.id,
    })
    .select(MEASUREMENT_SELECT)
    .single();

  if (error || !data) {
    // Phase 3 schema fallback without review_status
    if (error?.message.includes('review_status')) {
      const retry = await supabase
        .from('takeoff_measurements')
        .insert({
          project_id: input.projectId,
          sheet_id: input.sheetId,
          layer_id: input.layerId,
          name: input.name ?? null,
          discipline: input.discipline ?? null,
          unit: input.unit ?? 'm',
          preset_key: input.presetKey ?? null,
          tool_type: input.toolType,
          color: input.color,
          geometry: input.geometry as unknown as Json,
          length_m: metrics.length_m,
          area_m2: metrics.area_m2,
          count_value: metrics.count_value,
          text_content: input.textContent ?? input.geometry.text ?? null,
          notes: input.notes ?? null,
          scale_id: input.scaleId ?? null,
          pixels_per_meter: input.pixelsPerMeter ?? null,
          created_by: profile.id,
          created_by_name: profile.full_name,
          updated_by: profile.id,
        })
        .select(
          'id, project_id, sheet_id, layer_id, takeoff_item_id, name, discipline, unit, preset_key, tool_type, color, geometry, length_m, area_m2, count_value, text_content, notes, scale_id, pixels_per_meter, created_by, created_by_name, created_at, updated_at'
        )
        .single();
      if (retry.data) {
        return {
          success: true,
          measurement: mapMeasurement({
            ...retry.data,
            review_status: 'draft',
          } as Record<string, unknown>),
        };
      }
    }
    return { success: false, error: error?.message ?? 'Create failed.' };
  }

  await logTakeoffRevision({
    projectId: input.projectId,
    entityType: 'measurement',
    entityId: data.id,
    action: 'measurement.created',
    snapshot: {
      tool_type: input.toolType,
      name: input.name,
      preset_key: input.presetKey,
      metrics,
    },
    actorId: profile.id,
  });

  revalidatePath(ROUTES.projectTakeoff(input.projectId));

  return {
    success: true,
    measurement: mapMeasurement(data as Record<string, unknown>),
  };
}

export async function updateTakeoffMeasurement(input: {
  projectId: string;
  measurementId: string;
  patch: {
    name?: string | null;
    layer_id?: string | null;
    discipline?: string | null;
    color?: string;
    unit?: string;
    notes?: string | null;
    review_status?: TakeoffReviewStatus;
    geometry?: TakeoffGeometry;
    /** When geometry changes, pass ppm so metrics recompute accurately. */
    pixels_per_meter?: number | null;
  };
}): Promise<{ success: boolean; error?: string; measurement?: TakeoffMeasurement }> {
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

  let metricPatch: Record<string, unknown> = {};
  if (input.patch.geometry) {
    const { data: existing } = await supabase
      .from('takeoff_measurements')
      .select('tool_type, pixels_per_meter')
      .eq('id', input.measurementId)
      .eq('project_id', input.projectId)
      .is('deleted_at', null)
      .maybeSingle();

    if (existing) {
      const ppm =
        input.patch.pixels_per_meter ??
        (existing.pixels_per_meter != null
          ? Number(existing.pixels_per_meter)
          : null);
      const metrics = computeMeasurementMetrics(
        String(existing.tool_type),
        input.patch.geometry,
        ppm
      );
      metricPatch = {
        length_m: metrics.length_m,
        area_m2: metrics.area_m2,
        count_value: metrics.count_value,
        geometry: input.patch.geometry as unknown as Json,
        pixels_per_meter: ppm,
      };
    }
  }

  const { geometry: _geom, pixels_per_meter: _ppm, ...rest } = input.patch;
  void _geom;
  void _ppm;

  const { data, error } = await supabase
    .from('takeoff_measurements')
    .update({
      ...rest,
      ...metricPatch,
      updated_by: profile.id,
    })
    .eq('id', input.measurementId)
    .eq('project_id', input.projectId)
    .is('deleted_at', null)
    .select(MEASUREMENT_SELECT)
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Update failed.' };
  }

  await logTakeoffRevision({
    projectId: input.projectId,
    entityType: 'measurement',
    entityId: input.measurementId,
    action: 'measurement.updated',
    snapshot: {
      ...rest,
      metrics: metricPatch,
    } as Record<string, unknown>,
    actorId: profile.id,
  });

  // Phase 5 — live BOQ quantity sync when geometry/metrics change
  if (input.patch.geometry || metricPatch.length_m !== undefined) {
    await syncLinkedBoqForMeasurement({
      projectId: input.projectId,
      measurementId: input.measurementId,
      actorId: profile.id,
    });
  }

  revalidatePath(ROUTES.projectTakeoff(input.projectId));
  revalidatePath(ROUTES.projectBoq(input.projectId));
  return {
    success: true,
    measurement: mapMeasurement(data as Record<string, unknown>),
  };
}

/** Persist a full measurement row after local engine edit (metrics already computed). */
export async function persistTakeoffMeasurementGeometry(input: {
  projectId: string;
  measurement: TakeoffMeasurement;
}): Promise<{ success: boolean; error?: string; measurement?: TakeoffMeasurement }> {
  return updateTakeoffMeasurement({
    projectId: input.projectId,
    measurementId: input.measurement.id,
    patch: {
      geometry: input.measurement.geometry,
      pixels_per_meter: input.measurement.pixels_per_meter,
    },
  });
}

export async function softDeleteTakeoffMeasurement(input: {
  projectId: string;
  measurementId: string;
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
    .from('takeoff_measurements')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: profile.id,
    })
    .eq('id', input.measurementId)
    .eq('project_id', input.projectId);

  if (error) return { success: false, error: error.message };

  // Soft-delete BOQ link and resync remaining measurements on that BOQ
  const { data: link } = await supabase
    .from('takeoff_boq_links')
    .select('id, boq_id')
    .eq('project_id', input.projectId)
    .eq('measurement_id', input.measurementId)
    .is('deleted_at', null)
    .maybeSingle();

  if (link) {
    await supabase
      .from('takeoff_boq_links')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', link.id);
    const { syncBoqQuantityFromTakeoff } = await import(
      '@/services/takeoff/boq-link'
    );
    await syncBoqQuantityFromTakeoff({
      projectId: input.projectId,
      boqId: String(link.boq_id),
      actorId: profile.id,
    });
  }

  await logTakeoffRevision({
    projectId: input.projectId,
    entityType: 'measurement',
    entityId: input.measurementId,
    action: 'measurement.deleted',
    actorId: profile.id,
  });

  revalidatePath(ROUTES.projectTakeoff(input.projectId));
  revalidatePath(ROUTES.projectBoq(input.projectId));
  return { success: true };
}
