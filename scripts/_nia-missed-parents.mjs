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
  if (/^(contingency|financial cost|overhead|project mark-?up|mark-?up|taxes|vat)$/i.test((c2 || desc).trim())) past = true;
  if (past) continue;
  rows.push({ r, c1, desc, uom, qty, total, isSection: /^\d+\.0$/.test(c1) && !!c2 });
}

function isLookaheadParent(i) {
  const parent = rows[i];
  if (parent.isSection || parent.uom.toLowerCase() !== 'lot' || parent.qty !== 1 || parent.total <= 0) return false;
  for (let j = i + 1; j < Math.min(i + 12, rows.length); j++) {
    const next = rows[j];
    if (next.isSection) break;
    if (!next.desc) continue;
    if (next.uom && next.uom.toLowerCase() !== 'lot') return true;
    if (next.uom.toLowerCase() === 'lot') break;
  }
  return false;
}

function isSumChildrenParent(i) {
  const parent = rows[i];
  if (parent.isSection || parent.uom.toLowerCase() !== 'lot' || parent.total <= 0) return false;
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
  return n >= 1 && Math.abs(sum - parent.total) / parent.total <= 0.01;
}

// Combine: parent if lookahead OR sum-children
const parents = new Set();
for (let i = 0; i < rows.length; i++) {
  if (isLookaheadParent(i) || isSumChildrenParent(i)) parents.add(i);
}

// Also mark non-lot parents: amount equals sum of following rows until next equal-or-higher amount lot/section
for (let i = 0; i < rows.length; i++) {
  const parent = rows[i];
  if (parent.isSection || parents.has(i) || !parent.uom || parent.total <= 0) continue;
  if (parent.uom.toLowerCase() === 'lot') continue; // already handled
  let sum = 0;
  let n = 0;
  for (let j = i + 1; j < rows.length; j++) {
    if (rows[j].isSection) break;
    if (parents.has(j)) continue;
    if (!rows[j].uom || rows[j].total === 0) continue;
    // stop at sibling with same unit and comparable size? 
    if (n > 0 && rows[j].uom === parent.uom && rows[j].total >= parent.total * 0.8) break;
    sum += rows[j].total;
    n++;
    if (sum > parent.total * 1.01) break;
    if (n >= 2 && Math.abs(sum - parent.total) / parent.total <= 0.01) {
      parents.add(i);
      break;
    }
    if (n > 40) break;
  }
}

let leafSum = 0;
let leafCount = 0;
let zeroCount = 0;
const leafRows = [];
const parentRows = [];
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  if (row.isSection || !row.uom) continue;
  if (parents.has(i)) {
    parentRows.push(row);
    continue;
  }
  if (row.total === 0) {
    zeroCount++;
    continue;
  }
  leafSum += row.total;
  leafCount++;
  leafRows.push(row);
}

const grand = 351522209.40614164;
console.log({
  parents: parentRows.length,
  parent_sum: Math.round(parentRows.reduce((s, r) => s + r.total, 0) * 100) / 100,
  leaves: leafCount,
  zeros: zeroCount,
  leaf_sum: Math.round(leafSum * 100) / 100,
  grand,
  delta: Math.round((leafSum - grand) * 100) / 100,
  pct: (((leafSum - grand) / grand) * 100).toFixed(4) + '%',
  // counts user might mean:
  leaves_plus_zeros: leafCount + zeroCount,
  all_non_section: rows.filter((r) => !r.isSection && r.uom).length,
});

// Which lot rows are leaves but shouldn't be?
console.log('\nLot rows classified as LEAF (suspicious):');
for (const row of leafRows.filter((r) => r.uom.toLowerCase() === 'lot').sort((a, b) => b.total - a.total).slice(0, 40)) {
  console.log(row.r, Math.round(row.total), row.desc.slice(0, 60));
}

// Direct children of sections only (level-1 BOQ)
const level1 = [];
for (let i = 0; i < rows.length; i++) {
  if (!rows[i].isSection) continue;
  for (let j = i + 1; j < rows.length; j++) {
    if (rows[j].isSection) break;
    if (!rows[j].uom || rows[j].total === 0) continue;
    // level-1 = rows not under a prior parent within this section
    // take rows that are lot OR first-wave until we enter a parent's children
    level1.push(rows[j]);
    // only immediate: if this is a parent, skip its children
    if (parents.has(j)) {
      // skip until next lot/section sibling
      let k = j + 1;
      while (k < rows.length && !rows[k].isSection) {
        if (rows[k].uom.toLowerCase() === 'lot' && rows[k].total > 0) break;
        k++;
      }
      j = k - 1;
    }
  }
}
const l1sum = level1.reduce((s, r) => s + r.total, 0);
console.log('\nLEVEL1 under sections', {
  count: level1.length,
  sum: Math.round(l1sum * 100) / 100,
  delta: Math.round((l1sum - grand) * 100) / 100,
  pct: (((l1sum - grand) / grand) * 100).toFixed(4) + '%',
});
