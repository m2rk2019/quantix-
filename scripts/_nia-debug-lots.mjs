/**
 * Debug why intermediate lot packages are imported instead of detail children.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ExcelJS from 'exceljs';
import {
  classifyWorkbookSheets,
  sheetToMatrix,
} from '../lib/smart-import/sheet-classifier.ts';
import { extractBoqRows } from '../lib/smart-import/extractors.ts';

// Use bundled analyze path instead — load via exceljs + dynamic import of built bundle
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const ExcelJSCjs = require('exceljs');
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

const wb = new ExcelJSCjs.Workbook();
await wb.xlsx.readFile(resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx'));
const ws = wb.getWorksheet('BCB Breakdown');

// Show excel structure around Busway / FDAS / Refrigerant
for (const start of [206, 268, 404, 438, 570]) {
  console.log('\n==== Excel rows', start, '-', start + 25, '====');
  for (let r = start; r <= start + 25; r += 1) {
    const row = ws.getRow(r);
    const cols = [];
    for (let c = 1; c <= 9; c += 1) {
      const t = cellText(row.getCell(c));
      if (t) cols.push(`C${c}:${t.slice(0, 40)}`);
    }
    const uom = cellText(row.getCell(9));
    const total = num(cellText(row.getCell(16)));
    const lvl = row.outlineLevel || 0;
    if (!cols.length && !uom) continue;
    console.log(
      `R${r} L${lvl} uom=${uom || '-'} amt=${Math.round(total)} | ${cols.join(' | ')}`
    );
  }
}

// Build matrix the same way as importer and show those regions
const matrices = wb.worksheets.map((sheet) => {
  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    const dense = [];
    for (let i = 0; i < values.length; i += 1) {
      let v = values[i];
      if (v == null) {
        dense[i] = '';
        continue;
      }
      if (typeof v === 'object') {
        if ('result' in v && v.result != null) v = v.result;
        else if ('text' in v) v = v.text;
        else if ('richText' in v) v = v.richText.map((t) => t.text).join('');
        else if ('formula' in v) v = v.result ?? '';
        else v = String(v);
      }
      dense[i] = String(v).replace(/\s+/g, ' ').trim();
    }
    rows.push({ rowNumber, dense });
  });
  return { sheet_name: sheet.name, rows };
});

const bcb = matrices.find((m) => m.sheet_name === 'BCB Breakdown');
console.log('\nMatrix row count', bcb.rows.length, 'excel rowCount', ws.rowCount);
console.log(
  'First 15 matrix rowNumbers',
  bcb.rows.slice(0, 15).map((r) => r.rowNumber)
);

// Find Roughing In / Busway in matrix
for (const needle of [
  'Roughing In',
  'Busway System',
  'Power System Bus Way',
  '20mmØ PVC Pipe including fittings',
  'Refrigerant Pipe Works',
  '3/8" Copper Pipe',
]) {
  const hits = bcb.rows.filter((r) =>
    r.dense.some((c) => String(c).includes(needle.slice(0, 20)))
  );
  console.log(
    `\nNeedle "${needle}" hits:`,
    hits.slice(0, 5).map((h) => ({
      excelRow: h.rowNumber,
      matrixIdx: bcb.rows.indexOf(h),
      c0: h.dense[0],
      c1: h.dense[1]?.slice?.(0, 30),
      c2: h.dense[2]?.slice?.(0, 30),
      c3: h.dense[3]?.slice?.(0, 40),
      c7: h.dense[7],
      c8: h.dense[8],
      c15: h.dense[15],
    }))
  );
}
