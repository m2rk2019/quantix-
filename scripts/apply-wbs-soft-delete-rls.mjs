/**
 * Apply/verify WBS soft-delete RLS fix (idempotent).
 *
 * Prefer DATABASE_URL from Supabase → Settings → Database when pooler discovery fails.
 *
 *   npm run fix:wbs-delete-rls
 *   node scripts/apply-wbs-soft-delete-rls.mjs
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
  'supabase/migrations/20260712120000_fix_wbs_soft_delete_rls.sql'
);

loadEnvLocal();

async function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) {
    return {
      url: process.env.DATABASE_URL.trim(),
      label: 'DATABASE_URL',
      errorSummary: null,
    };
  }

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const projectRef = projectRefFromSupabaseUrl(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  );

  if (!password || !projectRef) {
    return {
      url: null,
      label: null,
      errorSummary:
        'Missing SUPABASE_DB_PASSWORD or NEXT_PUBLIC_SUPABASE_URL in .env.local',
    };
  }

  console.log('Resolving Postgres connection for project', projectRef, '…');
  const resolved = await resolveWorkingDatabaseUrl(projectRef, password, {
    timeoutMs: 3500,
    concurrency: 10,
    onProgress: (event) => {
      if (event.status === 'found') {
        console.log('Connected via', event.label);
      }
    },
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
    console.error('Sample failures:\n ', connection.errorSummary);
  }
  console.error(
    '\nSet DATABASE_URL in .env.local to the URI from Supabase → Settings → Database,'
  );
  console.error(
    'or run supabase/migrations/20260712120000_fix_wbs_soft_delete_rls.sql in the SQL Editor.'
  );
  process.exit(1);
}

const client = new pg.Client({
  connectionString: connection.url,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

console.log('Applying WBS soft-delete RLS fix via', connection.label, '…');
await client.query(sql);

const { rows: policies } = await client.query(`
  SELECT
    pol.polname AS policy_name,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expr
  FROM pg_policy pol
  JOIN pg_class cls ON cls.oid = pol.polrelid
  JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
  WHERE nsp.nspname = 'public'
    AND cls.relname = 'wbs'
    AND pol.polname = 'wbs_update'
`);

if (policies.length === 0) {
  console.error('FAIL: wbs_update policy missing after apply.');
  await client.end();
  process.exit(1);
}

const policy = policies[0];
if (!policy.with_check_expr) {
  console.error('FAIL: wbs_update still has NULL WITH CHECK (soft-delete blocked).');
  console.error(policy);
  await client.end();
  process.exit(1);
}

const { rows: grants } = await client.query(`
  SELECT privilege_type
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public'
    AND table_name = 'wbs'
    AND grantee = 'authenticated'
  ORDER BY privilege_type
`);

const { rows: fks } = await client.query(`
  SELECT
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    rc.delete_rule
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
    AND rc.constraint_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (
      ccu.table_name = 'wbs'
      OR tc.table_name = 'wbs'
    )
  ORDER BY tc.table_name, tc.constraint_name
`);

console.log('OK  wbs_update WITH CHECK is set');
console.log(
  'OK  authenticated grants:',
  grants.map((g) => g.privilege_type).join(', ') || '(none)'
);
console.log('FK constraints involving wbs:');
for (const fk of fks) {
  console.log(
    `  - ${fk.constraint_name}: ${fk.column_name} → ${fk.foreign_table} (ON DELETE ${fk.delete_rule})`
  );
}

await client.query(`
  CREATE SCHEMA IF NOT EXISTS quantix_migrations;
  CREATE TABLE IF NOT EXISTS quantix_migrations.applied (
    version TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  INSERT INTO quantix_migrations.applied (version, name)
  VALUES ('20260712120000_fix_wbs_soft_delete_rls', '20260712120000_fix_wbs_soft_delete_rls.sql')
  ON CONFLICT (version) DO NOTHING
`);

await client.query(`NOTIFY pgrst, 'reload schema'`);
await client.end();

console.log('\nWBS soft-delete RLS ready.');

