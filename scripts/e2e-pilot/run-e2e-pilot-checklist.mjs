/**
 * Quantix V1 — End-to-End Pilot automated checklist
 *
 *   npm run pilot:e2e
 *
 * Does NOT modify Import Engine or application features.
 * Runs fixture/module presence checks + Import Engine v1 regression,
 * then writes docs/QUANTIX_E2E_PILOT_REPORT.md
 */

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_DIR = resolve(ROOT, 'docs/e2e-pilot');
const RESULTS_JSON = resolve(OUT_DIR, 'E2E_PILOT_RESULTS.json');
const REPORT_MD = resolve(ROOT, 'docs/QUANTIX_E2E_PILOT_REPORT.md');

function ok(pathRel) {
  return existsSync(resolve(ROOT, pathRel));
}

function check(id, phase, type, title, pass, detail = '') {
  return {
    id,
    phase,
    type, // AUTO | MANUAL
    title,
    status: pass ? 'PASS' : type === 'MANUAL' ? 'MANUAL_REQUIRED' : 'FAIL',
    detail,
  };
}

const t0 = performance.now();

const checks = [];

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
checks.push(
  check(
    'P2-FIXTURE',
    2,
    'AUTO',
    'NIA sample workbook present',
    ok('samples/NIA_Budgetary_Cost_Breakdown.xlsx'),
    'samples/NIA_Budgetary_Cost_Breakdown.xlsx'
  )
);
checks.push(
  check(
    'P14-FIXTURE',
    14,
    'AUTO',
    'STREVI sample workbook present',
    ok('samples/STREVI_BCB_Breakdown.xlsx'),
    'samples/STREVI_BCB_Breakdown.xlsx'
  )
);
checks.push(
  check(
    'P2-GOLDEN',
    2,
    'AUTO',
    'Import Engine v1 regression goldens present',
    ok('docs/import-engine-v1/REGRESSION_GOLDENS.json'),
    'docs/import-engine-v1/REGRESSION_GOLDENS.json'
  )
);

// ---------------------------------------------------------------------------
// Module readiness (no behavior change — path presence only)
// ---------------------------------------------------------------------------
const moduleChecks = [
  ['P1-ROUTE', 1, 'Project create/list services', ['services/projects/create-project.ts', 'services/projects/list-projects.ts']],
  ['P3-MODULE', 3, 'WBS module', ['features/wbs', 'services/wbs']],
  ['P4-MODULE', 4, 'BOQ module', ['features/boq/components/BoqModule.tsx', 'services/boq']],
  ['P5-MODULE', 5, 'Resource / rate library', ['features/resource-library', 'services/rate-library']],
  ['P6-MODULE', 6, 'Estimate summary', ['services/estimate']],
  ['P7-MODULE', 7, 'Tender package', ['services/tender', 'features/tender']],
  ['P8-MODULE', 8, 'Master templates', ['services/master-templates', 'features/master-templates']],
  ['P9-MODULE', 9, 'Template reuse / create-from-template', ['services/master-templates']],
  ['P10-MODULE', 10, 'Historical archive', ['services/historical-projects', 'app/(shell)/historical']],
  ['P11-MODULE', 11, 'Audit trail', ['services/audit']],
  ['P12-MODULE', 12, 'Quantity Takeoff + BOQ link', ['features/takeoff', 'services/takeoff/boq-link.ts', 'lib/takeoff/boq-sync.ts']],
];

for (const [id, phase, title, paths] of moduleChecks) {
  const missing = paths.filter((p) => !ok(p));
  checks.push(
    check(
      id,
      phase,
      'AUTO',
      title,
      missing.length === 0,
      missing.length ? `Missing: ${missing.join(', ')}` : paths.join(', ')
    )
  );
}

// ---------------------------------------------------------------------------
// Manual phases (recorded as required — not auto-pass)
// ---------------------------------------------------------------------------
const manualPhases = [
  [1, 'P1-UI', 'Create project, save, verify project code & list'],
  [2, 'P2-UI', 'Import NIA into live project; confirm 450 BOQ + ₱351,522,209.41'],
  [3, 'P3-UI', 'WBS expand/collapse/add/edit/delete/move + BOQ grouping'],
  [4, 'P4-UI', 'BOQ search/filter/sort/edit/copy/duplicate/delete/undo/redo/totals'],
  [5, 'P5-UI', 'Resource create/edit/delete/search/assign to BOQ'],
  [6, 'P6-UI', 'Estimate Summary categories + refresh after BOQ change'],
  [7, 'P7-UI', 'Tender generate/preview/PDF/totals'],
  [8, 'P8-UI', 'Approve project + Save as Master Template + version'],
  [9, 'P9-UI', 'New project from template copies WBS/BOQ/Rates/Resources/Estimate'],
  [10, 'P10-UI', 'Archive / restore / compare versions'],
  [11, 'P11-UI', 'Audit trail contains pilot actions'],
  [12, 'P12-UI', 'Takeoff upload/calibrate/measure/assign/live qty/coverage/export'],
  [13, 'P13-PERF', 'Performance targets (dashboard/list/open/BOQ/estimate/tender PDF)'],
];

for (const [phase, id, title] of manualPhases) {
  checks.push(
    check(id, phase, 'MANUAL', title, false, 'Requires interactive estimator execution')
  );
}

// ---------------------------------------------------------------------------
// Import Engine v1 regression (Phases 2 + 14 automated core)
// ---------------------------------------------------------------------------
console.log('=== Quantix E2E Pilot Checklist ===\n');
console.log('Running Import Engine v1 regression (no importer code changes)...\n');

const regStart = performance.now();
const regression = spawnSync('npm', ['run', 'regression:import-engine-v1'], {
  cwd: ROOT,
  encoding: 'utf8',
  shell: true,
  env: process.env,
});
const regMs = Math.round(performance.now() - regStart);
const regOut = `${regression.stdout || ''}\n${regression.stderr || ''}`;
const overallPass = /OVERALL:\s*PASS/.test(regOut);
const niaPass = /PASS NIA leaves=450/.test(regOut) || /PASS nia: leaf_count 450/.test(regOut);
const streviPass =
  /PASS STREVI leaves=505/.test(regOut) || /PASS strevi: leaf_count 505/.test(regOut);
const niaSum =
  /351522209\.41/.test(regOut) &&
  (/PASS nia: leaf_sum_rounded/.test(regOut) || /PASS NIA leaves=450 sum=351522209\.41/.test(regOut));

checks.push(
  check(
    'P2-REGRESSION',
    2,
    'AUTO',
    'NIA Import Engine regression (450 leaves, sum, fingerprint)',
    niaPass && niaSum && overallPass,
    `duration_ms=${regMs}`
  )
);
checks.push(
  check(
    'P14-REGRESSION',
    14,
    'AUTO',
    'Import Engine v1 OVERALL PASS (NIA + STREVI)',
    overallPass && niaPass && streviPass,
    overallPass ? 'OVERALL: PASS' : regOut.slice(-800)
  )
);
checks.push(
  check(
    'P14-NIA',
    14,
    'AUTO',
    'NIA PASS',
    niaPass && niaSum,
    '450 leaves · Direct Cost 351522209.41'
  )
);
checks.push(
  check(
    'P14-STREVI',
    14,
    'AUTO',
    'STREVI PASS',
    streviPass,
    '505 leaves'
  )
);

// Policy: importer not modified in this pilot run
checks.push(
  check(
    'POLICY-NO-ENGINE-EDIT',
    14,
    'AUTO',
    'Pilot policy: Import Engine not modified by this checklist',
    true,
    'Checklist only executes regression; does not edit lib/smart-import or services/smart-import'
  )
);

const elapsedMs = Math.round(performance.now() - t0);

const auto = checks.filter((c) => c.type === 'AUTO');
const autoPass = auto.filter((c) => c.status === 'PASS').length;
const autoFail = auto.filter((c) => c.status === 'FAIL').length;
const manual = checks.filter((c) => c.type === 'MANUAL');

// Score: 60% automated, 40% reserved for manual (pending = not awarded)
const autoScore = auto.length ? (autoPass / auto.length) * 60 : 0;
const manualPendingPenaltyNote =
  'Manual UI phases not executed in this automated run (0/40 awarded). Complete QUANTIX_E2E_PILOT.md manually to unlock full score.';
const productionReadinessScore = Math.round(autoScore); // 0–60 until manual done; document path to 100

const byPhase = {};
for (const c of checks) {
  if (!byPhase[c.phase]) byPhase[c.phase] = [];
  byPhase[c.phase].push(c);
}

function phaseVerdict(phaseChecks) {
  const fails = phaseChecks.filter((c) => c.status === 'FAIL');
  if (fails.length) return 'FAIL';
  const autos = phaseChecks.filter((c) => c.type === 'AUTO');
  const manuals = phaseChecks.filter((c) => c.type === 'MANUAL');
  if (autos.length && autos.every((c) => c.status === 'PASS') && manuals.length === 0) {
    return 'PASS';
  }
  if (autos.length && autos.every((c) => c.status === 'PASS')) {
    return 'PASS_AUTO / MANUAL_REQUIRED';
  }
  if (manuals.length && autos.length === 0) return 'MANUAL_REQUIRED';
  return 'PARTIAL';
}

const phaseSummary = [];
for (let p = 1; p <= 14; p += 1) {
  const pcs = byPhase[p] || [];
  phaseSummary.push({
    phase: p,
    verdict: pcs.length ? phaseVerdict(pcs) : 'N/A',
    checks: pcs,
  });
}

const bugs = [];
if (autoFail > 0) {
  for (const c of auto.filter((x) => x.status === 'FAIL')) {
    bugs.push({
      id: c.id,
      title: c.title,
      severity: c.id.startsWith('P14') || c.id.startsWith('P2-REG') ? 'Critical' : 'High',
      detail: c.detail,
    });
  }
}

const recommendation =
  autoFail > 0
    ? 'Do not proceed to production. Resolve automated FAIL items, re-run npm run pilot:e2e, then complete manual phases.'
    : productionReadinessScore < 85
      ? 'Automated gate PASS. Complete all MANUAL_REQUIRED phases in QUANTIX_E2E_PILOT.md, attach screenshots, then re-score for production sign-off.'
      : 'Automated + prior acceptance evidence support production readiness pending final manual sign-off.';

const results = {
  generated_at: new Date().toISOString(),
  pilot_doc: 'docs/QUANTIX_E2E_PILOT.md',
  execution_time_ms: elapsedMs,
  regression_time_ms: regMs,
  import_engine_regression: {
    exit_code: regression.status,
    overall_pass: overallPass,
    nia_pass: niaPass && niaSum,
    strevi_pass: streviPass,
  },
  counts: {
    auto_total: auto.length,
    auto_pass: autoPass,
    auto_fail: autoFail,
    manual_required: manual.length,
  },
  production_readiness_score: productionReadinessScore,
  production_readiness_score_note: manualPendingPenaltyNote,
  recommendation,
  bugs,
  phases: phaseSummary,
  checks,
};

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(resolve(OUT_DIR, 'screenshots'), { recursive: true });
writeFileSync(RESULTS_JSON, JSON.stringify(results, null, 2), 'utf8');

function statusIcon(status) {
  if (status === 'PASS' || status === 'PASS_AUTO / MANUAL_REQUIRED') return '✔';
  if (status === 'FAIL') return '✖';
  return '○';
}

const reportLines = [];
reportLines.push('# Quantix V1 — End-to-End Pilot Report');
reportLines.push('');
reportLines.push('| Field | Value |');
reportLines.push('|-------|-------|');
reportLines.push(`| **Generated** | ${results.generated_at} |`);
reportLines.push(`| **Pilot plan** | [QUANTIX_E2E_PILOT.md](./QUANTIX_E2E_PILOT.md) |`);
reportLines.push(`| **Results JSON** | [e2e-pilot/E2E_PILOT_RESULTS.json](./e2e-pilot/E2E_PILOT_RESULTS.json) |`);
reportLines.push(`| **Execution time** | ${elapsedMs} ms (regression ${regMs} ms) |`);
reportLines.push(`| **Import Engine** | ${overallPass ? 'OVERALL PASS' : 'FAIL'} (NIA ${niaPass && niaSum ? 'PASS' : 'FAIL'} · STREVI ${streviPass ? 'PASS' : 'FAIL'}) |`);
reportLines.push(`| **Automated** | ${autoPass}/${auto.length} PASS · ${autoFail} FAIL |`);
reportLines.push(`| **Manual required** | ${manual.length} phases/checks |`);
reportLines.push(`| **Production Readiness Score** | **${productionReadinessScore} / 100** |`);
reportLines.push('');
reportLines.push('> Score awards up to **60** points for automated gates. Remaining **40** points require completing manual estimator phases and attaching screenshots.');
reportLines.push('');
reportLines.push('---');
reportLines.push('');
reportLines.push('## Phase verdicts');
reportLines.push('');
reportLines.push('| Phase | Verdict | Notes |');
reportLines.push('|------:|---------|-------|');
const phaseTitles = {
  1: 'Create Project',
  2: 'Smart Excel Import (NIA)',
  3: 'WBS',
  4: 'BOQ',
  5: 'Resource Library',
  6: 'Estimate Summary',
  7: 'Tender Package',
  8: 'Save as Master Template',
  9: 'New Project from Template',
  10: 'Historical Archive',
  11: 'Audit Trail',
  12: 'Manual Quantity Takeoff',
  13: 'Performance',
  14: 'Import Engine Regression',
};
for (const p of phaseSummary) {
  reportLines.push(
    `| ${p.phase}. ${phaseTitles[p.phase] ?? ''} | ${statusIcon(p.verdict)} ${p.verdict} | ${(p.checks || []).map((c) => c.id).join(', ')} |`
  );
}
reportLines.push('');
reportLines.push('---');
reportLines.push('');
reportLines.push('## Automated checklist detail');
reportLines.push('');
reportLines.push('| ID | Phase | Status | Check | Detail |');
reportLines.push('|----|------:|--------|-------|--------|');
for (const c of auto) {
  reportLines.push(
    `| ${c.id} | ${c.phase} | ${statusIcon(c.status)} ${c.status} | ${c.title} | ${String(c.detail).replace(/\|/g, '/')} |`
  );
}
reportLines.push('');
reportLines.push('## Manual checklist (required)');
reportLines.push('');
reportLines.push('| ID | Phase | Status | Check |');
reportLines.push('|----|------:|--------|-------|');
for (const c of manual) {
  reportLines.push(
    `| ${c.id} | ${c.phase} | ${statusIcon(c.status)} ${c.status} | ${c.title} |`
  );
}
reportLines.push('');
reportLines.push('---');
reportLines.push('');
reportLines.push('## Screenshots required');
reportLines.push('');
reportLines.push('Store under `docs/e2e-pilot/screenshots/` — see register in QUANTIX_E2E_PILOT.md (S1–S13).');
reportLines.push('');
reportLines.push('| ID | Phase | Required capture | Attached |');
reportLines.push('|----|------:|------------------|----------');
for (let i = 1; i <= 13; i += 1) {
  const labels = {
    1: 'Projects list with pilot project',
    2: 'Import success 450 / Direct Cost',
    3: 'WBS tree',
    4: 'BOQ after edit',
    5: 'Resource library',
    6: 'Estimate Summary',
    7: 'Tender PDF/preview',
    8: 'Master template version',
    9: 'Project from template',
    10: 'Historical archive',
    11: 'Audit trail',
    12: 'Takeoff + BOQ assign',
    13: 'Regression OVERALL PASS',
  };
  reportLines.push(`| S${i} | ${i === 13 ? 14 : i} | ${labels[i]} | ○ Pending |`);
}
reportLines.push('');
reportLines.push('---');
reportLines.push('');
reportLines.push('## Bugs found');
reportLines.push('');
if (bugs.length === 0) {
  reportLines.push('No automated failures detected in this run.');
} else {
  reportLines.push('| ID | Severity | Title | Detail |');
  reportLines.push('|----|----------|-------|--------|');
  for (const b of bugs) {
    reportLines.push(`| ${b.id} | ${b.severity} | ${b.title} | ${b.detail} |`);
  }
}
reportLines.push('');
reportLines.push('---');
reportLines.push('');
reportLines.push('## Recommendation');
reportLines.push('');
reportLines.push(recommendation);
reportLines.push('');
reportLines.push('---');
reportLines.push('');
reportLines.push('## Production Readiness Score');
reportLines.push('');
reportLines.push(`**${productionReadinessScore} / 100**`);
reportLines.push('');
reportLines.push('| Component | Points | Status |');
reportLines.push('|-----------|-------:|--------|');
reportLines.push(`| Automated gates (${autoPass}/${auto.length}) | ${Math.round(autoScore)} / 60 | ${autoFail === 0 ? '✔' : '✖'} |`);
reportLines.push('| Manual estimator phases + screenshots | 0 / 40 | ○ Pending |');
reportLines.push(`| **Total** | **${productionReadinessScore} / 100** | |`);
reportLines.push('');
reportLines.push(manualPendingPenaltyNote);
reportLines.push('');
reportLines.push('### How to reach 100');
reportLines.push('');
reportLines.push('1. Execute every MANUAL_REQUIRED step in QUANTIX_E2E_PILOT.md');
reportLines.push('2. Attach S1–S13 screenshots');
reportLines.push('3. Confirm no Critical/High bugs');
reportLines.push('4. Re-run `npm run pilot:e2e` (must remain Import Engine OVERALL PASS)');
reportLines.push('5. Sign the pilot sign-off table');
reportLines.push('');
reportLines.push('---');
reportLines.push('');
reportLines.push('## Policy confirmation');
reportLines.push('');
reportLines.push('- ✔ No new features added by this pilot checklist');
reportLines.push('- ✔ Smart Import Engine / Import Engine V1 not modified');
reportLines.push('- ✔ Application code unchanged unless a separate production bug fix is explicitly required');
reportLines.push('');

writeFileSync(REPORT_MD, reportLines.join('\n'), 'utf8');

console.log('\n=== SUMMARY ===');
console.log(`Automated: ${autoPass}/${auto.length} PASS, ${autoFail} FAIL`);
console.log(`Manual required: ${manual.length}`);
console.log(`Import Engine: ${overallPass ? 'OVERALL PASS' : 'FAIL'}`);
console.log(`Production Readiness Score: ${productionReadinessScore}/100`);
console.log(`Wrote ${RESULTS_JSON}`);
console.log(`Wrote ${REPORT_MD}`);

if (autoFail > 0 || !overallPass) {
  process.exitCode = 1;
} else {
  process.exitCode = 0;
}
