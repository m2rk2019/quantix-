import {
  calculateTotalAmount,
  calculateTotalRate,
} from '@/lib/boq/calculations';
import { getFormulaAudit } from '@/services/benchmark/get-formula-audit';
import { createClient } from '@/lib/supabase/server';
import type { UatFormulaComparisonRow, UatFormulaVerificationResult } from '@/types/uat';

export async function getFormulaVerification(
  projectId: string
): Promise<UatFormulaVerificationResult | null> {
  const supabase = await createClient();

  const [{ data: project }, audit] = await Promise.all([
    supabase
      .from('projects')
      .select('project_code, project_name')
      .eq('id', projectId)
      .maybeSingle(),
    getFormulaAudit(projectId),
  ]);

  if (!audit || !project) {
    return null;
  }

  const rows: UatFormulaComparisonRow[] = audit.lines.map((line) => {
    const rates = {
      material_rate: line.material_rate,
      labor_rate: line.labor_rate,
      equipment_rate: line.equipment_rate,
      subcontract_rate: line.subcontract_rate,
      other_cost_rate: line.other_cost_rate,
    };
    const manualRate = calculateTotalRate(rates);
    const manualAmount = calculateTotalAmount(line.quantity, manualRate);

    return {
      item_code: line.item_code,
      description: line.description,
      manual_total_rate: manualRate,
      system_total_rate: line.total_rate,
      rate_variance: roundVariance(manualRate, line.total_rate),
      manual_total_amount: manualAmount,
      system_total_amount: line.total_amount,
      amount_variance: roundVariance(manualAmount, line.total_amount),
      passed: line.passed,
    };
  });

  const passed_count = rows.filter((row) => row.passed).length;

  return {
    project_id: projectId,
    project_code: project.project_code,
    project_name: project.project_name,
    rows,
    passed_count,
    failed_count: rows.length - passed_count,
    accuracy_percent: rows.length > 0 ? (passed_count / rows.length) * 100 : 100,
    audit,
  };
}

function roundVariance(expected: number, actual: number): number {
  if (expected === 0) {
    return actual === 0 ? 0 : 100;
  }
  return Math.round(((actual - expected) / expected) * 10000) / 100;
}

export async function listUatProjects(): Promise<
  Array<{ id: string; project_code: string; project_name: string }>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('projects')
    .select('id, project_code, project_name')
    .is('deleted_at', null)
    .order('project_code')
    .limit(50);

  return (data ?? []).map((row) => ({
    id: row.id,
    project_code: row.project_code,
    project_name: row.project_name,
  }));
}
