import type {
  BoqResourceTotals,
  DisciplineBreakdownItem,
  EstimateBreakdown,
  EstimateLineItem,
  EstimatePercentages,
  EstimateSummaryData,
  WbsRollupNode,
} from '@/types/estimate';

export function buildEstimateSummaryLines(
  breakdown: EstimateBreakdown,
  resourceTotals: BoqResourceTotals,
  percentages: EstimatePercentages
): EstimateLineItem[] {
  return [
    {
      key: 'material',
      label: 'Material Cost',
      percent: null,
      amount: resourceTotals.material,
    },
    {
      key: 'labor',
      label: 'Labor Cost',
      percent: null,
      amount: resourceTotals.labor,
    },
    {
      key: 'equipment',
      label: 'Equipment Cost',
      percent: null,
      amount: resourceTotals.equipment,
    },
    {
      key: 'subcontract',
      label: 'Subcontract Cost',
      percent: null,
      amount: resourceTotals.subcontract,
    },
    {
      key: 'direct_cost',
      label: 'Direct Cost',
      percent: null,
      amount: breakdown.direct_cost,
      highlight: true,
    },
    {
      key: 'indirect_cost',
      label: 'OCM',
      percent: percentages.indirect_cost_percent,
      amount: breakdown.indirect_cost,
      editable: true,
      percentField: 'indirect_cost_percent',
    },
    {
      key: 'contingency',
      label: 'Contingency',
      percent: percentages.contingency_percent,
      amount: breakdown.contingency,
      editable: true,
      percentField: 'contingency_percent',
    },
    {
      key: 'markup',
      label: 'Profit',
      percent: percentages.markup_percent,
      amount: breakdown.markup,
      editable: true,
      percentField: 'markup_percent',
    },
    {
      key: 'vat',
      label: 'VAT',
      percent: percentages.vat_percent,
      amount: breakdown.vat,
      editable: true,
      percentField: 'vat_percent',
    },
    {
      key: 'grand_total',
      label: 'Total Bid Price',
      percent: null,
      amount: breakdown.grand_total,
      highlight: true,
    },
  ];
}

export function buildDisciplineBreakdown(
  wbsRollup: WbsRollupNode[],
  grandTotal: number
): DisciplineBreakdownItem[] {
  return wbsRollup
    .map((node) => ({
      id: node.id,
      code: node.wbs_code,
      name: node.description,
      amount: node.combined_total,
      percent: grandTotal > 0 ? (node.combined_total / grandTotal) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildMonthlyCashPlaceholder(grandTotal: number): Array<{
  month: string;
  amount: number;
}> {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const amount = Math.round((grandTotal / 12) * 100) / 100;
  return months.map((month) => ({ month, amount }));
}

export function validateSummaryData(data: EstimateSummaryData): string[] {
  const errors: string[] = [];
  const { breakdown, percentages, resource_totals } = data;

  const amounts = [
    breakdown.direct_cost,
    breakdown.indirect_cost,
    breakdown.contingency,
    breakdown.markup,
    breakdown.vat,
    breakdown.grand_total,
    resource_totals.material,
    resource_totals.labor,
    resource_totals.equipment,
    resource_totals.subcontract,
  ];

  if (amounts.some((value) => value < 0)) {
    errors.push('Negative totals are not allowed.');
  }

  const percentFields = Object.values(percentages);
  if (percentFields.some((value) => value < 0 || value > 100)) {
    errors.push('Markup percentages must be between 0 and 100.');
  }

  if (data.discipline_breakdown.length === 0 && data.boq_item_count > 0) {
    errors.push('WBS discipline breakdown is missing.');
  }

  return errors;
}
