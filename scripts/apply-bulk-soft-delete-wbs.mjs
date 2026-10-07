/**
 * Apply bulk_soft_delete_wbs RPC (idempotent).
 *
 *   npm run fix:wbs-bulk-delete
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

import { loadEnvLocal } from './lib/load-env-local.mjs';
import {
  projectRefFromSupabaseUrl,
  resolveWorkingDatabaseUrl,
} from './lib/resolve-database-url.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const SQL_PATH = resolve(
  ROOT,
  'supabase/migrations/20260714120000_bulk_soft_delete_wbs.sql'
);

loadEnvLocal();

async function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return {
      url: process.env.DATABASE_URL.trim(),
      label: 'DATABASE_URL',
    };
  }

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const projectRef = projectRefFromSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  );

  if (!password || !projectRef) {
    return { url: null, label: null, errorSummary: 'Missing DB credentials' };
  }

  const resolved = await resolveWorkingDatabaseUrl(projectRef, password, {
    timeoutMs: 3500,
    concurrency: 10,
  });

  return {
    url: resolved?.url ?? null,
    label: resolved?.label ?? null,
    errorSummary: resolved?.errorSummary ?? null,
  };
}

const sql = readFileSync(SQL_PATH, 'utf8');
const connection = await resolveDatabaseUrl();

if (!connection.url) {
  console.error('Could not open a Postgres connection.');
  if (connection.errorSummary) {
    console.error(connection.errorSummary);
  }
  console.error(
    'Run supabase/migrations/20260714120000_bulk_soft_delete_wbs.sql in the SQL Editor,'
  );
  console.error(
    'or set DATABASE_URL. App bulk delete still works via admin batch fallback.'
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString: connection.url,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log('Applying bulk_soft_delete_wbs via', connection.label, '…');
await client.query(sql);

const { rows } = await client.query(`
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'bulk_soft_delete_wbs'
`);

if (rows.length === 0) {
  console.error('FAIL: bulk_soft_delete_wbs missing after apply');
  await client.end();
  process.exit(1);
}

await client.query(`
  CREATE SCHEMA IF NOT EXISTS quantix_migrations;
  CREATE TABLE IF NOT EXISTS quantix_migrations.applied (
    version TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  INSERT INTO quantix_migrations.applied (version, name)
  VALUES ('20260714120000_bulk_soft_delete_wbs', '20260714120000_bulk_soft_delete_wbs.sql')
  ON CONFLICT (version) DO NOTHING
`);

await client.query(`NOTIFY pgrst, 'reload schema'`);
await client.end();
console.log('OK  bulk_soft_delete_wbs ready');
