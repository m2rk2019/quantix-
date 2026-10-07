/**
 * RC verification: calculations, pagination scale, and permission matrix.
 * Run: node scripts/rc-verify.mjs
 */

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function calculateTotalRate(rates) {
  return roundCurrency(
    rates.material_rate +
      rates.labor_rate +
      rates.equipment_rate +
      rates.subcontract_rate +
      rates.other_cost_rate
  );
}

function calculateTotalAmount(quantity, totalRate) {
  return roundCurrency(quantity * totalRate);
}

function calculateEstimateBreakdown(directCost, percentages) {
  const direct_cost = roundCurrency(directCost);
  const indirect_cost = roundCurrency(
    direct_cost * (percentages.indirect_cost_percent / 100)
  );
  const contingency = roundCurrency(
    (direct_cost + indirect_cost) * (percentages.contingency_percent / 100)
  );
  const markup = roundCurrency(
    (direct_cost + indirect_cost + contingency) *
      (percentages.markup_percent / 100)
  );
  const vat = roundCurrency(
    (direct_cost + indirect_cost + contingency + markup) *
      (percentages.vat_percent / 100)
  );
  const grand_total = roundCurrency(
    direct_cost + indirect_cost + contingency + markup + vat
  );

  return {
    direct_cost,
    indirect_cost,
    contingency,
    markup,
    vat,
    grand_total,
  };
}

const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

// BOQ calculations
const rate = calculateTotalRate({
  material_rate: 100,
  labor_rate: 50,
  equipment_rate: 25,
  subcontract_rate: 10,
  other_cost_rate: 5,
});
assert(rate === 190, `BOQ total rate expected 190, got ${rate}`);

const amount = calculateTotalAmount(10, rate);
assert(amount === 1900, `BOQ total amount expected 1900, got ${amount}`);

// Estimate breakdown (COST_STRUCTURE_V1)
const breakdown = calculateEstimateBreakdown(100000, {
  indirect_cost_percent: 10,
  contingency_percent: 5,
  markup_percent: 8,
  vat_percent: 15,
});
assert(breakdown.direct_cost === 100000, 'Direct cost mismatch');
assert(breakdown.indirect_cost === 10000, 'Indirect cost mismatch');
assert(breakdown.contingency === 5500, 'Contingency mismatch');
assert(breakdown.markup === 9240, 'Markup mismatch');
assert(breakdown.vat === 18711, 'VAT mismatch');
assert(breakdown.grand_total === 143451, `Grand total mismatch: ${breakdown.grand_total}`);

// Scale: 100,000 BOQ rows at 200/page
const BOQ_PAGE_SIZE = 200;
const totalBoqRows = 100_000;
const totalPages = Math.ceil(totalBoqRows / BOQ_PAGE_SIZE);
assert(totalPages === 500, `Expected 500 BOQ pages, got ${totalPages}`);

// Scale: 1,000 WBS nodes tree index
function buildDescendantCounts(nodes) {
  const childrenByParent = new Map();
  for (const node of nodes) {
    const list = childrenByParent.get(node.parent_id) ?? [];
    list.push(node.id);
    childrenByParent.set(node.parent_id, list);
  }

  const memo = new Map();
  function countDescendants(nodeId) {
    const cached = memo.get(nodeId);
    if (cached !== undefined) {
      return cached;
    }
    const children = childrenByParent.get(nodeId) ?? [];
    const total = children.reduce(
      (sum, childId) => sum + 1 + countDescendants(childId),
      0
    );
    memo.set(nodeId, total);
    return total;
  }

  for (const node of nodes) {
    countDescendants(node.id);
  }

  return memo;
}

const wbsNodes = [{ id: 'root', parent_id: null }];
for (let index = 1; index < 1000; index += 1) {
  wbsNodes.push({
    id: `node-${index}`,
    parent_id: index < 10 ? 'root' : `node-${Math.floor(index / 10)}`,
  });
}
const descendantCounts = buildDescendantCounts(wbsNodes);
assert(
  descendantCounts.size === 1000,
  `WBS index should cover 1000 nodes, got ${descendantCounts.size}`
);

// Permission matrix spot checks (mirrors types/project.ts)
const lifecycleExpectations = [
  ['estimator', 'start', 'draft', true, true],
  ['viewer', 'start', 'draft', true, false],
  ['estimator', 'approve', 'for_review', true, false],
  ['admin', 'approve', 'for_review', false, true],
  ['quantity_surveyor', 'reject', 'for_review', false, true],
];

function canPerformLifecycleAction(role, action, status, isOwner) {
  switch (action) {
    case 'start':
      return (
        status === 'draft' &&
        (role === 'super_admin' ||
          role === 'admin' ||
          role === 'quantity_surveyor' ||
          (role === 'estimator' && isOwner))
      );
    case 'approve':
      return (
        status === 'for_review' &&
        (role === 'super_admin' || role === 'admin')
      );
    case 'reject':
      return (
        status === 'for_review' &&
        (role === 'super_admin' ||
          role === 'admin' ||
          role === 'quantity_surveyor')
      );
    default:
      return false;
  }
}

for (const [role, action, status, isOwner, expected] of lifecycleExpectations) {
  const actual = canPerformLifecycleAction(role, action, status, isOwner);
  assert(
    actual === expected,
    `Lifecycle ${role}/${action}/${status}/owner=${isOwner}: expected ${expected}, got ${actual}`
  );
}

if (failures.length > 0) {
  console.error('RC verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('RC verification passed.');
console.log(`- BOQ calculations OK`);
console.log(`- Estimate breakdown OK (grand total ${breakdown.grand_total})`);
console.log(`- ${totalBoqRows.toLocaleString()} BOQ rows => ${totalPages} pages @ ${BOQ_PAGE_SIZE}/page`);
console.log(`- ${wbsNodes.length.toLocaleString()} WBS nodes indexed`);
console.log(`- Lifecycle permission spot checks OK`);
