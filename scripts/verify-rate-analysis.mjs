/**
 * Verify rate build-up computation helpers.
 *   node scripts/verify-rate-analysis.mjs
 */

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function computeLineAmount(consumption, unitCost, wastePercent = 0, productivity) {
  const qty = Math.max(0, consumption);
  const rate = Math.max(0, unitCost);
  const waste = Math.max(0, Math.min(100, wastePercent));
  let amount = qty * rate * (1 + waste / 100);
  if (productivity !== null && productivity !== undefined && productivity > 0) {
    amount = amount / productivity;
  }
  return roundCurrency(amount);
}

function computeRateBuildUp(directCost, markups) {
  const direct = roundCurrency(Math.max(0, directCost));
  const ocm = roundCurrency(direct * (markups.ocm_percent / 100));
  const contingency = roundCurrency((direct + ocm) * (markups.contingency_percent / 100));
  const profit = roundCurrency(
    (direct + ocm + contingency) * (markups.profit_percent / 100)
  );
  const vat = roundCurrency(
    (direct + ocm + contingency + profit) * (markups.vat_percent / 100)
  );
  return roundCurrency(direct + ocm + contingency + profit + vat);
}

let ok = true;

function assert(label, condition) {
  if (!condition) {
    console.error('FAIL', label);
    ok = false;
    return;
  }
  console.log('OK', label);
}

assert('basic amount', computeLineAmount(2, 50) === 100);
assert('waste amount', computeLineAmount(2, 50, 10) === 110);
assert('productivity amount', computeLineAmount(10, 30, 0, 2) === 150);

const finalRate = computeRateBuildUp(1000, {
  ocm_percent: 10,
  contingency_percent: 5,
  profit_percent: 8,
  vat_percent: 12,
});

assert('build-up final rate', finalRate > 1000);

process.exit(ok ? 0 : 1);
