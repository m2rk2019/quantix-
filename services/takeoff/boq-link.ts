'use server';

import { revalidatePath } from 'next/cache';

import { requireProvisionedUserProfile } from '@/lib/auth/session';
import {
  calculateTotalAmount,
  calculateTotalRate,
  roundCurrency,
} from '@/lib/boq/calculations';
import { ROUTES } from '@/lib/constants/routes';
import { createClient } from '@/lib/supabase/server';
import {
  computeTakeoffBoqDashboard,
  deriveQuantitySource,
  sumLinkedQuantities,
  type BoqQuantitySource,
  type TakeoffBoqDashboardStats,
  type TakeoffBoqValidationIssue,
} from '@/lib/takeoff/boq-sync';
import { logTakeoffRevision } from '@/services/takeoff/ensure-layers';
import type { TakeoffBoqLink, TakeoffMeasurement } from '@/types/takeoff';

const LINK_SELECT = `
  id, project_id, wbs_id, boq_id, measurement_id, created_by, created_at, updated_at
`;

function mapLink(row: Record<string, unknown>): TakeoffBoqLink {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    wbs_id: String(row.wbs_id),
    boq_id: String(row.boq_id),
    measurement_id: String(row.measurement_id),
    created_by: (row.created_by as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapMeasurementLite(row: Record<string, unknown>): TakeoffMeasurement {
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
    tool_type: row.tool_type as TakeoffMeasurement['tool_type'],
    color: String(row.color ?? '#2563eb'),
    geometry: (row.geometry ?? {}) as TakeoffMeasurement['geometry'],
    length_m: row.length_m != null ? Number(row.length_m) : null,
    area_m2: row.area_m2 != null ? Number(row.area_m2) : null,
    count_value: row.count_value != null ? Number(row.count_value) : null,
    text_content: (row.text_content as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    scale_id: (row.scale_id as string | null) ?? null,
    pixels_per_meter:
      row.pixels_per_meter != null ? Number(row.pixels_per_meter) : null,
    review_status:
      (row.review_status as TakeoffMeasurement['review_status']) ?? 'draft',
    created_by: (row.created_by as string | null) ?? null,
    created_by_name: (row.created_by_name as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export async function listTakeoffBoqLinks(
  projectId: string
): Promise<TakeoffBoqLink[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('takeoff_boq_links')
    .select(LINK_SELECT)
    .eq('project_id', projectId)
    .is('deleted_at', null);

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
  return (data ?? []).map((r) => mapLink(r as Record<string, unknown>));
}

export async function listBoqOptionsForTakeoff(projectId: string): Promise<
  Array<{
    id: string;
    wbs_id: string;
    wbs_code: string;
    item_code: string;
    description: string;
    unit: string;
    quantity: number;
    quantity_source: BoqQuantitySource;
  }>
> {
  const supabase = await createClient();
  const primaryItems = await supabase
    .from('boq_items')
    .select(
      'id, wbs_id, item_code, description, unit, quantity, quantity_source, imported_at, source_workbook'
    )
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('item_code', { ascending: true });

  let items = primaryItems.data as Array<Record<string, unknown>> | null;
  if (
    primaryItems.error &&
    (primaryItems.error.message.includes('quantity_source') ||
      primaryItems.error.message.includes('schema cache'))
  ) {
    const legacyItems = await supabase
      .from('boq_items')
      .select(
        'id, wbs_id, item_code, description, unit, quantity, imported_at, source_workbook'
      )
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('item_code', { ascending: true });
    items = legacyItems.data as Array<Record<string, unknown>> | null;
  }

  const [{ data: wbsRows }, links] = await Promise.all([
    supabase
      .from('wbs')
      .select('id, wbs_code')
      .eq('project_id', projectId)
      .is('deleted_at', null),
    listTakeoffBoqLinks(projectId),
  ]);
  const wbsMap = new Map(
    (wbsRows ?? []).map((w) => [w.id, w.wbs_code as string])
  );
  const linkedBoq = new Set(links.map((l) => l.boq_id));

  return (items ?? []).map((r) => ({
    id: String(r.id),
    wbs_id: String(r.wbs_id),
    wbs_code: wbsMap.get(String(r.wbs_id)) ?? '',
    item_code: String(r.item_code),
    description: String(r.description),
    unit: String(r.unit),
    quantity: Number(r.quantity),
    quantity_source: deriveQuantitySource({
      explicit: (r.quantity_source as string | null) ?? null,
      hasTakeoffLinks: linkedBoq.has(String(r.id)),
      importedAt: (r.imported_at as string | null) ?? null,
      sourceWorkbook: (r.source_workbook as string | null) ?? null,
    }),
  }));
}

/** Recalculate BOQ quantity from all linked takeoff measurements. */
export async function syncBoqQuantityFromTakeoff(input: {
  projectId: string;
  boqId: string;
  actorId?: string;
}): Promise<{
  success: boolean;
  error?: string;
  quantity?: number;
  quantity_source?: BoqQuantitySource;
}> {
  const supabase = await createClient();

  const { data: links, error: linkError } = await supabase
    .from('takeoff_boq_links')
    .select('measurement_id')
    .eq('project_id', input.projectId)
    .eq('boq_id', input.boqId)
    .is('deleted_at', null);

  if (linkError) {
    return { success: false, error: linkError.message };
  }

  const measurementIds = (links ?? []).map((l) => String(l.measurement_id));
  let measurements: TakeoffMeasurement[] = [];

  if (measurementIds.length > 0) {
    const { data: meas } = await supabase
      .from('takeoff_measurements')
      .select(
        'id, project_id, sheet_id, layer_id, takeoff_item_id, name, discipline, unit, preset_key, tool_type, color, geometry, length_m, area_m2, count_value, text_content, notes, scale_id, pixels_per_meter, review_status, created_by, created_by_name, created_at, updated_at'
      )
      .eq('project_id', input.projectId)
      .in('id', measurementIds)
      .is('deleted_at', null);
    measurements = (meas ?? []).map((r) =>
      mapMeasurementLite(r as Record<string, unknown>)
    );
  }

  const { data: boq, error: boqFetchError } = await supabase
    .from('boq_items')
    .select(
      'id, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, quantity_source, imported_at, source_workbook'
    )
    .eq('id', input.boqId)
    .eq('project_id', input.projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (boqFetchError || !boq) {
    return {
      success: false,
      error: boqFetchError?.message ?? 'BOQ item not found.',
    };
  }

  const hasLinks = measurements.length > 0;
  const quantity = hasLinks
    ? roundCurrency(sumLinkedQuantities(measurements))
    : Number(boq.quantity);
  const quantity_source: BoqQuantitySource = hasLinks
    ? 'takeoff'
    : deriveQuantitySource({
        explicit: null,
        hasTakeoffLinks: false,
        importedAt: boq.imported_at,
        sourceWorkbook: boq.source_workbook,
      });

  const rates = {
    material_rate: Number(boq.material_rate),
    labor_rate: Number(boq.labor_rate),
    equipment_rate: Number(boq.equipment_rate),
    subcontract_rate: Number(boq.subcontract_rate),
    other_cost_rate: Number(boq.other_cost_rate ?? 0),
  };
  const total_rate = calculateTotalRate(rates);
  const total_amount = calculateTotalAmount(quantity, total_rate);

  const { error: updateError } = await supabase
    .from('boq_items')
    .update({
      quantity,
      total_rate,
      total_amount,
      quantity_source,
      ...(input.actorId ? { updated_by: input.actorId } : {}),
    })
    .eq('id', input.boqId)
    .eq('project_id', input.projectId)
    .is('deleted_at', null);

  if (updateError) {
    // Column may missing before migration — retry without quantity_source
    if (updateError.message.includes('quantity_source')) {
      const { error: retryError } = await supabase
        .from('boq_items')
        .update({
          quantity,
          total_rate,
          total_amount,
          ...(input.actorId ? { updated_by: input.actorId } : {}),
        })
        .eq('id', input.boqId)
        .eq('project_id', input.projectId)
        .is('deleted_at', null);
      if (retryError) return { success: false, error: retryError.message };
    } else {
      return { success: false, error: updateError.message };
    }
  }

  revalidatePath(ROUTES.projectBoq(input.projectId));
  revalidatePath(ROUTES.projectTakeoff(input.projectId));

  return { success: true, quantity, quantity_source };
}

export async function assignMeasurementToBoq(input: {
  projectId: string;
  measurementId: string;
  boqId: string;
}): Promise<{
  success: boolean;
  error?: string;
  link?: TakeoffBoqLink;
  syncedQuantity?: number;
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

  const { data: boq } = await supabase
    .from('boq_items')
    .select('id, wbs_id')
    .eq('id', input.boqId)
    .eq('project_id', input.projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!boq) return { success: false, error: 'BOQ item not found.' };

  const { data: measurement } = await supabase
    .from('takeoff_measurements')
    .select('id')
    .eq('id', input.measurementId)
    .eq('project_id', input.projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!measurement) {
    return { success: false, error: 'Measurement not found.' };
  }

  // Soft-delete any prior link for this measurement, then insert
  await supabase
    .from('takeoff_boq_links')
    .update({ deleted_at: new Date().toISOString() })
    .eq('measurement_id', input.measurementId)
    .eq('project_id', input.projectId)
    .is('deleted_at', null);

  const { data: link, error } = await supabase
    .from('takeoff_boq_links')
    .insert({
      project_id: input.projectId,
      wbs_id: boq.wbs_id,
      boq_id: input.boqId,
      measurement_id: input.measurementId,
      created_by: profile.id,
    })
    .select(LINK_SELECT)
    .single();

  if (error || !link) {
    if (error?.message.includes('takeoff_boq_links_measurement_unique')) {
      return {
        success: false,
        error: 'Duplicate assignment — measurement already linked.',
      };
    }
    return { success: false, error: error?.message ?? 'Assign failed.' };
  }

  const sync = await syncBoqQuantityFromTakeoff({
    projectId: input.projectId,
    boqId: input.boqId,
    actorId: profile.id,
  });

  await logTakeoffRevision({
    projectId: input.projectId,
    entityType: 'boq_link',
    entityId: link.id,
    action: 'boq_link.assigned',
    snapshot: {
      measurement_id: input.measurementId,
      boq_id: input.boqId,
      quantity: sync.quantity,
    },
    actorId: profile.id,
  });

  revalidatePath(ROUTES.projectTakeoff(input.projectId));
  revalidatePath(ROUTES.projectBoq(input.projectId));

  return {
    success: true,
    link: mapLink(link as Record<string, unknown>),
    syncedQuantity: sync.quantity,
  };
}

export async function unassignMeasurementFromBoq(input: {
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
  const { data: existing } = await supabase
    .from('takeoff_boq_links')
    .select('id, boq_id')
    .eq('project_id', input.projectId)
    .eq('measurement_id', input.measurementId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!existing) return { success: true };

  const { error } = await supabase
    .from('takeoff_boq_links')
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (error) return { success: false, error: error.message };

  await syncBoqQuantityFromTakeoff({
    projectId: input.projectId,
    boqId: String(existing.boq_id),
    actorId: profile.id,
  });

  await logTakeoffRevision({
    projectId: input.projectId,
    entityType: 'boq_link',
    entityId: existing.id,
    action: 'boq_link.unassigned',
    actorId: profile.id,
  });

  revalidatePath(ROUTES.projectTakeoff(input.projectId));
  revalidatePath(ROUTES.projectBoq(input.projectId));
  return { success: true };
}

/** After measurement geometry/metrics change — sync parent BOQ if linked. */
export async function syncLinkedBoqForMeasurement(input: {
  projectId: string;
  measurementId: string;
  actorId?: string;
}): Promise<{ success: boolean; quantity?: number; boqId?: string }> {
  const supabase = await createClient();
  const { data: link } = await supabase
    .from('takeoff_boq_links')
    .select('boq_id')
    .eq('project_id', input.projectId)
    .eq('measurement_id', input.measurementId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!link) return { success: true };

  const sync = await syncBoqQuantityFromTakeoff({
    projectId: input.projectId,
    boqId: String(link.boq_id),
    actorId: input.actorId,
  });

  return {
    success: sync.success,
    quantity: sync.quantity,
    boqId: String(link.boq_id),
  };
}

export async function validateTakeoffBoqLinks(
  projectId: string
): Promise<TakeoffBoqValidationIssue[]> {
  const supabase = await createClient();
  const issues: TakeoffBoqValidationIssue[] = [];

  const [links, { data: measurements }, { data: boqItems }] = await Promise.all([
    listTakeoffBoqLinks(projectId),
    supabase
      .from('takeoff_measurements')
      .select('id, name, deleted_at')
      .eq('project_id', projectId),
    supabase
      .from('boq_items')
      .select('id, item_code, deleted_at')
      .eq('project_id', projectId)
      .is('deleted_at', null),
  ]);

  const activeMeas = new Set(
    (measurements ?? [])
      .filter((m) => !m.deleted_at)
      .map((m) => String(m.id))
  );
  const deletedMeas = new Set(
    (measurements ?? [])
      .filter((m) => m.deleted_at)
      .map((m) => String(m.id))
  );
  const linkedMeas = new Set(links.map((l) => l.measurement_id));
  const linkedBoq = new Set(links.map((l) => l.boq_id));

  for (const m of measurements ?? []) {
    if (m.deleted_at) continue;
    if (!linkedMeas.has(String(m.id))) {
      issues.push({
        code: 'measurement_no_boq',
        severity: 'warning',
        message: `Measurement "${(m.name as string) || m.id}" has no BOQ assignment`,
        measurementId: String(m.id),
      });
    }
  }

  for (const b of boqItems ?? []) {
    if (!linkedBoq.has(String(b.id))) {
      issues.push({
        code: 'boq_no_measurement',
        severity: 'warning',
        message: `BOQ "${b.item_code}" has no takeoff measurement`,
        boqId: String(b.id),
      });
    }
  }

  for (const link of links) {
    if (deletedMeas.has(link.measurement_id) || !activeMeas.has(link.measurement_id)) {
      issues.push({
        code: 'deleted_measurement',
        severity: 'error',
        message: `Link points to deleted/missing measurement`,
        measurementId: link.measurement_id,
        boqId: link.boq_id,
      });
    }
  }

  const seenMeas = new Set<string>();
  for (const link of links) {
    if (seenMeas.has(link.measurement_id)) {
      issues.push({
        code: 'duplicate_assignment',
        severity: 'error',
        message: `Duplicate assignment for measurement ${link.measurement_id}`,
        measurementId: link.measurement_id,
        boqId: link.boq_id,
      });
    }
    seenMeas.add(link.measurement_id);
  }

  return issues;
}

export async function getTakeoffBoqDashboard(
  projectId: string
): Promise<TakeoffBoqDashboardStats> {
  const supabase = await createClient();
  const [links, { data: measurements }, { data: boqItems }] = await Promise.all([
    listTakeoffBoqLinks(projectId),
    supabase
      .from('takeoff_measurements')
      .select('id')
      .eq('project_id', projectId)
      .is('deleted_at', null),
    supabase
      .from('boq_items')
      .select('id, quantity_source, imported_at, source_workbook')
      .eq('project_id', projectId)
      .is('deleted_at', null),
  ]);

  const linkedMeas = new Set(links.map((l) => l.measurement_id));
  const linkedBoq = new Set(links.map((l) => l.boq_id));
  const unassigned = (measurements ?? []).filter(
    (m) => !linkedMeas.has(String(m.id))
  ).length;

  let manual = 0;
  let imported = 0;
  for (const b of boqItems ?? []) {
    const src = deriveQuantitySource({
      explicit: (b as { quantity_source?: string | null }).quantity_source,
      hasTakeoffLinks: linkedBoq.has(String(b.id)),
      importedAt: (b as { imported_at?: string | null }).imported_at,
      sourceWorkbook: (b as { source_workbook?: string | null }).source_workbook,
    });
    if (src === 'manual') manual += 1;
    if (src === 'excel_import') imported += 1;
  }

  return computeTakeoffBoqDashboard({
    totalBoq: (boqItems ?? []).length,
    boqWithTakeoff: linkedBoq.size,
    measurementsUnassigned: unassigned,
    manualBoq: manual,
    importedBoq: imported,
  });
}

export async function listMeasurementIdsForBoq(input: {
  projectId: string;
  boqId: string;
}): Promise<string[]> {
  const links = await listTakeoffBoqLinks(input.projectId);
  return links
    .filter((l) => l.boq_id === input.boqId)
    .map((l) => l.measurement_id);
}
