/**
 * Verify why STREVI BOQ count went 504 -> 505. No code changes.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
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

const STREVI_ID = 'a356c582-fe81-472d-8bee-9575970dd3a0';
const XLSX =
  'C:\\Users\\mgoles\\Downloads\\EPC. CAC. BID. 4PH STREVI. BCB Breakdown & Summary (4 Bldgs). 2026 05 18 2.xlsx';

const beforeFull = JSON.parse(
  readFileSync(resolve(root, 'docs/_BEFORE_NIA_STREVI_SNAPSHOT_FULL.json'), 'utf8')
);
const beforeFp = beforeFull.strevi_extract.fingerprint;

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

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}
function keyOf(r) {
  return [
    String(r.description || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase(),
    String(r.unit || '').toLowerCase(),
    Number(r.quantity),
    round2(r.amount ?? r.total_amount),
  ].join('|');
}

const beforeLeaves = beforeFp
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [row_index, description, unit, quantity, amount] = line.split('|');
    return {
      row_index: Number(row_index),
      description,
      unit,
      quantity: Number(quantity),
      amount: Number(amount),
    };
  });

const analysis = await analyzeSmartImportWorkbook(readFileSync(XLSX));
const afterLeaves = analysis.boq_rows
  .filter((r) => !r.is_group_header)
  .map((r) => ({
    row_index: r.row_index,
    description: r.description,
    unit: r.unit,
    quantity: Number(r.quantity),
    amount: round2(r.amount),
    unit_rate: r.unit_rate,
  }));

const beforeRows = new Set(beforeLeaves.map((r) => r.row_index));
const afterRows = new Set(afterLeaves.map((r) => r.row_index));
const addedByRow = afterLeaves.filter((r) => !beforeRows.has(r.row_index));
const removedByRow = beforeLeaves.filter((r) => !afterRows.has(r.row_index));

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(XLSX);
const ws = wb.getWorksheet('BCB Breakdown');

function cellRaw(cell) {
  return cell?.value;
}
function cellText(cell) {
  let v = cellRaw(cell);
  if (v == null) return '';
  if (typeof v === 'object') {
    if ('result' in v && v.result != null) v = v.result;
    else if ('text' in v) v = v.text;
    else if ('richText' in v) v = v.richText.map((t) => t.text).join('');
    else if ('formula' in v) v = v.result ?? '';
    else v = String(v);
  }
  return String(v).replace(/\s+/g, ' ').trim();
}
function cellNum(cell) {
  let v = cellRaw(cell);
  if (v == null || v === '') return null;
  if (typeof v === 'object') {
    if ('result' in v && v.result != null) v = v.result;
    else if ('formula' in v) v = v.result;
    else return null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function excelRowDetail(r) {
  const row = ws.getRow(r);
  const c4 = cellText(row.getCell(4));
  const c3 = cellText(row.getCell(3));
  const c5 = cellText(row.getCell(5));
  const desc = c4 || c5 || c3;
  return {
    excel_row: r,
    description: desc,
    quantity: cellNum(row.getCell(8)),
    unit: cellText(row.getCell(9)),
    rate: cellNum(row.getCell(15)),
    amount: cellNum(row.getCell(16)),
    c3,
    c4,
    c5,
    outline: row.outlineLevel || 0,
  };
}

function countExcelExactDescription(desc) {
  const nd = desc.toLowerCase().replace(/\s+/g, ' ').trim();
  const hits = [];
  for (let r = 14; r <= 668; r += 1) {
    const d = excelRowDetail(r);
    const dd = (d.description || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (dd === nd) hits.push(d);
  }
  return hits;
}

const addedReport = addedByRow.map((r) => {
  const excel = excelRowDetail(r.row_index);
  const matches = countExcelExactDescription(r.description);
  const rate =
    r.quantity > 0 ? round2(r.amount / r.quantity) : round2(r.unit_rate || 0);
  return {
    newly_imported_boq_row: {
      excel_row_number: r.row_index,
      description: r.description,
      quantity: r.quantity,
      unit: r.unit,
      rate,
      amount: r.amount,
    },
    excel_source_row: {
      excel_row_number: excel.excel_row,
      description: excel.description,
      quantity: excel.quantity,
      unit: excel.unit,
      rate: excel.rate != null ? round2(excel.rate) : null,
      amount: excel.amount != null ? round2(excel.amount) : null,
    },
    excel_exact_description_match_count: matches.length,
    excel_match_row_numbers: matches.map((m) => m.excel_row),
    classification:
      matches.length === 1
        ? 'A_existed_in_excel_previously_skipped'
        : matches.length > 1
          ? 'B_duplicated_or_ambiguous'
          : 'NOT_FOUND_IN_EXCEL',
  };
});

const removedReport = removedByRow.map((r) => {
  const excel = excelRowDetail(r.row_index);
  const asGroup = analysis.boq_rows.find(
    (x) => x.is_group_header && x.row_index === r.row_index
  );
  return {
    no_longer_imported_as_leaf: {
      excel_row_number: r.row_index,
      description: r.description,
      quantity: r.quantity,
      unit: r.unit,
      amount: r.amount,
    },
    excel_source_row: {
      excel_row_number: excel.excel_row,
      description: excel.description,
      quantity: excel.quantity,
      unit: excel.unit,
      rate: excel.rate != null ? round2(excel.rate) : null,
      amount: excel.amount != null ? round2(excel.amount) : null,
    },
    now_group_header: Boolean(asGroup),
    reason:
      'Previously imported package leaf; now correctly classified as rollup/assembly parent (components remain as leaves).',
  };
});

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const { data: dbBoq } = await sb
  .from('boq_items')
  .select('description, unit, quantity, total_rate, total_amount')
  .eq('project_id', STREVI_ID)
  .is('deleted_at', null);

function dbCountExact(desc) {
  const nd = desc.toLowerCase().replace(/\s+/g, ' ').trim();
  return (dbBoq || []).filter(
    (d) =>
      String(d.description || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim() === nd
  ).length;
}

let acceptance = 'PASS';
const failReasons = [];
for (const row of addedReport) {
  if (row.excel_exact_description_match_count !== 1) {
    acceptance = 'FAIL';
    failReasons.push(
      `Excel match count ${row.excel_exact_description_match_count} for "${row.newly_imported_boq_row.description}"`
    );
  }
  const dbHits = dbCountExact(row.newly_imported_boq_row.description);
  if (dbHits !== 1) {
    acceptance = 'FAIL';
    failReasons.push(
      `DB duplicate count ${dbHits} for "${row.newly_imported_boq_row.description}"`
    );
  }
}
const mc2Db = (dbBoq || []).filter((d) => /MC2 Typ/i.test(d.description));
if (mc2Db.length > 0) {
  acceptance = 'FAIL';
  failReasons.push('MC2 package still present as BOQ leaf');
}

const report = {
  question: 'Why did STREVI BOQ count change 504 -> 505?',
  before_count: beforeLeaves.length,
  after_count: afterLeaves.length,
  db_count: (dbBoq || []).length,
  net_change: afterLeaves.length - beforeLeaves.length,
  accounting: {
    added_leaf_count: addedByRow.length,
    removed_leaf_count: removedByRow.length,
    net: addedByRow.length - removedByRow.length,
    formula: `(+${addedByRow.length} newly imported leaves) - (${removedByRow.length} former package leaf) = +${addedByRow.length - removedByRow.length}`,
  },
  newly_imported_rows: addedReport,
  removed_package_leaves: removedReport,
  acceptance,
  acceptance_detail:
    acceptance === 'PASS'
      ? 'Each newly imported BOQ row exists exactly once in Excel and exactly once in Quantix. Classification A (previously skipped). Not duplicated.'
      : failReasons.join('; '),
};

writeFileSync(
  resolve(root, 'docs/STREVI_BOQ_COUNT_505_VERIFICATION.json'),
  JSON.stringify(report, null, 2)
);

const mdLines = [
  '# STREVI BOQ Count 504 → 505 Verification',
  '',
  '**Code modified:** No',
  '',
  `**BEFORE extract leaves:** ${report.before_count}`,
  `**AFTER extract leaves:** ${report.after_count}`,
  `**DB active BOQ:** ${report.db_count}`,
  `**Net change:** ${report.net_change}`,
  '',
  '## Why the count changed',
  '',
  report.accounting.formula,
  '',
  '### Newly imported BOQ row(s)',
  '',
];

for (const row of addedReport) {
  const n = row.newly_imported_boq_row;
  mdLines.push(
    `| Field | Value |`,
    `| --- | --- |`,
    `| Excel row | ${n.excel_row_number} |`,
    `| Description | ${n.description} |`,
    `| Quantity | ${n.quantity} |`,
    `| Unit | ${n.unit} |`,
    `| Rate | ${n.rate} |`,
    `| Amount | ${n.amount} |`,
    `| Excel exact matches | ${row.excel_exact_description_match_count} (rows: ${row.excel_match_row_numbers.join(', ')}) |`,
    `| Classification | **${row.classification}** |`,
    ''
  );
}

if (removedReport.length) {
  mdLines.push('### Former leaf now treated as package/rollup (not a duplicate)', '');
  for (const row of removedReport) {
    const n = row.no_longer_imported_as_leaf;
    mdLines.push(
      `| Field | Value |`,
      `| --- | --- |`,
      `| Excel row | ${n.excel_row_number} |`,
      `| Description | ${n.description} |`,
      `| Quantity | ${n.quantity} |`,
      `| Unit | ${n.unit} |`,
      `| Amount | ${n.amount} |`,
      `| Now group header | ${row.now_group_header} |`,
      `| Reason | ${row.reason} |`,
      ''
    );
  }
}

mdLines.push(
  '## Acceptance',
  '',
  `**Result: ${acceptance}**`,
  '',
  report.acceptance_detail,
  ''
);

writeFileSync(
  resolve(root, 'docs/STREVI_BOQ_COUNT_505_VERIFICATION.md'),
  mdLines.join('\n')
);

console.log(JSON.stringify(report, null, 2));
