import { createClient } from '@/lib/supabase/server';
import type {
  HistoricalProjectListItem,
  HistoricalProjectListResult,
  HistoricalProjectSearchParams,
} from '@/types/historical-project';

const DEFAULT_PAGE_SIZE = 25;

function mapRow(row: Record<string, unknown>): HistoricalProjectListItem {
  return {
    id: String(row.id),
    source_project_id: (row.source_project_id as string | null) ?? null,
    project_code: String(row.project_code ?? ''),
    project_name: String(row.project_name ?? ''),
    client_name: String(row.client_name ?? ''),
    location: (row.location as string | null) ?? null,
    building_type: (row.building_type as string | null) ?? null,
    project_type: (row.project_type as string | null) ?? null,
    discipline_tags: Array.isArray(row.discipline_tags)
      ? (row.discipline_tags as string[])
      : [],
    resource_tags: Array.isArray(row.resource_tags)
      ? (row.resource_tags as string[])
      : [],
    supplier_tags: Array.isArray(row.supplier_tags)
      ? (row.supplier_tags as string[])
      : [],
    estimate_date: (row.estimate_date as string | null) ?? null,
    source_status: (row.source_status as string | null) ?? null,
    archive_version: Number(row.archive_version ?? 1),
    grand_total: Number(row.grand_total ?? 0),
    direct_cost: Number(row.direct_cost ?? 0),
    boq_item_count: Number(row.boq_item_count ?? 0),
    wbs_node_count: Number(row.wbs_node_count ?? 0),
    resource_count: Number(row.resource_count ?? 0),
    archived_at: String(row.archived_at ?? ''),
    is_benchmark_eligible: Boolean(row.is_benchmark_eligible ?? true),
    cost_intelligence_ready: Boolean(row.cost_intelligence_ready ?? false),
  };
}

async function resolveIdsByResourceOrSupplier(
  resource?: string,
  supplier?: string
): Promise<string[] | null> {
  if (!resource?.trim() && !supplier?.trim()) {
    return null;
  }

  const supabase = await createClient();
  let rateQuery = supabase
    .from('historical_resource_rates')
    .select('historical_project_id');

  if (resource?.trim()) {
    const needle = resource.trim();
    rateQuery = rateQuery.or(
      `code.ilike.%${needle}%,description.ilike.%${needle}%`
    );
  }
  if (supplier?.trim()) {
    rateQuery = rateQuery.ilike('supplier_name', `%${supplier.trim()}%`);
  }

  const { data } = await rateQuery.limit(1000);
  return Array.from(new Set((data ?? []).map((row) => row.historical_project_id)));
}

async function resolveIdsByDiscipline(
  discipline?: string
): Promise<string[] | null> {
  if (!discipline?.trim()) {
    return null;
  }

  const supabase = await createClient();
  const needle = discipline.trim();

  const [{ data: tagHits }, { data: lineHits }] = await Promise.all([
    supabase
      .from('historical_projects')
      .select('id')
      .eq('is_knowledge_active', true)
      .contains('discipline_tags', [needle])
      .limit(500),
    supabase
      .from('historical_boq_lines')
      .select('historical_project_id')
      .ilike('discipline', `%${needle}%`)
      .limit(500),
  ]);

  return Array.from(
    new Set([
      ...(tagHits ?? []).map((row) => row.id),
      ...(lineHits ?? []).map((row) => row.historical_project_id),
    ])
  );
}

export async function listHistoricalProjects(
  params: HistoricalProjectSearchParams = {}
): Promise<HistoricalProjectListResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const sort = params.sort ?? 'estimate_date';
  const order = params.order ?? 'desc';
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const [resourceIds, disciplineIds] = await Promise.all([
    resolveIdsByResourceOrSupplier(params.resource, params.supplier),
    resolveIdsByDiscipline(params.discipline),
  ]);

  if (resourceIds && resourceIds.length === 0) {
    return { projects: [], total: 0, page, pageSize, totalPages: 1 };
  }
  if (disciplineIds && disciplineIds.length === 0) {
    return { projects: [], total: 0, page, pageSize, totalPages: 1 };
  }

  let allowedIds: string[] | null = null;
  if (resourceIds && disciplineIds) {
    const set = new Set(disciplineIds);
    allowedIds = resourceIds.filter((id) => set.has(id));
    if (allowedIds.length === 0) {
      return { projects: [], total: 0, page, pageSize, totalPages: 1 };
    }
  } else {
    allowedIds = resourceIds ?? disciplineIds;
  }

  let query = supabase
    .from('historical_projects')
    .select(
      `
        id,
        source_project_id,
        project_code,
        project_name,
        client_name,
        location,
        building_type,
        project_type,
        discipline_tags,
        resource_tags,
        supplier_tags,
        estimate_date,
        source_status,
        archive_version,
        grand_total,
        direct_cost,
        boq_item_count,
        wbs_node_count,
        resource_count,
        archived_at,
        is_benchmark_eligible,
        cost_intelligence_ready
      `,
      { count: 'exact' }
    )
    .eq('is_knowledge_active', true);

  if (allowedIds) {
    query = query.in('id', allowedIds);
  }

  if (params.project_name?.trim()) {
    const value = params.project_name.trim();
    query = query.or(
      `project_name.ilike.%${value}%,project_code.ilike.%${value}%`
    );
  }

  if (params.client?.trim()) {
    query = query.ilike('client_name', `%${params.client.trim()}%`);
  }

  if (params.location?.trim()) {
    query = query.ilike('location', `%${params.location.trim()}%`);
  }

  if (params.building_type?.trim()) {
    query = query.ilike('building_type', `%${params.building_type.trim()}%`);
  }

  if (params.date_from?.trim()) {
    query = query.gte('estimate_date', params.date_from.trim());
  }

  if (params.date_to?.trim()) {
    query = query.lte(
      'estimate_date',
      `${params.date_to.trim()}T23:59:59.999Z`
    );
  }

  if (params.q?.trim()) {
    const q = params.q.trim();
    query = query.or(
      [
        `project_name.ilike.%${q}%`,
        `project_code.ilike.%${q}%`,
        `client_name.ilike.%${q}%`,
        `location.ilike.%${q}%`,
        `building_type.ilike.%${q}%`,
      ].join(',')
    );
  }

  query = query.order(sort, { ascending: order === 'asc', nullsFirst: false });
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    if (
      error.message.includes('does not exist') ||
      error.message.includes('schema cache') ||
      error.code === '42P01'
    ) {
      return { projects: [], total: 0, page, pageSize, totalPages: 1 };
    }
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    projects: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
