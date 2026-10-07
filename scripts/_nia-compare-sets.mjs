/**
 * Compare acceptance Excel 484-leaf set vs Quantix importer output.
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
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const { analyzeSmartImportWorkbook } = await import(
  pathToFileURL(resolve(root, 'scripts/_nia-analyze-bundle.mjs')).href
);
const analysis = await analyzeSmartImportWorkbook(
  readFileSync(resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx'))
);
const qLeaf = analysis.boq_rows.filter((r) => !r.is_group_header);
const qHead = analysis.boq_rows.filter((r) => r.is_group_header);

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx'));
const ws = wb.getWorksheet('BCB Breakdown');

function rowDesc(row) {
  for (let c = 1; c <= 6; c += 1) {
    const t = cellText(row.getCell(c));
    if (t && !/^\d+(\.\d+)?$/.test(t)) return t;
  }
  return '';
}

const excelLeaf = [];
for (let r = 13; r <= ws.rowCount; r += 1) {
  const row = ws.getRow(r);
  const c1 = cellText(row.getCell(1));
  const c2 = cellText(row.getCell(2));
  const desc = rowDesc(row);
  const qty = num(cellText(row.getCell(8)));
  const uom = cellText(row.getCell(9));
  const total = num(cellText(row.getCell(16)));
  if (/^grand\s*total$/i.test(desc || '')) continue;
  if (
    /^(contingency|financial cost|overhead|project mark-?up|mark-?up|taxes|vat)$/i.test(
      (c2 || desc || '').trim()
    )
  ) {
    break;
  }
  if (/^\d+\.0$/.test(c1) && c2) continue;
  if (!(uom && total !== 0)) continue;

  let isLotParent = false;
  if (uom.toLowerCase() === 'lot' && qty === 1) {
    for (let look = r + 1; look <= Math.min(r + 12, ws.rowCount); look += 1) {
      const nr = ws.getRow(look);
      const nd = rowDesc(nr);
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
  if (isLotParent) continue;
  excelLeaf.push({
    r,
    desc,
    uom,
    qty,
    total,
    level: Number(row.outlineLevel || 0),
  });
}

// Match by amount + unit (multiset)
const qPool = [...qLeaf];
let matched = 0;
const unmatchedE = [];
for (const e of excelLeaf) {
  const ix = qPool.findIndex(
    (q) => Math.abs(q.amount - e.total) < 0.02 && norm(q.unit) === norm(e.uom)
  );
  if (ix >= 0) {
    matched += 1;
    qPool.splice(ix, 1);
  } else {
    unmatchedE.push(e);
  }
}

// Outline parents inside 484
let parents = 0;
let parentSum = 0;
const parentRows = [];
for (const e of excelLeaf) {
  let has = false;
  for (let r = e.r + 1; r <= ws.rowCount; r += 1) {
    const nr = ws.getRow(r);
    const nu = cellText(nr.getCell(9));
    const nd = rowDesc(nr);
    if (!nu && !nd) continue;
    if (/^\d+\.0$/.test(cellText(nr.getCell(1)))) break;
    const nl = Number(nr.outlineLevel || 0);
    if (nl > e.level) {
      has = true;
      break;
    }
    if (nl <= e.level) break;
  }
  if (has) {
    parents += 1;
    parentSum += e.total;
    parentRows.push(e);
  }
}

// Deepest-only set
const deep = excelLeaf.filter((e) => !parentRows.some((p) => p.r === e.r));
const deepSum = deep.reduce((s, e) => s + e.total, 0);
const excelSum = excelLeaf.reduce((s, e) => s + e.total, 0);
const qSum = qLeaf.reduce((s, e) => s + e.amount, 0);
const grand = 351522209.41;

console.log(
  JSON.stringify(
    {
      excelLeaf: excelLeaf.length,
      excelEmptyDesc: excelLeaf.filter((e) => !e.desc).length,
      qLeaf: qLeaf.length,
      qHead: qHead.length,
      matched,
      unmatchedExcel: unmatchedE.length,
      unmatchedQuantix: qPool.length,
      excelSum: round2(excelSum),
      qSum: round2(qSum),
      deepCount: deep.length,
      deepSum: round2(deepSum),
      deepDelta: round2(deepSum - grand),
      outlineParentsIn484: parents,
      parentSum: round2(parentSum),
      unmatchedE: unmatchedE.slice(0, 40).map((e) => ({
        r: e.r,
        desc: (e.desc || '').slice(0, 50),
        u: e.uom,
        t: round2(e.total),
        l: e.level,
      })),
      unmatchedQ: qPool.slice(0, 40).map((q) => ({
        r: q.row_index,
        desc: q.description.slice(0, 50),
        u: q.unit,
        t: round2(q.amount),
      })),
      parentRows: parentRows.map((e) => ({
        r: e.r,
        desc: (e.desc || '').slice(0, 50),
        t: round2(e.total),
        l: e.level,
        u: e.uom,
      })),
      groupHeaders: qHead.slice(0, 40).map((h) => ({
        r: h.row_index,
        d: h.description.slice(0, 50),
      })),
    },
    null,
    2
  )
);

writeFileSync(
  resolve(root, 'docs/NIA_SET_COMPARE.json'),
  JSON.stringify(
    {
      excelLeaf,
      qLeaf,
      unmatchedE,
      unmatchedQ: qPool,
      parentRows,
      deep,
    },
    null,
    2
  )
);
