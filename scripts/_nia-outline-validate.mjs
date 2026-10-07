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
  if (/^grand\s*total$/i.test(desc || '')) continue;
  if (/^(contingency|financial cost|overhead|project mark-?up|mark-?up|taxes|vat)$/i.test((c2 || desc || '').trim())) past = true;
  if (past) continue;
  if (!desc && !uom) continue;
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

// For each parent (has deeper child), compare total vs sum of direct children
const mismatches = [];
for (let i = 0; i < rows.length; i++) {
  const p = rows[i];
  if (p.isSection || !p.uom) continue;
  const childStart = i + 1;
  if (childStart >= rows.length || rows[childStart].level <= p.level) continue; // not parent
  let sum = 0;
  let n = 0;
  const childLevel = p.level + 1;
  for (let j = childStart; j < rows.length; j++) {
    if (rows[j].level <= p.level) break;
    if (rows[j].isSection) break;
    // direct children only at parent.level+1
    if (rows[j].level === childLevel && rows[j].uom) {
      sum += rows[j].total;
      n++;
    }
  }
  const delta = sum - p.total;
  if (n > 0 && Math.abs(delta) > 1) {
    mismatches.push({
      r: p.r,
      desc: p.desc.slice(0, 50),
      parent: Math.round(p.total * 100) / 100,
      children: Math.round(sum * 100) / 100,
      delta: Math.round(delta * 100) / 100,
      n,
      level: p.level,
    });
  }
}

mismatches.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
console.log('parent/child mismatches', mismatches.length);
console.log(mismatches.slice(0, 30));
const overParents = mismatches.filter((m) => m.delta > 0);
const underParents = mismatches.filter((m) => m.delta < 0);
console.log({
  over_count: overParents.length,
  over_sum_delta: Math.round(overParents.reduce((s, m) => s + m.delta, 0) * 100) / 100,
  under_count: underParents.length,
  under_sum_delta: Math.round(underParents.reduce((s, m) => s + m.delta, 0) * 100) / 100,
});

// Deepest leaf sum only under consistent parents; skip children of mismatched?
// Alternative: sum level-1 only = exact. For detail BOQ use deepest leaves but
// SCALE? User said don't modify rates.

// Count rows with outline that user might call 484
const candidates = rows.filter((r) => !r.isSection && r.uom && r.total !== 0);
console.log('nonzero detail rows', candidates.length);

// Deepest leaves including zeros
let deep = 0;
let deepZero = 0;
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  if (row.isSection || !row.uom) continue;
  const isParent = i + 1 < rows.length && rows[i + 1].level > row.level;
  if (isParent) continue;
  if (row.total === 0) deepZero++;
  else deep++;
}
console.log({ deepest_nonzero: deep, deepest_zero: deepZero, sum_target_484: deep });
