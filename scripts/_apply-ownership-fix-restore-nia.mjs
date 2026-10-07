import { readFileSync } from 'node:fs';
import pg from 'pg';
import {
  resolveWorkingDatabaseUrl,
  projectRefFromSupabaseUrl,
} from './lib/resolve-database-url.mjs';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!(k in process.env)) process.env[k] = v;
}

const projectRef = projectRefFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const password = process.env.SUPABASE_DB_PASSWORD;
console.log('resolving db for', projectRef);
const found = await resolveWorkingDatabaseUrl(projectRef, password, {
  timeoutMs: 5000,
  concurrency: 10,
  onProgress: (e) => {
    if (e.status === 'found') console.log('found', e.label);
  },
});
if (!found.url) {
  console.error('No DB URL', found.errorSummary);
  process.exit(1);
}
console.log('using', found.label);

const client = new pg.Client({
  connectionString: found.url,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const fixSql = readFileSync(
  'supabase/fixes/fix-project-child-ownership-service-role.sql',
  'utf8'
);
await client.query(fixSql);
console.log('applied ownership fix');

const before = JSON.parse(
  readFileSync('docs/_BEFORE_NIA_STREVI_SNAPSHOT_FULL.json', 'utf8')
);
const niaEst = before.nia_db.estimate;
const niaId = 'd387f1f1-4271-4e35-832c-e30ba2cb0e66';

await client.query(
  `UPDATE estimate_summary SET
    direct_cost = $1,
    indirect_cost = $2,
    contingency = $3,
    markup = $4,
    vat = $5,
    grand_total = $6,
    updated_at = now()
  WHERE project_id = $7`,
  [
    niaEst.direct_cost,
    niaEst.indirect_cost,
    niaEst.contingency,
    niaEst.markup,
    niaEst.vat,
    niaEst.grand_total,
    niaId,
  ]
);
const { rows } = await client.query(
  `SELECT direct_cost, grand_total FROM estimate_summary WHERE project_id = $1`,
  [niaId]
);
console.log('NIA estimate restored', rows[0]);

// Persist DATABASE_URL for follow-on scripts
console.log('DATABASE_URL_READY', found.url.replace(/:[^:@]+@/, ':***@'));
await client.end();

// Write resolved url to temp file for reimport (gitignored ideally)
import { writeFileSync } from 'node:fs';
writeFileSync('.db-url.tmp', found.url);
console.log('wrote .db-url.tmp');
