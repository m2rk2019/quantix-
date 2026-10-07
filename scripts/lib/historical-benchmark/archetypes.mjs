/**
 * Sprint 14 — Five historical benchmark project archetypes.
 */

export const ARCHETYPES = [
  {
    key: 'office',
    id: 'b2011111-1111-4111-a111-111111111101',
    code: 'QTX-BENCH-OFF-001',
    name: 'Historical Office Building — Makati',
    client: 'Ayala Land Benchmark Archive',
    location: 'Makati City',
    project_type: 'commercial',
    item_count: 35,
    variance_seed: 14001,
  },
  {
    key: 'condominium',
    id: 'b3011111-1111-4111-a111-111111111101',
    code: 'QTX-BENCH-CON-001',
    name: 'Historical Condominium — BGC',
    client: 'Megawide Residential Benchmark',
    location: 'Taguig City',
    project_type: 'residential',
    item_count: 35,
    variance_seed: 14002,
  },
  {
    key: 'warehouse',
    id: 'b4011111-1111-4111-a111-111111111101',
    code: 'QTX-BENCH-WHS-001',
    name: 'Historical Warehouse — Laguna',
    client: 'Industrial Park Authority',
    location: 'Laguna',
    project_type: 'industrial',
    item_count: 35,
    variance_seed: 14003,
  },
  {
    key: 'commercial',
    id: 'b5011111-1111-4111-a111-111111111101',
    code: 'QTX-BENCH-COM-001',
    name: 'Historical Commercial Building — Cebu',
    client: 'SM Development Benchmark',
    location: 'Cebu City',
    project_type: 'commercial',
    item_count: 35,
    variance_seed: 14004,
  },
  {
    key: 'infrastructure',
    id: 'b6011111-1111-4111-a111-111111111101',
    code: 'QTX-BENCH-INF-001',
    name: 'Historical Infrastructure — Road Package',
    client: 'DPWH Benchmark Archive',
    location: 'Bulacan',
    project_type: 'infrastructure',
    item_count: 35,
    variance_seed: 14005,
  },
];

export const BENCHMARK_PERCENTAGES = {
  indirect_cost_percent: 10,
  contingency_percent: 5,
  markup_percent: 8,
  vat_percent: 12,
};

const WBS_BY_ARCHETYPE = {
  office: [
    { code: '1', description: 'Structural', children: ['Earthworks', 'Concrete', 'Steel'] },
    { code: '2', description: 'Architectural', children: ['Masonry', 'Finishes'] },
    { code: '3', description: 'MEPF', children: ['Plumbing', 'Electrical'] },
  ],
  condominium: [
    { code: '1', description: 'Structural', children: ['Foundation', 'Tower Concrete'] },
    { code: '2', description: 'Architectural', children: ['Partitions', 'Finishes'] },
    { code: '3', description: 'MEPF', children: ['Plumbing', 'HVAC'] },
  ],
  warehouse: [
    { code: '1', description: 'Civil', children: ['Earthworks', 'Pavement'] },
    { code: '2', description: 'Structural', children: ['Steel Frame', 'Roofing'] },
    { code: '3', description: 'MEPF', children: ['Electrical', 'Fire'] },
  ],
  commercial: [
    { code: '1', description: 'Structural', children: ['Concrete', 'Steel'] },
    { code: '2', description: 'Architectural', children: ['Curtain Wall', 'Interior'] },
    { code: '3', description: 'MEPF', children: ['Electrical', 'Mechanical'] },
  ],
  infrastructure: [
    { code: '1', description: 'Earthworks', children: ['Excavation', 'Embankment'] },
    { code: '2', description: 'Pavement', children: ['Sub-base', 'Asphalt'] },
    { code: '3', description: 'Drainage', children: ['RCBC', 'Manholes'] },
  ],
};

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function buildArchetypeSnapshot(archetype) {
  const rng = seededRandom(archetype.variance_seed);
  const wbsTree = WBS_BY_ARCHETYPE[archetype.key];
  const wbsNodes = [];
  let wbsSort = 0;

  for (const root of wbsTree) {
    const rootId = `${archetype.id.slice(0, 8)}-wbs-${root.code}`;
    wbsNodes.push({
      id: rootId,
      parent_id: null,
      wbs_code: root.code,
      description: root.description,
      level: 0,
      sort_order: wbsSort++,
    });
    for (const child of root.children) {
      wbsNodes.push({
        id: `${rootId}-${child.replace(/\s+/g, '').slice(0, 6)}`,
        parent_id: rootId,
        wbs_code: `${root.code}.${wbsNodes.filter((n) => n.parent_id === rootId).length + 1}`,
        description: child,
        level: 1,
        sort_order: wbsSort++,
      });
    }
  }

  const leafNodes = wbsNodes.filter((node) => node.level === 1);
  const items = [];
  const actuals = [];

  for (let index = 1; index <= archetype.item_count; index += 1) {
    const leaf = leafNodes[(index - 1) % leafNodes.length];
    const qty = Math.round((10 + rng() * 200) * 100) / 100;
    const matRate = Math.round((50 + rng() * 800) * 100) / 100;
    const labRate = Math.round((20 + rng() * 300) * 100) / 100;
    const eqRate = index % 3 === 0 ? Math.round(rng() * 150 * 100) / 100 : 0;
    const subRate = index % 7 === 0 ? Math.round(rng() * 400 * 100) / 100 : 0;
    const totalRate = Math.round((matRate + labRate + eqRate + subRate) * 100) / 100;
    const totalAmount = Math.round(qty * totalRate * 100) / 100;
    const itemCode = `${archetype.code.replace(/-/g, '').slice(-6)}-${String(index).padStart(3, '0')}`;

    items.push({
      id: `${archetype.id.slice(0, 8)}-boq-${String(index).padStart(3, '0')}`,
      wbs_id: leaf.id,
      item_code: itemCode,
      description: `${leaf.description} — benchmark item ${index}`,
      unit: index % 4 === 0 ? 'm2' : index % 3 === 0 ? 'm3' : 'lot',
      quantity: qty,
      material_rate: matRate,
      labor_rate: labRate,
      equipment_rate: eqRate,
      subcontract_rate: subRate,
      other_cost_rate: 0,
      total_rate: totalRate,
      total_amount: totalAmount,
    });

    const varianceFactor = 0.97 + rng() * 0.06;
    const actualQty = Math.round(qty * varianceFactor * 100) / 100;
    const actualRate = Math.round(totalRate * (0.98 + rng() * 0.04) * 100) / 100;
    const awarded = Math.round(actualQty * actualRate * 100) / 100;

    actuals.push({
      item_code: itemCode,
      description: items[items.length - 1].description,
      estimated_quantity: qty,
      actual_quantity: actualQty,
      estimated_unit_rate: totalRate,
      actual_unit_rate: actualRate,
      estimated_cost: totalAmount,
      actual_cost: awarded,
      awarded_cost: awarded,
    });
  }

  const directCost = items.reduce((sum, item) => sum + item.total_amount, 0);

  return {
    archetype,
    wbsNodes,
    items,
    actuals,
    directCost,
    percentages: BENCHMARK_PERCENTAGES,
  };
}

export function buildAllBenchmarkSnapshots() {
  return ARCHETYPES.map((archetype) => buildArchetypeSnapshot(archetype));
}
