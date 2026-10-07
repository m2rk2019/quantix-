/**
 * Prints instructions to apply the Sprint 8 formula validation demo seed.
 *
 *   npm run seed:formula-validation
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const generator = resolve(import.meta.dirname, 'generate-formula-validation-demo.mjs');
const sqlPath = resolve(import.meta.dirname, '../supabase/seed-formula-validation-demo.sql');

const result = spawnSync(process.execPath, [generator], { stdio: 'inherit' });

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

if (!existsSync(sqlPath)) {
  console.error('Seed SQL was not generated.');
  process.exit(1);
}

console.log('\nApply the seed in Supabase SQL Editor:');
console.log(`  ${sqlPath}`);
console.log('\nThen run validation:');
console.log('  npm run verify:estimating-engine');
