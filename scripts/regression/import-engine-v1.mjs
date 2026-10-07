/**
 * Quantix Import Engine v1.0 — automatic regression against NIA + STREVI.
 *
 *   npm run regression:import-engine-v1
 *
 * Any future importer change MUST keep both fixtures PASS.
 * Does not write to the database.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const goldensPath = resolve(
  root,
  'docs/import-engine-v1/REGRESSION_GOLDENS.json'
);

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

function fail(msg) {
  console.error('FAIL', msg);
  process.exitCode = 1;
}

function pass(msg) {
  console.log('PASS', msg);
}

function assert(cond, msg) {
  if (cond) pass(msg);
  else fail(msg);
}

function leafFingerprint(leaves) {
  return leaves
    .map(
      (r) =>
        `${r.row_index}|${r.description}|${r.unit}|${Number(r.quantity)}|${round2(r.amount)}`
    )
    .join('\n');
}

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

const bundleOut = resolve(root, 'scripts/_regression-analyze-bundle.mjs');
const build = spawnSync(
  'npx',
  [
    '--yes',
    'esbuild',
    'services/smart-import/analyze-workbook.ts',
    '--bundle',
    '--platform=node',
    '--format=esm',
    `--outfile=${bundleOut}`,
    '--packages=external',
    '--alias:@=./',
  ],
  { cwd: root, encoding: 'utf8', shell: true }
);
if (build.status !== 0) {
  fail(`esbuild failed: ${build.stderr || build.stdout}`);
  process.exit(1);
}

const wbsBundleOut = resolve(root, 'scripts/_regression-wbs-bundle.mjs');
const buildWbs = spawnSync(
  'npx',
  [
    '--yes',
    'esbuild',
    'lib/smart-import/build-wbs-from-boq.ts',
    '--bundle',
    '--platform=node',
    '--format=esm',
    `--outfile=${wbsBundleOut}`,
    '--packages=external',
    '--alias:@=./',
  ],
  { cwd: root, encoding: 'utf8', shell: true }
);
if (buildWbs.status !== 0) {
  fail(`esbuild wbs failed: ${buildWbs.stderr || buildWbs.stdout}`);
  process.exit(1);
}

const { analyzeSmartImportWorkbook } = await import(
  pathToFileURL(bundleOut).href + `?t=${Date.now()}`
);
const { buildWbsFromBoq } = await import(
  pathToFileURL(wbsBundleOut).href + `?t=${Date.now()}`
);

const QUANTIX_IMPORT_ENGINE_LABEL = 'Quantix Import Engine v1.0';
const QUANTIX_IMPORT_ENGINE_VERSION = '1.0.0';

const goldens = JSON.parse(readFileSync(goldensPath, 'utf8'));

console.log(`\n=== ${QUANTIX_IMPORT_ENGINE_LABEL} regression ===\n`);

const results = [];

for (const fixture of goldens.fixtures) {
  const xlsx = resolve(root, fixture.sample_path);
  console.log(`--- ${fixture.key.toUpperCase()} (${fixture.sample_path}) ---`);
  if (!existsSync(xlsx)) {
    fail(`${fixture.key}: workbook missing at ${fixture.sample_path}`);
    results.push({ key: fixture.key, status: 'FAIL', reason: 'missing workbook' });
    continue;
  }

  const analysis = await analyzeSmartImportWorkbook(readFileSync(xlsx));
  const leaves = analysis.boq_rows.filter((r) => !r.is_group_header);
  const groups = analysis.boq_rows.filter((r) => r.is_group_header);
  const leafSum = leaves.reduce((s, r) => s + Number(r.amount || 0), 0);
  const leafSumRounded = round2(leafSum);
  const fp = leafFingerprint(leaves);
  const fpHash = sha256(fp);
  const { wbs, boq } = buildWbsFromBoq(analysis.boq_rows);
  const wbsLevels = [...new Set(wbs.map((n) => n.level))].sort((a, b) => a - b);
  const minLevel = Math.min(...wbs.map((n) => n.level));
  const maxLevel = Math.max(...wbs.map((n) => n.level));

  let fixtureOk = true;
  const check = (cond, msg) => {
    if (cond) pass(`${fixture.key}: ${msg}`);
    else {
      fail(`${fixture.key}: ${msg}`);
      fixtureOk = false;
    }
  };

  check(
    leaves.length === fixture.expected.leaf_count,
    `leaf_count ${leaves.length} === ${fixture.expected.leaf_count}`
  );
  check(
    Math.abs(leafSumRounded - fixture.expected.leaf_sum_rounded) < 0.02,
    `leaf_sum_rounded ${leafSumRounded} ≈ ${fixture.expected.leaf_sum_rounded}`
  );
  check(
    fpHash === fixture.expected.leaf_fingerprint_sha256,
    `leaf fingerprint sha256 matches frozen golden`
  );
  check(boq.length === leaves.length, `WBS-linked BOQ count === leaf count`);
  check(minLevel >= 1, `WBS min level >= 1 (got ${minLevel})`);
  check(
    JSON.stringify(wbsLevels) === JSON.stringify(fixture.expected.wbs_levels),
    `WBS levels ${JSON.stringify(wbsLevels)} === ${JSON.stringify(fixture.expected.wbs_levels)}`
  );

  for (const must of fixture.expected.must_include_leaf_descriptions || []) {
    const hit = leaves.some((r) =>
      new RegExp(must.pattern, 'i').test(r.description)
    );
    check(hit, `includes leaf matching /${must.pattern}/`);
  }
  for (const mustNot of fixture.expected.must_not_include_leaf_descriptions || []) {
    const hit = leaves.some((r) =>
      new RegExp(mustNot.pattern, 'i').test(r.description)
    );
    check(!hit, `excludes leaf matching /${mustNot.pattern}/`);
  }
  for (const asGroup of fixture.expected.must_be_group_header || []) {
    const hit = groups.some((r) =>
      new RegExp(asGroup.pattern, 'i').test(r.description)
    );
    check(hit, `group header matching /${asGroup.pattern}/`);
  }

  if (fixture.expected.excel_grand_total_vat_ex != null) {
    check(
      Math.abs(leafSumRounded - fixture.expected.excel_grand_total_vat_ex) < 0.02,
      `direct-cost leaf sum matches Excel GRAND TOTAL (VAT Ex) ${fixture.expected.excel_grand_total_vat_ex}`
    );
  }

  results.push({
    key: fixture.key,
    status: fixtureOk ? 'PASS' : 'FAIL',
    leaf_count: leaves.length,
    leaf_sum_rounded: leafSumRounded,
    fingerprint_sha256: fpHash,
    wbs_count: wbs.length,
    wbs_levels: wbsLevels,
    max_level: maxLevel,
  });
  console.log('');
}

const allPass = results.every((r) => r.status === 'PASS');
const reportDir = resolve(root, 'docs/import-engine-v1');
mkdirSync(reportDir, { recursive: true });
const report = {
  engine: QUANTIX_IMPORT_ENGINE_LABEL,
  version: QUANTIX_IMPORT_ENGINE_VERSION,
  ran_at: new Date().toISOString(),
  overall: allPass ? 'PASS' : 'FAIL',
  results,
};
writeFileSync(
  resolve(reportDir, 'REGRESSION_LAST_RUN.json'),
  JSON.stringify(report, null, 2)
);

console.log('=== SUMMARY ===');
for (const r of results) {
  console.log(`${r.status} ${r.key.toUpperCase()} leaves=${r.leaf_count} sum=${r.leaf_sum_rounded}`);
}
console.log(`\nOVERALL: ${report.overall}`);
if (!allPass) process.exit(1);
