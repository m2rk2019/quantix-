import { DEFAULT_CURRENCY } from '@/lib/format-currency';
import type { CurrencyCode } from '@/types/project';

export const VALID_CURRENCY_CODES: readonly CurrencyCode[] = [
  'PHP',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SAR',
  'AUD',
  'CAD',
] as const;

export function parseCurrencyCode(
  value: string | null | undefined
): CurrencyCode {
  return VALID_CURRENCY_CODES.includes(value as CurrencyCode)
    ? (value as CurrencyCode)
    : DEFAULT_CURRENCY;
}
