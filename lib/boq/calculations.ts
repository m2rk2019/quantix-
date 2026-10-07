import type { BoqRateFields } from '@/types/boq';

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateTotalRate(rates: BoqRateFields): number {
  return roundCurrency(
    rates.material_rate +
      rates.labor_rate +
      rates.equipment_rate +
      rates.subcontract_rate +
      rates.other_cost_rate
  );
}

export function calculateTotalAmount(
  quantity: number,
  totalRate: number
): number {
  return roundCurrency(quantity * totalRate);
}

export function parseNumericField(value: string): number {
  if (value.trim() === '') {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatBoqNumber(value: number): string {
  return value.toFixed(2);
}
