import { revalidatePath } from 'next/cache';

import {
  calculateTotalAmount,
  roundCurrency,
} from '@/lib/boq/calculations';
import { BOQ_RATE_FIELDS, resolveBoqAction } from '@/lib/audit/constants';
import { diffAuditFields } from '@/lib/audit/diff-fields';
import { ROUTES } from '@/lib/constants/routes';
import {
  BOQ_MAPPED_RATE_CATEGORIES,
  CATEGORY_TO_OVERRIDE_FIELD,
  CATEGORY_TO_RATE_FIELD,
  computeCategoryTotals,
  computeDirectCost,
  computeLineAmount,
  computeRateBuildUp,
  emptyCategoryTotals,
  findDuplicateLibraryResources,
} from '@/lib/rate-analysis/compute';
import { validateRateAnalysisLines } from '@/lib/rate-analysis/validation';
import { createClient } from '@/lib/supabase/server';
import { assertBoqEditAccess } from '@/services/boq/assert-boq-access';
import { logProjectAuditChanges } from '@/services/audit/log-audit-event';
import { refreshProjectEstimate } from '@/services/estimate/refresh-project-estimate';
import { revalidateEstimatingPaths } from '@/services/project-rate-library/cascade-project-rate-change';
import {
  getProjectResourceSourceMeta,
  pickResolvedCost,
  resolveAnalysisLineCosts,
} from '@/services/project-rate-library/project-resource-source';
import type {
  RateAnalysisData,
  RateAnalysisLine,
  RateAnalysisLineInput,
  RateBuildUpMarkups,
  RateLibraryCategory,
  SaveRateAnalysisInput,
} from '@/types/rate-library';

interface RawAnalysisLine {
  id: string;
  boq_item_id: string;
  library_item_id: string | null;
  project_library_item_id: string | null;
  category: RateLibraryCategory;
  resource_name: string;
  unit: string;
  consumption: number;
  unit_cost: number;
  waste_percent: number;
  productivity: number | null;
  amount: number;
  sort_order: number;
}

interface BoqItemRow {
  id: string;
  item_code: string;
  description: string;
  unit: string;
  quantity: number;
  material_rate: number;
  labor_rate: number;
  equipment_rate: number;
  subcontract_rate: number;
  other_cost_rate: number;
  material_rate_override: boolean;
  labor_rate_override: boolean;
  equipment_rate_override: boolean;
  subcontract_rate_override: boolean;
  other_cost_rate_override: boolean;
  ocm_percent: number | null;
  contingency_percent: number | null;
  profit_percent: number | null;
  vat_percent: number | null;
  rate_buildup_direct_cost: number | null;
}

async function getProjectMarkups(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string
): Promise<RateBuildUpMarkups> {
  const { data } = await supabase
    .from('project_details')
    .select('indirect_cost_percent, contingency_percent, markup_percent, vat_percent')
    .eq('project_id', projectId)
    .maybeSingle();

  return {
    ocm_percent: Number(data?.indirect_cost_percent ?? 0),
    contingency_percent: Number(data?.contingency_percent ?? 0),
    profit_percent: Number(data?.markup_percent ?? 0),
    vat_percent: Number(data?.vat_percent ?? 0),
  };
}

function resolveItemMarkups(
  item: BoqItemRow,
  projectMarkups: RateBuildUpMarkups
): RateBuildUpMarkups {
  return {
    ocm_percent: item.ocm_percent ?? projectMarkups.ocm_percent,
    contingency_percent: item.contingency_percent ?? projectMarkups.contingency_percent,
    profit_percent: item.profit_percent ?? projectMarkups.profit_percent,
    vat_percent: item.vat_percent ?? projectMarkups.vat_percent,
  };
}

function mapLine(
  row: RawAnalysisLine,
  costsByKey: Awaited<ReturnType<typeof resolveAnalysisLineCosts>>['costsByKey'],
  companyToProjectId: Map<string, string>,
  usesProjectLibrary: boolean
): RateAnalysisLine {
  const resolved = pickResolvedCost(
    costsByKey,
    companyToProjectId,
    row,
    usesProjectLibrary
  );
  const libraryUnitCost = resolved.unitCost;
  const isStale =
    (row.project_library_item_id !== null || row.library_item_id !== null) &&
    libraryUnitCost !== null &&
    roundCurrency(libraryUnitCost) !== roundCurrency(Number(row.unit_cost));

  return {
    ...row,
    project_library_item_id:
      resolved.projectLibraryItemId ?? row.project_library_item_id,
    library_item_id: resolved.companyLibraryItemId ?? row.library_item_id,
    consumption: Number(row.consumption),
    unit_cost: Number(row.unit_cost),
    waste_percent: Number(row.waste_percent ?? 0),
    productivity: row.productivity === null ? null : Number(row.productivity),
    amount: Number(row.amount),
    library_unit_cost: libraryUnitCost,
    is_stale: isStale,
    resource_source: resolved.source,
  };
}

const BOQ_ITEM_SELECT = `
  id, item_code, description, unit, quantity,
  material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
  material_rate_override, labor_rate_override, equipment_rate_override,
  subcontract_rate_override, other_cost_rate_override,
  ocm_percent, contingency_percent, profit_percent, vat_percent, rate_buildup_direct_cost
`;

const LINE_SELECT = `
  id, boq_item_id, library_item_id, project_library_item_id, category, resource_name, unit,
  consumption, unit_cost, waste_percent, productivity, amount, sort_order
`;

export async function getRateAnalysis(
  projectId: string,
  boqItemId: string
): Promise<RateAnalysisData | null> {
  const supabase = await createClient();

  const { data: boqItem, error } = await supabase
    .from('boq_items')
    .select(BOQ_ITEM_SELECT)
    .eq('id', boqItemId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !boqItem) {
    return null;
  }

  const item = boqItem as BoqItemRow;
  const sourceMeta = await getProjectResourceSourceMeta(projectId);

  const { data: lines, error: linesError } = await supabase
    .from('boq_rate_analysis_lines')
    .select(LINE_SELECT)
    .eq('boq_item_id', boqItemId)
    .is('deleted_at', null)
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true });

  let rawLines = (lines ?? []) as RawAnalysisLine[];
  if (linesError) {
    const { data: legacyLines } = await supabase
      .from('boq_rate_analysis_lines')
      .select(
        `id, boq_item_id, library_item_id, category, resource_name, unit,
         consumption, unit_cost, waste_percent, productivity, amount, sort_order`
      )
      .eq('boq_item_id', boqItemId)
      .is('deleted_at', null)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true });

    rawLines = (legacyLines ?? []).map((row) => ({
      ...(row as Omit<RawAnalysisLine, 'project_library_item_id'>),
      project_library_item_id: null,
    }));
  }

  const resolved = await resolveAnalysisLineCosts(projectId, rawLines);
  const mappedLines = rawLines.map((row) =>
    mapLine(
      row,
      resolved.costsByKey,
      resolved.companyToProjectId,
      resolved.usesProjectLibrary
    )
  );

  const categoryTotals = computeCategoryTotals(mappedLines);
  const projectMarkups = await getProjectMarkups(supabase, projectId);
  const markups = resolveItemMarkups(item, projectMarkups);
  const directCost = computeDirectCost(
    categoryTotals,
    Number(item.other_cost_rate ?? 0)
  );
  const buildUp = computeRateBuildUp(directCost, markups);

  return {
    boqItemId: item.id,
    itemCode: item.item_code,
    description: item.description,
    unit: item.unit,
    lines: mappedLines,
    categoryTotals,
    buildUp,
    markups,
    projectMarkups,
    overrides: {
      material_rate_override: item.material_rate_override ?? false,
      labor_rate_override: item.labor_rate_override ?? false,
      equipment_rate_override: item.equipment_rate_override ?? false,
      subcontract_rate_override: item.subcontract_rate_override ?? false,
      other_cost_rate_override: item.other_cost_rate_override ?? false,
    },
    currentRates: {
      material_rate: Number(item.material_rate),
      labor_rate: Number(item.labor_rate),
      equipment_rate: Number(item.equipment_rate),
      subcontract_rate: Number(item.subcontract_rate),
      other_cost_rate: Number(item.other_cost_rate ?? 0),
    },
    staleLineCount: mappedLines.filter((line) => line.is_stale).length,
    resourceSource: sourceMeta.source,
    projectResourceCount: sourceMeta.projectResourceCount,
  };
}

async function prepareLines(
  projectId: string,
  boqItemId: string,
  inputLines: RateAnalysisLineInput[],
  refreshStale: boolean
) {
  const resolved = await resolveAnalysisLineCosts(projectId, inputLines);

  return inputLines.map((line, index) => {
    const picked = pickResolvedCost(
      resolved.costsByKey,
      resolved.companyToProjectId,
      line,
      resolved.usesProjectLibrary
    );

    let unitCost = roundCurrency(line.unit_cost);
    if (refreshStale && picked.unitCost !== null) {
      unitCost = roundCurrency(picked.unitCost);
    }

    const projectLibraryItemId =
      line.project_library_item_id ?? picked.projectLibraryItemId ?? null;
    const companyLibraryItemId =
      line.library_item_id ?? picked.companyLibraryItemId ?? null;

    const amount = computeLineAmount(
      line.consumption,
      unitCost,
      line.waste_percent ?? 0,
      line.productivity
    );

    return {
      boq_item_id: boqItemId,
      library_item_id: companyLibraryItemId,
      project_library_item_id: projectLibraryItemId,
      category: line.category,
      resource_name: line.resource_name.trim(),
      unit: line.unit.trim() || 'item',
      consumption: roundCurrency(Math.max(0, line.consumption)),
      unit_cost: unitCost,
      waste_percent: roundCurrency(
        Math.max(0, Math.min(100, line.waste_percent ?? 0))
      ),
      productivity:
        line.productivity === null || line.productivity === undefined
          ? null
          : roundCurrency(line.productivity),
      amount,
      sort_order: line.sort_order ?? index,
    };
  });
}

export async function saveRateAnalysis(
  projectId: string,
  boqItemId: string,
  input: SaveRateAnalysisInput
): Promise<{ success: boolean; error?: string; warnings?: string[] }> {
  const access = await assertBoqEditAccess(projectId);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const duplicates = findDuplicateLibraryResources(input.lines);
  const validation = validateRateAnalysisLines(input.lines, {
    checkDuplicates: true,
    duplicateIds: duplicates,
  });

  if (!validation.valid) {
    return { success: false, error: validation.errors.join(' ') };
  }

  const supabase = await createClient();

  const { data: boqItem, error: boqError } = await supabase
    .from('boq_items')
    .select(BOQ_ITEM_SELECT)
    .eq('id', boqItemId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (boqError || !boqItem) {
    return { success: false, error: 'BOQ item not found.' };
  }

  const item = boqItem as BoqItemRow;
  const projectMarkups = await getProjectMarkups(supabase, projectId);
  const markups: RateBuildUpMarkups = {
    ocm_percent:
      input.markups?.ocm_percent ?? item.ocm_percent ?? projectMarkups.ocm_percent,
    contingency_percent:
      input.markups?.contingency_percent ??
      item.contingency_percent ??
      projectMarkups.contingency_percent,
    profit_percent:
      input.markups?.profit_percent ??
      item.profit_percent ??
      projectMarkups.profit_percent,
    vat_percent:
      input.markups?.vat_percent ?? item.vat_percent ?? projectMarkups.vat_percent,
  };

  const now = new Date().toISOString();

  await supabase
    .from('boq_rate_analysis_lines')
    .update({ deleted_at: now })
    .eq('boq_item_id', boqItemId)
    .is('deleted_at', null);

  const preparedLines = await prepareLines(
    projectId,
    boqItemId,
    input.lines,
    input.refreshStaleLibraryRates ?? false
  );

  if (preparedLines.length > 0) {
    const { error: insertError } = await supabase
      .from('boq_rate_analysis_lines')
      .insert(preparedLines);

    if (insertError) {
      const legacyRows = preparedLines.map((row) => {
        const { project_library_item_id: _omit, ...rest } = row;
        void _omit;
        return rest;
      });
      const { error: legacyError } = await supabase
        .from('boq_rate_analysis_lines')
        .insert(legacyRows);
      if (legacyError) {
        return { success: false, error: legacyError.message };
      }
    }
  }

  const categoryTotals = computeCategoryTotals(preparedLines);
  const overrides = {
    material_rate_override: item.material_rate_override ?? false,
    labor_rate_override: item.labor_rate_override ?? false,
    equipment_rate_override: item.equipment_rate_override ?? false,
    subcontract_rate_override: item.subcontract_rate_override ?? false,
    other_cost_rate_override: item.other_cost_rate_override ?? false,
  };

  for (const category of input.clearOverrides ?? []) {
    if (!(category in CATEGORY_TO_OVERRIDE_FIELD)) {
      continue;
    }
    const overrideField =
      CATEGORY_TO_OVERRIDE_FIELD[
        category as keyof typeof CATEGORY_TO_OVERRIDE_FIELD
      ];
    overrides[overrideField] = false;
  }

  const rates = {
    material_rate: Number(item.material_rate),
    labor_rate: Number(item.labor_rate),
    equipment_rate: Number(item.equipment_rate),
    subcontract_rate: Number(item.subcontract_rate),
    other_cost_rate: Number(item.other_cost_rate ?? 0),
  };

  for (const category of BOQ_MAPPED_RATE_CATEGORIES) {
    const overrideField = CATEGORY_TO_OVERRIDE_FIELD[category];
    if (!overrides[overrideField]) {
      const rateField = CATEGORY_TO_RATE_FIELD[category];
      rates[rateField] = categoryTotals[category];
    }
  }

  const directCost = computeDirectCost(categoryTotals, rates.other_cost_rate);
  const buildUp = computeRateBuildUp(directCost, markups);
  const totalRate = buildUp.final_rate;
  const totalAmount = calculateTotalAmount(Number(item.quantity), totalRate);

  const beforeRates = {
    material_rate: Number(item.material_rate),
    labor_rate: Number(item.labor_rate),
    equipment_rate: Number(item.equipment_rate),
    subcontract_rate: Number(item.subcontract_rate),
    other_cost_rate: Number(item.other_cost_rate ?? 0),
  };

  const { error: updateError } = await supabase
    .from('boq_items')
    .update({
      ...rates,
      ...overrides,
      ocm_percent: markups.ocm_percent,
      contingency_percent: markups.contingency_percent,
      profit_percent: markups.profit_percent,
      vat_percent: markups.vat_percent,
      rate_buildup_direct_cost: directCost,
      total_rate: totalRate,
      total_amount: totalAmount,
      updated_by: access.ctx.profileId,
    })
    .eq('id', boqItemId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const auditChanges = diffAuditFields(
    beforeRates,
    rates,
    BOQ_RATE_FIELDS as unknown as string[]
  ).map((change) => ({
    field: change.field,
    action: resolveBoqAction(change.field),
    oldValue: change.oldValue,
    newValue: change.newValue,
  }));

  if (auditChanges.length > 0) {
    await logProjectAuditChanges({
      projectId,
      entityType: 'boq_item',
      entityId: boqItemId,
      actorId: access.ctx.profileId,
      module: 'boq',
      payload: {
        item_code: item.item_code,
        source: 'rate_analysis',
        direct_cost: directCost,
        final_rate: totalRate,
      },
      changes: auditChanges,
    });
  }

  await refreshProjectEstimate(projectId, access.ctx.profileId);
  await revalidateEstimatingPaths(projectId);
  revalidatePath(ROUTES.projectBoq(projectId));

  return {
    success: true,
    warnings: validation.warnings.length > 0 ? validation.warnings : undefined,
  };
}

export async function clearRateOverride(
  projectId: string,
  boqItemId: string,
  category: RateLibraryCategory
): Promise<{ success: boolean; error?: string }> {
  const analysis = await getRateAnalysis(projectId, boqItemId);
  if (!analysis) {
    return { success: false, error: 'BOQ item not found.' };
  }

  return saveRateAnalysis(projectId, boqItemId, {
    lines: analysis.lines.map((line) => ({
      id: line.id,
      library_item_id: line.library_item_id,
      project_library_item_id: line.project_library_item_id,
      category: line.category,
      resource_name: line.resource_name,
      unit: line.unit,
      consumption: line.consumption,
      unit_cost: line.unit_cost,
      waste_percent: line.waste_percent,
      productivity: line.productivity,
      sort_order: line.sort_order,
    })),
    markups: analysis.markups,
    clearOverrides: [category],
  });
}

export async function refreshStaleLibraryRates(
  projectId: string,
  boqItemId: string
): Promise<{ success: boolean; error?: string }> {
  const analysis = await getRateAnalysis(projectId, boqItemId);
  if (!analysis) {
    return { success: false, error: 'BOQ item not found.' };
  }

  return saveRateAnalysis(projectId, boqItemId, {
    lines: analysis.lines.map((line) => ({
      id: line.id,
      library_item_id: line.library_item_id,
      project_library_item_id: line.project_library_item_id,
      category: line.category,
      resource_name: line.resource_name,
      unit: line.unit,
      consumption: line.consumption,
      unit_cost: line.unit_cost,
      waste_percent: line.waste_percent,
      productivity: line.productivity,
      sort_order: line.sort_order,
    })),
    markups: analysis.markups,
    refreshStaleLibraryRates: true,
  });
}

export function previewCategoryTotals(
  lines: RateAnalysisLineInput[]
): Record<RateLibraryCategory, number> {
  if (lines.length === 0) {
    return emptyCategoryTotals();
  }

  const withAmounts = lines.map((line) => ({
    category: line.category,
    amount: computeLineAmount(
      line.consumption,
      line.unit_cost,
      line.waste_percent ?? 0,
      line.productivity
    ),
  }));

  return computeCategoryTotals(withAmounts);
}
