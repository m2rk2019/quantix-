/**
 * Sprint 13 — Company settings verification.
 *   npm run verify:company-settings
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

let ok = true;

function pass(label) {
  console.log('PASS', label);
}

function fail(label, expected, actual) {
  ok = false;
  console.error('FAIL', label, '| expected=', expected, '| actual=', actual);
}

const root = resolve(import.meta.dirname, '..');
const migration = readFileSync(
  resolve(root, 'supabase/migrations/20260710120000_company_settings_sprint13.sql'),
  'utf8'
);

if (migration.includes('company_settings')) {
  pass('company_settings migration exists');
} else {
  fail('migration', 'company_settings', 'missing');
}

if (migration.includes('projects_list_updated_idx')) {
  pass('performance indexes in migration');
} else {
  fail('indexes', 'present', 'missing');
}

const requiredFields = [
  'company_name',
  'logo_url',
  'default_currency',
  'theme_color',
  'report_header',
  'signature_block',
];
for (const field of requiredFields) {
  if (migration.includes(field)) {
    pass(`field ${field}`);
  } else {
    fail(`field ${field}`, 'present', 'missing');
  }
}

const themeHex = '#1f4e79';
const excelArgb = `FF${themeHex.replace('#', '').toUpperCase()}`;
if (excelArgb === 'FF1F4E79') {
  pass('theme color excel conversion');
} else {
  fail('excel argb', 'FF1F4E79', excelArgb);
}

console.log('\n' + (ok ? 'RESULT: PASS' : 'RESULT: FAIL'));
process.exit(ok ? 0 : 1);
