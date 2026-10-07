/**
 * Local Pilot — Megawide Office Building verification.
 *   npm run verify:megawide-office
 */

import { createClient } from '@supabase/supabase-js';

import { createSupabaseAdmin, loadEnvLocal } from './lib/load-env-local.mjs';
import {
  AMOUNT_TOLERANCE,
  amountsMatch,
  buildWbsRollup,
  sumBoqDirectCost,
  validateProjectSnapshot,
} from './lib/estimating-formulas.mjs';
import {
  MEGAWIDE_PERCENTAGES,
  MEGAWIDE_PROJECT_CODE,
  MEGAWIDE_PROJECT_ID,
  MEGAWIDE_PROJECT_META,
  TARGET_GRAND_MAX,
  TARGET_GRAND_MIN,
  buildFullMegawideSnapshot,
  getMegawideExpectedTotals,
} from './lib/megawide-office-demo-data.mjs';

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

console.log('Quantix Local Pilot — Megawide Office Building Verification');
console.log('===========================================================\n');

console.log('1. In-memory snapshot\n');

const snapshot = buildFullMegawideSnapshot();
const expected = getMegawideExpectedTotals();

console.log(`Project : ${MEGAWIDE_PROJECT_META.project_name}`);
console.log(`Code    : ${MEGAWIDE_PROJECT_CODE}`);
console.log(`BOQ rows: ${snapshot.items.length}`);
console.log(`WBS nodes: ${snapshot.wbsNodes.length}`);
console.log(`Library : ${snapshot.resourceLibrary.items.length} rate items\n`);

assertTrue('demo has 600 BOQ items', snapshot.items.length === 600);
assertTrue('demo has 20 WBS nodes', snapshot.wbsNodes.length === 20);
assertTrue(
  'resource library populated',
  snapshot.resourceLibrary.items.length >= 36
);
assertTrue(
  'grand total within PHP 300M–600M',
  snapshot.breakdown.grand_total >= TARGET_GRAND_MIN &&
    snapshot.breakdown.grand_total <= TARGET_GRAND_MAX
);

const disciplines = new Set(
  snapshot.wbsNodes.filter((node) => node.level === 3).map((node) => node.description)
);
const requiredDisciplines = [
  'Concrete',
  'Rebars',
  'Formworks',
  'Masonry',
  'Structural Steel',
  'Roofing',
  'Ceiling',
  'Doors',
  'Windows',
  'Painting',
  'Plumbing',
  'Fire Protection',
  'Electrical',
  'HVAC',
  'External Works',
];

for (const discipline of requiredDisciplines) {
  assertTrue(`discipline ${discipline}`, disciplines.has(discipline));
}

assertAmount('expected direct cost', expected.direct_cost, snapshot.breakdown.direct_cost);
assertAmount('expected grand total', expected.grand_total, snapshot.breakdown.grand_total);
assertAmount(
  'estimate grand total = bid grand total',
  snapshot.breakdown.grand_total,
  snapshot.bidSummary.grand_total
);

const boqTotal = sumBoqDirectCost(snapshot.items);
assertAmount('BOQ total = direct cost', boqTotal, snapshot.breakdown.direct_cost);
assertAmount(
  'resource grand total = BOQ total',
  snapshot.resourceTotals.grand_total,
  boqTotal
);

const rollup = buildWbsRollup(snapshot.wbsNodes, snapshot.items);
const rollupTotal = rollup.reduce((sum, node) => sum + node.combined_total, 0);
assertAmount('WBS rollup = BOQ total', boqTotal, rollupTotal);

const validationFailures = validateProjectSnapshot({
  items: snapshot.items,
  wbsNodes: snapshot.wbsNodes,
  percentages: MEGAWIDE_PERCENTAGES,
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
}

assertTrue('benchmark actuals for all BOQ items', snapshot.benchmarkActuals.length === snapshot.items.length);

console.log('\n2. Database checks (optional)\n');

loadEnvLocal();
const { supabaseUrl, serviceRoleKey } = createSupabaseAdmin();
const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: project, error: projectError } = await admin
  .from('projects')
  .select('id, project_code, project_name, status')
  .eq('id', MEGAWIDE_PROJECT_ID)
  .maybeSingle();

if (projectError) {
  fail('database project lookup', 'ok', projectError.message);
} else if (!project) {
  console.log('SKIP  database project not loaded (run npm run load:demo)');
} else {
  pass('database project exists');
  assertTrue('database project code', project.project_code === MEGAWIDE_PROJECT_CODE);

  const [summaryResult, detailsResult, boqResult, wbsResult, benchmarkResult] =
    await Promise.all([
      admin
        .from('estimate_summary')
        .select('direct_cost, grand_total')
        .eq('project_id', MEGAWIDE_PROJECT_ID)
        .maybeSingle(),
      admin
        .from('project_details')
        .select('currency, is_benchmark')
        .eq('project_id', MEGAWIDE_PROJECT_ID)
        .maybeSingle(),
      admin
        .from('boq_items')
        .select('total_amount')
        .eq('project_id', MEGAWIDE_PROJECT_ID)
        .is('deleted_at', null),
      admin
        .from('wbs')
        .select('id')
        .eq('project_id', MEGAWIDE_PROJECT_ID)
        .is('deleted_at', null),
      admin
        .from('project_benchmark_actuals')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', MEGAWIDE_PROJECT_ID),
    ]);

  if (summaryResult.error) {
    fail('estimate summary lookup', 'ok', summaryResult.error.message);
  } else if (summaryResult.data) {
    if (boqResult.error) {
      fail('database BOQ lookup', 'ok', boqResult.error.message);
    } else {
      const dbBoqTotal = (boqResult.data ?? []).reduce(
        (sum, row) => sum + Number(row.total_amount),
        0
      );
      assertAmount(
        'database BOQ total = estimate direct cost',
        Number(summaryResult.data.direct_cost),
        dbBoqTotal
      );
    }
    assertAmount(
      'database grand total matches snapshot',
      snapshot.breakdown.grand_total,
      Number(summaryResult.data.grand_total)
    );
  }

  if (detailsResult.error) {
    fail('database project details lookup', 'ok', detailsResult.error.message);
  } else if (detailsResult.data) {
    assertTrue('database currency PHP', detailsResult.data.currency === 'PHP');
    assertTrue('database is_benchmark', detailsResult.data.is_benchmark === true);
  }

  if (wbsResult.error) {
    fail('database WBS lookup', 'ok', wbsResult.error.message);
  } else {
    assertTrue('database WBS node count', (wbsResult.data ?? []).length === 20);
  }

  if (boqResult.error) {
    fail('database BOQ count lookup', 'ok', boqResult.error.message);
  } else {
    assertTrue('database BOQ item count', (boqResult.data ?? []).length === 600);
  }

  if (benchmarkResult.error) {
    fail('database benchmark actuals lookup', 'ok', benchmarkResult.error.message);
  } else {
    assertTrue(
      'database benchmark actuals loaded',
      (benchmarkResult.count ?? 0) === 600
    );
  }
}

console.log('\n===========================================================');

if (failures.length > 0) {
  console.error(`RESULT: FAIL (${failures.length} failure(s), ${passCount} passed)`);
  process.exit(1);
}

console.log(`RESULT: PASS (${passCount} checks)`);
console.log(`\nGrand total: PHP ${snapshot.breakdown.grand_total.toLocaleString()}`);
console.log(`Tolerance  : ±${AMOUNT_TOLERANCE}`);
process.exit(0);
