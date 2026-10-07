import { createClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit/log-audit-event';
import {
  computeLearningBoosts,
  extractQuantityTypesFromPlan,
  parseLearningProfilesFromAudit,
} from '@/lib/ai-estimator/learning';
import type { AiEstimatePlan, ParsedProjectDescription } from '@/types/ai-estimator';
import type { Json } from '@/types/database';

export async function loadLearningBoostsForDescription(
  parsed: ParsedProjectDescription
): Promise<{ learningBoost: number; quantityTypeBoosts: Record<string, number> }> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('audit_log')
    .select('payload')
    .eq('action', 'ai_estimate.applied')
    .order('created_at', { ascending: false })
    .limit(100);

  const profiles = parseLearningProfilesFromAudit(
    (data ?? []).map((row) => ({ payload: row.payload as Record<string, unknown> | null }))
  );

  const boosts = computeLearningBoosts(profiles, parsed);
  return {
    learningBoost: boosts.global_boost,
    quantityTypeBoosts: boosts.quantity_type_boosts,
  };
}

export async function logAiEstimateGenerated(
  plan: AiEstimatePlan,
  actorId: string
): Promise<void> {
  await logAuditEvent({
    projectId: plan.project_id,
    entityType: 'ai_estimate',
    entityId: plan.project_id,
    action: 'ai_estimate.generated',
    actorId,
    module: 'boq',
    remarks: `AI engineering plan generated (${plan.boq.length} BOQ suggestions)`,
    payload: {
      building_type: plan.description.building_type,
      knowledge_version: plan.knowledge_version,
      boq_count: plan.boq.length,
      wbs_count: plan.wbs.length,
      learning_boost: plan.learning_boost_applied,
      quantity_types: extractQuantityTypesFromPlan(plan.boq),
    } as Record<string, Json>,
  });
}

export async function logAiEstimateApplied(
  plan: AiEstimatePlan,
  actorId: string,
  result: { wbs_created?: number; boq_created?: number; rate_analysis_saved?: number }
): Promise<void> {
  await logAuditEvent({
    projectId: plan.project_id,
    entityType: 'ai_estimate',
    entityId: plan.project_id,
    action: 'ai_estimate.applied',
    actorId,
    module: 'boq',
    remarks: `AI estimate applied: ${result.boq_created ?? 0} BOQ, ${result.wbs_created ?? 0} WBS`,
    payload: {
      approved: true,
      building_type: plan.description.building_type,
      knowledge_version: plan.knowledge_version,
      boq_count: result.boq_created ?? 0,
      wbs_count: result.wbs_created ?? 0,
      rate_analysis_count: result.rate_analysis_saved ?? 0,
      quantity_types: extractQuantityTypesFromPlan(plan.boq),
      user_edited_items: plan.boq.filter(
        (item) => item.user_edited_quantity || item.user_edited_rates
      ).length,
    } as Record<string, Json>,
  });
}
