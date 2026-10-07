import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

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
  pathToFileURL(resolve(root, 'scripts/_fix-analyze-bundle.mjs')).href +
    '?t=' +
    Date.now()
);

const before = JSON.parse(
  readFileSync(resolve(root, 'docs/_BEFORE_NIA_STREVI_SNAPSHOT_FULL.json'), 'utf8')
);

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

async function captureExtract(xlsxPath) {
  const analysis = await analyzeSmartImportWorkbook(readFileSync(xlsxPath));
  const leaves = analysis.boq_rows.filter((r) => !r.is_group_header);
  const groups = analysis.boq_rows.filter((r) => r.is_group_header);
  const sum = leaves.reduce((s, r) => s + Number(r.amount || 0), 0);
  const fingerprint = leaves
    .map(
      (r) =>
        `${r.row_index}|${r.description}|${r.unit}|${Number(r.quantity)}|${round2(r.amount)}`
    )
    .join('\n');
  return {
    leaf_count: leaves.length,
    leaf_sum_raw: sum,
    leaf_sum_rounded: round2(sum),
    fingerprint,
    fingerprint_sha: Buffer.from(fingerprint).toString('base64').slice(0, 32),
    has_maintenance: leaves.some((r) => /maintenance crew/i.test(r.description)),
    has_security_grills: leaves.some((r) =>
      /security grills/i.test(r.description)
    ),
    has_mc2_leaf: leaves.some((r) => /MC2 Typ/i.test(r.description)),
    has_mc2_group: groups.some((r) => /MC2 Typ/i.test(r.description)),
    has_kw_hr: leaves.some((r) => /KW-hr Meter Base/i.test(r.description)),
    has_main_100at: leaves.some((r) => /MAIN:\s*100AT/i.test(r.description)),
    maintenance_amt: leaves.find((r) => /maintenance crew/i.test(r.description))
      ?.amount,
    security_amt: leaves.find((r) => /security grills/i.test(r.description))
      ?.amount,
  };
}

const nia = await captureExtract(
  resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx')
);
const strevi = await captureExtract(
  'C:\\Users\\mgoles\\Downloads\\EPC. CAC. BID. 4PH STREVI. BCB Breakdown & Summary (4 Bldgs). 2026 05 18 2.xlsx'
);

const niaUnchanged =
  nia.fingerprint === before.nia_extract.fingerprint &&
  nia.leaf_count === before.nia_extract.leaf_count;

const streviTarget = 1859023517.47;
const streviDelta = Math.abs(strevi.leaf_sum_rounded - streviTarget);

console.log(
  JSON.stringify(
    {
      nia: {
        unchanged: niaUnchanged,
        before_count: before.nia_extract.leaf_count,
        after_count: nia.leaf_count,
        before_sum: before.nia_extract.leaf_sum_rounded,
        after_sum: nia.leaf_sum_rounded,
        fingerprint_match: nia.fingerprint === before.nia_extract.fingerprint,
      },
      strevi: {
        before_count: before.strevi_extract.leaf_count,
        after_count: strevi.leaf_count,
        before_sum: before.strevi_extract.leaf_sum_rounded,
        after_sum: strevi.leaf_sum_rounded,
        target: streviTarget,
        delta_vs_target: round2(strevi.leaf_sum_rounded - streviTarget),
        pass_grand_total: streviDelta < 0.02,
        has_maintenance: strevi.has_maintenance,
        maintenance_amt: strevi.maintenance_amt,
        has_security_grills: strevi.has_security_grills,
        security_amt: strevi.security_amt,
        has_mc2_leaf: strevi.has_mc2_leaf,
        has_mc2_group: strevi.has_mc2_group,
        has_kw_hr: strevi.has_kw_hr,
        has_main_100at: strevi.has_main_100at,
      },
    },
    null,
    2
  )
);

if (!niaUnchanged) {
  console.error('NIA EXTRACT CHANGED — aborting before DB reimport');
  process.exit(2);
}
if (streviDelta >= 0.02) {
  console.error('STREVI grand total not matched — aborting before DB reimport');
  process.exit(3);
}
if (!strevi.has_maintenance || !strevi.has_security_grills) {
  console.error('STREVI missing restored leaves');
  process.exit(4);
}
if (strevi.has_mc2_leaf) {
  console.error('STREVI still has MC2 package as leaf (duplicate risk)');
  process.exit(5);
}
console.log('EXTRACT GATE PASS — safe to reimport');
