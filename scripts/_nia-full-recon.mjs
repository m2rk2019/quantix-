/**
 * Full NIA Excel ↔ Quantix line reconciliation + anomaly detections.
 * Writes docs/NIA_LINE_RECONCILIATION.json and docs/NIA_ORPHAN_QUANTIX.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
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
    '--outfile=scripts/_nia-analyze-bundle.mjs',
    '--packages=external',
    '--alias:@=./',
  ],
  { cwd: root, stdio: 'pipe', shell: true }
);

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
function resolveDesc(row) {
  for (const c of [4, 3, 5, 2, 6, 1]) {
    const t = cellText(row.getCell(c));
    if (t && !/^\d+(\.\d+)*$/.test(t)) return { description: t, column: c };
  }
  return { description: '', column: 4 };
}

const { analyzeSmartImportWorkbook } = await import(
  pathToFileURL(resolve(root, 'scripts/_nia-analyze-bundle.mjs')).href
);
const analysis = await analyzeSmartImportWorkbook(
  readFileSync(resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx'))
);
const qLeaf = analysis.boq_rows.filter((r) => !r.is_group_header);
const qByRow = new Map(qLeaf.map((r) => [r.row_index, r]));

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx'));
const ws = wb.getWorksheet('BCB Breakdown');
const grand = 351522209.41;

const excelRows = [];
let discipline = 'UNKNOWN';
for (let r = 13; r <= ws.rowCount; r += 1) {
  const row = ws.getRow(r);
  const c1 = cellText(row.getCell(1));
  const c2 = cellText(row.getCell(2));
  const resolved = resolveDesc(row);
  const qty = num(cellText(row.getCell(8)));
  const uom = cellText(row.getCell(9));
  const total = num(cellText(row.getCell(16)));
  const level = Number(row.outlineLevel || 0);

  if (/grand\s*total/i.test(resolved.description)) continue;
  if (
    /^(contingency|financial cost|overhead|project mark-?up|mark-?up|taxes|vat|bid price.*)$/i.test(
      (resolved.description || c2 || '').trim()
    )
  ) {
    break;
  }
  if (/^\d+\.0$/.test(c1) && c2) {
    discipline = c2;
    excelRows.push({
      excel_row: r,
      kind: 'SECTION',
      description: c2,
      unit: uom,
      quantity: qty,
      unit_rate: qty ? total / qty : 0,
      amount: total,
      wbs: c2,
      level,
    });
    continue;
  }
  if (!uom) continue;

  // Detect rollup parent (mirror importer)
  let isParent = false;
  if (total > 0) {
    for (let look = r + 1; look <= ws.rowCount; look += 1) {
      const nr = ws.getRow(look);
      const nl = Number(nr.outlineLevel || 0);
      const nd = resolveDesc(nr);
      const nu = cellText(nr.getCell(9));
      if (!nd.description && !nu) continue;
      if (/grand\s*total/i.test(nd.description) || /^\d+\.0$/.test(cellText(nr.getCell(1)))) break;
      if (nl > level) {
        isParent = true;
        break;
      }
      if (nl <= level) break;
    }
    if (!isParent && uom.toLowerCase() === 'lot' && qty === 1) {
      for (let look = r + 1; look <= Math.min(r + 40, ws.rowCount); look += 1) {
        const nr = ws.getRow(look);
        const nd = resolveDesc(nr);
        if (!nd.description) continue;
        if (/grand\s*total/i.test(nd.description) || /^\d+\.0$/.test(cellText(nr.getCell(1)))) break;
        const nu = cellText(nr.getCell(9));
        if (!nu) continue;
        if (nu.toLowerCase() !== 'lot') {
          isParent = true;
          break;
        }
        if (nd.column > resolved.column) continue;
        break;
      }
    }
  }

  let kind = 'LEAF';
  if (isParent) kind = 'PARENT_ROLLUP';
  else if (total === 0) kind = 'ZERO';

  excelRows.push({
    excel_row: r,
    kind,
    description: resolved.description,
    unit: uom,
    quantity: qty,
    unit_rate: qty ? total / qty : 0,
    amount: total,
    wbs: discipline,
    level,
    desc_column: resolved.column,
  });
}

// Apply MAIN/assembly duplicate collapse on leaf candidates
const excelLeaf = [];
for (const row of excelRows) {
  if (row.kind !== 'LEAF') continue;
  const prev = excelLeaf[excelLeaf.length - 1];
  if (
    prev &&
    Math.abs(prev.amount - row.amount) <= 0.02 &&
    row.excel_row - prev.excel_row <= 5
  ) {
    const prevIsMain = /^main\s*:/i.test(prev.description);
    const curIsMain = /^main\s*:/i.test(row.description);
    const prevIsLot = prev.unit.toLowerCase() === 'lot';
    const curIsLot = row.unit.toLowerCase() === 'lot';
    const isPair =
      prevIsMain || curIsMain || (prevIsLot && !curIsLot) || (!prevIsLot && curIsLot);
    if (isPair) {
      const preferCurrent =
        (curIsMain && !prevIsMain) || (!curIsLot && prevIsLot) || row.desc_column > 4;
      if (preferCurrent) {
        excelLeaf.pop();
      } else {
        continue;
      }
    }
  }
  excelLeaf.push(row);
}

const lineByLine = [];
for (const row of excelLeaf) {
  const q = qByRow.get(row.excel_row);
  lineByLine.push({
    excel_row: row.excel_row,
    imported: q ? 'YES' : 'NO',
    project_wbs: row.wbs,
    description: row.description,
    quantity: row.quantity,
    unit: row.unit,
    unit_rate: round2(row.unit_rate),
    amount: round2(row.amount),
    quantix_amount: q ? round2(q.amount) : null,
  });
}

const excelLeafRows = new Set(excelLeaf.map((r) => r.excel_row));
const orphans = qLeaf
  .filter((q) => !excelLeafRows.has(q.row_index))
  .map((q) => ({
    row_index: q.row_index,
    description: q.description,
    unit: q.unit,
    quantity: q.quantity,
    unit_rate: round2(q.unit_rate),
    amount: round2(q.amount),
    wbs: q.group_path,
    discipline: q.discipline,
  }));

const detections = {
  duplicated_descriptions: [],
  imported_subtotals: qLeaf.filter((r) => /subtotal/i.test(r.description)).map((r) => r.row_index),
  imported_totals: qLeaf
    .filter((r) => /grand\s*total|\btotal\b/i.test(r.description))
    .map((r) => ({ row: r.row_index, desc: r.description, amount: round2(r.amount) })),
  parent_rollups_skipped: excelRows.filter((r) => r.kind === 'PARENT_ROLLUP').length,
  zero_rows_skipped: excelRows.filter((r) => r.kind === 'ZERO').length,
  sections: excelRows.filter((r) => r.kind === 'SECTION').length,
};

const keyCount = new Map();
for (const row of excelLeaf) {
  const k = `${row.description.toLowerCase()}|${row.unit.toLowerCase()}`;
  keyCount.set(k, (keyCount.get(k) || 0) + 1);
}
for (const [k, n] of keyCount) {
  if (n > 1) detections.duplicated_descriptions.push({ key: k, count: n });
}

const excelSum = excelLeaf.reduce((s, r) => s + r.amount, 0);
const qSum = qLeaf.reduce((s, r) => s + r.amount, 0);

const report = {
  excel_leaf_count: excelLeaf.length,
  quantix_leaf_count: qLeaf.length,
  excel_total: round2(excelSum),
  quantix_total: round2(qSum),
  grand_total: grand,
  delta_vs_grand: round2(qSum - grand),
  pct_vs_grand: (((qSum - grand) / grand) * 100).toFixed(4) + '%',
  imported_yes: lineByLine.filter((r) => r.imported === 'YES').length,
  imported_no: lineByLine.filter((r) => r.imported === 'NO').length,
  orphan_count: orphans.length,
  detections,
  line_by_line: lineByLine,
};

writeFileSync(resolve(root, 'docs/NIA_LINE_RECONCILIATION.json'), JSON.stringify(report, null, 2));
writeFileSync(resolve(root, 'docs/NIA_ORPHAN_QUANTIX.json'), JSON.stringify(orphans, null, 2));

console.log(
  JSON.stringify(
    {
      excel_leaf_count: report.excel_leaf_count,
      quantix_leaf_count: report.quantix_leaf_count,
      excel_total: report.excel_total,
      quantix_total: report.quantix_total,
      delta_vs_grand: report.delta_vs_grand,
      pct_vs_grand: report.pct_vs_grand,
      imported_yes: report.imported_yes,
      imported_no: report.imported_no,
      orphan_count: report.orphan_count,
      detections_summary: {
        dup_keys: detections.duplicated_descriptions.length,
        subtotals: detections.imported_subtotals.length,
        totals: detections.imported_totals.length,
        parents_skipped: detections.parent_rollups_skipped,
        zeros_skipped: detections.zero_rows_skipped,
        sections: detections.sections,
      },
    },
    null,
    2
  )
);
