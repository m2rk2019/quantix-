import { createClient } from '@/lib/supabase/server';
import { listRateLibraryItems } from '@/services/rate-library/rate-library';
import type {
  ProjectAwareLibraryItem,
  ProjectResourceSourceMeta,
  ResolvedResourceCost,
  ResourceLibrarySource,
} from '@/types/project-aware-resource';
import type { ProjectRateLibraryItem } from '@/types/project-rate-library';
import type {
  RateLibraryCategory,
  RateLibraryListParams,
  RateLibraryListResult,
} from '@/types/rate-library';

function mapProjectItem(item: ProjectRateLibraryItem): ProjectAwareLibraryItem {
  return {
    id: item.id,
    code: item.code,
    description: item.description,
    unit: item.unit,
    unit_cost: item.unit_cost,
    category: item.category,
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.updated_at,
    source: 'project',
    project_library_item_id: item.id,
    company_library_item_id: item.source_company_item_id,
  };
}

function mapCompanyItem(
  item: RateLibraryListResult['items'][number]
): ProjectAwareLibraryItem {
  return {
    ...item,
    source: 'company',
    project_library_item_id: null,
    company_library_item_id: item.id,
  };
}

/**
 * Returns whether the project owns any active Project Rate Library rows.
 * Soft-fails to false when the table is not yet applied.
 */
export async function projectHasRateLibrary(
  projectId: string
): Promise<{ usesProjectLibrary: boolean; count: number }> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('project_rate_library_items')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .eq('is_active', true);

  if (error) {
    return { usesProjectLibrary: false, count: 0 };
  }

  const total = count ?? 0;
  return { usesProjectLibrary: total > 0, count: total };
}

export async function getProjectResourceSourceMeta(
  projectId: string
): Promise<ProjectResourceSourceMeta> {
  const { usesProjectLibrary, count } = await projectHasRateLibrary(projectId);
  return {
    projectId,
    usesProjectLibrary,
    projectResourceCount: count,
    source: usesProjectLibrary ? 'project' : 'company',
  };
}

/**
 * List resources for estimating pickers / AI.
 * Project library wins when non-empty; otherwise company master (legacy fallback).
 */
export async function listProjectAwareResources(
  projectId: string,
  params: RateLibraryListParams = {}
): Promise<RateLibraryListResult & { source: ResourceLibrarySource }> {
  const meta = await getProjectResourceSourceMeta(projectId);

  if (!meta.usesProjectLibrary) {
    const company = await listRateLibraryItems(params);
    return {
      ...company,
      items: company.items.map(mapCompanyItem),
      source: 'company',
    };
  }

  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, params.pageSize ?? 50));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('project_rate_library_items')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('code', { ascending: true })
    .range(from, to);

  if (params.activeOnly !== false) {
    query = query.eq('is_active', true);
  }
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }
  const search = params.search?.trim();
  if (search) {
    query = query.or(
      `code.ilike.%${search}%,description.ilike.%${search}%`
    );
  }

  const { data, error, count } = await query;
  if (error) {
    // Schema missing mid-flight — fall back to company.
    const company = await listRateLibraryItems(params);
    return {
      ...company,
      items: company.items.map(mapCompanyItem),
      source: 'company',
    };
  }

  const total = count ?? 0;
  const items = (data ?? []).map((row) =>
    mapProjectItem({
      id: row.id,
      project_id: row.project_id,
      code: row.code,
      description: row.description,
      unit: row.unit,
      unit_cost: Number(row.unit_cost),
      category: row.category as RateLibraryCategory,
      is_active: row.is_active,
      supplier_id: row.supplier_id,
      unit_id: row.unit_id,
      resource_category_id: row.resource_category_id,
      source_company_item_id: row.source_company_item_id,
      source_unit_cost:
        row.source_unit_cost === null ? null : Number(row.source_unit_cost),
      source_updated_at: row.source_updated_at,
      ignore_company_updates: row.ignore_company_updates,
      is_custom: row.source_company_item_id === null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })
  );

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    source: 'project',
  };
}

/**
 * Resolve live unit costs for analysis lines.
 * Prefers project_library_item_id; falls back to company library_item_id.
 * When the project library is active and a line only has a company id,
 * attempts to map via source_company_item_id to the project copy.
 */
export async function resolveAnalysisLineCosts(
  projectId: string,
  lines: Array<{
    library_item_id?: string | null;
    project_library_item_id?: string | null;
  }>
): Promise<{
  costsByKey: Map<string, ResolvedResourceCost>;
  usesProjectLibrary: boolean;
  /** suggested project id remaps: companyId → projectId */
  companyToProjectId: Map<string, string>;
}> {
  const meta = await getProjectResourceSourceMeta(projectId);
  const supabase = await createClient();
  const costsByKey = new Map<string, ResolvedResourceCost>();
  const companyToProjectId = new Map<string, string>();

  const projectIds = Array.from(
    new Set(
      lines
        .map((line) => line.project_library_item_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  const companyIds = Array.from(
    new Set(
      lines
        .map((line) => line.library_item_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (meta.usesProjectLibrary && companyIds.length > 0) {
    const { data: mapped } = await supabase
      .from('project_rate_library_items')
      .select('id, source_company_item_id, unit_cost')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .in('source_company_item_id', companyIds);

    for (const row of mapped ?? []) {
      if (row.source_company_item_id) {
        companyToProjectId.set(row.source_company_item_id, row.id);
        costsByKey.set(`project:${row.id}`, {
          unitCost: Number(row.unit_cost),
          source: 'project',
          projectLibraryItemId: row.id,
          companyLibraryItemId: row.source_company_item_id,
        });
      }
    }
  }

  if (projectIds.length > 0) {
    const { data: projectRows } = await supabase
      .from('project_rate_library_items')
      .select('id, source_company_item_id, unit_cost')
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .in('id', projectIds);

    for (const row of projectRows ?? []) {
      costsByKey.set(`project:${row.id}`, {
        unitCost: Number(row.unit_cost),
        source: 'project',
        projectLibraryItemId: row.id,
        companyLibraryItemId: row.source_company_item_id,
      });
    }
  }

  const unresolvedCompanyIds = companyIds.filter(
    (id) => !companyToProjectId.has(id)
  );
  if (unresolvedCompanyIds.length > 0) {
    const { data: companyRows } = await supabase
      .from('rate_library_items')
      .select('id, unit_cost')
      .is('deleted_at', null)
      .in('id', unresolvedCompanyIds);

    for (const row of companyRows ?? []) {
      costsByKey.set(`company:${row.id}`, {
        unitCost: Number(row.unit_cost),
        source: 'company',
        projectLibraryItemId: null,
        companyLibraryItemId: row.id,
      });
    }
  }

  return {
    costsByKey,
    usesProjectLibrary: meta.usesProjectLibrary,
    companyToProjectId,
  };
}

export function pickResolvedCost(
  costsByKey: Map<string, ResolvedResourceCost>,
  companyToProjectId: Map<string, string>,
  line: {
    library_item_id?: string | null;
    project_library_item_id?: string | null;
  },
  usesProjectLibrary: boolean
): ResolvedResourceCost {
  if (line.project_library_item_id) {
    return (
      costsByKey.get(`project:${line.project_library_item_id}`) ?? {
        unitCost: null,
        source: 'project',
        projectLibraryItemId: line.project_library_item_id,
        companyLibraryItemId: line.library_item_id ?? null,
      }
    );
  }

  if (line.library_item_id && usesProjectLibrary) {
    const mappedProjectId = companyToProjectId.get(line.library_item_id);
    if (mappedProjectId) {
      return (
        costsByKey.get(`project:${mappedProjectId}`) ?? {
          unitCost: null,
          source: 'project',
          projectLibraryItemId: mappedProjectId,
          companyLibraryItemId: line.library_item_id,
        }
      );
    }
  }

  if (line.library_item_id) {
    return (
      costsByKey.get(`company:${line.library_item_id}`) ?? {
        unitCost: null,
        source: 'company',
        projectLibraryItemId: null,
        companyLibraryItemId: line.library_item_id,
      }
    );
  }

  return {
    unitCost: null,
    source: null,
    projectLibraryItemId: null,
    companyLibraryItemId: null,
  };
}
