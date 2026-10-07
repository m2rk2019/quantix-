import { createClient } from '@/lib/supabase/server';
import {
  buildBenchmarkValidationResult,
  buildComparisonRow,
  inferArchetypeFromCode,
} from '@/lib/benchmark/comparison';
import {
  buildFormulaAuditResult,
  validateEstimateBreakdownConsistency,
  type FormulaAuditBoqItem,
} from '@/lib/estimate/formula-audit';
import type { BenchmarkValidationResult } from '@/types/benchmark';
import type { EstimatePercentages } from '@/types/estimate';

export async function validateHistoricalProject(
  projectId: string
): Promise<BenchmarkValidationResult | null> {
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('id, project_code, project_name')
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!project) {
    return null;
  }

  const [{ data: boqItems }, { data: actuals }, { data: details }, { data: summary }] =
    await Promise.all([
      supabase
        .from('boq_items')
        .select(
          'id, item_code, description, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount'
        )
        .eq('project_id', projectId)
        .is('deleted_at', null),
      supabase
        .from('project_benchmark_actuals')
        .select('*')
        .eq('project_id', projectId),
      supabase
        .from('project_details')
        .select(
          'indirect_cost_percent, contingency_percent, markup_percent, vat_percent, is_benchmark'
        )
        .eq('project_id', projectId)
        .maybeSingle(),
      supabase
        .from('estimate_summary')
        .select('direct_cost, indirect_cost, contingency, markup, vat, grand_total')
        .eq('project_id', projectId)
        .maybeSingle(),
    ]);

  const actualByCode = new Map(
    (actuals ?? []).map((row) => [row.item_code, row])
  );

  const comparisonRows = (boqItems ?? []).map((item) => {
    const actual = actualByCode.get(item.item_code);
    const estimatedUnitRate = Number(item.total_rate);
    const estimatedCost = Number(item.total_amount);

    return buildComparisonRow({
      id: item.id,
      item_code: item.item_code,
      description: item.description,
      estimated_quantity: Number(item.quantity),
      actual_quantity: Number(actual?.actual_quantity ?? item.quantity),
      estimated_unit_rate: estimatedUnitRate,
      actual_unit_rate: Number(actual?.actual_unit_rate ?? estimatedUnitRate),
      estimated_cost: estimatedCost,
      actual_cost: Number(actual?.actual_cost ?? estimatedCost),
      awarded_cost: Number(actual?.awarded_cost ?? actual?.actual_cost ?? estimatedCost),
    });
  });

  const auditItems: FormulaAuditBoqItem[] = (boqItems ?? []).map((item) => ({
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

  const percentages: EstimatePercentages = {
    indirect_cost_percent: Number(details?.indirect_cost_percent ?? 10),
    contingency_percent: Number(details?.contingency_percent ?? 5),
    markup_percent: Number(details?.markup_percent ?? 8),
    vat_percent: Number(details?.vat_percent ?? 12),
  };

  const formulaAudit = buildFormulaAuditResult(projectId, auditItems, percentages);

  const directCost = (boqItems ?? []).reduce(
    (sum, item) => sum + Number(item.total_amount),
    0
  );

  const breakdownCheck = summary
    ? validateEstimateBreakdownConsistency(directCost, percentages, {
        direct_cost: Number(summary.direct_cost),
        indirect_cost: Number(summary.indirect_cost),
        contingency: Number(summary.contingency),
        markup: Number(summary.markup),
        vat: Number(summary.vat),
        grand_total: Number(summary.grand_total),
      })
    : { passed: true, issues: [] };

  return buildBenchmarkValidationResult({
    project_id: projectId,
    project_code: project.project_code,
    project_name: project.project_name,
    archetype: inferArchetypeFromCode(project.project_code),
    rows: comparisonRows,
    formula_accuracy_percent: formulaAudit.accuracy_percent,
    calculation_consistency_percent: breakdownCheck.passed ? 100 : 0,
  });
}

export async function listBenchmarkProjects(): Promise<
  Array<{ id: string; project_code: string; project_name: string; client_name: string }>
> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('project_details')
    .select(
      'project_id, is_benchmark, projects!inner(id, project_code, project_name, client_name, deleted_at)'
    )
    .eq('is_benchmark', true);

  return (data ?? [])
    .filter((row) => {
      const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
      return project && !project.deleted_at;
    })
    .map((row) => {
      const project = Array.isArray(row.projects) ? row.projects[0]! : row.projects!;
      return {
        id: project.id,
        project_code: project.project_code,
        project_name: project.project_name,
        client_name: project.client_name,
      };
    });
}
