import { roundCurrency } from '@/lib/boq/calculations';
import type { EstimateBreakdown, EstimatePercentages } from '@/types/estimate';

function applyPercent(base: number, percent: number): number {
  if (percent < 0 || percent > 100) {
    throw new Error('Percentage must be between 0 and 100.');
  }

  return roundCurrency(base * (percent / 100));
}

export function calculateEstimateBreakdown(
  directCost: number,
  percentages: EstimatePercentages
): EstimateBreakdown {
  if (directCost < 0) {
    throw new Error('Direct cost cannot be negative.');
  }

  const validated: EstimatePercentages = {
    indirect_cost_percent: Math.max(0, Math.min(100, percentages.indirect_cost_percent)),
    contingency_percent: Math.max(0, Math.min(100, percentages.contingency_percent)),
    markup_percent: Math.max(0, Math.min(100, percentages.markup_percent)),
    vat_percent: Math.max(0, Math.min(100, percentages.vat_percent)),
  };

  const direct_cost = roundCurrency(directCost);
  const indirect_cost = applyPercent(
    direct_cost,
    validated.indirect_cost_percent
  );
  const contingency = applyPercent(
    direct_cost + indirect_cost,
    validated.contingency_percent
  );
  const markup = applyPercent(
    direct_cost + indirect_cost + contingency,
    validated.markup_percent
  );
  const vat = applyPercent(
    direct_cost + indirect_cost + contingency + markup,
    validated.vat_percent
  );
  const grand_total = roundCurrency(
    direct_cost + indirect_cost + contingency + markup + vat
  );

  return {
    direct_cost,
    indirect_cost,
    contingency,
    markup,
    vat,
    grand_total,
  };
}
