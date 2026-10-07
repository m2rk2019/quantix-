import {
  calculateTotalAmount,
  calculateTotalRate,
  roundCurrency,
} from '@/lib/boq/calculations';
import { calculateEstimateBreakdown } from '@/lib/estimate/calculations';
import type { EstimatePercentages } from '@/types/estimate';
import type { FormulaAuditLine, FormulaAuditResult } from '@/types/benchmark';

export const AMOUNT_TOLERANCE = 0.01;

export interface FormulaAuditBoqItem {
  item_code: string;
  description: string;
  quantity: number;
  material_rate: number;
  labor_rate: number;
  equipment_rate: number;
  subcontract_rate: number;
  other_cost_rate: number;
  total_rate: number;
  total_amount: number;
}

function amountsMatch(expected: number, actual: number): boolean {
  return Math.abs(expected - actual) <= AMOUNT_TOLERANCE;
}

export function buildFormulaAuditLine(
  item: FormulaAuditBoqItem,
  directCostTotal: number,
  percentages: EstimatePercentages
): FormulaAuditLine {
  const rates = {
    material_rate: item.material_rate,
    labor_rate: item.labor_rate,
    equipment_rate: item.equipment_rate,
    subcontract_rate: item.subcontract_rate,
    other_cost_rate: item.other_cost_rate,
  };

  const expectedRate = calculateTotalRate(rates);
  const expectedAmount = calculateTotalAmount(item.quantity, expectedRate);
  const issues: string[] = [];

  if (!amountsMatch(expectedRate, item.total_rate)) {
    issues.push(
      `Total rate mismatch: expected ${expectedRate}, got ${item.total_rate}`
    );
  }

  if (!amountsMatch(expectedAmount, item.total_amount)) {
    issues.push(
      `Total amount mismatch: expected ${expectedAmount}, got ${item.total_amount}`
    );
  }

  const resourceBreakdown = [
    { category: 'Material', amount: roundCurrency(item.quantity * item.material_rate) },
    { category: 'Labor', amount: roundCurrency(item.quantity * item.labor_rate) },
    { category: 'Equipment', amount: roundCurrency(item.quantity * item.equipment_rate) },
    { category: 'Subcontract', amount: roundCurrency(item.quantity * item.subcontract_rate) },
    { category: 'Other', amount: roundCurrency(item.quantity * item.other_cost_rate) },
  ];

  const lineDirect = expectedAmount;
  const markupBreakdown = calculateEstimateBreakdown(lineDirect, percentages);

  return {
    item_code: item.item_code,
    description: item.description,
    quantity_formula: `Qty × Unit Rate = ${item.quantity} × ${expectedRate}`,
    rate_formula: `Mat + Lab + Eq + Sub + Oth = ${expectedRate}`,
    quantity: item.quantity,
    material_rate: item.material_rate,
    labor_rate: item.labor_rate,
    equipment_rate: item.equipment_rate,
    subcontract_rate: item.subcontract_rate,
    other_cost_rate: item.other_cost_rate,
    total_rate: item.total_rate,
    total_amount: item.total_amount,
    resource_breakdown: resourceBreakdown,
    markup_breakdown: markupBreakdown,
    percentages,
    line_share_of_direct:
      directCostTotal > 0 ? (lineDirect / directCostTotal) * 100 : 0,
    passed: issues.length === 0,
    issues,
  };
}

export function buildFormulaAuditResult(
  projectId: string,
  items: FormulaAuditBoqItem[],
  percentages: EstimatePercentages
): FormulaAuditResult {
  const directCostTotal = items.reduce((sum, item) => sum + item.total_amount, 0);
  const lines = items.map((item) =>
    buildFormulaAuditLine(item, directCostTotal, percentages)
  );

  const passed_count = lines.filter((line) => line.passed).length;
  const failed_count = lines.length - passed_count;
  const accuracy_percent =
    lines.length > 0 ? (passed_count / lines.length) * 100 : 100;

  return {
    project_id: projectId,
    lines,
    passed_count,
    failed_count,
    accuracy_percent,
  };
}

export function validateEstimateBreakdownConsistency(
  directCost: number,
  percentages: EstimatePercentages,
  stored: {
    direct_cost: number;
    indirect_cost: number;
    contingency: number;
    markup: number;
    vat: number;
    grand_total: number;
  }
): { passed: boolean; issues: string[] } {
  const recomputed = calculateEstimateBreakdown(directCost, percentages);
  const issues: string[] = [];

  for (const key of [
    'direct_cost',
    'indirect_cost',
    'contingency',
    'markup',
    'vat',
    'grand_total',
  ] as const) {
    if (!amountsMatch(recomputed[key], stored[key])) {
      issues.push(`Estimate ${key} mismatch: expected ${recomputed[key]}, got ${stored[key]}`);
    }
  }

  return { passed: issues.length === 0, issues };
}
