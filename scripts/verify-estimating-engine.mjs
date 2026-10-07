/**
 * Sprint 8 — Formula Validation Suite for Quantix V1.
 *
 *   node scripts/verify-estimating-engine.mjs
 *   npm run verify:estimating-engine
 *
 * PASS/FAIL with expected vs actual values. No production code changes required.
 */

import { performance } from 'node:perf_hooks';

import {
  AMOUNT_TOLERANCE,
  amountsMatch,
  buildWbsRollup,
  calculateEstimateBreakdown,
  calculateTotalAmount,
  calculateTotalRate,
  computeLineAmount,
  computeRateBuildUp,
  computeResourceTotals,
  findDuplicateLibraryResources,
  resolveBoqRates,
  roundCurrency,
  sumBoqDirectCost,
  validateProjectSnapshot,
  validateRateAnalysisLines,
} from './lib/estimating-formulas.mjs';

import {
  buildFullDemoSnapshot,
  buildPerformanceItems,
  DEMO_PERCENTAGES,
  DEMO_PROJECT_META,
  getExpectedTotals,
} from './lib/formula-validation-demo-data.mjs';

const failures = [];
let passCount = 0;

function pass(label) {
  passCount += 1;
  console.log(`PASS  ${label}`);
}

function fail(label, expected, actual, detail = '') {
  const message = `${label} | expected=${expected} actual=${actual}${detail ? ` | ${detail}` : ''}`;
  failures.push(message);
  console.error(`FAIL  ${message}`);
}

function assertAmount(label, expected, actual) {
  if (amountsMatch(expected, actual)) {
    pass(label);
    return true;
  }
  fail(label, expected, actual);
  return false;
}

function assertTrue(label, condition) {
  if (condition) {
    pass(label);
    return true;
  }
  fail(label, true, false);
  return false;
}

console.log('Quantix Estimating Engine — Formula Validation Suite');
console.log('====================================================\n');

// ---------------------------------------------------------------------------
// 1. Formula unit tests
// ---------------------------------------------------------------------------
console.log('1. Formula tests\n');

assertAmount('zero quantity amount', 0, calculateTotalAmount(0, 2500));
assertAmount('large quantity amount', 2500000000, calculateTotalAmount(1_000_000, 2500));

const decimalAmount = calculateTotalAmount(12.375, 185.5);
assertAmount('decimal quantity amount', roundCurrency(12.375 * 185.5), decimalAmount);

const overrideRates = resolveBoqRates({
  material_rate: 100,
  labor_rate: 50,
  equipment_rate: 0,
  subcontract_rate: 0,
  other_cost_rate: 0,
  material_rate_override: 175,
});
assertAmount('manual material override', 175, overrideRates.material_rate);
assertAmount('manual override total rate', 225, calculateTotalRate(overrideRates));

const syncedLibraryCost = 285;
const staleLibraryCost = 310;
const lineAmountFromLibrary = computeLineAmount(2, syncedLibraryCost, 5);
const lineAmountAfterSync = computeLineAmount(2, staleLibraryCost, 5);
assertTrue(
  'rate library sync changes line amount',
  lineAmountFromLibrary !== lineAmountAfterSync
);
assertAmount('library sync old amount', 598.5, lineAmountFromLibrary);
assertAmount('library sync new amount', 651, lineAmountAfterSync);

const negativeValidation = validateRateAnalysisLines([
  {
    resource_name: 'Bad material',
    consumption: -1,
    unit_cost: 50,
    waste_percent: 0,
  },
]);
assertTrue('negative consumption rejected', !negativeValidation.valid);

const negativeEstimateFailed = (() => {
  try {
    calculateEstimateBreakdown(-1, DEMO_PERCENTAGES);
    return false;
  } catch {
    return true;
  }
})();
assertTrue('negative direct cost rejected', negativeEstimateFailed);

const duplicateIds = findDuplicateLibraryResources([
  { category: 'material', library_item_id: 'lib-1' },
  { category: 'material', library_item_id: 'lib-1' },
  { category: 'labor', library_item_id: 'lib-2' },
]);
assertTrue('duplicate resource detection', duplicateIds.length === 1);

const buildUp = computeRateBuildUp(1000, {
  ocm_percent: 10,
  contingency_percent: 5,
  profit_percent: 8,
  vat_percent: 12,
});
assertAmount('rate build-up OCM', 100, buildUp.ocm);
assertAmount('rate build-up final rate', 1397.09, buildUp.final_rate);

// ---------------------------------------------------------------------------
// 2. Demo project snapshot (100 BOQ items)
// ---------------------------------------------------------------------------
console.log('\n2. Demo project validation\n');

const snapshot = buildFullDemoSnapshot(100);
const expected = getExpectedTotals();

console.log(`Project : ${DEMO_PROJECT_META.project_name}`);
console.log(`Client  : ${DEMO_PROJECT_META.client_name}`);
console.log(`Location: ${DEMO_PROJECT_META.location}`);
console.log(`BOQ rows: ${snapshot.items.length}`);
console.log(`WBS nodes: ${snapshot.wbsNodes.length}`);
console.log(`Library resources: ${snapshot.resourceLibrary.items.length}\n`);

assertTrue('demo has ~100 BOQ items', snapshot.items.length === 100);
assertTrue('demo has 14 WBS nodes', snapshot.wbsNodes.length === 14);
assertTrue(
  'resource library populated',
  snapshot.resourceLibrary.items.length >= 26
);

assertAmount('expected direct cost', expected.direct_cost, snapshot.breakdown.direct_cost);
assertAmount('expected OCM', expected.indirect_cost, snapshot.breakdown.indirect_cost);
assertAmount('expected contingency', expected.contingency, snapshot.breakdown.contingency);
assertAmount('expected profit', expected.markup, snapshot.breakdown.markup);
assertAmount('expected VAT', expected.vat, snapshot.breakdown.vat);
assertAmount('expected grand total', expected.grand_total, snapshot.breakdown.grand_total);

assertAmount(
  'resource material total',
  expected.resource_totals.material,
  snapshot.resourceTotals.material
);
assertAmount(
  'resource labor total',
  expected.resource_totals.labor,
  snapshot.resourceTotals.labor
);
assertAmount(
  'resource subcontract total',
  expected.resource_totals.subcontract,
  snapshot.resourceTotals.subcontract
);

const validationFailures = validateProjectSnapshot({
  items: snapshot.items,
  wbsNodes: snapshot.wbsNodes,
  percentages: DEMO_PERCENTAGES,
  breakdown: snapshot.breakdown,
  resourceTotals: snapshot.resourceTotals,
  bidSummary: snapshot.bidSummary,
});

if (validationFailures.length === 0) {
  pass('full project snapshot validation');
} else {
  for (const item of validationFailures.slice(0, 10)) {
    fail(item.check, item.expected, item.actual, item.message);
  }
  if (validationFailures.length > 10) {
    fail(
      'additional snapshot failures',
      0,
      validationFailures.length,
      `${validationFailures.length - 10} more mismatches`
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Cross validation
// ---------------------------------------------------------------------------
console.log('\n3. Cross validation\n');

const boqTotal = sumBoqDirectCost(snapshot.items);
assertAmount('BOQ total = direct cost', boqTotal, snapshot.breakdown.direct_cost);
assertAmount(
  'BOQ total = bid direct cost',
  boqTotal,
  snapshot.bidSummary.total_direct_cost
);
assertAmount(
  'estimate grand total = bid grand total',
  snapshot.breakdown.grand_total,
  snapshot.bidSummary.grand_total
);
assertAmount(
  'resource grand total = BOQ total',
  snapshot.resourceTotals.grand_total,
  boqTotal
);

const rollup = buildWbsRollup(snapshot.wbsNodes, snapshot.items);
const rollupTotal = rollup.reduce((sum, node) => sum + node.combined_total, 0);
assertAmount('WBS rollup = BOQ total', boqTotal, rollupTotal);

// ---------------------------------------------------------------------------
// 4. Performance benchmarks
// ---------------------------------------------------------------------------
console.log('\n4. Performance benchmarks\n');

const PERF_LIMIT_MS = 2000;

for (const count of [100, 500, 1000]) {
  const loadStart = performance.now();
  const items = buildPerformanceItems(count);
  const loadMs = performance.now() - loadStart;

  const calcStart = performance.now();
  const direct = sumBoqDirectCost(items);
  const breakdown = calculateEstimateBreakdown(direct, DEMO_PERCENTAGES);
  const resources = computeResourceTotals(items);
  const calcMs = performance.now() - calcStart;

  const saveStart = performance.now();
  for (const item of items) {
    const recomputed = calculateTotalAmount(
      item.quantity,
      calculateTotalRate(item)
    );
    if (!amountsMatch(recomputed, item.total_amount)) {
      fail(`perf save integrity ${count}`, item.total_amount, recomputed);
      break;
    }
  }
  const saveMs = performance.now() - saveStart;
  const totalMs = loadMs + calcMs + saveMs;

  console.log(
    `  ${count} items | load ${loadMs.toFixed(1)}ms | calc ${calcMs.toFixed(1)}ms | save ${saveMs.toFixed(1)}ms | total ${totalMs.toFixed(1)}ms | grand ${breakdown.grand_total.toLocaleString()}`
  );

  if (totalMs > PERF_LIMIT_MS) {
    fail(`performance ${count} items under ${PERF_LIMIT_MS}ms`, PERF_LIMIT_MS, totalMs);
  } else {
    pass(`performance ${count} items under ${PERF_LIMIT_MS}ms`);
  }

  assertAmount(`perf ${count} resource grand total`, direct, resources.grand_total);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n====================================================');

if (failures.length > 0) {
  console.error(`RESULT: FAIL (${failures.length} failure(s), ${passCount} passed)`);
  console.error('\nFailures:');
  for (const message of failures) {
    console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log(`RESULT: PASS (${passCount} checks)`);
console.log('\nExpected totals (100-item demo):');
console.log(`  Direct Cost   : ${expected.direct_cost.toLocaleString()}`);
console.log(`  OCM           : ${expected.indirect_cost.toLocaleString()}`);
console.log(`  Contingency   : ${expected.contingency.toLocaleString()}`);
console.log(`  Profit        : ${expected.markup.toLocaleString()}`);
console.log(`  VAT           : ${expected.vat.toLocaleString()}`);
console.log(`  Grand Total   : ${expected.grand_total.toLocaleString()}`);
console.log(`  Tolerance     : ±${AMOUNT_TOLERANCE}`);

process.exit(0);
