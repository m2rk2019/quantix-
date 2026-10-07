/**
 * Quantix Acceptance Test Phase 1 — NIA Budgetary Cost Breakdown
 *   node scripts/nia-acceptance-phase1.mjs
 *
 * Analyzes the real NIA workbook with the production import engine,
 * compares against Excel ground truth, and writes a discrepancy report.
 * Does not auto-correct mismatches.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  const v = t.slice(i + 1).trim();
  if (!(k in process.env)) process.env[k] = v;
}

const results = [];
const mismatches = [];
const niaPath = resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx');

function pass(feature, detail = '') {
  results.push({ feature, status: 'PASS', detail });
  console.log('PASS', feature, detail ? `— ${detail}` : '');
}
function fail(feature, detail = '') {
  results.push({ feature, status: 'FAIL', detail });
  console.error('FAIL', feature, detail ? `— ${detail}` : '');
}
function mismatch(area, excel, quantix, note = '') {
  mismatches.push({ area, excel, quantix, note });
  console.error('MISMATCH', area, '| Excel:', excel, '| Quantix:', quantix, note ? `| ${note}` : '');
}

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

function resolveExcelDesc(row) {
  for (const c of [4, 3, 5, 2, 6, 1]) {
    const t = cellText(row.getCell(c));
    if (t && !/^\d+(\.\d+)*$/.test(t)) return { description: t, column: c };
  }
  return { description: '', column: 4 };
}

function isExcelRollupParent(ws, r, uom, qty, total, descColumn) {
  if (total <= 0) return false;
  const row = ws.getRow(r);
  const level = Number(row.outlineLevel || 0);

  for (let look = r + 1; look <= (ws.rowCount || 0); look += 1) {
    const nr = ws.getRow(look);
    const nextLevel = Number(nr.outlineLevel || 0);
    const next = resolveExcelDesc(nr);
    const nextUnit = cellText(nr.getCell(9));
    if (!next.description && !nextUnit) continue;
    if (/grand\s*total/i.test(next.description)) break;
    if (/^\d+\.0$/.test(cellText(nr.getCell(1)))) break;
    if (nextLevel > level) return true;
    if (nextLevel <= level) break;
  }

  if (uom.toLowerCase() !== 'lot' || qty !== 1) return false;
  for (let look = r + 1; look <= Math.min(r + 40, ws.rowCount || 0); look += 1) {
    const nr = ws.getRow(look);
    const next = resolveExcelDesc(nr);
    if (!next.description) continue;
    if (/grand\s*total/i.test(next.description)) break;
    if (/^\d+\.0$/.test(cellText(nr.getCell(1)))) break;
    const nextUnit = cellText(nr.getCell(9));
    if (!nextUnit) continue;
    if (nextUnit.toLowerCase() !== 'lot') return true;
    if (next.column > descColumn) continue;
    break;
  }
  return false;
}

async function excelGroundTruth() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(niaPath);
  const ws = wb.getWorksheet('BCB Breakdown');
  const bid = wb.getWorksheet('Bid Summary');

  const project = cellText(ws.getRow(5).getCell(3));
  const location = cellText(ws.getRow(6).getCell(3));
  const packageName = cellText(ws.getRow(7).getCell(3));
  const cfa = num(cellText(ws.getRow(5).getCell(9)));
  const units = num(cellText(ws.getRow(7).getCell(9)));
  const bldgsSheet = num(cellText(ws.getRow(8).getCell(9)));
  const bldgsBid = bid ? num(cellText(bid.getRow(7).getCell(8))) : 0;

  let grand = 0;
  const disciplineTotals = new Map();
  let leaf = 0;
  let sections = 0;
  let material = 0;
  let labor = 0;
  let services = 0;
  let currentDiscipline = null;
  const leafRows = [];

  for (let r = 13; r <= (ws.rowCount || 0); r++) {
    const row = ws.getRow(r);
    const c1 = cellText(row.getCell(1));
    const c2 = cellText(row.getCell(2));
    const qty = num(cellText(row.getCell(8)));
    const uom = cellText(row.getCell(9));
    const matCost = num(cellText(row.getCell(11)));
    const labCost = num(cellText(row.getCell(13)));
    const svcCost = num(cellText(row.getCell(15)));
    const total = num(cellText(row.getCell(16)));
    const resolved = resolveExcelDesc(row);
    const desc = resolved.description;

    if (/grand\s*total/i.test(desc)) {
      if (total > 0) grand = total;
      continue; // summary banner / footer — disciplines continue until commercial
    }
    if (
      /^(contingency|financial cost|overhead|project mark-?up|mark-?up|taxes|vat|bid price.*)$/i.test(
        (desc || '').trim()
      ) ||
      /^(contingency|financial cost|overhead|project mark-?up|mark-?up|taxes|vat)$/i.test(
        (c2 || '').trim()
      )
    ) {
      break; // end of direct-cost disciplines
    }
    if (/^\d+\.0$/.test(c1) && c2) {
      sections += 1;
      currentDiscipline = c2;
      disciplineTotals.set(c2, total);
      continue;
    }
    if (!(uom && total !== 0)) continue;
    if (isExcelRollupParent(ws, r, uom, qty, total, resolved.column)) continue;

    // Collapse assembly + MAIN: duplicates only when adjacent in the sheet
    // (same package). Do not collapse same-priced items across packages.
    const prev = leafRows[leafRows.length - 1];
    if (
      prev &&
      Math.abs(prev.amount - total) <= 0.02 &&
      r - prev.row <= 5
    ) {
      const prevIsMain = /^main\s*:/i.test(prev.description);
      const curIsMain = /^main\s*:/i.test(desc);
      const prevIsLot = prev.unit.toLowerCase() === 'lot';
      const curIsLot = uom.toLowerCase() === 'lot';
      const isPair =
        prevIsMain ||
        curIsMain ||
        (prevIsLot && !curIsLot) ||
        (!prevIsLot && curIsLot);
      if (isPair) {
        const preferCurrent =
          (curIsMain && !prevIsMain) || (!curIsLot && prevIsLot) || resolved.column > 4;
        if (preferCurrent) {
          material -= prev._mat || 0;
          labor -= prev._lab || 0;
          services -= prev._svc || 0;
          leafRows.pop();
          leaf -= 1;
        } else {
          continue;
        }
      }
    }

    leaf += 1;
    material += matCost;
    labor += labCost;
    services += svcCost;
    leafRows.push({
      row: r,
      description: desc,
      unit: uom,
      quantity: qty,
      amount: total,
      discipline: currentDiscipline,
      _mat: matCost,
      _lab: labCost,
      _svc: svcCost,
    });
  }

  return {
    sheets: wb.worksheets.map((s) => ({ name: s.name, state: s.state, rows: s.rowCount })),
    project,
    location,
    packageName,
    cfa,
    units,
    bldgsSheet,
    bldgsBid,
    grand,
    leaf,
    sections,
    material,
    labor,
    services,
    disciplineTotals,
    leafRows,
  };
}

async function main() {
  if (!existsSync(niaPath)) {
    fail('Workbook detected', 'samples/NIA_Budgetary_Cost_Breakdown.xlsx missing');
    process.exit(1);
  }
  pass('Workbook detected', 'samples/NIA_Budgetary_Cost_Breakdown.xlsx');

  const excel = await excelGroundTruth();
  pass(
    'Sheets recognized (Excel)',
    excel.sheets.map((s) => `${s.name}${s.state === 'hidden' ? ' (hidden)' : ''}`).join(', ')
  );

  // Production analyzer
  const bundleUrl = pathToFileURL(resolve(root, 'scripts/_nia-analyze-bundle.mjs')).href;
  const { analyzeSmartImportWorkbook } = await import(bundleUrl);
  const buffer = readFileSync(niaPath);
  const analysis = await analyzeSmartImportWorkbook(buffer);

  const roles = analysis.sheets.map((s) => `${s.sheet_name}:${s.role}`).join(', ');
  const hasBoq = analysis.sheets.some(
    (s) => s.role === 'boq' || s.role === 'cost_breakdown'
  );
  const hasBid = analysis.sheets.some(
    (s) => s.role === 'bid_summary' || s.role === 'summary'
  );
  if (hasBoq) pass('Sheets recognized', roles);
  else fail('Sheets recognized', roles);

  // Project info
  const nameOk =
    analysis.project_info.project_name &&
    analysis.project_info.project_name !== 'Imported Project' &&
    excel.project.toLowerCase().includes(
      analysis.project_info.project_name.slice(0, 20).toLowerCase()
    );
  if (nameOk) pass('Project Info', analysis.project_info.project_name);
  else {
    fail('Project Info', analysis.project_info.project_name);
    mismatch(
      'Project name',
      excel.project,
      analysis.project_info.project_name
    );
  }
  if (
    analysis.project_info.location &&
    excel.location.toLowerCase().includes(
      analysis.project_info.location.slice(0, 12).toLowerCase()
    )
  ) {
    pass('Project location', analysis.project_info.location);
  } else {
    fail('Project location', analysis.project_info.location || 'missing');
    mismatch('Location', excel.location, analysis.project_info.location);
  }

  const { buildWbsFromBoq } = await import(bundleUrl).catch(() => ({}));
  // WBS is inside analyze already via buildWbsFromBoq - rebuild for counts
  const leafBoq = analysis.boq_rows.filter((r) => !r.is_group_header);
  const groupBoq = analysis.boq_rows.filter((r) => r.is_group_header);
  const excelBoqTotal = leafBoq.reduce((s, r) => s + (r.amount || 0), 0);

  // Import buildWbs - it's exported from bundle via analyze deps; compute from groups
  const wbsCount = groupBoq.length;
  if (wbsCount >= 5) pass('WBS', `${wbsCount} group/section nodes`);
  else {
    fail('WBS', `${wbsCount} group/section nodes (expected ≥5)`);
    mismatch('WBS sections', excel.sections, wbsCount);
  }

  if (leafBoq.length === excel.leaf) {
    pass('BOQ', `${leafBoq.length} items (exact match with Excel leaf set)`);
  } else {
    fail('BOQ', `${leafBoq.length} items (Excel leaf ${excel.leaf})`);
    mismatch('BOQ item count', excel.leaf, leafBoq.length);
  }

  // Resources (from BOQ when no resource sheet — expected for NIA)
  const resourceCandidates = new Set(
    leafBoq.map((r) => r.description.trim().toLowerCase()).filter(Boolean)
  );
  if (resourceCandidates.size >= 50) {
    pass('Resources', `${resourceCandidates.size} unique BOQ→resource candidates`);
  } else {
    fail('Resources', `${resourceCandidates.size} candidates`);
  }
  if (analysis.resource_rows.length === 0) {
    mismatches.push({
      area: 'Dedicated resource analysis sheet',
      excel: 'Not present in NIA workbook (resources embedded in BCB rates)',
      quantix: '0 resource_analysis rows',
      note: 'Expected — resources derived from BOQ lines',
    });
  }

  // Unit rates
  const withRates = leafBoq.filter((r) => r.unit_rate > 0 || r.amount > 0).length;
  if (withRates >= leafBoq.length * 0.95) {
    pass('Unit Rates', `${withRates}/${leafBoq.length} priced lines`);
  } else {
    fail('Unit Rates', `${withRates}/${leafBoq.length} priced lines`);
  }

  // Estimate / totals
  const excelTotal = excel.grand;
  const quantixTotal = excelBoqTotal;
  const variance = quantixTotal - excelTotal;
  const variancePct = excelTotal > 0 ? (variance / excelTotal) * 100 : 0;
  const withinTol = Math.abs(variancePct) < 0.1;

  if (withinTol) {
    pass(
      'Estimate Summary',
      `Excel ${round2(excelTotal)} vs Quantix ${round2(quantixTotal)} (${round2(variancePct)}%)`
    );
  } else {
    fail(
      'Estimate Summary',
      `Excel ${round2(excelTotal)} vs Quantix ${round2(quantixTotal)} (${round2(variancePct)}%)`
    );
    mismatch('Total Cost (per building)', round2(excelTotal), round2(quantixTotal), `${round2(variancePct)}%`);
  }

  // Discipline totals
  const qDiscipline = new Map();
  for (const row of leafBoq) {
    const key = row.discipline || 'Unknown';
    qDiscipline.set(key, (qDiscipline.get(key) || 0) + row.amount);
  }
  for (const [name, excelAmt] of excel.disciplineTotals.entries()) {
    // Match loosely by keyword
    let qAmt = 0;
    for (const [qName, amt] of qDiscipline.entries()) {
      if (
        qName.toLowerCase().includes(name.toLowerCase().slice(0, 6)) ||
        name.toLowerCase().includes(qName.toLowerCase().slice(0, 6))
      ) {
        qAmt += amt;
      }
    }
    const dVar = excelAmt > 0 ? ((qAmt - excelAmt) / excelAmt) * 100 : 0;
    if (Math.abs(dVar) > 1) {
      mismatch(`Discipline total: ${name}`, round2(excelAmt), round2(qAmt), `${round2(dVar)}%`);
    }
  }

  // Line-level reconciliation by Excel row index (descriptions repeat across packages).
  const excelByRow = new Map(excel.leafRows.map((row) => [row.row, row]));
  let lineMismatches = 0;
  for (const row of leafBoq) {
    const hit = excelByRow.get(row.row_index);
    if (!hit) {
      lineMismatches += 1;
      if (mismatches.filter((m) => m.area.startsWith('BOQ line')).length < 25) {
        mismatch(
          `BOQ line missing in Excel map`,
          'n/a',
          `row ${row.row_index}: ${row.description.slice(0, 50)} [${row.unit}] = ${round2(row.amount)}`
        );
      }
      continue;
    }
    if (hit.amount > 0 && Math.abs(row.amount - hit.amount) / hit.amount > 0.01) {
      lineMismatches += 1;
      if (mismatches.filter((m) => m.area.startsWith('BOQ amount')).length < 25) {
        mismatch(
          `BOQ amount: ${row.description.slice(0, 40)} [${row.unit}]`,
          round2(hit.amount),
          round2(row.amount)
        );
      }
    }
  }
  if (lineMismatches === 0) {
    pass('BOQ line reconciliation', `${leafBoq.length} rows matched by Excel row index`);
  } else {
    fail('BOQ line reconciliation', `${lineMismatches} line discrepancies`);
  }

  // Pipeline wiring (code paths — live DB steps)
  const runner = readFileSync(
    resolve(root, 'services/smart-import/run-smart-import.ts'),
    'utf8'
  );
  const importPage = existsSync(
    resolve(root, 'app/(shell)/projects/import/page.tsx')
  );
  if (importPage) pass('Project Import page', '/projects/import');
  else fail('Project Import page');

  if (runner.includes('generateTenderSubmission')) {
    pass('Tender Package (pipeline wired)', 'auto after import');
  } else fail('Tender Package (pipeline wired)');

  const capture = readFileSync(
    resolve(root, 'services/historical-projects/capture-historical-archive.ts'),
    'utf8'
  );
  // Historical archive + master template are explicit post-import estimator actions.
  if (
    capture.includes('historical_projects') &&
    existsSync(resolve(root, 'app/(shell)/historical/page.tsx'))
  ) {
    pass(
      'Historical Archive',
      'Available via Approve/Archive (not auto on import)'
    );
  } else fail('Historical Archive');

  const saveTpl = readFileSync(
    resolve(root, 'services/master-templates/save-master-template.ts'),
    'utf8'
  );
  if (
    saveTpl.includes('master_templates') &&
    existsSync(
      resolve(
        root,
        'features/master-templates/components/SaveAsMasterTemplateButton.tsx'
      )
    )
  ) {
    pass(
      'Master Template',
      'Available via Save as Master Template (not auto on import)'
    );
  } else fail('Master Template');

  // Schema readiness
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  for (const table of [
    'smart_import_jobs',
    'historical_projects',
    'tender_submissions',
    'master_templates',
  ]) {
    const { error } = await sb.from(table).select('*', { count: 'exact', head: true });
    if (error) fail(`Schema ${table}`, error.message);
    else pass(`Schema ${table}`);
  }

  // Resource totals comparison (Excel material/labor/services vs Quantix single amount)
  mismatch(
    'Resource cost split (Material)',
    round2(excel.material),
    'not split in Quantix import (rolled into Total Cost)',
    'Informational — Quantix stores composite BOQ amount'
  );
  mismatch(
    'Resource cost split (Labor)',
    round2(excel.labor),
    'not split in Quantix import (rolled into Total Cost)',
    'Informational — Quantix stores composite BOQ amount'
  );
  mismatch(
    'Resource cost split (Services)',
    round2(excel.services),
    'not split in Quantix import (rolled into Total Cost)',
    'Informational — Quantix stores composite BOQ amount'
  );

  if (excel.bldgsSheet !== excel.bldgsBid) {
    mismatch(
      'Building count (sheet vs bid summary)',
      `BCB sheet # of Bldgs=${excel.bldgsSheet}`,
      `Bid Summary No. of Bldgs=${excel.bldgsBid}`,
      'Present in source workbook — not a Quantix error'
    );
  }

  // Write report
  const reportDir = resolve(root, 'docs');
  mkdirSync(reportDir, { recursive: true });
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const overall = failed === 0 ? 'PASS' : 'FAIL';

  const md = `# Quantix Acceptance Test Phase 1 — NIA BCB

**Date:** ${new Date().toISOString()}
**Workbook:** \`samples/NIA_Budgetary_Cost_Breakdown.xlsx\`
**Source:** \`MCC. CAC. Budgetary Cost Breakdown & Summary - NIA Rd Project. 2026 09 22 1.xlsx\`
**Overall:** **${overall}** (${passed} PASS / ${failed} FAIL)
**Mismatches logged:** ${mismatches.length}

## Import Validation Report

| Check | Status | Detail |
|-------|--------|--------|
${results
  .map(
    (r) =>
      `| ${r.status === 'PASS' ? '✓' : '✗'} ${r.feature} | **${r.status}** | ${r.detail.replace(/\|/g, '/')} |`
  )
  .join('\n')}

## Comparison statistics

| Metric | Original Excel | Quantix Generated | Delta |
|--------|----------------|-------------------|-------|
| BOQ leaf items | ${excel.leaf} | ${leafBoq.length} | ${leafBoq.length - excel.leaf} |
| WBS / sections | ${excel.sections} | ${wbsCount} | ${wbsCount - excel.sections} |
| Unique resources (from BOQ) | ${excel.leaf} | ${resourceCandidates.size} | ${resourceCandidates.size - excel.leaf} |
| Total Cost (per bldg) | ${round2(excelTotal)} | ${round2(quantixTotal)} | ${round2(variance)} (${round2(variancePct)}%) |
| Material Cost (Excel) | ${round2(excel.material)} | _(composite)_ | — |
| Labor Cost (Excel) | ${round2(excel.labor)} | _(composite)_ | — |
| Services Cost (Excel) | ${round2(excel.services)} | _(composite)_ | — |
| CFA (m²) | ${excel.cfa} | ${analysis.project_info.cfa_sqm ?? '—'} | — |
| Units | ${excel.units} | ${analysis.project_info.number_of_units ?? '—'} | — |
| Buildings (BCB sheet) | ${excel.bldgsSheet} | ${analysis.project_info.number_of_buildings ?? '—'} | — |
| Buildings (Bid Summary) | ${excel.bldgsBid} | — | source inconsistency |

### Discipline totals (Excel)

| Discipline | Excel Total |
|------------|-------------|
${[...excel.disciplineTotals.entries()]
  .map(([k, v]) => `| ${k} | ${round2(v)} |`)
  .join('\n')}

### Discipline totals (Quantix imported leaf sum)

| Discipline | Quantix Total |
|------------|---------------|
${[...qDiscipline.entries()]
  .map(([k, v]) => `| ${k} | ${round2(v)} |`)
  .join('\n')}

## Discrepancy report (no auto-correct)

${
  mismatches.length === 0
    ? '_None_'
    : mismatches
        .map(
          (m, i) =>
            `### ${i + 1}. ${m.area}\n- **Excel:** ${m.excel}\n- **Quantix:** ${m.quantix}\n${m.note ? `- **Note:** ${m.note}\n` : ''}`
        )
        .join('\n')
}

## Pipeline notes

1. Upload path: **/projects/import** (existing Smart Excel Import UI).
2. Tender package is generated automatically after import.
3. **Historical Archive** and **Master Template** require explicit user actions after import (Approve/Archive + Save as Master Template) — not auto-executed by \`runSmartExcelImport\`.
4. NIA workbook has **no separate resource library sheet**; resources are derived from BOQ lines with Material/Labor/Services rates rolled into **Total Cost**.
5. Bid Summary reports **5 buildings**; BCB Breakdown header shows **# of Bldgs = 1** (per-building BCB). Reconciliation uses **per-building Grand Total** \`${round2(excel.grand)}\`.

## Acceptance checklist

| Step | Status |
|------|--------|
| ✓ Workbook detected | ${results.find((r) => r.feature.startsWith('Workbook'))?.status || 'FAIL'} |
| ✓ Sheets recognized | ${hasBoq ? 'PASS' : 'FAIL'} |
| ✓ Project Info | ${nameOk ? 'PASS' : 'FAIL'} |
| ✓ WBS | ${wbsCount >= 5 ? 'PASS' : 'FAIL'} |
| ✓ BOQ | ${leafBoq.length === excel.leaf ? 'PASS' : 'FAIL'} |
| ✓ Resources | ${resourceCandidates.size >= 50 ? 'PASS' : 'FAIL'} |
| ✓ Unit Rates | ${withRates >= leafBoq.length * 0.95 ? 'PASS' : 'FAIL'} |
| ✓ Estimate Summary | ${withinTol ? 'PASS' : 'FAIL'} |
| ✓ Tender Package | ${runner.includes('generateTenderSubmission') ? 'PASS (wired)' : 'FAIL'} |
| ✓ Historical Archive | ${runner.includes('captureHistorical') ? 'PASS' : 'FAIL (manual step)'} |
| ✓ Master Template | ${runner.includes('saveMasterTemplate') ? 'PASS' : 'FAIL (manual step)'} |

---
**Goal:** 100% reconciliation with uploaded NIA workbook.  
**Current total-cost variance:** ${round2(variancePct)}% ${withinTol ? '(within ±0.10% tolerance)' : '(OUTSIDE ±0.10% tolerance)'}.
`;

  const reportPath = resolve(reportDir, 'NIA_ACCEPTANCE_PHASE1_REPORT.md');
  writeFileSync(reportPath, md, 'utf8');
  writeFileSync(
    resolve(reportDir, 'NIA_ACCEPTANCE_PHASE1_RAW.json'),
    JSON.stringify(
      {
        overall,
        excel: {
          ...excel,
          disciplineTotals: Object.fromEntries(excel.disciplineTotals),
          leafRows: excel.leafRows.length,
        },
        quantix: {
          project_info: analysis.project_info,
          sheets: analysis.sheets,
          boq_leaf: leafBoq.length,
          boq_groups: groupBoq.length,
          excel_boq_total: quantixTotal,
          resource_rows: analysis.resource_rows.length,
          bid_summary: analysis.bid_summary,
        },
        results,
        mismatches,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('\n=== OVERALL', overall, `===`);
  console.log('Report:', reportPath);
  console.log(`PASS ${passed} / FAIL ${failed} / mismatches ${mismatches.length}`);
  process.exit(failed > 0 || !withinTol ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
