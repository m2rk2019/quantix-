/**
 * Generates supabase/apply-migrations-8-17.sql for SQL Editor paste.
 * Run: node scripts/generate-migrations-8-17-bundle.mjs
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const MIGRATIONS_DIR = resolve(ROOT, 'supabase/migrations');
const OUTPUT = resolve(ROOT, 'supabase/apply-migrations-8-17.sql');

const START_FILE = '20260702120000_grant_schema_permissions.sql';

const files = readdirSync(MIGRATIONS_DIR)
  .filter((name) => name.endsWith('.sql'))
  .sort()
  .filter((name) => name >= START_FILE);

function guardCreateType(sql) {
  if (!sql.includes('CREATE TYPE public.rate_library_category')) {
    return sql;
  }

  return sql.replace(
    /CREATE TYPE public\.rate_library_category AS ENUM \([\s\S]*?\);/m,
    `DO $guard$
BEGIN
  CREATE TYPE public.rate_library_category AS ENUM (
    'material',
    'labor',
    'equipment',
    'subcontract'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $guard$;`
  );
}

function makeIdempotent(sql) {
  let next = sql;

  next = guardCreateType(next);

  next = next.replace(
    /CREATE TABLE public\.([a-z_]+)/g,
    'CREATE TABLE IF NOT EXISTS public.$1'
  );

  next = next.replace(
    /CREATE UNIQUE INDEX (?!IF NOT EXISTS)([a-z_]+)/g,
    'CREATE UNIQUE INDEX IF NOT EXISTS $1'
  );

  next = next.replace(
    /CREATE INDEX (?!IF NOT EXISTS)([a-z_]+)/g,
    'CREATE INDEX IF NOT EXISTS $1'
  );

  next = next.replace(
    /CREATE TRIGGER ([a-z_]+)\s+BEFORE UPDATE ON public\.([a-z_]+)/g,
    'DROP TRIGGER IF EXISTS $1 ON public.$2;\n\nCREATE TRIGGER $1\n  BEFORE UPDATE ON public.$2'
  );

  next = next.replace(
    /CREATE POLICY ([a-z_]+)\n\s+ON public\.([a-z_]+)/g,
    'DROP POLICY IF EXISTS $1 ON public.$2;\n\nCREATE POLICY $1\n  ON public.$2'
  );

  return next;
}

const parts = [
  '-- Quantix V1 — Apply migrations #8–#17 only',
  '-- Safe to run when migrations #1–#7 are already applied.',
  '-- Paste into Supabase Dashboard → SQL Editor → Run',
  '-- Project: tfpiuuyvknxdegegvqrm',
  '--',
  '-- After success:',
  '--   1. Project Settings → API → Reload schema',
  '--   2. npm run load:demo',
  '--   3. npm run verify:megawide-office',
  '',
  'BEGIN;',
  '',
];

for (const file of files) {
  const raw = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8').trim();
  const sql = makeIdempotent(raw);

  parts.push(`-- >>> BEGIN ${file}`);
  parts.push(sql);
  parts.push(`-- <<< END ${file}`);
  parts.push('');
}

parts.push(`NOTIFY pgrst, 'reload schema';`);
parts.push('');
parts.push('COMMIT;');
parts.push('');

writeFileSync(OUTPUT, `${parts.join('\n')}\n`, 'utf8');
console.log(`Wrote ${OUTPUT} (${files.length} migrations).`);
