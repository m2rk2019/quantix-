import { createClient } from '@/lib/supabase/server';
import {
  buildFormulaAuditResult,
  type FormulaAuditBoqItem,
} from '@/lib/estimate/formula-audit';
import type { FormulaAuditResult } from '@/types/benchmark';
import type { EstimatePercentages } from '@/types/estimate';

export async function getFormulaAudit(
  projectId: string
): Promise<FormulaAuditResult | null> {
  const supabase = await createClient();

  const [{ data: boqItems }, { data: details }] = await Promise.all([
    supabase
      .from('boq_items')
      .select(
        'item_code, description, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount'
      )
      .eq('project_id', projectId)
      .is('deleted_at', null)
      .order('item_code'),
    supabase
      .from('project_details')
      .select('indirect_cost_percent, contingency_percent, markup_percent, vat_percent')
      .eq('project_id', projectId)
      .maybeSingle(),
  ]);

  if (!boqItems || boqItems.length === 0) {
    return null;
  }

  const percentages: EstimatePercentages = {
    indirect_cost_percent: Number(details?.indirect_cost_percent ?? 10),
    contingency_percent: Number(details?.contingency_percent ?? 5),
    markup_percent: Number(details?.markup_percent ?? 8),
    vat_percent: Number(details?.vat_percent ?? 12),
  };

  const items: FormulaAuditBoqItem[] = boqItems.map((item) => ({
    item_code: item.item_code,
    description: item.description,
    quantity: Number(item.quantity),
    material_rate: Number(item.material_rate),
    labor_rate: Number(item.labor_rate),
    equipment_rate: Number(item.equipment_rate),
    subcontract_rate: Number(item.subcontract_rate),
    other_cost_rate: Number(item.other_cost_rate),
    total_rate: Number(item.total_rate),
    total_amount: Number(item.total_amount),
  }));

  return buildFormulaAuditResult(projectId, items, percentages);
}
