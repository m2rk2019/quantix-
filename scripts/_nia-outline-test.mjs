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

const rows = [];
let past = false;
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
  if (!desc && !uom) continue;
  if (/^grand\s*total$/i.test(desc || c4)) continue;
  if (/^(contingency|financial cost|overhead|project mark-?up|mark-?up|taxes|vat)$/i.test((c2 || desc || '').trim())) {
    past = true;
  }
  if (past) continue;
  rows.push({
    r,
    c1,
    desc: desc || '',
    uom,
    qty,
    total,
    level,
    isSection: /^\d+\.0$/.test(c1) && !!c2,
  });
}

const grand = 351522209.40614164;
let leafSum = 0;
let leafCount = 0;
let parentCount = 0;
let zeroLeaf = 0;
const leaves = [];

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  if (row.isSection) continue;
  if (!row.uom) continue;

  // Parent if any following row (before back to same/higher level) has deeper outline
  let isParent = false;
  for (let j = i + 1; j < rows.length; j++) {
    if (rows[j].level <= row.level) break;
    if (rows[j].isSection) break;
    isParent = true;
    break;
  }

  if (isParent) {
    parentCount++;
    continue;
  }
  if (row.total === 0) {
    zeroLeaf++;
    continue;
  }
  leafSum += row.total;
  leafCount++;
  leaves.push(row);
}

console.log({
  leafCount,
  zeroLeaf,
  parentCount,
  leaf_plus_zero: leafCount + zeroLeaf,
  leafSum: Math.round(leafSum * 100) / 100,
  grand,
  delta: Math.round((leafSum - grand) * 100) / 100,
  pct: (((leafSum - grand) / grand) * 100).toFixed(4) + '%',
});

// Level histogram of leaves
const hist = new Map();
for (const l of leaves) hist.set(l.level, (hist.get(l.level) || 0) + 1);
console.log('leaf levels', Object.fromEntries(hist));

// If still over, show largest leaves at level 1
console.log('\nLargest level-1 leaves:');
for (const l of leaves.filter((x) => x.level <= 1).sort((a, b) => b.total - a.total).slice(0, 25)) {
  console.log(l.r, 'L'+l.level, Math.round(l.total), l.uom, l.desc.slice(0, 55));
}
