/**
 * Lists Supabase migrations in apply order for production deployment.
 * Run: npm run deploy:migrations
 */

import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MIGRATIONS_DIR = resolve(import.meta.dirname, '../supabase/migrations');

const files = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.error('No migration files found.');
  process.exit(1);
}

console.log('Quantix V1 — apply migrations in this order:\n');

files.forEach((file, index) => {
  const content = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8');
  const firstLine = content.split('\n').find((line) => line.trim().startsWith('--'));
  const summary = firstLine ? firstLine.replace(/^--\s*/, '') : '(no description)';

  console.log(`${String(index + 1).padStart(2, ' ')}. ${file}`);
  console.log(`    ${summary}`);
});

console.log('\nApply via:');
console.log('  supabase db push          (CLI, linked project)');
console.log('  Supabase SQL Editor       (paste each file in order)');
console.log('\nVerify: supabase migration list');
