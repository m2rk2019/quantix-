/**
 * Rollback Project Rate Library table/RPCs (does not remove enum values).
 *
 *   npm run rollback:project-rate-library
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
const ROLLBACK = resolve(
  ROOT,
  'supabase/migrations/20260715120100_project_rate_library.rollback.sql'
);

loadEnvLocal();

async function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return { url: process.env.DATABASE_URL.trim(), label: 'DATABASE_URL' };
  }
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const projectRef = projectRefFromSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  );
  if (!password || !projectRef) return { url: null };
  const resolved = await resolveWorkingDatabaseUrl(projectRef, password, {
    timeoutMs: 3500,
    concurrency: 10,
  });
  return { url: resolved?.url ?? null, label: resolved?.label ?? null };
}

const connection = await resolveDatabaseUrl();
if (!connection.url) {
  console.error('Could not open Postgres. Run the rollback SQL manually:');
  console.error(ROLLBACK);
  process.exit(1);
}

const client = new pg.Client({
  connectionString: connection.url,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
console.log('Rolling back Project Rate Library via', connection.label ?? 'url');
await client.query(readFileSync(ROLLBACK, 'utf8'));
await client.query(`
  DELETE FROM quantix_migrations.applied
  WHERE version = '20260715120100_project_rate_library'
`);
await client.query(`NOTIFY pgrst, 'reload schema'`);
await client.end();
console.log('OK  Project Rate Library rolled back (enum labels retained)');
