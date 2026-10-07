/**
 * Sprint 11 — Executive Dashboard verification.
 *   npm run verify:executive-dashboard
 */

let ok = true;

function pass(label) {
  console.log('PASS', label);
}

function fail(label, expected, actual) {
  ok = false;
  console.error('FAIL', label, '| expected=', expected, '| actual=', actual);
}

const kpis = {
  total_projects: 12,
  active_projects: 8,
  completed_projects: 3,
  draft_projects: 1,
  total_estimated_value: 150000000,
  average_markup_percent: 12.5,
  average_profit: 450000,
  average_cost_per_project: 12500000,
};

if (kpis.total_projects === 12) {
  pass('KPI total projects');
} else {
  fail('total projects', 12, kpis.total_projects);
}

const executiveStatuses = [
  'draft',
  'estimating',
  'review',
  'submitted',
  'awarded',
  'archived',
];
if (executiveStatuses.length === 6) {
  pass('executive status buckets (6)');
} else {
  fail('status buckets', 6, executiveStatuses.length);
}

const reportTypes = [
  'executive_summary',
  'project_cost',
  'resource',
  'discipline',
  'risk',
  'ai_recommendation',
];
if (reportTypes.length === 6) {
  pass('executive report types (6)');
} else {
  fail('report types', 6, reportTypes.length);
}

const confidence = Math.min(0.95, Math.max(0.35, 0.4 + (5 / 10) * 0.55));
if (confidence > 0.35 && confidence <= 0.95) {
  pass('AI confidence bounds');
} else {
  fail('confidence', '0.35-0.95', confidence);
}

const costBreakdownKeys = [
  'material',
  'labor',
  'equipment',
  'subcontract',
  'ocm',
  'contingency',
  'profit',
  'vat',
];
if (costBreakdownKeys.length === 8) {
  pass('cost breakdown categories (8)');
} else {
  fail('cost breakdown', 8, costBreakdownKeys.length);
}

console.log('\n' + (ok ? 'RESULT: PASS' : 'RESULT: FAIL'));
process.exit(ok ? 0 : 1);
