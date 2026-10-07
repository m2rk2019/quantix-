import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
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

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NIA_ID = 'd387f1f1-4271-4e35-832c-e30ba2cb0e66';
const STREVI_ID = 'a356c582-fe81-472d-8bee-9575970dd3a0';
const NIA_XLSX = resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx');
const STREVI_XLSX =
  'C:\\Users\\mgoles\\Downloads\\EPC. CAC. BID. 4PH STREVI. BCB Breakdown & Summary (4 Bldgs). 2026 05 18 2.xlsx';

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

async function captureDb(projectId, label) {
  const { data: project } = await sb
    .from('projects')
    .select('id, project_code, project_name')
    .eq('id', projectId)
    .single();
  const { data: boq } = await sb
    .from('boq_items')
    .select(
      'id, item_code, description, unit, quantity, total_rate, total_amount'
    )
    .eq('project_id', projectId)
    .is('deleted_at', null);
  const { data: summary } = await sb
    .from('estimate_summary')
    .select(
      'direct_cost, indirect_cost, contingency, markup, vat, grand_total'
    )
    .eq('project_id', projectId)
    .maybeSingle();
  const { count: rateCount } = await sb
    .from('project_rate_library_items')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('deleted_at', null);

  const leaves = boq || [];
  const fingerprint = leaves
    .map(
      (r) =>
        `${r.description}|${r.unit}|${Number(r.quantity)}|${round2(r.total_rate)}|${round2(r.total_amount)}`
    )
    .sort()
    .join('\n');

  return {
    label,
    project,
    boq_count: leaves.length,
    boq_sum: round2(leaves.reduce((s, r) => s + Number(r.total_amount || 0), 0)),
    priced_count: leaves.filter(
      (r) => Number(r.total_rate) > 0 || Number(r.total_amount) > 0
    ).length,
    rate_library_count: rateCount ?? 0,
    estimate: summary
      ? {
          direct_cost: round2(summary.direct_cost),
          indirect_cost: round2(summary.indirect_cost),
          contingency: round2(summary.contingency),
          markup: round2(summary.markup),
          vat: round2(summary.vat),
          grand_total: round2(summary.grand_total),
        }
      : null,
    fingerprint_sha: Buffer.from(fingerprint).toString('base64').slice(0, 32),
    fingerprint,
  };
}

// Bundle current analyzer
spawnSync(
  'npx',
  [
    '--yes',
    'esbuild',
    'services/smart-import/analyze-workbook.ts',
    '--bundle',
    '--platform=node',
    '--format=esm',
    '--outfile=scripts/_fix-analyze-bundle.mjs',
    '--packages=external',
    '--alias:@=./',
  ],
  { cwd: root, stdio: 'inherit', shell: true }
);

const { analyzeSmartImportWorkbook } = await import(
  pathToFileURL(resolve(root, 'scripts/_fix-analyze-bundle.mjs')).href
);

async function captureExtract(xlsxPath, label) {
  const analysis = await analyzeSmartImportWorkbook(readFileSync(xlsxPath));
  const leaves = analysis.boq_rows.filter((r) => !r.is_group_header);
  const sum = leaves.reduce((s, r) => s + Number(r.amount || 0), 0);
  const fingerprint = leaves
    .map(
      (r) =>
        `${r.row_index}|${r.description}|${r.unit}|${Number(r.quantity)}|${round2(r.amount)}`
    )
    .join('\n');
  return {
    label,
    leaf_count: leaves.length,
    leaf_sum_raw: sum,
    leaf_sum_rounded: round2(sum),
    fingerprint_sha: Buffer.from(fingerprint).toString('base64').slice(0, 32),
    fingerprint,
    key_rows: {
      maintenance_crew: leaves.find((r) => /maintenance crew/i.test(r.description)),
      security_grills: leaves.find((r) => /security grills/i.test(r.description)),
      mc2: leaves.find((r) => /MC2 Typ/i.test(r.description)),
      kw_hr: leaves.find((r) => /KW-hr Meter Base/i.test(r.description)),
      main_100at: leaves.find((r) => /MAIN:\s*100AT/i.test(r.description)),
    },
  };
}

const before = {
  captured_at: new Date().toISOString(),
  nia_db: await captureDb(NIA_ID, 'NIA'),
  strevi_db: await captureDb(STREVI_ID, 'STREVI'),
  nia_extract: await captureExtract(NIA_XLSX, 'NIA'),
  strevi_extract: await captureExtract(STREVI_XLSX, 'STREVI'),
};

writeFileSync(
  resolve(root, 'docs/_BEFORE_NIA_STREVI_SNAPSHOT.json'),
  JSON.stringify(
    {
      ...before,
      nia_db: { ...before.nia_db, fingerprint: '[omitted]' },
      strevi_db: { ...before.strevi_db, fingerprint: '[omitted]' },
      nia_extract: { ...before.nia_extract, fingerprint: '[omitted]' },
      strevi_extract: { ...before.strevi_extract, fingerprint: '[omitted]' },
    },
    null,
    2
  )
);
// keep full fingerprints separately for rollback compare
writeFileSync(
  resolve(root, 'docs/_BEFORE_NIA_STREVI_SNAPSHOT_FULL.json'),
  JSON.stringify(before, null, 2)
);

console.log(
  JSON.stringify(
    {
      nia_db: {
        boq_count: before.nia_db.boq_count,
        boq_sum: before.nia_db.boq_sum,
        estimate: before.nia_db.estimate,
        rates: before.nia_db.rate_library_count,
      },
      strevi_db: {
        boq_count: before.strevi_db.boq_count,
        boq_sum: before.strevi_db.boq_sum,
        estimate: before.strevi_db.estimate,
      },
      nia_extract: {
        leaf_count: before.nia_extract.leaf_count,
        leaf_sum_rounded: before.nia_extract.leaf_sum_rounded,
      },
      strevi_extract: {
        leaf_count: before.strevi_extract.leaf_count,
        leaf_sum_rounded: before.strevi_extract.leaf_sum_rounded,
        key_rows: before.strevi_extract.key_rows,
      },
    },
    null,
    2
  )
);
