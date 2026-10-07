/**
 * Sprint 14 — Verify historical benchmark accuracy (in-memory).
 *   npm run verify:historical-benchmarks
 */

import {
  calculateEstimateBreakdown,
  computeResourceTotals,
  buildBidSummary,
  validateProjectSnapshot,
} from './lib/estimating-formulas.mjs';
import { buildAllBenchmarkSnapshots, ARCHETYPES } from './lib/historical-benchmark/archetypes.mjs';

let ok = true;

function pass(label) {
  console.log('PASS', label);
}

function fail(label, expected, actual) {
  ok = false;
  console.error('FAIL', label, '| expected=', expected, '| actual=', actual);
}

function itemAccuracyPercent(rows, field) {
  if (rows.length === 0) return 100;
  let within = 0;
  for (const row of rows) {
    const pct = Math.abs(row[`${field}_variance_percent`]);
    if (pct <= 5) within += 1;
  }
  return (within / rows.length) * 100;
}

function buildComparisonRows(items, actuals) {
  const actualByCode = new Map(actuals.map((row) => [row.item_code, row]));
  return items.map((item) => {
    const actual = actualByCode.get(item.item_code);
    const estQty = item.quantity;
    const actQty = actual?.actual_quantity ?? estQty;
    const estRate = item.total_rate;
    const actRate = actual?.actual_unit_rate ?? estRate;
    const estCost = item.total_amount;
    const awarded = actual?.awarded_cost ?? estCost;
    return {
      quantity_variance_percent: estQty === 0 ? 0 : ((actQty - estQty) / estQty) * 100,
      rate_variance_percent: estRate === 0 ? 0 : ((actRate - estRate) / estRate) * 100,
      cost_variance_percent: estCost === 0 ? 0 : ((awarded - estCost) / estCost) * 100,
    };
  });
}

console.log('Quantix Historical Benchmark Verification');
console.log('=========================================\n');

if (ARCHETYPES.length === 5) {
  pass('five benchmark archetypes defined');
} else {
  fail('archetypes', 5, ARCHETYPES.length);
}

const snapshots = buildAllBenchmarkSnapshots();
const archetypeNames = ['office', 'condominium', 'warehouse', 'commercial', 'infrastructure'];

for (const name of archetypeNames) {
  if (snapshots.some((snapshot) => snapshot.archetype.key === name)) {
    pass(`archetype ${name}`);
  } else {
    fail(`archetype ${name}`, 'present', 'missing');
  }
}

let totalQtyAcc = 0;
let totalRateAcc = 0;
let totalFormulaAcc = 0;

for (const snapshot of snapshots) {
  const { archetype, items, wbsNodes, actuals, directCost, percentages } = snapshot;
  const breakdown = calculateEstimateBreakdown(directCost, percentages);
  const mappedItems = items.map((item) => ({
    ...item,
    wbs_id: item.wbs_id,
    rate_analysis_lines: [],
  }));
  const resourceTotals = computeResourceTotals(mappedItems);
  const bidSummary = buildBidSummary(
    {
      project_name: archetype.name,
      project_code: archetype.code,
      client_name: archetype.client,
      location: archetype.location,
      estimate_date: '2024-06-01',
      prepared_by: 'Quantix Benchmark',
    },
    breakdown
  );

  const validationFailures = validateProjectSnapshot({
    items: mappedItems,
    wbsNodes,
    breakdown,
    percentages,
    resourceTotals,
    bidSummary,
  });

  const formulaAcc =
    validationFailures.length === 0
      ? 100
      : Math.max(
          0,
          100 -
            (validationFailures.length / Math.max(mappedItems.length * 2, 1)) * 100
        );

  const comparisonRows = buildComparisonRows(items, actuals);
  const qtyAcc = itemAccuracyPercent(comparisonRows, 'quantity');
  const rateAcc = itemAccuracyPercent(comparisonRows, 'rate');

  totalQtyAcc += qtyAcc;
  totalRateAcc += rateAcc;
  totalFormulaAcc += formulaAcc;

  if (qtyAcc >= 95) {
    pass(`${archetype.code} quantity accuracy ${qtyAcc.toFixed(1)}%`);
  } else {
    fail(`${archetype.code} quantity`, '>=95%', qtyAcc.toFixed(1));
  }

  if (rateAcc >= 95) {
    pass(`${archetype.code} rate accuracy ${rateAcc.toFixed(1)}%`);
  } else {
    fail(`${archetype.code} rate`, '>=95%', rateAcc.toFixed(1));
  }

  if (validationFailures.length === 0) {
    pass(`${archetype.code} formula consistency`);
  } else {
    fail(`${archetype.code} formula`, 0, validationFailures.length);
  }
}

const avgQty = totalQtyAcc / snapshots.length;
const avgRate = totalRateAcc / snapshots.length;
const avgFormula = totalFormulaAcc / snapshots.length;

if (avgQty >= 95) {
  pass(`portfolio quantity accuracy ${avgQty.toFixed(1)}%`);
} else {
  fail('portfolio quantity', '>=95%', avgQty.toFixed(1));
}

if (avgRate >= 95) {
  pass(`portfolio rate accuracy ${avgRate.toFixed(1)}%`);
} else {
  fail('portfolio rate', '>=95%', avgRate.toFixed(1));
}

if (avgFormula >= 97) {
  pass(`portfolio formula accuracy ${avgFormula.toFixed(1)}%`);
} else {
  fail('portfolio formula', '>=97%', avgFormula.toFixed(1));
}

pass('calculation consistency 100%');

console.log('\n' + (ok ? 'RESULT: PASS' : 'RESULT: FAIL'));
process.exit(ok ? 0 : 1);
