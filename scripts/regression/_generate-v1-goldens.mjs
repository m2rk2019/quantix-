/**
 * One-shot: compute frozen goldens for Import Engine v1.0 regression.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
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

for (const [entry, out] of [
  ['services/smart-import/analyze-workbook.ts', 'scripts/_regression-analyze-bundle.mjs'],
  ['lib/smart-import/build-wbs-from-boq.ts', 'scripts/_regression-wbs-bundle.mjs'],
]) {
  spawnSync(
    'npx',
    [
      '--yes',
      'esbuild',
      entry,
      '--bundle',
      '--platform=node',
      '--format=esm',
      `--outfile=${resolve(root, out)}`,
      '--packages=external',
      '--alias:@=./',
    ],
    { cwd: root, stdio: 'inherit', shell: true }
  );
}

const { analyzeSmartImportWorkbook } = await import(
  pathToFileURL(resolve(root, 'scripts/_regression-analyze-bundle.mjs')).href +
    `?t=${Date.now()}`
);
const { buildWbsFromBoq } = await import(
  pathToFileURL(resolve(root, 'scripts/_regression-wbs-bundle.mjs')).href +
    `?t=${Date.now()}`
);

async function fixture(key, sample_path, extra = {}) {
  const analysis = await analyzeSmartImportWorkbook(
    readFileSync(resolve(root, sample_path))
  );
  const leaves = analysis.boq_rows.filter((r) => !r.is_group_header);
  const leafSumRounded = round2(
    leaves.reduce((s, r) => s + Number(r.amount || 0), 0)
  );
  const { wbs } = buildWbsFromBoq(analysis.boq_rows);
  const wbs_levels = [...new Set(wbs.map((n) => n.level))].sort((a, b) => a - b);
  return {
    key,
    display_name: extra.display_name,
    sample_path,
    expected: {
      leaf_count: leaves.length,
      leaf_sum_rounded: leafSumRounded,
      leaf_fingerprint_sha256: sha256(leafFingerprint(leaves)),
      wbs_levels,
      wbs_count: wbs.length,
      excel_grand_total_vat_ex: extra.excel_grand_total_vat_ex ?? null,
      must_include_leaf_descriptions: extra.must_include_leaf_descriptions || [],
      must_not_include_leaf_descriptions:
        extra.must_not_include_leaf_descriptions || [],
      must_be_group_header: extra.must_be_group_header || [],
    },
  };
}

const fixtures = [
  await fixture('nia', 'samples/NIA_Budgetary_Cost_Breakdown.xlsx', {
    display_name: 'NIA Budgetary Cost Breakdown',
    excel_grand_total_vat_ex: 351522209.41,
  }),
  await fixture('strevi', 'samples/STREVI_BCB_Breakdown.xlsx', {
    display_name: 'STREVI BCB Breakdown & Summary (4 Bldgs)',
    excel_grand_total_vat_ex: 1859023517.47,
    must_include_leaf_descriptions: [
      { pattern: '^Maintenance Crew$' },
      { pattern: 'Security Grills \\(Meter Center' },
      { pattern: 'KW-hr Meter Base' },
      { pattern: 'MAIN:\\s*100AT' },
    ],
    must_not_include_leaf_descriptions: [{ pattern: 'MC2 Typ' }],
    must_be_group_header: [{ pattern: 'MC2 Typ' }],
  }),
];

const goldens = {
  engine: 'Quantix Import Engine v1.0',
  version: '1.0.0',
  frozen_at: '2026-10-05',
  policy:
    'Do not change importer behavior unless a production bug is found. Any change must keep both fixtures PASS.',
  fixtures,
};

mkdirSync(resolve(root, 'docs/import-engine-v1'), { recursive: true });
writeFileSync(
  resolve(root, 'docs/import-engine-v1/REGRESSION_GOLDENS.json'),
  JSON.stringify(goldens, null, 2)
);
console.log(JSON.stringify(goldens, null, 2));
