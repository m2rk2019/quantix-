/**
 * Apply Phase 4–8 fix migrations against PostgreSQL (local Docker or Supabase).
 *   node scripts/verify-phase4-8-fixes.mjs
 *   node scripts/verify-phase4-8-fixes.mjs --docker
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import pg from 'pg';
import {
  projectRefFromSupabaseUrl,
  resolveWorkingDatabaseUrl,
} from './lib/resolve-database-url.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const useDocker = process.argv.includes('--docker');

const MIGRATIONS = [
  'supabase/fixes/historical-projects-repository.sql',
  'supabase/fixes/tender-submission-package.sql',
  'supabase/fixes/smart-excel-import-engine.sql',
  'supabase/fixes/master-template-import-workflow.sql',
];

function loadEnvLocal() {
  const envPath = resolve(root, '.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

async function connectDocker() {
  const port = 55432;
  const container = 'quantix-migration-verify-pg';
  spawnSync('docker', ['rm', '-f', container], { stdio: 'ignore' });
  const run = spawnSync(
    'docker',
    [
      'run',
      '-d',
      '--name',
      container,
      '-e',
      'POSTGRES_PASSWORD=postgres',
      '-p',
      `${port}:5432`,
      'postgres:16-alpine',
    ],
    { encoding: 'utf8' }
  );
  if (run.status !== 0) {
    throw new Error(run.stderr || run.stdout || 'docker run failed');
  }

  const url = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;
  const client = new pg.Client({ connectionString: url });
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      await client.connect();
      await client.query('SELECT 1');
      return { client, container, url, label: 'docker-postgres:16' };
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error('Docker Postgres did not become ready');
}

async function connectSupabase() {
  loadEnvLocal();
  const projectRef = projectRefFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  let url = process.env.DATABASE_URL?.trim();
  let label = url ? 'DATABASE_URL' : null;
  if (!url) {
    const found = await resolveWorkingDatabaseUrl(
      projectRef,
      process.env.SUPABASE_DB_PASSWORD,
      { timeoutMs: 6000, concurrency: 12 }
    );
    if (!found.url) {
      throw new Error(found.errorSummary || 'No database URL');
    }
    url = found.url;
    label = found.label;
  }
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });
  await client.connect();
  return { client, container: null, url, label };
}

async function applyPrerequisites(client) {
  const basePath = resolve(root, 'supabase/apply-all-migrations.sql');
  if (!existsSync(basePath)) {
    throw new Error('Missing supabase/apply-all-migrations.sql for Docker bootstrap');
  }
  const sql = readFileSync(basePath, 'utf8');
  await client.query(sql);
}

async function runSqlFile(client, relPath) {
  const sql = readFileSync(resolve(root, relPath), 'utf8');
  await client.query(sql);
}

async function main() {
  const results = [];
  let client;
  let container;

  try {
    if (useDocker) {
      ({ client, container } = await connectDocker());
      console.log('Bootstrapping base schema via apply-all-migrations.sql…');
      await applyPrerequisites(client);
    } else {
      ({ client, container } = await connectSupabase());
      console.log('Using existing Supabase database (base schema assumed).');
    }

    for (const file of MIGRATIONS) {
      try {
        await runSqlFile(client, file);
        await runSqlFile(client, file);
        results.push({ file, status: 'PASS' });
        console.log('PASS', file, '(2x idempotent)');
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results.push({ file, status: 'FAIL', detail: message });
        console.error('FAIL', file, message);
      }
    }
  } finally {
    if (client) {
      try {
        await client.end();
      } catch {
        // ignore
      }
    }
    if (container) {
      spawnSync('docker', ['rm', '-f', container], { stdio: 'ignore' });
    }
  }

  console.log('\n=== REPORT ===');
  for (const row of results) {
    const mark = row.status === 'PASS' ? '✓' : '✗';
    console.log(`${row.status} ${mark} ${row.file.split('/').pop()}`);
    if (row.detail) console.log('   ', row.detail);
  }

  const allPass = results.length === MIGRATIONS.length && results.every((r) => r.status === 'PASS');
  process.exit(allPass ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
