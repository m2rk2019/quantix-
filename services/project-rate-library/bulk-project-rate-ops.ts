import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { assertProjectRateEditAccess } from '@/services/project-rate-library/assert-project-rate-access';
import type { BulkProjectRateResult } from '@/types/project-rate-library';
import type { RateLibraryCategory } from '@/types/rate-library';
import type { Json } from '@/types/database';

async function requireIds(
  projectId: string,
  itemIds: string[]
): Promise<{ ok: true; ids: string[] } | { ok: false; error: string }> {
  const ids = Array.from(new Set(itemIds.filter(Boolean)));
  if (ids.length === 0) {
    return { ok: false, error: 'No project rate items selected.' };
  }
  const access = await assertProjectRateEditAccess(projectId);
  if (!access.ok) {
    return { ok: false, error: access.error };
  }
  return { ok: true, ids };
}

export async function bulkDeleteProjectRateItems(
  projectId: string,
  itemIds: string[]
): Promise<BulkProjectRateResult> {
  const gate = await requireIds(projectId, itemIds);
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  const access = await assertProjectRateEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('project_rate_library_items')
    .update({
      deleted_at: now,
      updated_by: access.ctx.profileId,
    })
    .eq('project_id', projectId)
    .in('id', gate.ids)
    .is('deleted_at', null)
    .select('id');

  if (error) {
    return { success: false, error: error.message };
  }

  const affectedIds = (data ?? []).map((row) => row.id);

  try {
    await logAuditEvent({
      projectId,
      entityType: 'project_rate_library',
      entityId: projectId,
      action: 'project_rate.deleted',
      actorId: access.ctx.profileId,
      module: 'project_rate',
      remarks: `Bulk soft-deleted ${affectedIds.length} project rate item(s)`,
      payload: { affected_ids: affectedIds as unknown as Json },
    });
  } catch (auditError) {
    console.error('[Project Rate Library] bulk delete audit failed', auditError);
  }

  return {
    success: true,
    affectedCount: affectedIds.length,
    affectedIds,
  };
}

export async function bulkDuplicateProjectRateItems(
  projectId: string,
  itemIds: string[]
): Promise<BulkProjectRateResult> {
  const gate = await requireIds(projectId, itemIds);
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  const access = await assertProjectRateEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from('project_rate_library_items')
    .select('*')
    .eq('project_id', projectId)
    .in('id', gate.ids)
    .is('deleted_at', null);

  if (error) {
    return { success: false, error: error.message };
  }

  if (!rows || rows.length === 0) {
    return { success: false, error: 'No matching project rate items found.' };
  }

  const stamp = Date.now().toString(36).toUpperCase();
  const { data: inserted, error: insertError } = await supabase
    .from('project_rate_library_items')
    .insert(
      rows.map((row, index) => ({
        project_id: projectId,
        code: `${row.code}-COPY-${stamp}${index}`,
        description: `${row.description} (Copy)`,
        unit: row.unit,
        unit_cost: row.unit_cost,
        category: row.category,
        is_active: row.is_active,
        supplier_id: row.supplier_id,
        unit_id: row.unit_id,
        resource_category_id: row.resource_category_id,
        source_company_item_id: null,
        source_unit_cost: null,
        source_updated_at: null,
        ignore_company_updates: false,
        created_by: access.ctx.profileId,
        updated_by: access.ctx.profileId,
      }))
    )
    .select('id');

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  const affectedIds = (inserted ?? []).map((row) => row.id);
  return {
    success: true,
    affectedCount: affectedIds.length,
    affectedIds,
  };
}

export async function bulkUpdateProjectRateCategory(
  projectId: string,
  itemIds: string[],
  category: RateLibraryCategory
): Promise<BulkProjectRateResult> {
  const gate = await requireIds(projectId, itemIds);
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  const access = await assertProjectRateEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_rate_library_items')
    .update({
      category,
      updated_by: access.ctx.profileId,
    })
    .eq('project_id', projectId)
    .in('id', gate.ids)
    .is('deleted_at', null)
    .select('id');

  if (error) {
    return { success: false, error: error.message };
  }

  const affectedIds = (data ?? []).map((row) => row.id);
  return {
    success: true,
    affectedCount: affectedIds.length,
    affectedIds,
  };
}

export async function bulkChangeProjectRateUnit(
  projectId: string,
  itemIds: string[],
  unit: string
): Promise<BulkProjectRateResult> {
  const normalized = unit.trim();
  if (!normalized) {
    return { success: false, error: 'Unit is required.' };
  }

  const gate = await requireIds(projectId, itemIds);
  if (!gate.ok) {
    return { success: false, error: gate.error };
  }

  const access = await assertProjectRateEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_rate_library_items')
    .update({
      unit: normalized,
      updated_by: access.ctx.profileId,
    })
    .eq('project_id', projectId)
    .in('id', gate.ids)
    .is('deleted_at', null)
    .select('id');

  if (error) {
    return { success: false, error: error.message };
  }

  const affectedIds = (data ?? []).map((row) => row.id);
  return {
    success: true,
    affectedCount: affectedIds.length,
    affectedIds,
  };
}

export async function exportProjectRateItems(
  projectId: string,
  itemIds: string[]
): Promise<{ success: boolean; error?: string; rows?: Array<Record<string, unknown>> }> {
  const access = await assertProjectRateEditAccess(projectId);
  if (!access.ok) {
    // Allow read-only export for viewers with project read access via list path
    const { assertProjectRateReadAccess } = await import(
      '@/services/project-rate-library/assert-project-rate-access'
    );
    const readAccess = await assertProjectRateReadAccess(projectId);
    if (!readAccess.ok) {
      return { success: false, error: readAccess.error };
    }
  }

  const ids = Array.from(new Set(itemIds.filter(Boolean)));
  if (ids.length === 0) {
    return { success: false, error: 'No project rate items selected.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_rate_library_items')
    .select(
      'code, description, category, unit, unit_cost, is_active, source_company_item_id'
    )
    .eq('project_id', projectId)
    .in('id', ids)
    .is('deleted_at', null)
    .order('code', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    rows: (data ?? []).map((row) => ({
      code: row.code,
      description: row.description,
      category: row.category,
      unit: row.unit,
      unit_cost: Number(row.unit_cost),
      is_active: row.is_active,
      is_custom: row.source_company_item_id === null,
    })),
  };
}
