/**
 * Verify resource pricing insight math (Concrete 4000 psi example).
 *   node scripts/verify-resource-pricing-insights.mjs
 */

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function roundToNearest(value, step = 50) {
  return Math.round(value / step) * step;
}

function computeNegotiationBand(companyAverage) {
  const low = roundToNearest(companyAverage * 1.01);
  const high = Math.max(low + 50, roundToNearest(companyAverage * 1.038));
  return { low, high };
}

function buildInsightFromMock() {
  // Exact commercial figures from the Concrete 4000 psi mock.
  const companyAverage = 5250;
  const projects = [
    { project_code: 'Project A', unit_cost: 5200 },
    { project_code: 'Project B', unit_cost: 4950 },
    { project_code: 'Project C', unit_cost: 5650 },
  ];
  const currentQuotation = 5780;
  const percentAbove =
    ((currentQuotation - companyAverage) / companyAverage) * 100;
  const band = computeNegotiationBand(companyAverage);
  const lowest = Math.min(...projects.map((p) => p.unit_cost));
  const highest = Math.max(...projects.map((p) => p.unit_cost));
  return { companyAverage, currentQuotation, percentAbove, band, lowest, highest };
}

function buildInsightFromProjects() {
  // Production path: average of project awards + company catalog as quotation.
  const projects = [5200, 4950, 5650];
  const companyAverage = roundMoney(
    projects.reduce((s, v) => s + v, 0) / projects.length
  );
  const currentQuotation = 5780;
  const percentAbove =
    ((currentQuotation - companyAverage) / companyAverage) * 100;
  const band = computeNegotiationBand(companyAverage);
  return { companyAverage, percentAbove, band };
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

const mock = buildInsightFromMock();
assert('percent ~10.1%', Math.abs(mock.percentAbove - 10.0952) < 0.01);
assert('lowest 4950', mock.lowest === 4950);
assert('highest 5650', mock.highest === 5650);
assert('negotiation low 5300', mock.band.low === 5300);
assert('negotiation high 5450', mock.band.high === 5450);

const live = buildInsightFromProjects();
assert('live avg ~5266.67', Math.abs(live.companyAverage - 5266.67) < 0.01);
assert('live percent ~9.7%', Math.abs(live.percentAbove - 9.75) < 0.1);
assert('live band 5300–5450', live.band.low === 5300 && live.band.high === 5450);

process.exit(ok ? 0 : 1);
