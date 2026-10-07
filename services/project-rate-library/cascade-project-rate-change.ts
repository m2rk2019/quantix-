import { revalidatePath } from 'next/cache';

import {
  calculateTotalAmount,
  roundCurrency,
} from '@/lib/boq/calculations';
import { ROUTES } from '@/lib/constants/routes';
import {
  BOQ_MAPPED_RATE_CATEGORIES,
  CATEGORY_TO_OVERRIDE_FIELD,
  CATEGORY_TO_RATE_FIELD,
  computeCategoryTotals,
  computeDirectCost,
  computeLineAmount,
  computeRateBuildUp,
} from '@/lib/rate-analysis/compute';
import { createClient } from '@/lib/supabase/server';
import { refreshProjectEstimate } from '@/services/estimate/refresh-project-estimate';
import type { RateBuildUpMarkups, RateLibraryCategory } from '@/types/rate-library';

interface AnalysisLineRow {
  id: string;
  boq_item_id: string;
  category: RateLibraryCategory;
  consumption: number;
  unit_cost: number;
  waste_percent: number | null;
  productivity: number | null;
  amount: number;
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

/**
 * Recalculate a BOQ item's category rates + totals from its analysis lines.
 * Respects manual rate overrides. Refreshes estimate when done.
 */
export async function recalculateBoqItemFromAnalysis(
  projectId: string,
  boqItemId: string,
  actorId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: boqItem, error: boqError } = await supabase
    .from('boq_items')
    .select(
      `id, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
       material_rate_override, labor_rate_override, equipment_rate_override,
       subcontract_rate_override, other_cost_rate_override,
       ocm_percent, contingency_percent, profit_percent, vat_percent`
    )
    .eq('id', boqItemId)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (boqError || !boqItem) {
    return { success: false, error: 'BOQ item not found.' };
  }

  const { data: lines } = await supabase
    .from('boq_rate_analysis_lines')
    .select(
      'id, boq_item_id, category, consumption, unit_cost, waste_percent, productivity, amount'
    )
    .eq('boq_item_id', boqItemId)
    .is('deleted_at', null);

  const mapped = (lines ?? []).map((line) => ({
    category: line.category as RateLibraryCategory,
    amount: Number(line.amount),
  }));

  const categoryTotals = computeCategoryTotals(mapped);
  const projectMarkups = await getProjectMarkups(supabase, projectId);
  const markups: RateBuildUpMarkups = {
    ocm_percent: boqItem.ocm_percent ?? projectMarkups.ocm_percent,
    contingency_percent:
      boqItem.contingency_percent ?? projectMarkups.contingency_percent,
    profit_percent: boqItem.profit_percent ?? projectMarkups.profit_percent,
    vat_percent: boqItem.vat_percent ?? projectMarkups.vat_percent,
  };

  const overrides = {
    material_rate_override: boqItem.material_rate_override ?? false,
    labor_rate_override: boqItem.labor_rate_override ?? false,
    equipment_rate_override: boqItem.equipment_rate_override ?? false,
    subcontract_rate_override: boqItem.subcontract_rate_override ?? false,
    other_cost_rate_override: boqItem.other_cost_rate_override ?? false,
  };

  const rates = {
    material_rate: Number(boqItem.material_rate),
    labor_rate: Number(boqItem.labor_rate),
    equipment_rate: Number(boqItem.equipment_rate),
    subcontract_rate: Number(boqItem.subcontract_rate),
    other_cost_rate: Number(boqItem.other_cost_rate ?? 0),
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
  const totalAmount = calculateTotalAmount(Number(boqItem.quantity), totalRate);

  const { error: updateError } = await supabase
    .from('boq_items')
    .update({
      ...rates,
      rate_buildup_direct_cost: directCost,
      total_rate: totalRate,
      total_amount: totalAmount,
      updated_by: actorId,
    })
    .eq('id', boqItemId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

/**
 * Propagate a project resource unit-cost change into linked rate-analysis lines,
 * BOQ rates, estimate summary, and dashboard caches.
 */
export async function cascadeProjectRateCostChange(
  projectId: string,
  projectLibraryItemId: string,
  newUnitCost: number,
  actorId: string
): Promise<{ success: boolean; error?: string; updatedLines?: number }> {
  const supabase = await createClient();
  const unitCost = roundCurrency(Math.max(0, newUnitCost));

  const { data: lines, error } = await supabase
    .from('boq_rate_analysis_lines')
    .select(
      'id, boq_item_id, category, consumption, unit_cost, waste_percent, productivity, amount'
    )
    .eq('project_library_item_id', projectLibraryItemId)
    .is('deleted_at', null);

  if (error) {
    // Column/table may be missing on unmigrated DBs — soft-skip cascade.
    return { success: true, updatedLines: 0 };
  }

  const analysisLines = (lines ?? []) as AnalysisLineRow[];
  if (analysisLines.length === 0) {
    await revalidateEstimatingPaths(projectId);
    return { success: true, updatedLines: 0 };
  }

  for (const line of analysisLines) {
    const amount = computeLineAmount(
      Number(line.consumption),
      unitCost,
      Number(line.waste_percent ?? 0),
      line.productivity === null ? null : Number(line.productivity)
    );
    await supabase
      .from('boq_rate_analysis_lines')
      .update({ unit_cost: unitCost, amount })
      .eq('id', line.id);
  }

  const boqIds = Array.from(new Set(analysisLines.map((line) => line.boq_item_id)));
  for (const boqItemId of boqIds) {
    const result = await recalculateBoqItemFromAnalysis(
      projectId,
      boqItemId,
      actorId
    );
    if (!result.success) {
      return result;
    }
  }

  await refreshProjectEstimate(projectId, actorId);
  await revalidateEstimatingPaths(projectId);

  return { success: true, updatedLines: analysisLines.length };
}

/**
 * After company→project import, remap analysis lines that still point at company
 * ids onto the new project copies and refresh costs/totals.
 */
export async function remapAnalysisLinesToProjectResources(
  projectId: string,
  companyToProject: Array<{
    companyItemId: string;
    projectItemId: string;
    unitCost: number;
  }>,
  actorId: string
): Promise<{ remapped: number }> {
  if (companyToProject.length === 0) {
    return { remapped: 0 };
  }

  const supabase = await createClient();
  let remapped = 0;
  const affectedBoq = new Set<string>();

  for (const mapping of companyToProject) {
    const { data: lines } = await supabase
      .from('boq_rate_analysis_lines')
      .select(
        'id, boq_item_id, consumption, waste_percent, productivity, project_library_item_id'
      )
      .eq('library_item_id', mapping.companyItemId)
      .is('deleted_at', null)
      .is('project_library_item_id', null);

    for (const line of lines ?? []) {
      // Scope to this project's BOQ items
      const { data: boq } = await supabase
        .from('boq_items')
        .select('id')
        .eq('id', line.boq_item_id)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .maybeSingle();

      if (!boq) {
        continue;
      }

      const amount = computeLineAmount(
        Number(line.consumption),
        mapping.unitCost,
        Number(line.waste_percent ?? 0),
        line.productivity === null ? null : Number(line.productivity)
      );

      const { error } = await supabase
        .from('boq_rate_analysis_lines')
        .update({
          project_library_item_id: mapping.projectItemId,
          unit_cost: mapping.unitCost,
          amount,
        })
        .eq('id', line.id);

      if (!error) {
        remapped += 1;
        affectedBoq.add(line.boq_item_id);
      }
    }
  }

  for (const boqItemId of affectedBoq) {
    await recalculateBoqItemFromAnalysis(projectId, boqItemId, actorId);
  }

  if (affectedBoq.size > 0) {
    await refreshProjectEstimate(projectId, actorId);
    await revalidateEstimatingPaths(projectId);
  }

  return { remapped };
}

export async function revalidateEstimatingPaths(projectId: string): Promise<void> {
  revalidatePath(ROUTES.projectBoq(projectId));
  revalidatePath(ROUTES.projectSummary(projectId));
  revalidatePath(ROUTES.projectRates(projectId));
  revalidatePath(ROUTES.projectValidation(projectId));
  revalidatePath(ROUTES.projectAiEstimator(projectId));
  revalidatePath(ROUTES.dashboard);
  revalidatePath(ROUTES.dashboardPrint);
}
