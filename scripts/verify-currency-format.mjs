/**
 * PHP currency formatter verification.
 *   npm run verify:currency-format
 */

import {
  DEFAULT_CURRENCY,
  formatCurrency,
  formatCurrencyPHP,
  excelCurrencyNumFmt,
} from '../lib/format-currency.ts';

let ok = true;

function pass(label) {
  console.log('PASS', label);
}

function fail(label, expected, actual) {
  ok = false;
  console.error('FAIL', label, '| expected=', expected, '| actual=', actual);
}

function assertFormat(label, amount, expected) {
  const actual = formatCurrencyPHP(amount);
  if (actual === expected) {
    pass(label);
  } else {
    fail(label, expected, actual);
  }
}

console.log('Quantix — PHP Currency Format Verification\n');

if (DEFAULT_CURRENCY === 'PHP') {
  pass('default currency is PHP');
} else {
  fail('default currency', 'PHP', DEFAULT_CURRENCY);
}

assertFormat('positive amount', 1234.56, '₱ 1,234.56');
assertFormat('large amount', 1234567.89, '₱ 1,234,567.89');
assertFormat('whole pesos', 12345, '₱ 12,345.00');
assertFormat('zero', 0, '₱ 0.00');
assertFormat('negative amount', -1234.56, '-₱ 1,234.56');
assertFormat('small fraction', 0.5, '₱ 0.50');

if (formatCurrency(100) === formatCurrencyPHP(100)) {
  pass('formatCurrency delegates to formatCurrencyPHP');
} else {
  fail('formatCurrency delegation', formatCurrencyPHP(100), formatCurrency(100));
}

if (excelCurrencyNumFmt() === '"₱"#,##0.00') {
  pass('excel PHP numFmt');
} else {
  fail('excel numFmt', '"₱"#,##0.00', excelCurrencyNumFmt());
}

console.log('\n' + (ok ? 'RESULT: PASS' : 'RESULT: FAIL'));
process.exit(ok ? 0 : 1);
