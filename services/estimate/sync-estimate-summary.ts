import { calculateEstimateBreakdown } from '@/lib/estimate/calculations';
import { createClient } from '@/lib/supabase/server';
import type { EstimateBreakdown, EstimatePercentages } from '@/types/estimate';

export async function sumDirectCost(projectId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('sum_boq_total_amount', {
    p_project_id: projectId,
    p_wbs_id: null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return Number(data ?? 0);
}
export async function getEstimatePercentages(
  projectId: string
): Promise<EstimatePercentages> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project_details')
    .select(
      'indirect_cost_percent, contingency_percent, markup_percent, vat_percent'
    )
    .eq('project_id', projectId)
    .maybeSingle();

  if (error || !data) {
    return {
      indirect_cost_percent: 0,
      contingency_percent: 0,
      markup_percent: 0,
      vat_percent: 0,
    };
  }

  return {
    indirect_cost_percent: Number(data.indirect_cost_percent ?? 0),
    contingency_percent: Number(data.contingency_percent ?? 0),
    markup_percent: Number(data.markup_percent ?? 0),
    vat_percent: Number(data.vat_percent ?? 0),
  };
}

export async function syncEstimateSummary(
  projectId: string,
  profileId?: string
): Promise<EstimateBreakdown> {
  const supabase = await createClient();
  const directCost = await sumDirectCost(projectId);
  const percentages = await getEstimatePercentages(projectId);
  const breakdown = calculateEstimateBreakdown(directCost, percentages);

  const { data: existing } = await supabase
    .from('estimate_summary')
    .select('id, created_by')
    .eq('project_id', projectId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('estimate_summary')
      .update({
        direct_cost: breakdown.direct_cost,
        indirect_cost: breakdown.indirect_cost,
        contingency: breakdown.contingency,
        markup: breakdown.markup,
        vat: breakdown.vat,
        grand_total: breakdown.grand_total,
        updated_by: profileId ?? null,
      })
      .eq('project_id', projectId);

    if (error) {
      throw new Error(error.message);
    }
  } else if (profileId) {
    const { error } = await supabase.from('estimate_summary').insert({
      project_id: projectId,
      direct_cost: breakdown.direct_cost,
      indirect_cost: breakdown.indirect_cost,
      contingency: breakdown.contingency,
      markup: breakdown.markup,
      vat: breakdown.vat,
      grand_total: breakdown.grand_total,
      created_by: profileId,
      updated_by: profileId,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  return breakdown;
}
