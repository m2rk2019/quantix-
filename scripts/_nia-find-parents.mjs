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
  if (!desc) continue;
  if (/^grand\s*total$/i.test(desc)) continue;
  if (/^(contingency|financial cost|overhead|project mark-?up|mark-?up|taxes|vat)$/i.test((c2 || desc).trim())) {
    past = true;
  }
  if (past) continue;
  rows.push({ r, c1, desc, uom, qty, total, isSection: /^\d+\.0$/.test(c1) && !!c2 });
}

const grand = 351522209.40614164;

// Strategy: within each section, greedily mark as parent any row whose amount
// approximately equals sum of a contiguous run of following non-section rows
// (until next row with amount >= this row or section end), within 0.5%.
const parentIdx = new Set();
const sectionBounds = [];
for (let i = 0; i < rows.length; i++) {
  if (rows[i].isSection) sectionBounds.push(i);
}
sectionBounds.push(rows.length);

for (let s = 0; s < sectionBounds.length - 1; s++) {
  const start = sectionBounds[s] + 1; // after section header
  const end = sectionBounds[s + 1];
  for (let i = start; i < end; i++) {
    const parent = rows[i];
    if (!parent.uom || parent.total <= 0) continue;
    let sum = 0;
    let childCount = 0;
    for (let j = i + 1; j < end; j++) {
      if (parentIdx.has(j)) continue;
      const child = rows[j];
      if (!child.uom) continue;
      // stop if we hit a sibling package of similar/larger size at same "lot" level
      if (
        childCount > 0 &&
        child.uom.toLowerCase() === 'lot' &&
        parent.uom.toLowerCase() === 'lot' &&
        child.total >= parent.total * 0.5
      ) {
        break;
      }
      sum += child.total;
      childCount += 1;
      if (sum > parent.total * 1.005) break;
      if (childCount >= 1 && Math.abs(sum - parent.total) / parent.total <= 0.005) {
        parentIdx.add(i);
        break;
      }
      // limit window
      if (childCount > 80) break;
    }
  }
}

let leafSum = 0;
let leafCount = 0;
let parentSum = 0;
const parents = [];
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  if (row.isSection) continue;
  if (!row.uom) continue;
  if (parentIdx.has(i)) {
    parentSum += row.total;
    parents.push(row);
    continue;
  }
  if (row.total === 0) continue;
  leafSum += row.total;
  leafCount += 1;
}

console.log({
  parent_count: parents.length,
  parent_sum: Math.round(parentSum * 100) / 100,
  leaf_count: leafCount,
  leaf_sum: Math.round(leafSum * 100) / 100,
  grand,
  delta: Math.round((leafSum - grand) * 100) / 100,
  delta_pct: (((leafSum - grand) / grand) * 100).toFixed(4) + '%',
});

console.log('\nParents found (top 30 by amount):');
for (const p of [...parents].sort((a, b) => b.total - a.total).slice(0, 30)) {
  console.log(p.r, Math.round(p.total), p.uom, p.desc.slice(0, 55));
}

// Also try: only lot rows as candidate parents with sum-of-children match
const lotParents = new Set();
for (let i = 0; i < rows.length; i++) {
  const parent = rows[i];
  if (parent.isSection || parent.uom.toLowerCase() !== 'lot' || parent.total <= 0) continue;
  // find end: next lot or section
  let end = rows.length;
  for (let j = i + 1; j < rows.length; j++) {
    if (rows[j].isSection) {
      end = j;
      break;
    }
    if (rows[j].uom.toLowerCase() === 'lot' && rows[j].total > 0) {
      end = j;
      break;
    }
  }
  let sum = 0;
  let n = 0;
  for (let j = i + 1; j < end; j++) {
    if (!rows[j].uom || rows[j].total === 0) continue;
    sum += rows[j].total;
    n += 1;
  }
  if (n >= 1 && Math.abs(sum - parent.total) / parent.total <= 0.01) {
    lotParents.add(i);
  }
}

leafSum = 0;
leafCount = 0;
parentSum = 0;
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  if (row.isSection || !row.uom || row.total === 0) continue;
  if (lotParents.has(i)) {
    parentSum += row.total;
    continue;
  }
  leafSum += row.total;
  leafCount += 1;
}
console.log('\nLOT-PARENT-BY-SUM-CHILDREN', {
  parents: lotParents.size,
  parent_sum: Math.round(parentSum * 100) / 100,
  leaf_count: leafCount,
  leaf_sum: Math.round(leafSum * 100) / 100,
  delta: Math.round((leafSum - grand) * 100) / 100,
  delta_pct: (((leafSum - grand) / grand) * 100).toFixed(4) + '%',
});

// Count ALL non-section rows with uom (including zeros and lot parents) = ?
const allDetail = rows.filter((r) => !r.isSection && r.uom);
console.log('all_detail_with_uom', allDetail.length);
console.log('non_zero_detail', allDetail.filter((r) => r.total !== 0).length);
console.log(
  'non_zero_non_lotparent_lookhead12',
  'see prior'
);
