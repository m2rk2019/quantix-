/**
 * Line-by-line NIA Excel ↔ Quantix importer reconciliation.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function cellText(cell) {
  let v = cell?.value;
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
function num(v) {
  const n = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
function keyOf(desc, unit) {
  return `${String(desc).toLowerCase().trim()}|${String(unit).toLowerCase().trim()}`;
}

// Rebuild analyzer
const { spawnSync } = await import('node:child_process');
spawnSync(
  'npx',
  [
    '--yes',
    'esbuild',
    'services/smart-import/analyze-workbook.ts',
    '--bundle',
    '--platform=node',
    '--format=esm',
    '--outfile=scripts/_nia-analyze-bundle.mjs',
    '--packages=external',
    '--alias:@=./',
  ],
  { cwd: root, stdio: 'inherit', shell: true }
);

const { analyzeSmartImportWorkbook } = await import(
  pathToFileURL(resolve(root, 'scripts/_nia-analyze-bundle.mjs')).href
);
const buffer = readFileSync(resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx'));
const analysis = await analyzeSmartImportWorkbook(buffer);
const qLeaf = analysis.boq_rows.filter((r) => !r.is_group_header);
const qGroups = analysis.boq_rows.filter((r) => r.is_group_header);

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx'));
const ws = wb.getWorksheet('BCB Breakdown');

const excelRows = [];
let currentDiscipline = 'UNKNOWN';
let pastCommercial = false;

for (let r = 13; r <= (ws.rowCount || 0); r++) {
  const row = ws.getRow(r);
  const c1 = cellText(row.getCell(1));
  const c2 = cellText(row.getCell(2));
  const c3 = cellText(row.getCell(3));
  const c4 = cellText(row.getCell(4));
  const qty = num(cellText(row.getCell(8)));
  const uom = cellText(row.getCell(9));
  const matRate = num(cellText(row.getCell(10)));
  const labRate = num(cellText(row.getCell(12)));
  const svcRate = num(cellText(row.getCell(14)));
  const total = num(cellText(row.getCell(16)));
  const desc = c4 || c3 || c2;
  if (!desc) continue;
  if (/^grand\s*total$/i.test(desc) || /^grand\s*total$/i.test(c4)) continue;
  if (
    /^(contingency|financial cost|overhead|project mark-?up|mark-?up|taxes|vat)$/i.test(
      (c2 || desc).trim()
    )
  ) {
    pastCommercial = true;
  }
  if (pastCommercial) continue;

  const isSection = /^\d+\.0$/.test(c1) && !!c2;
  if (isSection) {
    currentDiscipline = c2;
    excelRows.push({
      excel_row: r,
      kind: 'SECTION',
      item_number: c1,
      description: c2,
      unit: uom,
      quantity: qty,
      unit_rate: qty ? total / qty : 0,
      amount: total,
      discipline: c2,
      mat_rate: matRate,
      lab_rate: labRate,
      svc_rate: svcRate,
    });
    continue;
  }

  // Detect lot parent (same heuristic as importer)
  let isLotParent = false;
  if (uom.toLowerCase() === 'lot' && qty === 1 && total > 0) {
    for (let look = r + 1; look <= Math.min(r + 12, ws.rowCount || 0); look++) {
      const nr = ws.getRow(look);
      const nd =
        cellText(nr.getCell(4)) ||
        cellText(nr.getCell(3)) ||
        cellText(nr.getCell(2));
      if (!nd) continue;
      if (/^grand\s*total$/i.test(nd) || /^\d+\.0$/.test(cellText(nr.getCell(1)))) break;
      const nu = cellText(nr.getCell(9));
      if (nu && nu.toLowerCase() !== 'lot') {
        isLotParent = true;
        break;
      }
      if (nu.toLowerCase() === 'lot') break;
    }
  }

  if (!uom) continue;

  excelRows.push({
    excel_row: r,
    kind: isLotParent ? 'LOT_PARENT' : total === 0 ? 'ZERO' : 'LEAF',
    item_number: c1 || '',
    description: desc,
    unit: uom,
    quantity: qty,
    unit_rate: qty ? total / qty : matRate + labRate + svcRate,
    amount: total,
    discipline: currentDiscipline,
    mat_rate: matRate,
    lab_rate: labRate,
    svc_rate: svcRate,
  });
}

const excelLeaf = excelRows.filter((r) => r.kind === 'LEAF');
const excelLeafAllIncludingZero = excelRows.filter(
  (r) => r.kind === 'LEAF' || r.kind === 'ZERO'
);

console.log('EXCEL', {
  section: excelRows.filter((r) => r.kind === 'SECTION').length,
  lot_parent: excelRows.filter((r) => r.kind === 'LOT_PARENT').length,
  leaf: excelLeaf.length,
  zero: excelRows.filter((r) => r.kind === 'ZERO').length,
  leaf_plus_zero: excelLeafAllIncludingZero.length,
  leaf_total: round2(excelLeaf.reduce((s, r) => s + r.amount, 0)),
  section_total: round2(
    excelRows.filter((r) => r.kind === 'SECTION').reduce((s, r) => s + r.amount, 0)
  ),
  lot_parent_total: round2(
    excelRows.filter((r) => r.kind === 'LOT_PARENT').reduce((s, r) => s + r.amount, 0)
  ),
});
console.log('QUANTIX', {
  groups: qGroups.length,
  leaf: qLeaf.length,
  leaf_total: round2(qLeaf.reduce((s, r) => s + r.amount, 0)),
});

// Match Quantix to Excel by row proximity: build multimap by key
const excelByKey = new Map();
for (const row of excelLeaf) {
  const k = keyOf(row.description, row.unit);
  if (!excelByKey.has(k)) excelByKey.set(k, []);
  excelByKey.get(k).push(row);
}
const excelUsed = new Set();

const lineReport = [];
for (const row of excelRows) {
  if (row.kind === 'SECTION' || row.kind === 'LOT_PARENT') {
    lineReport.push({
      excel_row: row.excel_row,
      kind: row.kind,
      imported: 'NO (correct — not leaf)',
      description: row.description,
      unit: row.unit,
      quantity: row.quantity,
      unit_rate: round2(row.unit_rate),
      amount: round2(row.amount),
      wbs: row.discipline,
      quantix_amount: null,
      note: row.kind,
    });
    continue;
  }
  if (row.kind === 'ZERO') {
    // Was Quantix importing these before skip?
    const matchQ = qLeaf.find(
      (q) =>
        keyOf(q.description, q.unit) === keyOf(row.description, row.unit) &&
        Math.abs(q.amount - row.amount) < 0.02
    );
    lineReport.push({
      excel_row: row.excel_row,
      kind: 'ZERO',
      imported: matchQ ? 'YES' : 'NO',
      description: row.description,
      unit: row.unit,
      quantity: row.quantity,
      unit_rate: round2(row.unit_rate),
      amount: 0,
      wbs: row.discipline,
      quantix_amount: matchQ ? round2(matchQ.amount) : null,
      note: 'zero-cost / by-tenant',
    });
    continue;
  }

  const k = keyOf(row.description, row.unit);
  const pool = excelByKey.get(k) || [];
  // Find matching quantix unused
  let qMatch = null;
  for (const q of qLeaf) {
    if (keyOf(q.description, q.unit) !== k) continue;
    if (excelUsed.has(`q-${q.row_index}`)) continue;
    // Prefer closest amount
    if (!qMatch || Math.abs(q.amount - row.amount) < Math.abs(qMatch.amount - row.amount)) {
      qMatch = q;
    }
  }
  if (qMatch) excelUsed.add(`q-${qMatch.row_index}`);

  const imported = qMatch ? 'YES' : 'NO';
  let note = '';
  if (qMatch && Math.abs(qMatch.amount - row.amount) > 0.02) {
    note = `AMOUNT_MISMATCH excel=${round2(row.amount)} qx=${round2(qMatch.amount)}`;
  }
  if (qMatch && Math.abs(qMatch.quantity - row.quantity) > 0.0001) {
    note += ` QTY_MISMATCH excel=${row.quantity} qx=${qMatch.quantity}`;
  }

  lineReport.push({
    excel_row: row.excel_row,
    kind: 'LEAF',
    imported,
    description: row.description,
    unit: row.unit,
    quantity: row.quantity,
    unit_rate: round2(row.unit_rate),
    amount: round2(row.amount),
    wbs: qMatch?.discipline || row.discipline,
    quantix_amount: qMatch ? round2(qMatch.amount) : null,
    quantix_qty: qMatch?.quantity ?? null,
    quantix_rate: qMatch ? round2(qMatch.unit_rate) : null,
    note,
  });
}

const orphanQ = [];
for (const q of qLeaf) {
  if (excelUsed.has(`q-${q.row_index}`)) continue;
  orphanQ.push({
    description: q.description,
    unit: q.unit,
    quantity: q.quantity,
    unit_rate: round2(q.unit_rate),
    amount: round2(q.amount),
    wbs: q.discipline,
    row_index: q.row_index,
  });
}

const missing = lineReport.filter((r) => r.kind === 'LEAF' && r.imported === 'NO');
const amountMismatch = lineReport.filter((r) => r.note.includes('AMOUNT_MISMATCH'));
const qtyMismatch = lineReport.filter((r) => r.note.includes('QTY_MISMATCH'));

// Duplicate keys in Quantix
const qKeyCount = new Map();
for (const q of qLeaf) {
  const k = keyOf(q.description, q.unit);
  qKeyCount.set(k, (qKeyCount.get(k) || 0) + 1);
}
const qDupes = [...qKeyCount.entries()].filter(([, c]) => c > 1);

// Sum diagnostics
const importedYes = lineReport.filter((r) => r.kind === 'LEAF' && r.imported === 'YES');
const sumImportedExcel = importedYes.reduce((s, r) => s + r.amount, 0);
const sumImportedQx = importedYes.reduce((s, r) => s + (r.quantix_amount || 0), 0);
const sumMissing = missing.reduce((s, r) => s + r.amount, 0);
const sumOrphan = orphanQ.reduce((s, r) => s + r.amount, 0);
const sumAmtDelta = amountMismatch.reduce(
  (s, r) => s + ((r.quantix_amount || 0) - r.amount),
  0
);

console.log('\nDIAGNOSTICS');
console.log({
  missing_leaf_rows: missing.length,
  missing_amount: round2(sumMissing),
  orphan_quantix_rows: orphanQ.length,
  orphan_amount: round2(sumOrphan),
  amount_mismatches: amountMismatch.length,
  amount_mismatch_delta: round2(sumAmtDelta),
  qty_mismatches: qtyMismatch.length,
  quantix_duplicate_keys: qDupes.length,
  sum_imported_excel_amounts: round2(sumImportedExcel),
  sum_imported_quantix_amounts: round2(sumImportedQx),
  reconstructed_qx_total: round2(sumImportedQx + sumOrphan),
  excel_leaf_total: round2(excelLeaf.reduce((s, r) => s + r.amount, 0)),
});

console.log('\nTOP ORPHAN QX BY AMOUNT');
for (const row of [...orphanQ].sort((a, b) => b.amount - a.amount).slice(0, 20)) {
  console.log(round2(row.amount), row.unit, row.description.slice(0, 60), '|', row.wbs);
}

console.log('\nTOP MISSING EXCEL BY AMOUNT');
for (const row of [...missing].sort((a, b) => b.amount - a.amount).slice(0, 20)) {
  console.log(round2(row.amount), row.unit, row.description.slice(0, 60), '|', row.wbs);
}

console.log('\nTOP AMOUNT MISMATCHES (qx - excel)');
for (const row of [...amountMismatch]
  .sort((a, b) => Math.abs((b.quantix_amount || 0) - b.amount) - Math.abs((a.quantix_amount || 0) - a.amount))
  .slice(0, 20)) {
  console.log(
    'delta',
    round2((row.quantix_amount || 0) - row.amount),
    row.unit,
    row.description.slice(0, 50),
    'excel',
    row.amount,
    'qx',
    row.quantix_amount
  );
}

writeFileSync(
  resolve(root, 'docs/NIA_LINE_RECONCILIATION.json'),
  JSON.stringify(
    {
      excel_leaf_count: excelLeaf.length,
      quantix_leaf_count: qLeaf.length,
      lineReport,
      orphanQ,
      missing,
      amountMismatch,
      qDupes: qDupes.map(([k, c]) => ({ key: k, count: c })),
    },
    null,
    2
  )
);
console.log('\nWrote docs/NIA_LINE_RECONCILIATION.json');
