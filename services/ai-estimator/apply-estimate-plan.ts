import { revalidatePath } from 'next/cache';

import { ROUTES } from '@/lib/constants/routes';
import { createBoqItem } from '@/services/boq/create-boq-item';
import { createWbsNode } from '@/services/wbs/create-wbs-node';
import { saveRateAnalysis } from '@/services/rate-analysis/rate-analysis';
import { assertBoqEditAccess } from '@/services/boq/assert-boq-access';
import { logAiEstimateApplied } from '@/services/ai-estimator/ai-learning';
import { hasBlockingScopeIssues } from '@/lib/ai-estimator/scope-checker';
import type { AiEstimatePlan, ApplyAiEstimateResult } from '@/types/ai-estimator';

export async function applyAiEstimatePlan(
  plan: AiEstimatePlan
): Promise<ApplyAiEstimateResult> {
  const access = await assertBoqEditAccess(plan.project_id);
  if (!access.ok) {
    return { success: false, error: access.error };
  }

  const selectedWbs = plan.wbs.filter((node) => node.selected);
  const selectedBoq = plan.boq.filter((item) => item.selected);

  if (selectedWbs.length === 0) {
    return { success: false, error: 'Select at least one WBS node to apply.' };
  }

  if (selectedBoq.length === 0) {
    return { success: false, error: 'Select at least one BOQ item to apply.' };
  }

  if (hasBlockingScopeIssues(plan.scope_issues)) {
    return {
      success: false,
      error: 'Resolve blocking scope issues before applying the AI estimate.',
    };
  }

  const wbsIdMap = new Map<string, string>();
  const sortedWbs = [...selectedWbs].sort((a, b) => a.sort_order - b.sort_order);

  for (const node of sortedWbs) {
    const parentId = node.parent_temp_id
      ? wbsIdMap.get(node.parent_temp_id) ?? null
      : null;

    const result = await createWbsNode({
      project_id: plan.project_id,
      parent_id: parentId,
      description: node.description,
    });

    if (!result.success || !result.nodeId) {
      return {
        success: false,
        error: result.error ?? `Failed to create WBS: ${node.description}`,
      };
    }

    wbsIdMap.set(node.temp_id, result.nodeId);
  }

  let boqCreated = 0;
  let rateAnalysisSaved = 0;

  for (const item of selectedBoq) {
    const wbsId = wbsIdMap.get(item.wbs_temp_id);
    if (!wbsId) {
      return {
        success: false,
        error: `WBS mapping missing for BOQ item: ${item.description}`,
      };
    }

    const boqResult = await createBoqItem({
      project_id: plan.project_id,
      wbs_id: wbsId,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      material_rate: item.material_rate,
      labor_rate: item.labor_rate,
      equipment_rate: item.equipment_rate,
      subcontract_rate: item.subcontract_rate,
      other_cost_rate: item.other_cost_rate,
    });

    if (!boqResult.success || !boqResult.itemId) {
      return {
        success: false,
        error: boqResult.error ?? `Failed to create BOQ: ${item.description}`,
      };
    }

    boqCreated += 1;

    if (item.rate_analysis_lines.length > 0) {
      const saveResult = await saveRateAnalysis(plan.project_id, boqResult.itemId, {
        lines: item.rate_analysis_lines.map((line, index) => ({
          library_item_id: line.library_item_id,
          project_library_item_id: line.project_library_item_id,
          category: line.category,
          resource_name: line.resource_name,
          unit: line.unit,
          consumption: line.consumption,
          unit_cost: line.unit_cost,
          waste_percent: line.waste_percent,
          productivity: line.productivity,
          sort_order: index,
        })),
      });

      if (!saveResult.success) {
        return {
          success: false,
          error:
            saveResult.error ??
            `Failed to save rate analysis for: ${item.description}`,
        };
      }

      rateAnalysisSaved += 1;
    }
  }

  revalidatePath(ROUTES.projectWbs(plan.project_id));
  revalidatePath(ROUTES.projectBoq(plan.project_id));
  revalidatePath(ROUTES.projectSummary(plan.project_id));
  revalidatePath(ROUTES.projectAiEstimator(plan.project_id));

  await logAiEstimateApplied(plan, access.ctx.profileId, {
    wbs_created: wbsIdMap.size,
    boq_created: boqCreated,
    rate_analysis_saved: rateAnalysisSaved,
  });

  return {
    success: true,
    wbs_created: wbsIdMap.size,
    boq_created: boqCreated,
    rate_analysis_saved: rateAnalysisSaved,
  };
}
