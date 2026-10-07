/**
 * Pure estimating formulas for Sprint 8 validation (mirrors production lib/*).
 */

export const AMOUNT_TOLERANCE = 0.01;

export function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

export function calculateTotalRate(rates) {
  return roundCurrency(
    rates.material_rate +
      rates.labor_rate +
      rates.equipment_rate +
      rates.subcontract_rate +
      (rates.other_cost_rate ?? 0)
  );
}

export function calculateTotalAmount(quantity, totalRate) {
  return roundCurrency(quantity * totalRate);
}

export function calculateEstimateBreakdown(directCost, percentages) {
  if (directCost < 0) {
    throw new Error('Direct cost cannot be negative.');
  }

  const validated = {
    indirect_cost_percent: clampPercent(percentages.indirect_cost_percent),
    contingency_percent: clampPercent(percentages.contingency_percent),
    markup_percent: clampPercent(percentages.markup_percent),
    vat_percent: clampPercent(percentages.vat_percent),
  };

  const direct_cost = roundCurrency(directCost);
  const indirect_cost = applyPercent(direct_cost, validated.indirect_cost_percent);
  const contingency = applyPercent(
    direct_cost + indirect_cost,
    validated.contingency_percent
  );
  const markup = applyPercent(
    direct_cost + indirect_cost + contingency,
    validated.markup_percent
  );
  const vat = applyPercent(
    direct_cost + indirect_cost + contingency + markup,
    validated.vat_percent
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

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function applyPercent(base, percent) {
  return roundCurrency(base * (clampPercent(percent) / 100));
}

export function computeLineAmount(
  consumption,
  unitCost,
  wastePercent = 0,
  productivity
) {
  const qty = Math.max(0, consumption);
  const rate = Math.max(0, unitCost);
  const waste = Math.max(0, Math.min(100, wastePercent));
  let amount = qty * rate * (1 + waste / 100);

  if (productivity !== null && productivity !== undefined && productivity > 0) {
    amount = amount / productivity;
  }

  return roundCurrency(amount);
}

export function computeCategoryTotals(lines) {
  const totals = {
    material: 0,
    labor: 0,
    equipment: 0,
    subcontract: 0,
  };

  for (const line of lines) {
    totals[line.category] = roundCurrency(totals[line.category] + line.amount);
  }

  return totals;
}

export function computeDirectCost(categoryTotals, otherCostRate = 0) {
  const sum =
    categoryTotals.material +
    categoryTotals.labor +
    categoryTotals.equipment +
    categoryTotals.subcontract;
  return roundCurrency(sum + Math.max(0, otherCostRate));
}

export function computeRateBuildUp(directCost, markups) {
  const direct = roundCurrency(Math.max(0, directCost));
  const ocm = applyPercent(direct, markups.ocm_percent);
  const contingency = applyPercent(direct + ocm, markups.contingency_percent);
  const profit = applyPercent(
    direct + ocm + contingency,
    markups.profit_percent
  );
  const vat = applyPercent(
    direct + ocm + contingency + profit,
    markups.vat_percent
  );
  const final_rate = roundCurrency(direct + ocm + contingency + profit + vat);

  return {
    direct_cost: direct,
    ocm,
    contingency,
    profit,
    vat,
    final_rate,
  };
}

export function findDuplicateLibraryResources(lines) {
  const seen = new Map();
  const duplicates = [];

  for (const line of lines) {
    if (!line.library_item_id) {
      continue;
    }
    const key = `${line.category}:${line.library_item_id}`;
    if (seen.has(key)) {
      duplicates.push(line.library_item_id);
    } else {
      seen.set(key, line.library_item_id);
    }
  }

  return duplicates;
}

export function validateRateAnalysisLines(lines) {
  const errors = [];

  for (const [index, line] of lines.entries()) {
    const row = index + 1;

    if (!line.resource_name?.trim()) {
      errors.push(`Row ${row}: resource name is required.`);
    }

    if (line.consumption < 0) {
      errors.push(`Row ${row}: quantity cannot be negative.`);
    }

    if (line.unit_cost < 0) {
      errors.push(`Row ${row}: unit rate cannot be negative.`);
    }

    const waste = line.waste_percent ?? 0;
    if (waste < 0 || waste > 100) {
      errors.push(`Row ${row}: waste % must be between 0 and 100.`);
    }

    if (
      line.productivity !== null &&
      line.productivity !== undefined &&
      line.productivity <= 0
    ) {
      errors.push(`Row ${row}: productivity must be greater than 0 when set.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function resolveBoqRates(item) {
  return {
    material_rate:
      item.material_rate_override ?? item.material_rate,
    labor_rate: item.labor_rate_override ?? item.labor_rate,
    equipment_rate:
      item.equipment_rate_override ?? item.equipment_rate,
    subcontract_rate:
      item.subcontract_rate_override ?? item.subcontract_rate,
    other_cost_rate:
      item.other_cost_rate_override ?? item.other_cost_rate ?? 0,
  };
}

export function computeResourceTotals(items) {
  let material = 0;
  let labor = 0;
  let equipment = 0;
  let subcontract = 0;
  let grand = 0;

  for (const item of items) {
    const qty = item.quantity;
    material += qty * item.material_rate;
    labor += qty * item.labor_rate;
    equipment += qty * item.equipment_rate;
    subcontract += qty * item.subcontract_rate;
    grand += item.total_amount;
  }

  return {
    material: roundCurrency(material),
    labor: roundCurrency(labor),
    equipment: roundCurrency(equipment),
    subcontract: roundCurrency(subcontract),
    grand_total: roundCurrency(grand),
  };
}

export function sumBoqDirectCost(items) {
  return roundCurrency(items.reduce((sum, item) => sum + item.total_amount, 0));
}

export function buildWbsRollup(wbsNodes, items) {
  const directByWbs = new Map();

  for (const item of items) {
    directByWbs.set(
      item.wbs_id,
      roundCurrency((directByWbs.get(item.wbs_id) ?? 0) + item.total_amount)
    );
  }

  const nodeMap = new Map();

  for (const node of wbsNodes) {
    nodeMap.set(node.id, {
      ...node,
      direct_total: directByWbs.get(node.id) ?? 0,
      combined_total: 0,
      children: [],
    });
  }

  const roots = [];

  for (const node of nodeMap.values()) {
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  }

  function computeCombined(node) {
    const childTotal = node.children.reduce(
      (sum, child) => sum + computeCombined(child),
      0
    );
    node.combined_total = roundCurrency(node.direct_total + childTotal);
    node.children.sort((a, b) => a.sort_order - b.sort_order);
    return node.combined_total;
  }

  roots.sort((a, b) => a.sort_order - b.sort_order);
  for (const root of roots) {
    computeCombined(root);
  }

  return roots;
}

export function buildDisciplineBreakdown(wbsRollup, grandTotal) {
  return wbsRollup
    .map((node) => ({
      id: node.id,
      code: node.wbs_code,
      name: node.description,
      amount: node.combined_total,
      percent: grandTotal > 0 ? roundCurrency((node.combined_total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function buildBidSummary(projectMeta, breakdown) {
  return {
    project_name: projectMeta.project_name,
    project_code: projectMeta.project_code,
    client_name: projectMeta.client_name,
    location: projectMeta.location,
    estimate_date: projectMeta.estimate_date,
    prepared_by: projectMeta.prepared_by,
    total_direct_cost: breakdown.direct_cost,
    indirect_cost: breakdown.indirect_cost,
    markup: breakdown.markup,
    vat: breakdown.vat,
    grand_total: breakdown.grand_total,
    cost_per_square_meter: null,
  };
}

export function amountsMatch(a, b, tolerance = AMOUNT_TOLERANCE) {
  return Math.abs(a - b) <= tolerance;
}

export function validateProjectSnapshot(snapshot) {
  const failures = [];
  const { items, wbsNodes, percentages, breakdown, resourceTotals, bidSummary } =
    snapshot;

  const boqTotal = sumBoqDirectCost(items);

  if (!amountsMatch(boqTotal, breakdown.direct_cost)) {
    failures.push({
      check: 'direct_cost',
      expected: boqTotal,
      actual: breakdown.direct_cost,
      message: 'BOQ sum does not match direct cost.',
    });
  }

  if (!amountsMatch(boqTotal, resourceTotals.grand_total)) {
    failures.push({
      check: 'resource_grand_total',
      expected: boqTotal,
      actual: resourceTotals.grand_total,
      message: 'BOQ sum does not match resource grand total.',
    });
  }

  if (!amountsMatch(breakdown.grand_total, bidSummary.grand_total)) {
    failures.push({
      check: 'bid_grand_total',
      expected: breakdown.grand_total,
      actual: bidSummary.grand_total,
      message: 'Estimate grand total does not match bid summary.',
    });
  }

  const recomputed = calculateEstimateBreakdown(boqTotal, percentages);
  for (const key of [
    'direct_cost',
    'indirect_cost',
    'contingency',
    'markup',
    'vat',
    'grand_total',
  ]) {
    if (!amountsMatch(recomputed[key], breakdown[key])) {
      failures.push({
        check: key,
        expected: recomputed[key],
        actual: breakdown[key],
        message: `Estimate ${key} mismatch.`,
      });
    }
  }

  for (const item of items) {
    const rates = resolveBoqRates(item);
    const expectedRate = calculateTotalRate(rates);
    const expectedAmount = calculateTotalAmount(item.quantity, expectedRate);

    if (!amountsMatch(expectedRate, item.total_rate)) {
      failures.push({
        check: `boq_rate_${item.item_code}`,
        expected: expectedRate,
        actual: item.total_rate,
        message: `${item.item_code} total_rate mismatch.`,
      });
    }

    if (!amountsMatch(expectedAmount, item.total_amount)) {
      failures.push({
        check: `boq_amount_${item.item_code}`,
        expected: expectedAmount,
        actual: item.total_amount,
        message: `${item.item_code} total_amount mismatch.`,
      });
    }

    if (item.rate_analysis_lines?.length) {
      const categoryTotals = computeCategoryTotals(item.rate_analysis_lines);
      const checks = [
        ['material', item.material_rate],
        ['labor', item.labor_rate],
        ['equipment', item.equipment_rate],
        ['subcontract', item.subcontract_rate],
      ];

      for (const [category, rate] of checks) {
        if (!amountsMatch(categoryTotals[category], rate)) {
          failures.push({
            check: `rate_analysis_${item.item_code}_${category}`,
            expected: categoryTotals[category],
            actual: rate,
            message: `${item.item_code} ${category} rate does not match analysis lines.`,
          });
        }
      }
    }
  }

  const rollup = buildWbsRollup(wbsNodes, items);
  const wbsDirectSum = items.reduce((sum, item) => sum + item.total_amount, 0);
  const rollupRootTotal = rollup.reduce((sum, node) => sum + node.combined_total, 0);

  if (!amountsMatch(wbsDirectSum, rollupRootTotal)) {
    failures.push({
      check: 'wbs_rollup_total',
      expected: wbsDirectSum,
      actual: rollupRootTotal,
      message: 'WBS rollup root total does not match BOQ sum.',
    });
  }

  for (const node of wbsNodes) {
    const rollupNode = findRollupNode(rollup, node.id);
    const expectedDirect = roundCurrency(
      items
        .filter((item) => item.wbs_id === node.id)
        .reduce((sum, item) => sum + item.total_amount, 0)
    );

    if (rollupNode && !amountsMatch(rollupNode.direct_total, expectedDirect)) {
      failures.push({
        check: `wbs_direct_${node.wbs_code}`,
        expected: expectedDirect,
        actual: rollupNode.direct_total,
        message: `WBS ${node.wbs_code} direct total mismatch.`,
      });
    }
  }

  const discipline = buildDisciplineBreakdown(rollup, breakdown.grand_total);
  const disciplineSum = roundCurrency(
    discipline.reduce((sum, row) => sum + row.amount, 0)
  );

  if (!amountsMatch(disciplineSum, rollupRootTotal)) {
    failures.push({
      check: 'discipline_breakdown_total',
      expected: rollupRootTotal,
      actual: disciplineSum,
      message: 'Discipline breakdown does not match WBS rollup.',
    });
  }

  return failures;
}

function findRollupNode(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const child = findRollupNode(node.children, id);
    if (child) {
      return child;
    }
  }
  return null;
}
