import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import { assertProjectRateEditAccess } from '@/services/project-rate-library/assert-project-rate-access';
import type { ImportCompanyResourcesResult } from '@/types/project-rate-library';
import type { Json } from '@/types/database';
import type { RateLibraryCategory } from '@/types/rate-library';

function parseImportPayload(data: unknown): {
  imported_count: number;
  skipped_count: number;
  imported_ids: string[];
} {
  if (!data || typeof data !== 'object') {
    return { imported_count: 0, skipped_count: 0, imported_ids: [] };
  }
  const payload = data as Record<string, unknown>;
  const ids = Array.isArray(payload.imported_ids)
    ? payload.imported_ids.filter((id): id is string => typeof id === 'string')
    : [];
  return {
    imported_count: Number(payload.imported_count ?? ids.length) || 0,
    skipped_count: Number(payload.skipped_count ?? 0) || 0,
    imported_ids: ids,
  };
}

async function importViaAdminBatch(
  projectId: string,
  companyItemIds: string[],
  actorId: string
): Promise<ImportCompanyResourcesResult> {
  const admin = createAdminClient();
  const uniqueIds = Array.from(new Set(companyItemIds));

  const { data: companyRows, error: companyError } = await admin
    .from('rate_library_items')
    .select(
      'id, code, description, unit, unit_cost, category, is_active, supplier_id, unit_id, resource_category_id, updated_at'
    )
    .in('id', uniqueIds)
    .is('deleted_at', null);

  if (companyError) {
    return { success: false, error: companyError.message };
  }

  const { data: existing, error: existingError } = await admin
    .from('project_rate_library_items')
    .select('source_company_item_id, code')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  if (existingError) {
    return { success: false, error: existingError.message };
  }

  const existingSources = new Set(
    (existing ?? [])
      .map((row) => row.source_company_item_id)
      .filter((id): id is string => Boolean(id))
  );
  const existingCodes = new Set(
    (existing ?? []).map((row) => row.code.toLowerCase())
  );

  const toInsert = (companyRows ?? []).filter(
    (row) =>
      !existingSources.has(row.id) && !existingCodes.has(row.code.toLowerCase())
  );

  if (toInsert.length === 0) {
    return {
      success: true,
      importedCount: 0,
      skippedCount: uniqueIds.length,
      importedIds: [],
    };
  }

  const { data: inserted, error: insertError } = await admin
    .from('project_rate_library_items')
    .insert(
      toInsert.map((row) => ({
        project_id: projectId,
        code: row.code,
        description: row.description,
        unit: row.unit,
        unit_cost: row.unit_cost,
        category: row.category,
        is_active: row.is_active,
        supplier_id: row.supplier_id,
        unit_id: row.unit_id,
        resource_category_id: row.resource_category_id,
        source_company_item_id: row.id,
        source_unit_cost: row.unit_cost,
        source_updated_at: row.updated_at,
        ignore_company_updates: false,
        created_by: actorId,
        updated_by: actorId,
      }))
    )
    .select('id');

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  const importedIds = (inserted ?? []).map((row) => row.id);
  return {
    success: true,
    importedCount: importedIds.length,
    skippedCount: Math.max(0, uniqueIds.length - importedIds.length),
    importedIds,
  };
}

export async function importCompanyResourcesToProject(
  projectId: string,
  companyItemIds: string[]
): Promise<ImportCompanyResourcesResult> {
  const uniqueIds = Array.from(new Set(companyItemIds.filter(Boolean)));
  if (uniqueIds.length === 0) {
    return { success: false, error: 'No company resources selected.' };
  }

  const access = await assertProjectRateEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    'import_company_resources_to_project',
    {
      p_project_id: projectId,
      p_company_item_ids: uniqueIds,
      p_actor_id: access.ctx.profileId,
    }
  );

  let result: ImportCompanyResourcesResult;

  if (error) {
    console.warn(
      '[Project Rate Library] import RPC unavailable — admin batch fallback',
      error.message
    );
    result = await importViaAdminBatch(
      projectId,
      uniqueIds,
      access.ctx.profileId
    );
  } else {
    const parsed = parseImportPayload(data);
    result = {
      success: true,
      importedCount: parsed.imported_count,
      skippedCount: parsed.skipped_count,
      importedIds: parsed.imported_ids,
    };
  }

  if (!result.success) {
    return result;
  }

  // Remap existing BOQ rate-analysis lines onto newly imported project copies.
  try {
    const admin = createAdminClient();
    const { data: projectCopies } = await admin
      .from('project_rate_library_items')
      .select('id, source_company_item_id, unit_cost')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .in('source_company_item_id', uniqueIds);

    const { remapAnalysisLinesToProjectResources } = await import(
      '@/services/project-rate-library/cascade-project-rate-change'
    );
    await remapAnalysisLinesToProjectResources(
      projectId,
      (projectCopies ?? [])
        .filter((row) => Boolean(row.source_company_item_id))
        .map((row) => ({
          companyItemId: row.source_company_item_id as string,
          projectItemId: row.id,
          unitCost: Number(row.unit_cost),
        })),
      access.ctx.profileId
    );
  } catch (remapError) {
    console.warn(
      '[Project Rate Library] post-import remapping skipped',
      remapError
    );
  }

  try {
    await logAuditEvent({
      projectId,
      entityType: 'project_rate_library',
      entityId: projectId,
      action: 'project_rate.imported',
      actorId: access.ctx.profileId,
      module: 'project_rate',
      remarks: `Imported ${result.importedCount ?? 0} company resource(s)`,
      payload: {
        imported_count: result.importedCount ?? 0,
        skipped_count: result.skippedCount ?? 0,
        company_item_ids: uniqueIds as unknown as Json,
        imported_ids: (result.importedIds ?? []) as unknown as Json,
      },
    });
  } catch (auditError) {
    console.error('[Project Rate Library] import audit failed', auditError);
  }

  return result;
}

/**
 * Resolve matching company resource IDs (by category/search) and import in one call.
 * Used by Import All for large catalogs without shipping IDs from the client.
 */
export async function importCompanyResourcesByFilter(
  projectId: string,
  filters: {
    category?: RateLibraryCategory | 'all';
    search?: string;
    activeOnly?: boolean;
  } = {}
): Promise<ImportCompanyResourcesResult> {
  const access = await assertProjectRateEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const supabase = await createClient();
  const pageSize = 1000;
  const ids: string[] = [];
  let from = 0;
  let useAdmin = false;

  for (;;) {
    const db = useAdmin ? createAdminClient() : supabase;
    let pageQuery = db
      .from('rate_library_items')
      .select('id')
      .is('deleted_at', null)
      .order('code', { ascending: true })
      .range(from, from + pageSize - 1);

    if (filters.activeOnly !== false) {
      pageQuery = pageQuery.eq('is_active', true);
    }
    if (filters.category && filters.category !== 'all') {
      pageQuery = pageQuery.eq('category', filters.category);
    }
    const search = filters.search?.trim();
    if (search) {
      pageQuery = pageQuery.or(
        `code.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data, error } = await pageQuery;
    if (error) {
      if (!useAdmin) {
        useAdmin = true;
        from = 0;
        ids.length = 0;
        continue;
      }
      return { success: false, error: error.message };
    }

    const batch = data ?? [];
    ids.push(...batch.map((row) => row.id));
    if (batch.length < pageSize) {
      break;
    }
    from += pageSize;
  }

  return importCompanyResourcesToProject(projectId, ids);
}
