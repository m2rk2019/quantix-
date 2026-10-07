import { roundCurrency } from '@/lib/boq/calculations';
import type { RateLibraryCategory } from '@/types/rate-library';
import { RATE_LIBRARY_CATEGORIES } from '@/types/rate-library';
import type { RateBuildUpMarkups, RateBuildUpSummary } from '@/types/rate-library';

export function computeLineAmount(
  consumption: number,
  unitCost: number,
  wastePercent = 0,
  productivity?: number | null
): number {
  const qty = Math.max(0, consumption);
  const rate = Math.max(0, unitCost);
  const waste = Math.max(0, Math.min(100, wastePercent));
  let amount = qty * rate * (1 + waste / 100);

  if (productivity !== null && productivity !== undefined && productivity > 0) {
    amount = amount / productivity;
  }

  return roundCurrency(amount);
}

export function computeCategoryTotals(
  lines: Array<{ category: RateLibraryCategory; amount: number }>
): Record<RateLibraryCategory, number> {
  const totals = emptyCategoryTotals();

  for (const line of lines) {
    totals[line.category] = roundCurrency(totals[line.category] + line.amount);
  }

  return totals;
}

export function computeDirectCost(
  categoryTotals: Record<RateLibraryCategory, number>,
  otherCostRate = 0
): number {
  const sum = RATE_LIBRARY_CATEGORIES.reduce(
    (acc, category) => acc + categoryTotals[category],
    0
  );
  return roundCurrency(sum + Math.max(0, otherCostRate));
}

function applyPercent(base: number, percent: number): number {
  const clamped = Math.max(0, Math.min(100, percent));
  return roundCurrency(base * (clamped / 100));
}

export function computeRateBuildUp(
  directCost: number,
  markups: RateBuildUpMarkups
): RateBuildUpSummary {
  const direct = roundCurrency(Math.max(0, directCost));
  const ocm = applyPercent(direct, markups.ocm_percent);
  const contingency = applyPercent(direct + ocm, markups.contingency_percent);
  const profit = applyPercent(
    direct + ocm + contingency,
    markups.profit_percent
  );
  const vat = applyPercent(
    direct + ocm + contingency + profit,
    markups.vat_percent
  );
  const finalRate = roundCurrency(direct + ocm + contingency + profit + vat);

  return {
    direct_cost: direct,
    ocm,
    contingency,
    profit,
    vat,
    final_rate: finalRate,
  };
}

export function emptyCategoryTotals(): Record<RateLibraryCategory, number> {
  return RATE_LIBRARY_CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = 0;
      return acc;
    },
    {} as Record<RateLibraryCategory, number>
  );
}

export const CATEGORY_TO_RATE_FIELD = {
  material: 'material_rate',
  labor: 'labor_rate',
  equipment: 'equipment_rate',
  subcontract: 'subcontract_rate',
} as const satisfies Partial<Record<RateLibraryCategory, string>>;

export const CATEGORY_TO_OVERRIDE_FIELD = {
  material: 'material_rate_override',
  labor: 'labor_rate_override',
  equipment: 'equipment_rate_override',
  subcontract: 'subcontract_rate_override',
} as const satisfies Partial<Record<RateLibraryCategory, string>>;

export const BOQ_MAPPED_RATE_CATEGORIES = [
  'material',
  'labor',
  'equipment',
  'subcontract',
] as const satisfies readonly RateLibraryCategory[];

export function findDuplicateLibraryResources(
  lines: Array<{
    library_item_id?: string | null;
    project_library_item_id?: string | null;
    category: RateLibraryCategory;
  }>
): string[] {
  const seen = new Map<string, string>();
  const duplicates: string[] = [];

  for (const line of lines) {
    const resourceId =
      line.project_library_item_id ?? line.library_item_id ?? null;
    if (!resourceId) {
      continue;
    }
    const key = `${line.category}:${resourceId}`;
    if (seen.has(key)) {
      duplicates.push(resourceId);
    } else {
      seen.set(key, resourceId);
    }
  }

  return duplicates;
}
