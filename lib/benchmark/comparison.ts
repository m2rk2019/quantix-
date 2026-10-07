import { formatCurrencyPHP } from '@/lib/format-currency';
import type {
  BenchmarkComparisonRow,
  BenchmarkFinding,
  BenchmarkValidationResult,
} from '@/types/benchmark';
import type { BenchmarkArchetype } from '@/types/benchmark';

export const ACCEPTANCE = {
  quantity_accuracy: 95,
  rate_accuracy: 95,
  formula_accuracy: 97,
  calculation_consistency: 100,
} as const;

function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

function variance(actual: number, estimated: number): number {
  return actual - estimated;
}

function variancePercent(actual: number, estimated: number): number {
  if (estimated === 0) {
    return actual === 0 ? 0 : 100;
  }
  return roundPercent((variance(actual, estimated) / estimated) * 100);
}

function itemAccuracyPercent(rows: BenchmarkComparisonRow[], field: 'quantity' | 'rate' | 'cost'): number {
  if (rows.length === 0) {
    return 100;
  }

  let withinTolerance = 0;
  for (const row of rows) {
    const pct =
      field === 'quantity'
        ? Math.abs(row.quantity_variance_percent)
        : field === 'rate'
          ? Math.abs(row.rate_variance_percent)
          : Math.abs(row.cost_variance_percent);

    if (pct <= 5) {
      withinTolerance += 1;
    }
  }

  return roundPercent((withinTolerance / rows.length) * 100);
}

export function buildComparisonRow(input: {
  id: string;
  item_code: string;
  description: string;
  estimated_quantity: number;
  actual_quantity: number;
  estimated_unit_rate: number;
  actual_unit_rate: number;
  estimated_cost: number;
  actual_cost: number;
  awarded_cost: number;
}): BenchmarkComparisonRow {
  return {
    id: input.id,
    item_code: input.item_code,
    description: input.description,
    estimated_quantity: input.estimated_quantity,
    actual_quantity: input.actual_quantity,
    quantity_variance: variance(input.actual_quantity, input.estimated_quantity),
    quantity_variance_percent: variancePercent(
      input.actual_quantity,
      input.estimated_quantity
    ),
    estimated_unit_rate: input.estimated_unit_rate,
    actual_unit_rate: input.actual_unit_rate,
    rate_variance: variance(input.actual_unit_rate, input.estimated_unit_rate),
    rate_variance_percent: variancePercent(
      input.actual_unit_rate,
      input.estimated_unit_rate
    ),
    estimated_cost: input.estimated_cost,
    actual_cost: input.actual_cost,
    awarded_cost: input.awarded_cost,
    cost_variance: variance(input.awarded_cost, input.estimated_cost),
    cost_variance_percent: variancePercent(
      input.awarded_cost,
      input.estimated_cost
    ),
  };
}

export function buildBenchmarkFindings(rows: BenchmarkComparisonRow[]): BenchmarkFinding[] {
  const findings: BenchmarkFinding[] = [];

  for (const row of rows) {
    if (Math.abs(row.quantity_variance_percent) > 10) {
      findings.push({
        id: `qty-${row.item_code}`,
        severity: Math.abs(row.quantity_variance_percent) > 20 ? 'critical' : 'warning',
        category: 'quantity',
        title: 'Quantity variance exceeds tolerance',
        message: `${row.item_code}: ${row.quantity_variance_percent.toFixed(1)}% variance (${row.estimated_quantity} → ${row.actual_quantity}).`,
        item_code: row.item_code,
      });
    }

    if (Math.abs(row.rate_variance_percent) > 10) {
      findings.push({
        id: `rate-${row.item_code}`,
        severity: Math.abs(row.rate_variance_percent) > 20 ? 'critical' : 'warning',
        category: 'rate',
        title: 'Rate variance exceeds tolerance',
        message: `${row.item_code}: ${row.rate_variance_percent.toFixed(1)}% rate variance.`,
        item_code: row.item_code,
      });
    }

    if (Math.abs(row.cost_variance_percent) > 10) {
      findings.push({
        id: `cost-${row.item_code}`,
        severity: Math.abs(row.cost_variance_percent) > 20 ? 'critical' : 'warning',
        category: 'cost',
        title: 'Cost overrun / saving detected',
        message: `${row.item_code}: ${row.cost_variance_percent.toFixed(1)}% cost variance (award ${formatCurrencyPHP(row.awarded_cost)}).`,
        item_code: row.item_code,
      });
    }
  }

  const overruns = rows.filter((row) => row.cost_variance > 0);
  if (overruns.length > rows.length * 0.3) {
    findings.push({
      id: 'pattern-overrun',
      severity: 'warning',
      category: 'cost',
      title: 'Systematic cost overrun pattern',
      message: `${overruns.length} of ${rows.length} lines show positive cost variance — review contingency and productivity assumptions.`,
    });
  }

  return findings;
}

export function buildBenchmarkValidationResult(input: {
  project_id: string;
  project_code: string;
  project_name: string;
  archetype: BenchmarkArchetype | null;
  rows: BenchmarkComparisonRow[];
  formula_accuracy_percent: number;
  calculation_consistency_percent: number;
}): BenchmarkValidationResult {
  const quantity_accuracy_percent = itemAccuracyPercent(input.rows, 'quantity');
  const rate_accuracy_percent = itemAccuracyPercent(input.rows, 'rate');
  const cost_accuracy_percent = itemAccuracyPercent(input.rows, 'cost');

  const meets_acceptance =
    quantity_accuracy_percent >= ACCEPTANCE.quantity_accuracy &&
    rate_accuracy_percent >= ACCEPTANCE.rate_accuracy &&
    input.formula_accuracy_percent >= ACCEPTANCE.formula_accuracy &&
    input.calculation_consistency_percent >= ACCEPTANCE.calculation_consistency;

  return {
    project_id: input.project_id,
    project_code: input.project_code,
    project_name: input.project_name,
    archetype: input.archetype,
    rows: input.rows,
    findings: buildBenchmarkFindings(input.rows),
    quantity_accuracy_percent,
    rate_accuracy_percent,
    cost_accuracy_percent,
    formula_accuracy_percent: input.formula_accuracy_percent,
    calculation_consistency_percent: input.calculation_consistency_percent,
    meets_acceptance,
  };
}

export function inferArchetypeFromCode(
  projectCode: string
): BenchmarkArchetype | null {
  if (projectCode.includes('OFF')) return 'office';
  if (projectCode.includes('CON')) return 'condominium';
  if (projectCode.includes('WHS')) return 'warehouse';
  if (projectCode.includes('COM')) return 'commercial';
  if (projectCode.includes('INF')) return 'infrastructure';
  return null;
}
