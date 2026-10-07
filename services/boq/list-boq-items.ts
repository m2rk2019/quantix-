import { BOQ_PAGE_SIZE } from '@/lib/performance/constants';
import {
  buildWbsTreeDisplayOrder,
  compareBoqByWbsTreeOrder,
} from '@/lib/boq/sort-by-wbs-tree';
import { deriveQuantitySource } from '@/lib/takeoff/boq-sync';
import { createClient } from '@/lib/supabase/server';
import type { BoqCategoryTotals, BoqListParams, BoqListResult, BoqItem, BoqTotals } from '@/types/boq';

const DEFAULT_PAGE_SIZE = BOQ_PAGE_SIZE;
interface RawBoqRow {
  id: string;
  project_id: string;
  wbs_id: string;
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  material_rate: number;
  labor_rate: number;
  equipment_rate: number;
  subcontract_rate: number;
  other_cost_rate: number;
  total_rate: number;
  total_amount: number;
  material_rate_override?: boolean;
  labor_rate_override?: boolean;
  equipment_rate_override?: boolean;
  subcontract_rate_override?: boolean;
  other_cost_rate_override?: boolean;
  template_match_status?: string | null;
  needs_estimator_review?: boolean;
  source_workbook?: string | null;
  source_sheet?: string | null;
  source_row?: number | null;
  imported_at?: string | null;
  match_confidence?: number | null;
  quantity_source?: string | null;
  created_at: string;
  updated_at: string;
}

async function getWbsLookup(
  projectId: string
): Promise<Map<string, { wbs_code: string; description: string }>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('wbs')
    .select('id, wbs_code, description')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  return new Map(
    (data ?? []).map((row) => [
      row.id,
      { wbs_code: row.wbs_code, description: row.description },
    ])
  );
}

async function getWbsTreeDisplayOrder(
  projectId: string
): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('wbs')
    .select('id, parent_id, sort_order')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  return buildWbsTreeDisplayOrder(data ?? []);
}

function mapRow(
  row: RawBoqRow,
  wbsLookup: Map<string, { wbs_code: string; description: string }>,
  takeoffByBoq?: Map<string, string[]>
): BoqItem {
  const wbs = wbsLookup.get(row.wbs_id);
  const measIds = takeoffByBoq?.get(row.id) ?? [];
  const hasTakeoff = measIds.length > 0;

  return {
    id: row.id,
    project_id: row.project_id,
    wbs_id: row.wbs_id,
    wbs_code: wbs?.wbs_code ?? '',
    wbs_description: wbs?.description ?? '',
    item_code: row.item_code,
    description: row.description,
    unit: row.unit,
    quantity: Number(row.quantity),
    material_rate: Number(row.material_rate),
    labor_rate: Number(row.labor_rate),
    equipment_rate: Number(row.equipment_rate),
    subcontract_rate: Number(row.subcontract_rate),
    other_cost_rate: Number(row.other_cost_rate ?? 0),
    material_rate_override: row.material_rate_override ?? false,
    labor_rate_override: row.labor_rate_override ?? false,
    equipment_rate_override: row.equipment_rate_override ?? false,
    subcontract_rate_override: row.subcontract_rate_override ?? false,
    other_cost_rate_override: row.other_cost_rate_override ?? false,
    total_rate: Number(row.total_rate),
    total_amount: Number(row.total_amount),
    template_match_status: row.template_match_status ?? null,
    needs_estimator_review: row.needs_estimator_review ?? false,
    source_workbook: row.source_workbook ?? null,
    source_sheet: row.source_sheet ?? null,
    source_row: row.source_row ?? null,
    imported_at: row.imported_at ?? null,
    match_confidence: row.match_confidence ?? null,
    quantity_source: deriveQuantitySource({
      explicit: row.quantity_source ?? null,
      hasTakeoffLinks: hasTakeoff,
      importedAt: row.imported_at ?? null,
      sourceWorkbook: row.source_workbook ?? null,
    }),
    takeoff_measurement_id: measIds[0] ?? null,
    takeoff_link_count: measIds.length,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function getTakeoffLinksByBoq(
  projectId: string
): Promise<Map<string, string[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('takeoff_boq_links')
    .select('boq_id, measurement_id')
    .eq('project_id', projectId)
    .is('deleted_at', null);

  const map = new Map<string, string[]>();
  if (error || !data) return map;
  for (const row of data) {
    const boqId = String(row.boq_id);
    const list = map.get(boqId) ?? [];
    list.push(String(row.measurement_id));
    map.set(boqId, list);
  }
  return map;
}

const BOQ_SELECT = `
  id,
  project_id,
  wbs_id,
  item_code,
  description,
  unit,
  quantity,
  material_rate,
  labor_rate,
  equipment_rate,
  subcontract_rate,
  other_cost_rate,
  material_rate_override,
  labor_rate_override,
  equipment_rate_override,
  subcontract_rate_override,
  other_cost_rate_override,
  total_rate,
  total_amount,
  template_match_status,
  needs_estimator_review,
  source_workbook,
  source_sheet,
  source_row,
  imported_at,
  match_confidence,
  quantity_source,
  created_at,
  updated_at
`;

const BOQ_SELECT_LEGACY = `
  id,
  project_id,
  wbs_id,
  item_code,
  description,
  unit,
  quantity,
  material_rate,
  labor_rate,
  equipment_rate,
  subcontract_rate,
  other_cost_rate,
  material_rate_override,
  labor_rate_override,
  equipment_rate_override,
  subcontract_rate_override,
  other_cost_rate_override,
  total_rate,
  total_amount,
  template_match_status,
  needs_estimator_review,
  source_workbook,
  source_sheet,
  source_row,
  imported_at,
  match_confidence,
  created_at,
  updated_at
`;

export async function listBoqItems(
  projectId: string,
  params: BoqListParams = {}
): Promise<BoqListResult> {
  const supabase = await createClient();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const sort = params.sort ?? 'wbs_order';
  const order = params.order ?? 'asc';
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const takeoffByBoq = await getTakeoffLinksByBoq(projectId);
  let selectCols = BOQ_SELECT;

  // Default / explicit WBS-tree presentation order (not a DB column sort).
  if (sort === 'wbs_order') {
    const [wbsLookup, wbsDisplayOrder] = await Promise.all([
      getWbsLookup(projectId),
      getWbsTreeDisplayOrder(projectId),
    ]);

    const pageFetchSize = 1000;
    const collected: RawBoqRow[] = [];
    let totalCount = 0;
    let offset = 0;

    while (true) {
      let pageQuery = supabase
        .from('boq_items')
        .select(selectCols, { count: 'exact' })
        .eq('project_id', projectId)
        .is('deleted_at', null);

      if (params.wbsId) {
        pageQuery = pageQuery.eq('wbs_id', params.wbsId);
      }
      if (params.search?.trim()) {
        const term = params.search.trim();
        pageQuery = pageQuery.or(
          `item_code.ilike.%${term}%,description.ilike.%${term}%`
        );
      }

      let { data, error, count } = await pageQuery.range(
        offset,
        offset + pageFetchSize - 1
      );
      if (
        error &&
        (error.message.includes('quantity_source') ||
          error.message.includes('schema cache'))
      ) {
        selectCols = BOQ_SELECT_LEGACY;
        pageQuery = supabase
          .from('boq_items')
          .select(selectCols, { count: 'exact' })
          .eq('project_id', projectId)
          .is('deleted_at', null);
        if (params.wbsId) pageQuery = pageQuery.eq('wbs_id', params.wbsId);
        if (params.search?.trim()) {
          const term = params.search.trim();
          pageQuery = pageQuery.or(
            `item_code.ilike.%${term}%,description.ilike.%${term}%`
          );
        }
        ({ data, error, count } = await pageQuery.range(
          offset,
          offset + pageFetchSize - 1
        ));
      }
      if (error) {
        throw new Error(error.message);
      }
      totalCount = count ?? totalCount;
      const chunk = (data ?? []) as unknown as RawBoqRow[];
      collected.push(...chunk);
      if (chunk.length < pageFetchSize || collected.length >= totalCount) {
        break;
      }
      offset += pageFetchSize;
    }

    const mapped = collected.map((row) =>
      mapRow(row, wbsLookup, takeoffByBoq)
    );
    mapped.sort((a, b) => {
      const cmp = compareBoqByWbsTreeOrder(a, b, wbsDisplayOrder);
      return order === 'asc' ? cmp : -cmp;
    });

    const pageItems = mapped.slice(from, from + pageSize);

    return {
      items: pageItems,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    };
  }

  let query = supabase
    .from('boq_items')
    .select(selectCols, { count: 'exact' })
    .eq('project_id', projectId)
    .is('deleted_at', null);

  if (params.wbsId) {
    query = query.eq('wbs_id', params.wbsId);
  }

  if (params.search?.trim()) {
    const term = params.search.trim();
    query = query.or(
      `item_code.ilike.%${term}%,description.ilike.%${term}%`
    );
  }

  const ascending = order === 'asc';
  query = query.order(sort, { ascending }).range(from, to);

  const [primaryResult, wbsLookup] = await Promise.all([
    query,
    getWbsLookup(projectId),
  ]);
  let data = primaryResult.data as unknown as RawBoqRow[] | null;
  let error = primaryResult.error;
  let count = primaryResult.count;
  if (
    error &&
    (error.message.includes('quantity_source') ||
      error.message.includes('schema cache'))
  ) {
    let legacy = supabase
      .from('boq_items')
      .select(BOQ_SELECT_LEGACY, { count: 'exact' })
      .eq('project_id', projectId)
      .is('deleted_at', null);
    if (params.wbsId) legacy = legacy.eq('wbs_id', params.wbsId);
    if (params.search?.trim()) {
      const term = params.search.trim();
      legacy = legacy.or(
        `item_code.ilike.%${term}%,description.ilike.%${term}%`
      );
    }
    legacy = legacy.order(sort, { ascending }).range(from, to);
    const legacyResult = await legacy;
    data = legacyResult.data as unknown as RawBoqRow[] | null;
    error = legacyResult.error;
    count = legacyResult.count;
  }
  if (error) {
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    items: (data ?? []).map((row) => mapRow(row, wbsLookup, takeoffByBoq)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function countProjectBoqItems(
  projectId: string
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('boq_items')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('deleted_at', null);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

const EMPTY_CATEGORY_TOTALS: BoqCategoryTotals = {
  materialTotal: 0,
  laborTotal: 0,
  equipmentTotal: 0,
  subcontractTotal: 0,
  grandTotal: 0,
};

async function loadCategoryTotals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  wbsId?: string | null
): Promise<BoqCategoryTotals> {
  const { data, error } = await supabase.rpc('boq_category_totals', {
    p_project_id: projectId,
    p_wbs_id: wbsId ?? null,
  });

  if (error || !data?.[0]) {
    return EMPTY_CATEGORY_TOTALS;
  }

  const row = data[0];
  return {
    materialTotal: Number(row.material_total ?? 0),
    laborTotal: Number(row.labor_total ?? 0),
    equipmentTotal: Number(row.equipment_total ?? 0),
    subcontractTotal: Number(row.subcontract_total ?? 0),
    grandTotal: Number(row.grand_total ?? 0),
  };
}

export async function getBoqTotals(
  projectId: string,
  wbsId?: string | null
): Promise<BoqTotals> {
  const supabase = await createClient();

  const [projectResult, wbsResult, projectCategories, filteredCategories] =
    await Promise.all([
      supabase.rpc('sum_boq_total_amount', {
        p_project_id: projectId,
        p_wbs_id: null,
      }),
      wbsId
        ? supabase.rpc('sum_boq_total_amount', {
            p_project_id: projectId,
            p_wbs_id: wbsId,
          })
        : Promise.resolve({ data: null, error: null }),
      loadCategoryTotals(supabase, projectId, null),
      wbsId
        ? loadCategoryTotals(supabase, projectId, wbsId)
        : Promise.resolve(null),
    ]);

  if (projectResult.error) {
    throw new Error(projectResult.error.message);
  }

  const projectTotal = Number(projectResult.data ?? 0);
  const wbsSubtotal = wbsId
    ? Number(wbsResult.data ?? 0)
    : projectTotal;
  const categoryTotals = wbsId
    ? (filteredCategories ?? EMPTY_CATEGORY_TOTALS)
    : projectCategories;

  return { wbsSubtotal, projectTotal, categoryTotals };
}