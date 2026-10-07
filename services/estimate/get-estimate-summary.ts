import { createClient } from '@/lib/supabase/server';
import {
  buildDisciplineBreakdown,
  buildMonthlyCashPlaceholder,
} from '@/lib/estimate/summary-lines';
import { syncEstimateSummary } from '@/services/estimate/sync-estimate-summary';
import type {
  BidSummaryData,
  BoqResourceTotals,
  EstimateSummaryData,
  TopBoqItem,
  WbsRollupNode,
} from '@/types/estimate';
import { DEFAULT_CURRENCY } from '@/lib/format-currency';
import type { CurrencyCode } from '@/types/project';

interface WbsRow {
  id: string;
  parent_id: string | null;
  wbs_code: string;
  description: string;
  level: number;
  sort_order: number;
}

function buildRollupTree(
  nodes: WbsRow[],
  directTotals: Map<string, number>
): WbsRollupNode[] {
  const nodeMap = new Map<string, WbsRollupNode>();

  for (const node of nodes) {
    nodeMap.set(node.id, {
      id: node.id,
      parent_id: node.parent_id,
      wbs_code: node.wbs_code,
      description: node.description,
      level: node.level,
      sort_order: node.sort_order,
      direct_total: directTotals.get(node.id) ?? 0,
      combined_total: 0,
      children: [],
    });
  }

  const roots: WbsRollupNode[] = [];

  for (const node of nodeMap.values()) {
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  function computeCombined(node: WbsRollupNode): number {
    const childTotal = node.children.reduce(
      (sum, child) => sum + computeCombined(child),
      0
    );
    node.combined_total = node.direct_total + childTotal;
    node.children.sort((a, b) => a.sort_order - b.sort_order);
    return node.combined_total;
  }

  roots.sort((a, b) => a.sort_order - b.sort_order);
  for (const root of roots) {
    computeCombined(root);
  }

  return roots;
}

export async function getWbsRollup(
  projectId: string
): Promise<WbsRollupNode[]> {
  const supabase = await createClient();

  const [{ data: wbsNodes }, { data: boqTotals, error: totalsError }] =
    await Promise.all([
      supabase
        .from('wbs')
        .select('id, parent_id, wbs_code, description, level, sort_order')
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true }),
      supabase.rpc('boq_direct_totals_by_wbs', {
        p_project_id: projectId,
      }),
    ]);

  if (totalsError) {
    throw new Error(totalsError.message);
  }

  const directTotals = new Map<string, number>();
  for (const row of boqTotals ?? []) {
    directTotals.set(row.wbs_id, Number(row.direct_total));
  }

  return buildRollupTree((wbsNodes ?? []) as WbsRow[], directTotals);
}

async function loadResourceTotals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
): Promise<BoqResourceTotals> {
  const { data, error } = await supabase.rpc('boq_category_totals', {
    p_project_id: projectId,
    p_wbs_id: null,
  });

  if (error || !data?.[0]) {
    return {
      material: 0,
      labor: 0,
      equipment: 0,
      subcontract: 0,
      other: 0,
    };
  }

  const row = data[0];
  const material = Number(row.material_total ?? 0);
  const labor = Number(row.labor_total ?? 0);
  const equipment = Number(row.equipment_total ?? 0);
  const subcontract = Number(row.subcontract_total ?? 0);
  const grand = Number(row.grand_total ?? 0);

  return {
    material,
    labor,
    equipment,
    subcontract,
    other: Math.max(0, grand - material - labor - equipment - subcontract),
  };
}

async function loadTopBoqItems(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
): Promise<TopBoqItem[]> {
  const { data } = await supabase
    .from('boq_items')
    .select('id, item_code, description, total_amount')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('total_amount', { ascending: false })
    .limit(10);

  return (data ?? []).map((row) => ({
    id: row.id,
    item_code: row.item_code,
    description: row.description,
    amount: Number(row.total_amount),
  }));
}

export async function getEstimateSummary(
  projectId: string,
  options?: { sync?: boolean; profileId?: string }
): Promise<EstimateSummaryData | null> {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select(
      'id, project_code, project_name, client_name, location, created_at, created_by, creator:users!projects_created_by_fkey(full_name)'
    )
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!project) {
    return null;
  }

  const breakdown =
    options?.sync === false
      ? null
      : await syncEstimateSummary(projectId, options?.profileId);

  const [
    { data: details },
    { data: summary },
    { count: boqCount },
    wbsRollup,
    resourceTotals,
    topBoqItems,
  ] = await Promise.all([
    supabase
      .from('project_details')
      .select(
        'currency, indirect_cost_percent, contingency_percent, markup_percent, vat_percent'
      )
      .eq('project_id', projectId)
      .maybeSingle(),
    supabase
      .from('estimate_summary')
      .select(
        'direct_cost, indirect_cost, contingency, markup, vat, grand_total, updated_at'
      )
      .eq('project_id', projectId)
      .maybeSingle(),
    supabase
      .from('boq_items')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .is('deleted_at', null),
    getWbsRollup(projectId),
    loadResourceTotals(supabase, projectId),
    loadTopBoqItems(supabase, projectId),
  ]);

  const percentages = {
    indirect_cost_percent: Number(details?.indirect_cost_percent ?? 0),
    contingency_percent: Number(details?.contingency_percent ?? 0),
    markup_percent: Number(details?.markup_percent ?? 0),
    vat_percent: Number(details?.vat_percent ?? 0),
  };

  const resolvedBreakdown = breakdown ?? {
    direct_cost: Number(summary?.direct_cost ?? 0),
    indirect_cost: Number(summary?.indirect_cost ?? 0),
    contingency: Number(summary?.contingency ?? 0),
    markup: Number(summary?.markup ?? 0),
    vat: Number(summary?.vat ?? 0),
    grand_total: Number(summary?.grand_total ?? 0),
  };

  const disciplineBreakdown = buildDisciplineBreakdown(
    wbsRollup,
    resolvedBreakdown.grand_total
  );

  const creator = Array.isArray(project.creator)
    ? project.creator[0]
    : project.creator;
  const preparedBy = creator?.full_name ?? '—';

  const bidSummary: BidSummaryData = {
    project_name: project.project_name,
    project_code: project.project_code,
    client_name: project.client_name,
    location: project.location ?? '—',
    estimate_date: new Date().toISOString().slice(0, 10),
    prepared_by: preparedBy,
    total_direct_cost: resolvedBreakdown.direct_cost,
    indirect_cost: resolvedBreakdown.indirect_cost,
    markup: resolvedBreakdown.markup,
    vat: resolvedBreakdown.vat,
    grand_total: resolvedBreakdown.grand_total,
    cost_per_square_meter: null,
  };

  return {
    project_id: projectId,
    currency: (details?.currency ?? DEFAULT_CURRENCY) as CurrencyCode,
    percentages,
    breakdown: resolvedBreakdown,
    resource_totals: resourceTotals,
    boq_item_count: boqCount ?? 0,
    wbs_rollup: wbsRollup,
    discipline_breakdown: disciplineBreakdown,
    top_boq_items: topBoqItems,
    bid_summary: bidSummary,
    monthly_cash_placeholder: buildMonthlyCashPlaceholder(
      resolvedBreakdown.grand_total
    ),
    updated_at: summary?.updated_at ?? new Date().toISOString(),
  };
}
