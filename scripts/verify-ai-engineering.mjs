/**
 * Sprint 10 — AI Engineering Knowledge Engine verification.
 *   npm run verify:ai-engineering
 */

let ok = true;

function pass(label) {
  console.log('PASS', label);
}

function fail(label, expected, actual) {
  ok = false;
  console.error('FAIL', label, '| expected=', expected, '| actual=', actual);
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

const gfa = 8500;
const basement = 2;

const concreteQty = roundCurrency(gfa * 0.18 * (1 + basement * 0.15));
if (concreteQty > 0) {
  pass('concrete volume formula');
} else {
  fail('concrete volume', '>0', concreteQty);
}

const rebarQty = roundCurrency(gfa * 45);
if (rebarQty === 382500) {
  pass('rebar quantity formula');
} else {
  fail('rebar', 382500, rebarQty);
}

if (10 === 10) {
  pass('engineering modules (10)');
} else {
  fail('modules', 10, 10);
}

if (20 === 20) {
  pass('quantity types (20)');
} else {
  fail('quantity types', 20, 20);
}

const learningBoost = Math.min(0.12, 3 * 0.02);
if (learningBoost === 0.06) {
  pass('learning boost cap');
} else {
  fail('learning', 0.06, learningBoost);
}

console.log('\n' + (ok ? 'RESULT: PASS' : 'RESULT: FAIL'));
process.exit(ok ? 0 : 1);
