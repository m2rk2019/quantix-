/**
 * Apply Project Rate Library migrations (enum extend + table/RPCs).
 *
 *   npm run fix:project-rate-library
 *
 * Connection order:
 *   1. DATABASE_URL (Session pooler URI from Supabase → Connect)
 *   2. SUPABASE_ACCESS_TOKEN (Management API SQL)
 *   3. SUPABASE_DB_PASSWORD + pooler discovery
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
const FILES = [
  'supabase/migrations/20260715120000_rate_library_category_extend.sql',
  'supabase/migrations/20260715120100_project_rate_library.sql',
];

loadEnvLocal();

async function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return { url: process.env.DATABASE_URL.trim(), label: 'DATABASE_URL' };
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

async function applyViaManagementApi(projectRef, accessToken) {
  console.log('Applying Project Rate Library via Management API');

  for (const relative of FILES) {
    const query = readFileSync(resolve(ROOT, relative), 'utf8');
    console.log('→', relative);
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );
    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `Management API ${response.status} for ${relative}: ${text.slice(0, 500)}`
      );
    }
  }

  const verifyResponse = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          SELECT
            (SELECT count(*)::int FROM information_schema.tables
              WHERE table_schema = 'public'
                AND table_name = 'project_rate_library_items') AS table_ok,
            (SELECT count(*)::int FROM pg_proc p
              JOIN pg_namespace n ON n.oid = p.pronamespace
              WHERE n.nspname = 'public'
                AND proname IN (
                  'import_company_resources_to_project',
                  'list_project_rate_library_stale',
                  'sync_project_rate_library_from_company'
                )) AS rpc_ok;
          NOTIFY pgrst, 'reload schema';
        `,
      }),
    }
  );
  const verifyText = await verifyResponse.text();
  if (!verifyResponse.ok) {
    throw new Error(`Verify failed: ${verifyText.slice(0, 500)}`);
  }
  console.log('Verify:', verifyText.slice(0, 300));
  console.log('OK  Project Rate Library schema ready (Management API)');
}

const projectRef = projectRefFromSupabaseUrl(
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
);
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();

if (accessToken && projectRef) {
  try {
    await applyViaManagementApi(projectRef, accessToken);
    process.exit(0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error('Falling back to Postgres connection…');
  }
}

const connection = await resolveDatabaseUrl();
if (!connection.url) {
  console.error('Could not open a Postgres connection.');
  if (connection.errorSummary) console.error(connection.errorSummary);
  console.error(
    '\nSet one of the following in .env.local, then re-run npm run fix:project-rate-library:'
  );
  console.error(
    '  - DATABASE_URL = Session mode URI from Supabase Dashboard → Connect'
  );
  console.error(
    '  - SUPABASE_ACCESS_TOKEN = Personal access token (Account → Access Tokens)'
  );
  console.error(
    '\nOr paste these files in the SQL Editor (in order), then NOTIFY pgrst, \'reload schema\':'
  );
  for (const file of FILES) console.error(`  - ${file}`);
  process.exit(1);
}

const client = new pg.Client({
  connectionString: connection.url,
  ssl: { rejectUnauthorized: false },
});
await client.connect();
console.log('Applying Project Rate Library via', connection.label);

for (const relative of FILES) {
  const sql = readFileSync(resolve(ROOT, relative), 'utf8');
  console.log('→', relative);
  await client.query(sql);
}

const { rows: tables } = await client.query(`
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'project_rate_library_items'
`);
if (tables.length === 0) {
  console.error('FAIL: project_rate_library_items missing');
  await client.end();
  process.exit(1);
}

const { rows: fns } = await client.query(`
  SELECT proname FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND proname IN (
      'import_company_resources_to_project',
      'list_project_rate_library_stale',
      'sync_project_rate_library_from_company'
    )
`);
if (fns.length < 3) {
  console.error('FAIL: expected import/stale/sync RPCs, found', fns.map((r) => r.proname));
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
  INSERT INTO quantix_migrations.applied (version, name) VALUES
    ('20260715120000_rate_library_category_extend', '20260715120000_rate_library_category_extend.sql'),
    ('20260715120100_project_rate_library', '20260715120100_project_rate_library.sql')
  ON CONFLICT (version) DO NOTHING
`);
await client.query(`NOTIFY pgrst, 'reload schema'`);
await client.end();
console.log('OK  Project Rate Library schema ready');
