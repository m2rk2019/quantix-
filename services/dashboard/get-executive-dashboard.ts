import { createClient } from '@/lib/supabase/server';
import { DEFAULT_CURRENCY } from '@/lib/format-currency';
import {
  aggregateResourceUsage,
  buildCostBreakdown,
  buildDisciplineBreakdown,
  buildPortfolioKpis,
  buildTopCostItems,
  buildWbsDistribution,
  detectDuplicateBoqDescriptions,
} from '@/lib/dashboard/aggregations';
import {
  buildPortfolioInsights,
  computeAiConfidenceScore,
} from '@/lib/dashboard/insights';
import { buildResourcePricingInsights } from '@/lib/dashboard/resource-pricing-insights';
import {
  isActiveProjectStatus,
  isCompletedProjectStatus,
  mapExecutiveStatus,
} from '@/lib/dashboard/status-mapping';
import type {
  DashboardFilters,
  ExecutiveDashboardData,
  ExecutiveProjectStatus,
  ExecutiveStatusCount,
} from '@/types/dashboard';
import { EXECUTIVE_STATUS_LABELS } from '@/types/dashboard';
import type { CurrencyCode } from '@/types/project';
import { isProjectStatus } from '@/types/project';

const DEFAULT_PAGE_SIZE = 10;
const MAX_BOQ_ROWS = 5000;

interface SummaryRow {
  project_id: string;
  direct_cost: number;
  indirect_cost: number;
  contingency: number;
  markup: number;
  vat: number;
  grand_total: number;
}

interface DetailsRow {
  project_id: string;
  currency: string;
  markup_percent: number;
  contingency_percent: number;
}

interface ProjectRow {
  id: string;
  project_code: string;
  project_name: string;
  client_name: string;
  location: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  created_by: string;
  creator: { full_name: string } | { full_name: string }[] | null;
  summary: SummaryRow | null;
  details: DetailsRow | null;
}

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function applyDashboardFilters(
  query: ReturnType<Awaited<ReturnType<typeof createClient>>['from']>,
  filters: DashboardFilters
) {
  let filtered = query.is('deleted_at', null);

  if (filters.search?.trim()) {
    const search = filters.search.trim();
    filtered = filtered.or(
      `project_name.ilike.%${search}%,project_code.ilike.%${search}%,client_name.ilike.%${search}%,location.ilike.%${search}%`
    );
  }

  if (filters.client?.trim()) {
    filtered = filtered.ilike('client_name', `%${filters.client.trim()}%`);
  }

  if (filters.location?.trim()) {
    filtered = filtered.ilike('location', `%${filters.location.trim()}%`);
  }

  if (filters.estimatorId) {
    filtered = filtered.eq('created_by', filters.estimatorId);
  }

  if (filters.status && filters.status.length > 0) {
    filtered = filtered.in('status', filters.status);
  }

  if (filters.dateFrom) {
    filtered = filtered.gte('updated_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    filtered = filtered.lte('updated_at', `${filters.dateTo}T23:59:59.999Z`);
  }

  return filtered;
}

async function loadFilteredProjects(
  filters: DashboardFilters
): Promise<ProjectRow[]> {
  const supabase = await createClient();
  let query = supabase.from('projects').select(
    `
      id,
      project_code,
      project_name,
      client_name,
      location,
      status,
      created_at,
      updated_at,
      submitted_at,
      created_by,
      creator:users!projects_created_by_fkey(full_name)
    `
  );

  query = applyDashboardFilters(query, filters);
  const { data, error } = await query.order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const projects = data ?? [];
  const projectIds = projects.map((row) => row.id);

  if (projectIds.length === 0) {
    return [];
  }

  const [summariesResult, detailsResult] = await Promise.all([
    supabase
      .from('estimate_summary')
      .select(
        'project_id, direct_cost, indirect_cost, contingency, markup, vat, grand_total'
      )
      .in('project_id', projectIds),
    supabase
      .from('project_details')
      .select('project_id, currency, markup_percent, contingency_percent')
      .in('project_id', projectIds),
  ]);

  if (summariesResult.error) {
    throw new Error(summariesResult.error.message);
  }
  if (detailsResult.error) {
    throw new Error(detailsResult.error.message);
  }

  const summaryByProject = new Map(
    (summariesResult.data ?? []).map((row) => [
      row.project_id,
      {
        project_id: row.project_id,
        direct_cost: Number(row.direct_cost),
        indirect_cost: Number(row.indirect_cost),
        contingency: Number(row.contingency),
        markup: Number(row.markup),
        vat: Number(row.vat),
        grand_total: Number(row.grand_total),
      },
    ])
  );

  const detailsByProject = new Map(
    (detailsResult.data ?? []).map((row) => [
      row.project_id,
      {
        project_id: row.project_id,
        currency: row.currency,
        markup_percent: Number(row.markup_percent),
        contingency_percent: Number(row.contingency_percent),
      },
    ])
  );

  return projects.map((row) => ({
    ...row,
    summary: summaryByProject.get(row.id) ?? null,
    details: detailsByProject.get(row.id) ?? null,
  }));
}

async function loadBoqAnalytics(
  projectIds: string[],
  projectMeta: Map<string, { project_code: string; project_name: string }>
) {
  if (projectIds.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data: boqData, error: boqError } = await supabase
    .from('boq_items')
    .select(
      'id, project_id, item_code, description, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, total_amount, wbs_id'
    )
    .in('project_id', projectIds)
    .is('deleted_at', null)
    .order('total_amount', { ascending: false })
    .limit(MAX_BOQ_ROWS);

  if (boqError) {
    throw new Error(boqError.message);
  }

  const wbsIds = [
    ...new Set((boqData ?? []).map((row) => row.wbs_id).filter(Boolean)),
  ];

  const wbsById = new Map<
    string,
    { description: string; wbs_code: string; level: number }
  >();

  if (wbsIds.length > 0) {
    const { data: wbsData, error: wbsError } = await supabase
      .from('wbs')
      .select('id, description, wbs_code, level')
      .in('id', wbsIds)
      .is('deleted_at', null);

    if (wbsError) {
      throw new Error(wbsError.message);
    }

    for (const wbs of wbsData ?? []) {
      wbsById.set(wbs.id, {
        description: wbs.description,
        wbs_code: wbs.wbs_code,
        level: wbs.level,
      });
    }
  }

  return (boqData ?? []).map((row) => {
    const project = projectMeta.get(row.project_id);
    const wbs = wbsById.get(row.wbs_id);

    return {
      project_id: row.project_id,
      project_code: project?.project_code ?? '—',
      project_name: project?.project_name ?? '—',
      id: row.id,
      item_code: row.item_code,
      description: row.description,
      total_amount: Number(row.total_amount),
      quantity: Number(row.quantity),
      material_rate: Number(row.material_rate),
      labor_rate: Number(row.labor_rate),
      equipment_rate: Number(row.equipment_rate),
      subcontract_rate: Number(row.subcontract_rate),
      wbs_description: wbs?.description ?? null,
      wbs_code: wbs?.wbs_code ?? null,
      wbs_level: wbs?.level ?? null,
    };
  });
}

async function loadProjectCounts(projectIds: string[]) {
  if (projectIds.length === 0) {
    return { boqCounts: new Map<string, number>(), wbsCounts: new Map<string, number>(), zeroRates: new Map<string, number>() };
  }

  const supabase = await createClient();

  const [boqResult, wbsResult, zeroRateResult] = await Promise.all([
    supabase
      .from('boq_items')
      .select('project_id')
      .in('project_id', projectIds)
      .is('deleted_at', null),
    supabase
      .from('wbs')
      .select('project_id')
      .in('project_id', projectIds)
      .is('deleted_at', null),
    supabase
      .from('boq_items')
      .select('project_id')
      .in('project_id', projectIds)
      .is('deleted_at', null)
      .or('material_rate.eq.0,labor_rate.eq.0,equipment_rate.eq.0,subcontract_rate.eq.0'),
  ]);

  const boqCounts = new Map<string, number>();
  for (const row of boqResult.data ?? []) {
    boqCounts.set(row.project_id, (boqCounts.get(row.project_id) ?? 0) + 1);
  }

  const wbsCounts = new Map<string, number>();
  for (const row of wbsResult.data ?? []) {
    wbsCounts.set(row.project_id, (wbsCounts.get(row.project_id) ?? 0) + 1);
  }

  const zeroRates = new Map<string, number>();
  for (const row of zeroRateResult.data ?? []) {
    zeroRates.set(row.project_id, (zeroRates.get(row.project_id) ?? 0) + 1);
  }

  return { boqCounts, wbsCounts, zeroRates };
}

async function loadAiAuditCounts(): Promise<{
  applied: number;
  generated: number;
}> {
  const supabase = await createClient();
  const [applied, generated] = await Promise.all([
    supabase
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'ai_estimate.applied'),
    supabase
      .from('audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('action', 'ai_estimate.generated'),
  ]);

  return {
    applied: applied.count ?? 0,
    generated: generated.count ?? 0,
  };
}

async function loadResourcePricingRows(projectIds: string[]): Promise<{
  projectRates: Array<{
    id: string;
    project_id: string;
    project_code: string;
    project_name: string;
    code: string;
    description: string;
    unit_cost: number;
    category: string;
    updated_at: string;
  }>;
  companyRates: Array<{
    id: string;
    code: string;
    description: string;
    unit_cost: number;
    category: string;
  }>;
}> {
  if (projectIds.length === 0) {
    return { projectRates: [], companyRates: [] };
  }

  const supabase = await createClient();

  const { data: projectRows, error: projectError } = await supabase
    .from('project_rate_library_items')
    .select('id, project_id, code, description, unit_cost, category, updated_at')
    .in('project_id', projectIds)
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(2000);

  if (projectError) {
    // Table may be missing on unmigrated environments — soft skip.
    return { projectRates: [], companyRates: [] };
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('id, project_code, project_name')
    .in('id', projectIds)
    .is('deleted_at', null);

  const projectMeta = new Map(
    (projects ?? []).map((row) => [
      row.id,
      { project_code: row.project_code, project_name: row.project_name },
    ])
  );

  const projectRates = (projectRows ?? []).map((row) => {
    const project = projectMeta.get(row.project_id);
    return {
      id: row.id,
      project_id: row.project_id,
      project_code: project?.project_code ?? '—',
      project_name: project?.project_name ?? '—',
      code: row.code,
      description: row.description,
      unit_cost: Number(row.unit_cost),
      category: row.category,
      updated_at: row.updated_at,
    };
  });

  const codes = Array.from(new Set(projectRates.map((row) => row.code))).slice(
    0,
    200
  );

  let companyRates: Array<{
    id: string;
    code: string;
    description: string;
    unit_cost: number;
    category: string;
  }> = [];

  if (codes.length > 0) {
    const { data: companyRows } = await supabase
      .from('rate_library_items')
      .select('id, code, description, unit_cost, category')
      .in('code', codes)
      .is('deleted_at', null)
      .eq('is_active', true)
      .limit(500);

    companyRates = (companyRows ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      description: row.description,
      unit_cost: Number(row.unit_cost),
      category: row.category,
    }));
  }

  return { projectRates, companyRates };
}

async function loadEstimators(): Promise<Array<{ id: string; full_name: string }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select('id, full_name')
    .in('role', ['estimator', 'quantity_surveyor', 'admin', 'super_admin'])
    .order('full_name');

  return (data ?? []).map((row) => ({
    id: row.id,
    full_name: row.full_name,
  }));
}

function buildStatusCounts(
  projects: Array<{ executive_status: ExecutiveProjectStatus }>
): ExecutiveStatusCount[] {
  const counts = new Map<string, number>();

  for (const project of projects) {
    counts.set(
      project.executive_status,
      (counts.get(project.executive_status) ?? 0) + 1
    );
  }

  return (Object.keys(EXECUTIVE_STATUS_LABELS) as Array<keyof typeof EXECUTIVE_STATUS_LABELS>).map(
    (status) => ({
      status,
      label: EXECUTIVE_STATUS_LABELS[status],
      count: counts.get(status) ?? 0,
    })
  );
}

export async function getExecutiveDashboard(
  filters: DashboardFilters = {}
): Promise<ExecutiveDashboardData> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;

  const [allProjects, estimators, aiAudit] = await Promise.all([
    loadFilteredProjects(filters),
    loadEstimators(),
    loadAiAuditCounts(),
  ]);

  const projectIds = allProjects.map((row) => row.id);
  const projectMeta = new Map(
    allProjects.map((row) => [
      row.id,
      { project_code: row.project_code, project_name: row.project_name },
    ])
  );

  const [boqRows, counts, pricingRows] = await Promise.all([
    loadBoqAnalytics(projectIds, projectMeta),
    loadProjectCounts(projectIds),
    loadResourcePricingRows(projectIds),
  ]);

  const normalized = allProjects.map((row) => {
    const summary = row.summary;
    const details = row.details;
    const creator = unwrapRelation(row.creator);
    const status = isProjectStatus(row.status) ? row.status : 'draft';
    const currency = (details?.currency ?? DEFAULT_CURRENCY) as CurrencyCode;

    return {
      id: row.id,
      project_code: row.project_code,
      project_name: row.project_name,
      client_name: row.client_name,
      location: row.location,
      status,
      executive_status: mapExecutiveStatus(status, row.submitted_at),
      created_by: row.created_by,
      created_by_name: creator?.full_name ?? 'Unknown',
      updated_at: row.updated_at,
      grand_total: Number(summary?.grand_total ?? 0),
      markup_percent: Number(details?.markup_percent ?? 0),
      markup_amount: Number(summary?.markup ?? 0),
      contingency_percent: Number(details?.contingency_percent ?? 0),
      currency,
      boq_item_count: counts.boqCounts.get(row.id) ?? 0,
      wbs_node_count: counts.wbsCounts.get(row.id) ?? 0,
      zero_rate_items: counts.zeroRates.get(row.id) ?? 0,
      summary: {
        direct_cost: Number(summary?.direct_cost ?? 0),
        indirect_cost: Number(summary?.indirect_cost ?? 0),
        contingency: Number(summary?.contingency ?? 0),
        markup: Number(summary?.markup ?? 0),
        vat: Number(summary?.vat ?? 0),
        grand_total: Number(summary?.grand_total ?? 0),
      },
    };
  });

  const currencies = new Set(normalized.map((row) => row.currency));
  const displayCurrency = (normalized[0]?.currency ?? DEFAULT_CURRENCY) as CurrencyCode;

  const kpis = buildPortfolioKpis(normalized);
  kpis.active_projects = normalized.filter((row) =>
    isActiveProjectStatus(row.status)
  ).length;
  kpis.completed_projects = normalized.filter((row) =>
    isCompletedProjectStatus(row.status)
  ).length;
  kpis.draft_projects = normalized.filter((row) => row.status === 'draft').length;

  const resourceUsage = aggregateResourceUsage(boqRows);
  const summaries = normalized.map((row) => row.summary);
  const costBreakdown = buildCostBreakdown(summaries, resourceUsage);
  const disciplineBreakdown = buildDisciplineBreakdown(
    boqRows,
    costBreakdown.grand_total
  );
  const wbsDistribution = buildWbsDistribution(boqRows);
  const topCostItems = buildTopCostItems(boqRows, 20);
  const duplicates = detectDuplicateBoqDescriptions(boqRows);
  const aiConfidenceScore = computeAiConfidenceScore(
    aiAudit.applied,
    aiAudit.generated
  );

  const insights = [
    ...buildResourcePricingInsights({
      projectRates: pricingRows.projectRates,
      companyRates: pricingRows.companyRates,
    }),
    ...buildPortfolioInsights({
      kpis,
      disciplineBreakdown,
      projects: normalized,
      duplicates,
      aiConfidenceScore,
    }),
  ];

  const totalProjects = normalized.length;
  const totalPages = Math.max(1, Math.ceil(totalProjects / pageSize));
  const from = (page - 1) * pageSize;
  const paginatedProjects = normalized.slice(from, from + pageSize);

  return {
    generated_at: new Date().toISOString(),
    display_currency: displayCurrency,
    mixed_currency_warning: currencies.size > 1,
    kpis,
    cost_breakdown: costBreakdown,
    discipline_breakdown: disciplineBreakdown,
    wbs_distribution: wbsDistribution,
    top_cost_items: topCostItems,
    resource_usage: resourceUsage,
    status_counts: buildStatusCounts(normalized),
    insights,
    ai_confidence_score: aiConfidenceScore,
    projects: paginatedProjects,
    total_projects: totalProjects,
    page,
    page_size: pageSize,
    total_pages: totalPages,
    estimators,
  };
}

export function parseDashboardFilters(
  params: Record<string, string | undefined>
): DashboardFilters {
  const statusParam = params.status?.split(',').filter(Boolean) ?? [];
  const status = statusParam.filter(isProjectStatus);

  return {
    search: params.search,
    client: params.client,
    location: params.location,
    estimatorId: params.estimator,
    status: status.length > 0 ? status : undefined,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    page: Number(params.page ?? '1') || 1,
    pageSize: Number(params.pageSize ?? '10') || 10,
  };
}
