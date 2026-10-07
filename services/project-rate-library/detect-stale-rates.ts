import { createClient } from '@/lib/supabase/server';
import { assertProjectRateReadAccess } from '@/services/project-rate-library/assert-project-rate-access';
import type { ProjectRateStaleItem } from '@/types/project-rate-library';
import type { RateLibraryCategory } from '@/types/rate-library';

export async function detectStaleProjectRates(
  projectId: string
): Promise<{ items: ProjectRateStaleItem[]; error?: string }> {
  const access = await assertProjectRateReadAccess(projectId);
  if (!access.ok) {
    return { items: [], error: access.error };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_project_rate_library_stale', {
    p_project_id: projectId,
  });

  if (error) {
    // Fallback join when RPC is not applied yet
    console.warn(
      '[Project Rate Library] stale RPC unavailable — query fallback',
      error.message
    );

    const { data: projectRows, error: projectError } = await supabase
      .from('project_rate_library_items')
      .select(
        'id, code, description, category, unit_cost, source_company_item_id, source_unit_cost, source_updated_at, ignore_company_updates'
      )
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .not('source_company_item_id', 'is', null)
      .eq('ignore_company_updates', false);

    if (projectError) {
      return { items: [], error: projectError.message };
    }

    const sourceIds = (projectRows ?? [])
      .map((row) => row.source_company_item_id)
      .filter((id): id is string => Boolean(id));

    if (sourceIds.length === 0) {
      return { items: [] };
    }

    const { data: companyRows, error: companyError } = await supabase
      .from('rate_library_items')
      .select('id, unit_cost, updated_at')
      .in('id', sourceIds)
      .is('deleted_at', null);

    if (companyError) {
      return { items: [], error: companyError.message };
    }

    const companyById = new Map(
      (companyRows ?? []).map((row) => [row.id, row] as const)
    );

    const items: ProjectRateStaleItem[] = [];
    for (const row of projectRows ?? []) {
      if (!row.source_company_item_id) {
        continue;
      }
      const company = companyById.get(row.source_company_item_id);
      if (!company) {
        continue;
      }
      const sourceCost =
        row.source_unit_cost === null ? null : Number(row.source_unit_cost);
      if (
        Number(company.unit_cost) === sourceCost &&
        company.updated_at === row.source_updated_at
      ) {
        continue;
      }
      items.push({
        project_item_id: row.id,
        source_company_item_id: row.source_company_item_id,
        code: row.code,
        description: row.description,
        category: row.category as RateLibraryCategory,
        project_unit_cost: Number(row.unit_cost),
        company_unit_cost: Number(company.unit_cost),
        source_unit_cost: sourceCost,
        company_updated_at: company.updated_at,
        source_updated_at: row.source_updated_at,
      });
    }

    return { items };
  }

  return {
    items: (data ?? []).map((row) => ({
      project_item_id: row.project_item_id,
      source_company_item_id: row.source_company_item_id,
      code: row.code,
      description: row.description,
      category: row.category,
      project_unit_cost: Number(row.project_unit_cost),
      company_unit_cost: Number(row.company_unit_cost),
      source_unit_cost:
        row.source_unit_cost === null ? null : Number(row.source_unit_cost),
      company_updated_at: row.company_updated_at,
      source_updated_at: row.source_updated_at,
    })),
  };
}
