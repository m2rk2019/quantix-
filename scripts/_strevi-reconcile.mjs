/**
 * STREVI Excel ↔ Quantix BOQ line-by-line reconciliation (investigation only).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const WORKBOOK =
  process.env.STREVI_XLSX ||
  'C:\\Users\\mgoles\\Downloads\\EPC. CAC. BID. 4PH STREVI. BCB Breakdown & Summary (4 Bldgs). 2026 05 18 2.xlsx';
const PROJECT_ID = process.env.STREVI_PROJECT_ID || 'a356c582-fe81-472d-8bee-9575970dd3a0';

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
function round2(n) {
  return Math.round(n * 100) / 100;
}
function roundCurrency(value) {
  // Match lib/boq/calculations.ts
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

// Bundle analyzer
spawnSync(
  'npx',
  [
    '--yes',
    'esbuild',
    'services/smart-import/analyze-workbook.ts',
    '--bundle',
    '--platform=node',
    '--format=esm',
    '--outfile=scripts/_strevi-analyze-bundle.mjs',
    '--packages=external',
    '--alias:@=./',
  ],
  { cwd: root, stdio: 'inherit', shell: true }
);

const { analyzeSmartImportWorkbook } = await import(
  pathToFileURL(resolve(root, 'scripts/_strevi-analyze-bundle.mjs')).href
);

const buffer = readFileSync(WORKBOOK);
const analysis = await analyzeSmartImportWorkbook(buffer);
const extractedLeaves = analysis.boq_rows.filter((r) => !r.is_group_header);
const extractedGroups = analysis.boq_rows.filter((r) => r.is_group_header);
const extractedSum = extractedLeaves.reduce((s, r) => s + Number(r.amount || 0), 0);
const extractedSumRounded = extractedLeaves.reduce(
  (s, r) => s + roundCurrency(Number(r.amount || 0)),
  0
);

// Excel native scan — locate GRAND TOTAL and leaf amounts on BCB sheet
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(WORKBOOK);
const sheetNames = wb.worksheets.map((s) => s.name);
const bcb =
  wb.getWorksheet('BCB Breakdown') ||
  wb.worksheets.find((s) => /bcb|breakdown|cost/i.test(s.name));

const excelGrandCandidates = [];
const excelAllAmountRows = [];
if (bcb) {
  for (let r = 1; r <= (bcb.rowCount || 0); r++) {
    const row = bcb.getRow(r);
    const texts = [];
    let lastNum = null;
    for (let c = 1; c <= Math.min(20, bcb.columnCount || 20); c++) {
      const t = cellText(row.getCell(c));
      const n = cellNum(row.getCell(c));
      if (t) texts.push(t);
      if (n != null && n > 0) lastNum = n;
    }
    const joined = texts.join(' | ');
    if (/grand\s*total/i.test(joined) || /vat\s*ex/i.test(joined) || /direct\s*cost/i.test(joined)) {
      excelGrandCandidates.push({
        row: r,
        label: joined.slice(0, 160),
        amount: lastNum,
      });
    }
  }
}

// DB imported BOQ
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const { data: project } = await sb
  .from('projects')
  .select('id,project_code,project_name')
  .eq('id', PROJECT_ID)
  .single();
const { data: boq } = await sb
  .from('boq_items')
  .select(
    'id,item_code,description,quantity,unit,total_rate,total_amount,material_rate,labor_rate,equipment_rate,subcontract_rate'
  )
  .eq('project_id', PROJECT_ID)
  .is('deleted_at', null)
  .order('item_code');
const { data: summary } = await sb
  .from('estimate_summary')
  .select('direct_cost,grand_total')
  .eq('project_id', PROJECT_ID)
  .maybeSingle();
const { data: job } = await sb
  .from('smart_import_jobs')
  .select('reconciliation_report,validation_report,status')
  .eq('project_id', PROJECT_ID)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

const imported = boq ?? [];
const importedSum = imported.reduce((s, r) => s + Number(r.total_amount || 0), 0);
const importedSumRounded2 = imported.reduce(
  (s, r) => s + round2(Number(r.total_amount || 0)),
  0
);

// Match extracted leaves to imported by description+unit+amount proximity
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
function matchKey(desc, unit, qty) {
  return `${norm(desc)}|${norm(unit)}|${round2(Number(qty || 0))}`;
}

const importedByKey = new Map();
for (const row of imported) {
  const k = matchKey(row.description, row.unit, row.quantity);
  if (!importedByKey.has(k)) importedByKey.set(k, []);
  importedByKey.get(k).push(row);
}

const lineDiffs = [];
const missing = [];
const duplicated = [];
const amountMismatches = [];
const usedImported = new Set();

for (const leaf of extractedLeaves) {
  const k = matchKey(leaf.description, leaf.unit, leaf.quantity);
  const candidates = (importedByKey.get(k) || []).filter((r) => !usedImported.has(r.id));
  let match = candidates[0];
  if (!match) {
    // fallback: description+unit only
    const loose = imported.filter(
      (r) =>
        !usedImported.has(r.id) &&
        norm(r.description) === norm(leaf.description) &&
        norm(r.unit) === norm(leaf.unit)
    );
    match = loose[0];
  }
  if (!match) {
    missing.push({
      item_number: leaf.item_number,
      description: leaf.description,
      unit: leaf.unit,
      quantity: leaf.quantity,
      excel_amount: leaf.amount,
    });
    continue;
  }
  usedImported.add(match.id);
  const excelAmt = Number(leaf.amount || 0);
  const impAmt = Number(match.total_amount || 0);
  const delta = round2(impAmt - excelAmt);
  const excelRate = Number(leaf.unit_rate || 0);
  const impRate = Number(match.total_rate || 0);
  const recomputed = roundCurrency(Number(match.quantity) * impRate);
  const row = {
    item_number: leaf.item_number,
    description: leaf.description.slice(0, 80),
    unit: leaf.unit,
    quantity_excel: leaf.quantity,
    quantity_imported: Number(match.quantity),
    excel_amount: excelAmt,
    imported_amount: impAmt,
    difference: delta,
    excel_rate: excelRate,
    imported_rate: impRate,
    rate_diff: round2(impRate - excelRate),
    imported_qty_x_rate: recomputed,
    amount_vs_qty_rate: round2(impAmt - recomputed),
  };
  lineDiffs.push(row);
  if (Math.abs(delta) >= 0.005) amountMismatches.push(row);
}

const extras = imported.filter((r) => !usedImported.has(r.id));

// Detect duplicates in import by description+unit+qty
const seen = new Map();
for (const row of imported) {
  const k = matchKey(row.description, row.unit, row.quantity);
  seen.set(k, (seen.get(k) || 0) + 1);
}
for (const [k, count] of seen) {
  if (count > 1) duplicated.push({ key: k, count });
}

// Excel grand from analysis summary
const excelDirectFromAnalysis = Number(analysis.cost_summary?.direct_cost || 0);
const excelBidFromAnalysis = Number(analysis.cost_summary?.bid_price || 0);

const report = {
  project,
  workbook: WORKBOOK,
  sheets: sheetNames,
  excel_grand_candidates: excelGrandCandidates,
  analysis_cost_summary: analysis.cost_summary,
  counts: {
    extracted_leaves: extractedLeaves.length,
    extracted_groups: extractedGroups.length,
    imported_boq: imported.length,
    missing_in_import: missing.length,
    extras_in_import: extras.length,
    duplicate_keys_in_import: duplicated.length,
    amount_mismatches_ge_half_cent: amountMismatches.length,
  },
  totals: {
    excel_direct_from_analysis: excelDirectFromAnalysis,
    excel_bid_from_analysis: excelBidFromAnalysis,
    extracted_leaf_sum_raw: extractedSum,
    extracted_leaf_sum_round2_each: extractedSumRounded,
    imported_boq_sum_raw: importedSum,
    imported_boq_sum_round2: importedSumRounded2,
    estimate_direct_cost: Number(summary?.direct_cost || 0),
    estimate_grand_total_bid: Number(summary?.grand_total || 0),
    overview_uses_direct_cost: Number(summary?.direct_cost || 0),
    delta_overview_vs_excel_analysis: round2(
      Number(summary?.direct_cost || 0) - excelDirectFromAnalysis
    ),
    delta_imported_sum_vs_excel_analysis: round2(importedSum - excelDirectFromAnalysis),
    delta_extracted_raw_vs_excel_analysis: round2(extractedSum - excelDirectFromAnalysis),
    delta_extracted_rounded_vs_excel_analysis: round2(
      extractedSumRounded - excelDirectFromAnalysis
    ),
    job_reconciliation: job?.reconciliation_report ?? null,
  },
  missing_sample: missing.slice(0, 30),
  extras_sample: extras.slice(0, 30).map((r) => ({
    item_code: r.item_code,
    description: r.description?.slice(0, 80),
    amount: Number(r.total_amount),
  })),
  duplicate_keys_sample: duplicated.slice(0, 20),
  amount_mismatches: amountMismatches
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .slice(0, 50),
  top_absolute_line_diffs: [...lineDiffs]
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
    .slice(0, 30),
  sum_of_line_differences: round2(
    lineDiffs.reduce((s, r) => s + Number(r.difference || 0), 0)
  ),
};

const outPath = resolve(root, 'docs/STREVI_RECONCILIATION_REPORT.json');
writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log('\nWrote', outPath);
