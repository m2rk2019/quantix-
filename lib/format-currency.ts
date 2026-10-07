import type { CurrencyCode } from '@/types/project';

/** Quantix V1 default application currency */
export const DEFAULT_CURRENCY: CurrencyCode = 'PHP';

export const PHP_CURRENCY_SYMBOL = '₱';

/**
 * Format a numeric amount as Philippine Peso for UI display.
 * Examples: ₱ 1,234.56 · ₱ 0.00 · -₱ 1,234.56
 */
export function formatCurrencyPHP(amount: number): string {
  if (!Number.isFinite(amount)) {
    return `${PHP_CURRENCY_SYMBOL} 0.00`;
  }

  const sign = amount < 0 ? '-' : '';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  return `${sign}${PHP_CURRENCY_SYMBOL} ${formatted}`;
}

/**
 * Format monetary values for display. V1 always presents amounts in PHP.
 * The optional currency argument is retained for API compatibility; calculations
 * and storage remain numeric and currency-agnostic.
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = DEFAULT_CURRENCY
): string {
  void currency;
  return formatCurrencyPHP(amount);
}

/** Excel number format string for PHP currency columns */
export function excelCurrencyNumFmt(
  currency: CurrencyCode = DEFAULT_CURRENCY
): string {
  void currency;
  return `"${PHP_CURRENCY_SYMBOL}"#,##0.00`;
}
