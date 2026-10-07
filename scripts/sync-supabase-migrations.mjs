/**
 * Apply pending Supabase migrations in chronological order, refresh PostgREST
 * schema cache, verify required tables, and optionally load the pilot demo.
 *
 * Requires DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local
 *
 *   npm run sync:supabase
 *   npm run sync:supabase -- --load-demo
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import pg from 'pg';

import { loadEnvLocal } from './lib/load-env-local.mjs';
import {
  projectRefFromSupabaseUrl,
  resolveWorkingDatabaseUrl,
} from './lib/resolve-database-url.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const MIGRATIONS_DIR = resolve(ROOT, 'supabase/migrations');
const GRANTS_PATH = resolve(ROOT, 'supabase/grant-schema-permissions.sql');

const REQUIRED_TABLES = [
  'users',
  'projects',
  'project_details',
  'wbs',
  'boq_items',
  'estimate_summary',
  'rate_library_items',
  'boq_rate_analysis_lines',
  'company_suppliers',
  'company_units',
  'company_resource_categories',
  'company_settings',
  'project_benchmark_actuals',
];

/** User-facing name company_resources maps to rate_library_items + company_resource_categories. */
const AI_ESTIMATOR_NOTE =
  'AI Estimator uses in-app engineering rules (no dedicated DB tables in V1).';

const MIGRATION_SENTINELS = {
  '20260625120000_create_users_auth.sql': { type: 'table', name: 'users' },
  '20260626120000_create_projects.sql': { type: 'table', name: 'projects' },
  '20260627120000_project_details_sprint3.sql': { type: 'table', name: 'project_details' },
  '20260628120000_create_wbs.sql': { type: 'table', name: 'wbs' },
  '20260629120000_boq_sprint5.sql': { type: 'table', name: 'boq_items' },
  '20260630120000_audit_trail_sprint68.sql': { type: 'column', table: 'audit_log', column: 'project_id' },
  '20260701120000_performance_sprint69.sql': { type: 'function', name: 'sum_boq_total_amount' },
  '20260703120000_get_current_user_profile_rpc.sql': { type: 'function', name: 'get_current_user_profile' },
  '20260707120000_rate_library_analysis.sql': { type: 'table', name: 'rate_library_items' },
  '20260708120000_company_resource_library.sql': { type: 'table', name: 'company_suppliers' },
  '20260710120000_company_settings_sprint13.sql': { type: 'table', name: 'company_settings' },
  '20260711120000_benchmark_sprint14.sql': { type: 'table', name: 'project_benchmark_actuals' },
};

function parseArgs(argv) {
  return { loadDemo: argv.includes('--load-demo') };
}

function getMigrationFiles() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort();
}

function resolveDatabaseUrl() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) {
    return Promise.resolve({ url: direct, label: 'DATABASE_URL' });
  }

  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const projectRef = projectRefFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());

  if (!password || !projectRef) {
    return Promise.resolve(null);
  }

  return resolveWorkingDatabaseUrl(projectRef, password, { timeoutMs: 4000 }).then(
    (resolved) => (resolved?.url ? resolved : null)
  );
}

async function ensureMigrationTable(client) {
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS quantix_migrations;
    CREATE TABLE IF NOT EXISTS quantix_migrations.applied (
      version TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query(
    'SELECT version FROM quantix_migrations.applied ORDER BY version'
  );
  return new Set(rows.map((row) => row.version));
}

async function objectExists(client, sentinel) {
  if (sentinel.type === 'table') {
    const { rows } = await client.query(
      `SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
       LIMIT 1`,
      [sentinel.name]
    );
    return rows.length > 0;
  }

  if (sentinel.type === 'function') {
    const { rows } = await client.query(
      `SELECT 1
       FROM pg_proc p
       JOIN pg_namespace n ON n.oid = p.pronamespace
       WHERE n.nspname = 'public' AND p.proname = $1
       LIMIT 1`,
      [sentinel.name]
    );
    return rows.length > 0;
  }

  if (sentinel.type === 'column') {
    const { rows } = await client.query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = $1
         AND column_name = $2
       LIMIT 1`,
      [sentinel.table, sentinel.column]
    );
    return rows.length > 0;
  }

  return false;
}

async function tableExists(client, name) {
  return objectExists(client, { type: 'table', name });
}

async function detectPendingMigrations(client, files) {
  const applied = await getAppliedMigrations(client);
  const pending = [];
  const skipped = [];

  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    if (applied.has(version)) {
      continue;
    }

    const sentinel = MIGRATION_SENTINELS[file];
    if (sentinel) {
      const exists = await objectExists(client, sentinel);
      if (exists) {
        await client.query(
          `INSERT INTO quantix_migrations.applied (version, name)
           VALUES ($1, $2)
           ON CONFLICT (version) DO NOTHING`,
          [version, file]
        );
        skipped.push(file);
        continue;
      }
    }

    pending.push(file);
  }

  return { applied: [...applied], pending, skipped };
}

async function applyMigration(client, file) {
  const version = file.replace(/\.sql$/, '');
  const sql = readFileSync(resolve(MIGRATIONS_DIR, file), 'utf8');

  await client.query('BEGIN');
  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO quantix_migrations.applied (version, name)
       VALUES ($1, $2)
       ON CONFLICT (version) DO NOTHING`,
      [version, file]
    );
    await client.query('COMMIT');
    return { file, ok: true };
  } catch (error) {
    await client.query('ROLLBACK');
    return { file, ok: false, error: error.message };
  }
}

async function refreshSchemaCache(client) {
  await client.query(`NOTIFY pgrst, 'reload schema';`);
}

async function applyGrants(client) {
  if (!existsSync(GRANTS_PATH)) {
    return { ok: false, error: 'grant-schema-permissions.sql not found' };
  }

  const sql = readFileSync(GRANTS_PATH, 'utf8');
  try {
    await client.query(sql);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

async function verifyTables(client) {
  const results = [];

  for (const table of REQUIRED_TABLES) {
    const exists = await tableExists(client, table);
    results.push({ table, exists });
  }

  return results;
}

async function probeRestTables() {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return [];
  }

  const probes = [];
  for (const table of REQUIRED_TABLES) {
    const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=0`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    probes.push({
      table,
      ok: response.ok,
      status: response.status,
      message: response.ok ? 'reachable' : (await response.text()).slice(0, 120),
    });
  }

  return probes;
}

function runNodeScript(scriptName) {
  const scriptPath = resolve(ROOT, 'scripts', scriptName);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: ROOT,
    stdio: 'pipe',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  });

  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    stdout: result.stdout?.toString() ?? '',
    stderr: result.stderr?.toString() ?? '',
  };
}

async function main() {
  loadEnvLocal();
  const { loadDemo } = parseArgs(process.argv.slice(2));
  const files = getMigrationFiles();
  const connection = await resolveDatabaseUrl();

  console.log('Quantix — Supabase Schema Sync');
  console.log('==============================\n');
  console.log(`Migration files in repo: ${files.length}`);
  console.log(AI_ESTIMATOR_NOTE);
  console.log('');

  const report = {
    migration_files: files,
    applied_migrations: [],
    skipped_as_existing: [],
    failed_migrations: [],
    grants_applied: false,
    schema_cache_refreshed: false,
    table_checks: [],
    rest_probes: [],
    demo_load: null,
    demo_verify: null,
    issues: [],
  };

  if (!connection) {
    report.issues.push(
      'Could not connect to PostgreSQL with SUPABASE_DB_PASSWORD. Copy the exact connection string from Supabase Dashboard → Settings → Database.'
    );

    console.error('BLOCKED: database credentials not configured.\n');
    console.error('Set one of the following in .env.local:');
    console.error('  DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres');
    console.error('  SUPABASE_DB_PASSWORD=your-database-password');
    console.error('\nPending migrations to apply manually (SQL Editor, in order):');
    for (const file of files) {
      console.error(`  - ${file}`);
    }

    printReport(report);
    process.exit(2);
  }

  console.log(`Using connection: ${connection.label}\n`);

  const client = new pg.Client({
    connectionString: connection.url,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL.\n');

    await ensureMigrationTable(client);
    const { applied, pending, skipped } = await detectPendingMigrations(client, files);

    report.applied_migrations = applied;
    report.skipped_as_existing = skipped;

    console.log(`Already recorded/applied: ${applied.length}`);
    console.log(`Pending to apply: ${pending.length}\n`);

    for (const file of pending) {
      process.stdout.write(`→ ${file} ... `);
      const result = await applyMigration(client, file);
      if (result.ok) {
        report.applied_migrations.push(file.replace(/\.sql$/, ''));
        console.log('OK');
      } else {
        report.failed_migrations.push({ file, error: result.error });
        console.log('FAILED');
        console.error(`   ${result.error}`);
      }
    }

    process.stdout.write('→ grant-schema-permissions.sql ... ');
    const grants = await applyGrants(client);
    if (grants.ok) {
      report.grants_applied = true;
      console.log('OK');
    } else {
      report.issues.push(`Grants failed: ${grants.error}`);
      console.log('FAILED');
    }

    process.stdout.write('→ refresh PostgREST schema cache ... ');
    await refreshSchemaCache(client);
    report.schema_cache_refreshed = true;
    console.log('OK');

    report.table_checks = await verifyTables(client);
    const missingTables = report.table_checks.filter((row) => !row.exists);
    if (missingTables.length > 0) {
      report.issues.push(
        `Missing tables after migration: ${missingTables.map((row) => row.table).join(', ')}`
      );
    }

    report.rest_probes = await probeRestTables();
    const restMissing = report.rest_probes.filter((row) => !row.ok);
    if (restMissing.length > 0) {
      report.issues.push(
        `PostgREST cannot reach: ${restMissing.map((row) => `${row.table} (${row.message})`).join('; ')}`
      );
    }
  } catch (error) {
    report.issues.push(error instanceof Error ? error.message : String(error));
    console.error('\nDatabase sync failed:', report.issues.at(-1));
    printReport(report);
    process.exit(1);
  } finally {
    await client.end();
  }

  if (loadDemo) {
    console.log('\nLoading pilot demo...\n');
    report.demo_load = runNodeScript('load-megawide-demo.mjs');
    if (!report.demo_load.ok) {
      report.issues.push('load:demo failed — see demo_load output');
    }

    console.log('\nVerifying pilot demo...\n');
    report.demo_verify = runNodeScript('verify-megawide-office-demo.mjs');
    if (!report.demo_verify.ok) {
      report.issues.push('verify:megawide-office failed — see demo_verify output');
    }
  }

  printReport(report);
  process.exit(report.issues.length > 0 || report.failed_migrations.length > 0 ? 1 : 0);
}

function printReport(report) {
  console.log('\n==============================');
  console.log('SYNC REPORT');
  console.log('==============================\n');

  console.log('Applied migrations:');
  if (report.applied_migrations.length === 0) {
    console.log('  (none recorded)');
  } else {
    for (const version of report.applied_migrations) {
      console.log(`  ✓ ${version}`);
    }
  }

  if (report.failed_migrations.length > 0) {
    console.log('\nFailed migrations:');
    for (const row of report.failed_migrations) {
      console.log(`  ✗ ${row.file}: ${row.error}`);
    }
  }

  if (report.table_checks.length > 0) {
    console.log('\nTable verification (PostgreSQL):');
    for (const row of report.table_checks) {
      console.log(`  ${row.exists ? '✓' : '✗'} ${row.table}`);
    }
  }

  if (report.rest_probes.length > 0) {
    console.log('\nPostgREST probe:');
    for (const row of report.rest_probes) {
      console.log(`  ${row.ok ? '✓' : '✗'} ${row.table}`);
    }
  }

  if (report.demo_load) {
    console.log(`\nload:demo: ${report.demo_load.ok ? 'PASS' : 'FAIL'}`);
  }

  if (report.demo_verify) {
    console.log(`verify:megawide-office: ${report.demo_verify.ok ? 'PASS' : 'FAIL'}`);
  }

  if (report.issues.length > 0) {
    console.log('\nRemaining issues:');
    for (const issue of report.issues) {
      console.log(`  - ${issue}`);
    }
  } else {
    console.log('\nNo remaining issues.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
