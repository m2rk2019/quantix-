import type {
  PortfolioCostBreakdown,
  PortfolioDisciplineItem,
  PortfolioKpis,
  PortfolioResourceUsage,
  PortfolioTopCostItem,
  PortfolioWbsItem,
} from '@/types/dashboard';
import type { CurrencyCode } from '@/types/project';

interface SummaryRow {
  direct_cost: number;
  indirect_cost: number;
  contingency: number;
  markup: number;
  vat: number;
  grand_total: number;
}

interface ProjectAnalyticsRow {
  id: string;
  project_code: string;
  project_name: string;
  grand_total: number;
  markup_percent: number;
  markup_amount: number;
  currency: CurrencyCode;
}

interface BoqAggregateRow {
  project_id: string;
  project_code: string;
  project_name: string;
  id: string;
  item_code: string;
  description: string;
  total_amount: number;
  quantity: number;
  material_rate: number;
  labor_rate: number;
  equipment_rate: number;
  subcontract_rate: number;
  wbs_description: string | null;
  wbs_code: string | null;
  wbs_level: number | null;
}

export function buildPortfolioKpis(
  projects: ProjectAnalyticsRow[]
): PortfolioKpis {
  const count = projects.length;
  const totalValue = projects.reduce((sum, row) => sum + row.grand_total, 0);
  const markupPercents = projects
    .map((row) => row.markup_percent)
    .filter((value) => value > 0);
  const profitAmounts = projects.map((row) => row.markup_amount);

  return {
    total_projects: count,
    active_projects: 0,
    completed_projects: 0,
    draft_projects: 0,
    total_estimated_value: totalValue,
    average_markup_percent:
      markupPercents.length > 0
        ? markupPercents.reduce((a, b) => a + b, 0) / markupPercents.length
        : 0,
    average_profit:
      profitAmounts.length > 0
        ? profitAmounts.reduce((a, b) => a + b, 0) / profitAmounts.length
        : 0,
    average_cost_per_project: count > 0 ? totalValue / count : 0,
  };
}

export function buildCostBreakdown(
  summaries: SummaryRow[],
  resources: PortfolioResourceUsage
): PortfolioCostBreakdown {
  const ocm = summaries.reduce((sum, row) => sum + row.indirect_cost, 0);
  const contingency = summaries.reduce((sum, row) => sum + row.contingency, 0);
  const profit = summaries.reduce((sum, row) => sum + row.markup, 0);
  const vat = summaries.reduce((sum, row) => sum + row.vat, 0);
  const grandTotal = summaries.reduce((sum, row) => sum + row.grand_total, 0);

  return {
    material: resources.material,
    labor: resources.labor,
    equipment: resources.equipment,
    subcontract: resources.subcontract,
    ocm,
    contingency,
    profit,
    vat,
    grand_total: grandTotal,
  };
}

export function aggregateResourceUsage(
  rows: BoqAggregateRow[]
): PortfolioResourceUsage {
  return rows.reduce(
    (acc, row) => ({
      material: acc.material + row.quantity * row.material_rate,
      labor: acc.labor + row.quantity * row.labor_rate,
      equipment: acc.equipment + row.quantity * row.equipment_rate,
      subcontract: acc.subcontract + row.quantity * row.subcontract_rate,
    }),
    { material: 0, labor: 0, equipment: 0, subcontract: 0 }
  );
}

export function buildDisciplineBreakdown(
  rows: BoqAggregateRow[],
  grandTotal: number
): PortfolioDisciplineItem[] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    const name = row.wbs_description?.trim() || 'Unassigned';
    totals.set(name, (totals.get(name) ?? 0) + row.total_amount);
  }

  return [...totals.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      percent: grandTotal > 0 ? (amount / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 12);
}

export function buildWbsDistribution(
  rows: BoqAggregateRow[]
): PortfolioWbsItem[] {
  const totals = new Map<string, { code: string; amount: number }>();

  for (const row of rows) {
    if (row.wbs_level !== 0 && row.wbs_level !== 1) {
      continue;
    }
    const code = row.wbs_code ?? '—';
    const name = row.wbs_description ?? 'Unassigned';
    const key = `${code}:${name}`;
    const existing = totals.get(key) ?? { code, amount: 0 };
    existing.amount += row.total_amount;
    totals.set(key, existing);
  }

  return [...totals.entries()]
    .map(([key, value]) => {
      const name = key.split(':').slice(1).join(':') || value.code;
      return {
        code: value.code,
        name,
        amount: value.amount,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 15);
}

export function buildTopCostItems(
  rows: BoqAggregateRow[],
  limit = 20
): PortfolioTopCostItem[] {
  return [...rows]
    .sort((a, b) => b.total_amount - a.total_amount)
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      project_code: row.project_code,
      project_name: row.project_name,
      item_code: row.item_code,
      description: row.description,
      amount: row.total_amount,
    }));
}

export function detectDuplicateBoqDescriptions(
  rows: BoqAggregateRow[]
): Array<{ project_id: string; project_code: string; description: string }> {
  const seen = new Map<string, number>();
  const duplicates: Array<{
    project_id: string;
    project_code: string;
    description: string;
  }> = [];

  for (const row of rows) {
    const key = `${row.project_id}:${row.description.toLowerCase().trim()}`;
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    if (count === 2) {
      duplicates.push({
        project_id: row.project_id,
        project_code: row.project_code,
        description: row.description,
      });
    }
  }

  return duplicates.slice(0, 10);
}
