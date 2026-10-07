import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx'));
const ws = wb.getWorksheet('BCB Breakdown');

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

const grand = 351522209.40614164;
const items = [];
let past = false;
let section = null;

for (let r = 13; r <= ws.rowCount; r++) {
  const row = ws.getRow(r);
  const c1 = cellText(row.getCell(1));
  const c2 = cellText(row.getCell(2));
  const c3 = cellText(row.getCell(3));
  const c4 = cellText(row.getCell(4));
  const qty = num(cellText(row.getCell(8)));
  const uom = cellText(row.getCell(9));
  const total = num(cellText(row.getCell(16)));
  const desc = c4 || c3 || c2;
  const level = Number(row.outlineLevel || 0);
  if (/^grand\s*total$/i.test(desc || '')) continue;
  if (/^(contingency|financial cost|overhead|project mark-?up|mark-?up|taxes|vat)$/i.test((c2 || desc || '').trim())) {
    past = true;
  }
  if (past) continue;

  if (/^\d+\.0$/.test(c1) && c2) {
    section = c2;
    continue;
  }
  if (!section || !uom) continue;
  if (level === 1 && total !== 0) {
    items.push({ r, desc, uom, qty, total, section, level });
  }
}

const sum = items.reduce((s, i) => s + i.total, 0);
console.log({
  count: items.length,
  sum: Math.round(sum * 100) / 100,
  grand,
  delta: Math.round((sum - grand) * 100) / 100,
  pct: (((sum - grand) / grand) * 100).toFixed(4) + '%',
});

// Per section
const by = new Map();
for (const i of items) {
  by.set(i.section, (by.get(i.section) || 0) + i.total);
}
console.log('by section level1', [...by.entries()].map(([k, v]) => [k, Math.round(v)]));

// Section header amounts for comparison
for (let r = 13; r <= 620; r++) {
  const row = ws.getRow(r);
  const c1 = cellText(row.getCell(1));
  const c2 = cellText(row.getCell(2));
  if (/^\d+\.0$/.test(c1) && c2) {
    console.log('SECTION', c1, c2, Math.round(num(cellText(row.getCell(16)))), 'L1sum', Math.round(by.get(c2) || 0));
  }
}
