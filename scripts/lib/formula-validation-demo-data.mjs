/**
 * Sprint 8 demo dataset: WBS, resource library, ~100 BOQ items with rate analysis.
 */

import {
  buildBidSummary,
  buildWbsRollup,
  calculateEstimateBreakdown,
  calculateTotalAmount,
  calculateTotalRate,
  computeCategoryTotals,
  computeLineAmount,
  computeResourceTotals,
  roundCurrency,
  sumBoqDirectCost,
} from './estimating-formulas.mjs';

export const DEMO_PROJECT_ID = 'f8a11111-1111-4111-a111-111111111101';
export const DEMO_PROJECT_CODE = 'QTX-FORMULA-VAL-001';

export const DEMO_PROJECT_META = {
  project_id: DEMO_PROJECT_ID,
  project_code: DEMO_PROJECT_CODE,
  project_name: 'Quantix Formula Validation Project',
  client_name: 'Megawide Construction Corporation',
  location: 'Quezon City',
  estimate_date: '2026-06-26',
  prepared_by: 'Quantix Validation Engine',
};

export const DEMO_PERCENTAGES = {
  indirect_cost_percent: 10,
  contingency_percent: 5,
  markup_percent: 8,
  vat_percent: 12,
};

const WBS_TREE = [
  {
    code: '1',
    description: 'Structural',
    children: [
      { code: '1.1', description: 'Earthworks' },
      { code: '1.2', description: 'Concrete Works' },
      { code: '1.3', description: 'Rebar Works' },
    ],
  },
  {
    code: '2',
    description: 'Architectural',
    children: [
      { code: '2.1', description: 'Masonry' },
      { code: '2.2', description: 'Plastering' },
      { code: '2.3', description: 'Painting' },
      { code: '2.4', description: 'Ceiling' },
      { code: '2.5', description: 'Flooring' },
    ],
  },
  {
    code: '3',
    description: 'MEPF',
    children: [
      { code: '3.1', description: 'Plumbing' },
      { code: '3.2', description: 'Electrical' },
      { code: '3.3', description: 'Fire Protection' },
    ],
  },
];

const BOQ_TEMPLATES = {
  Earthworks: [
    'Excavation for foundation (common soil)',
    'Backfilling and compaction',
    'Gravel bedding 150mm thick',
    'Hauling and disposal of excavated material',
    'Site grading and levelling',
    'Temporary shoring',
    'Dewatering allowance',
    'Rock excavation (minor)',
    'Embankment fill',
    'Soil stabilization',
  ],
  'Concrete Works': [
    'Portland cement concrete footing 3000 psi',
    'Reinforced concrete column',
    'Reinforced concrete beam',
    'Reinforced concrete slab on grade',
    'Reinforced concrete suspended slab',
    'Concrete stairs',
    'Concrete curb and gutter',
    'Concrete pavement 150mm',
    'Lean concrete blinding',
    'Concrete core filling',
    'Concrete pump allowance',
  ],
  'Rebar Works': [
    'Supply and install rebar #16',
    'Supply and install rebar #20',
    'Supply and install rebar #25',
    'Cutting and bending rebar',
    'Welded wire mesh 6x6-W1.4xW1.4',
    'Rebar chairs and spacers',
    'Epoxy coated rebar',
    'Rebar splicing couplers',
    'Stirrups and ties',
    'Rebar testing allowance',
  ],
  Masonry: [
    '150mm CHB wall',
    '100mm CHB wall',
    '4" concrete hollow block partition',
    'Brick veneer wall',
    'Glass block wall',
    'Masonry grout filling',
    'Wall chipping and preparation',
    'Masonry lintel',
    'Control joint sealant',
    'Masonry cleaning',
  ],
  Plastering: [
    'Cement plaster interior 12mm',
    'Cement plaster exterior 15mm',
    'Skim coat finish',
    'Plaster on CHB wall',
    'Plaster on concrete surface',
    'Corner bead supply and install',
    'Plaster repair and patching',
    'Acrylic plaster finish',
    'Waterproof plaster additive',
    'Plaster curing compound',
  ],
  Painting: [
    'Interior latex paint 2 coats',
    'Exterior elastomeric paint',
    'Epoxy floor paint',
    'Enamel paint on steel',
    'Primer coat masonry',
    'Wood stain and varnish',
    'Traffic marking paint',
    'Anti-mould paint bathroom',
    'Paint surface preparation',
    'Signage painting',
  ],
  Ceiling: [
    'Gypsum board ceiling 9mm',
    'Mineral fiber acoustic ceiling',
    'Metal furring channel',
    'Suspended ceiling T-bar system',
    'Ceiling insulation',
    'Access panel 600x600',
    'Cornice moulding',
    'Ceiling painting',
    'Moisture resistant gypsum board',
    'Linear LED cove detail',
  ],
  Flooring: [
    'Ceramic floor tile 600x600',
    'Vinyl plank flooring',
    'Granite floor tile',
    'Cementitious floor topping',
    'Epoxy floor coating',
    'Marble flooring',
    'Floor leveling compound',
    'Tile grout and adhesive',
    'Rubber flooring gym',
    'Polished concrete finish',
  ],
  Plumbing: [
    'PVC pipe 4" SDR series',
    'PVC pipe 2" water line',
    'Copper pipe 3/4" hot water',
    'Floor drain stainless 4"',
    'Water closet complete set',
    'Lavatory with faucet',
    'Shower set thermostatic',
    'Gate valve bronze 2"',
    'Water heater 50L',
    'Septic tank installation',
  ],
  Electrical: [
    'THHN wire 3.5mm2',
    'THHN wire 5.5mm2',
    'PVC conduit 25mm',
    'Panel board 42 circuits',
    'Circuit breaker 20A',
    'LED downlight 12W',
    'Convenience outlet duplex',
    'Grounding rod copper',
    'Cable tray 300mm',
    'Lightning protection system',
  ],
  'Fire Protection': [
    'Sprinkler head upright',
    'Fire hose cabinet',
    'Wet riser pipe 65mm',
    'Fire pump electric 750GPM',
    'Fire alarm smoke detector',
    'Fire alarm manual pull station',
    'Fire extinguisher 10lbs ABC',
    'Fire door 90min rated',
    'FM200 suppression heads',
    'Fire protection testing',
  ],
};

export const PHILIPPINE_RESOURCES = {
  suppliers: [
    { code: 'SUP-HOLCIM', name: 'Holcim Philippines' },
    { code: 'SUP-REPUBLIC', name: 'Republic Cement' },
    { code: 'SUP-MKP', name: 'MKP Construction Supply' },
    { code: 'SUP-STEELASIA', name: 'SteelAsia Manufacturing' },
    { code: 'SUP-BOY', name: 'Boysen Paints Philippines' },
    { code: 'SUP-PHILPIPE', name: 'Philippine Pipe Industries' },
  ],
  units: [
    { code: 'UOM-M3', symbol: 'm3', name: 'Cubic Meter' },
    { code: 'UOM-M2', symbol: 'm2', name: 'Square Meter' },
    { code: 'UOM-M', symbol: 'm', name: 'Linear Meter' },
    { code: 'UOM-KG', symbol: 'kg', name: 'Kilogram' },
    { code: 'UOM-BAG', symbol: 'bag', name: 'Bag' },
    { code: 'UOM-PC', symbol: 'pc', name: 'Piece' },
    { code: 'UOM-LOT', symbol: 'lot', name: 'Lump Sum' },
    { code: 'UOM-HR', symbol: 'hr', name: 'Hour' },
    { code: 'UOM-DAY', symbol: 'day', name: 'Day' },
  ],
  categories: [
    { code: 'CAT-CEMENT', name: 'Cement & Concrete', resource_type: 'material' },
    { code: 'CAT-STEEL', name: 'Steel & Rebar', resource_type: 'material' },
    { code: 'CAT-FINISH', name: 'Finishes', resource_type: 'material' },
    { code: 'CAT-MEP', name: 'MEP Materials', resource_type: 'material' },
    { code: 'CAT-SKILLED', name: 'Skilled Labor', resource_type: 'labor' },
    { code: 'CAT-SEMI', name: 'Semi-Skilled Labor', resource_type: 'labor' },
    { code: 'CAT-PLANT', name: 'Plant & Equipment', resource_type: 'equipment' },
    { code: 'CAT-SUB-MEP', name: 'MEP Subcontract', resource_type: 'subcontract' },
  ],
  materials: [
    { code: 'MAT-CEM-40', description: 'Portland Cement Type I 40kg bag', unit: 'bag', unit_cost: 285 },
    { code: 'MAT-SAND', description: 'Washed sand', unit: 'm3', unit_cost: 1450 },
    { code: 'MAT-GRVL', description: 'Gravel 3/4"', unit: 'm3', unit_cost: 1650 },
    { code: 'MAT-CHB-150', description: 'CHB 150mm', unit: 'pc', unit_cost: 42 },
    { code: 'MAT-REBAR16', description: 'Deformed bar #16', unit: 'kg', unit_cost: 68 },
    { code: 'MAT-GYPSUM', description: 'Gypsum board 9mm', unit: 'm2', unit_cost: 285 },
    { code: 'MAT-PAINT', description: 'Latex paint 20L pail', unit: 'lot', unit_cost: 4200 },
    { code: 'MAT-PVC-4', description: 'PVC pipe 4" SDR', unit: 'm', unit_cost: 520 },
    { code: 'MAT-THHN-35', description: 'THHN wire 3.5mm2', unit: 'm', unit_cost: 48 },
    { code: 'MAT-SPRINKLER', description: 'Sprinkler head upright', unit: 'pc', unit_cost: 850 },
  ],
  labor: [
    { code: 'LAB-MASON', description: 'Mason', unit: 'day', unit_cost: 850 },
    { code: 'LAB-CARP', description: 'Carpenter', unit: 'day', unit_cost: 900 },
    { code: 'LAB-STEEL', description: 'Steel fixer', unit: 'day', unit_cost: 950 },
    { code: 'LAB-ELEC', description: 'Electrician', unit: 'day', unit_cost: 1100 },
    { code: 'LAB-PLUMB', description: 'Plumber', unit: 'day', unit_cost: 1050 },
    { code: 'LAB-PAINT', description: 'Painter', unit: 'day', unit_cost: 800 },
    { code: 'LAB-LABORER', description: 'Laborer/helper', unit: 'day', unit_cost: 650 },
  ],
  equipment: [
    { code: 'EQ-MIXER', description: 'Concrete mixer 1 bagger', unit: 'day', unit_cost: 1800 },
    { code: 'EQ-BACKHOE', description: 'Backhoe loader', unit: 'day', unit_cost: 12500 },
    { code: 'EQ-CRANE', description: 'Tower crane', unit: 'day', unit_cost: 45000 },
    { code: 'EQ-SCAFF', description: 'Scaffolding rental', unit: 'day', unit_cost: 2200 },
    { code: 'EQ-PUMP', description: 'Concrete pump boom', unit: 'day', unit_cost: 28000 },
  ],
  subcontract: [
    { code: 'SUB-ELEC', description: 'Electrical subcontract package', unit: 'lot', unit_cost: 185000 },
    { code: 'SUB-PLUMB', description: 'Plumbing subcontract package', unit: 'lot', unit_cost: 165000 },
    { code: 'SUB-FIRE', description: 'Fire protection specialist', unit: 'lot', unit_cost: 220000 },
    { code: 'SUB-WATERPROOF', description: 'Waterproofing specialist', unit: 'lot', unit_cost: 95000 },
  ],
};

function wbsUuid(index) {
  return `f8b11111-1111-4111-a111-${String(index).padStart(12, '0')}`;
}

function boqUuid(index) {
  return `f8c11111-1111-4111-a111-${String(index).padStart(12, '0')}`;
}

function libraryUuid(prefix, index) {
  return `f8d${prefix}-1111-4111-a111-${String(index).padStart(12, '0')}`;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function buildWbsNodes() {
  const nodes = [];
  let index = 1;
  let sortOrder = 0;

  for (const group of WBS_TREE) {
    const groupId = wbsUuid(index);
    index += 1;
    sortOrder += 1;

    nodes.push({
      id: groupId,
      parent_id: null,
      wbs_code: group.code,
      description: group.description,
      level: 1,
      sort_order: sortOrder,
    });

    for (const child of group.children) {
      const childId = wbsUuid(index);
      index += 1;
      sortOrder += 1;

      nodes.push({
        id: childId,
        parent_id: groupId,
        wbs_code: child.code,
        description: child.description,
        level: 2,
        sort_order: sortOrder,
      });
    }
  }

  return nodes;
}

export function buildResourceLibrary(ownerId = '00000000-0000-4000-8000-000000000001') {
  const library = {
    suppliers: PHILIPPINE_RESOURCES.suppliers.map((row, index) => ({
      id: libraryUuid('e1', index + 1),
      ...row,
      created_by: ownerId,
    })),
    units: PHILIPPINE_RESOURCES.units.map((row, index) => ({
      id: libraryUuid('e2', index + 1),
      ...row,
      created_by: ownerId,
    })),
    categories: PHILIPPINE_RESOURCES.categories.map((row, index) => ({
      id: libraryUuid('e3', index + 1),
      ...row,
      created_by: ownerId,
    })),
    items: [],
  };

  const resourceGroups = [
    ['material', PHILIPPINE_RESOURCES.materials],
    ['labor', PHILIPPINE_RESOURCES.labor],
    ['equipment', PHILIPPINE_RESOURCES.equipment],
    ['subcontract', PHILIPPINE_RESOURCES.subcontract],
  ];

  let itemIndex = 1;
  for (const [category, rows] of resourceGroups) {
    for (const row of rows) {
      library.items.push({
        id: libraryUuid('e4', itemIndex),
        code: row.code,
        description: row.description,
        unit: row.unit,
        unit_cost: row.unit_cost,
        category,
        is_active: true,
        created_by: ownerId,
      });
      itemIndex += 1;
    }
  }

  return library;
}

function pickUnit(description) {
  if (description.includes('pipe') || description.includes('wire')) {
    return 'm';
  }
  if (description.includes('tile') || description.includes('plaster') || description.includes('paint')) {
    return 'm2';
  }
  if (description.includes('rebar') || description.includes('Deformed')) {
    return 'kg';
  }
  if (description.includes('lot') || description.includes('allowance') || description.includes('package')) {
    return 'lot';
  }
  if (description.includes('Excavation') || description.includes('concrete') || description.includes('sand')) {
    return 'm3';
  }
  return 'm2';
}

function buildRateAnalysisLines(itemIndex, categoryName, rng) {
  const lines = [];
  const material = PHILIPPINE_RESOURCES.materials[
    itemIndex % PHILIPPINE_RESOURCES.materials.length
  ];
  const labor = PHILIPPINE_RESOURCES.labor[itemIndex % PHILIPPINE_RESOURCES.labor.length];
  const equipment = PHILIPPINE_RESOURCES.equipment[
    itemIndex % PHILIPPINE_RESOURCES.equipment.length
  ];

  const materialConsumption = roundCurrency(0.4 + rng() * 1.6);
  const laborConsumption = roundCurrency(0.05 + rng() * 0.25);
  const equipmentConsumption = roundCurrency(0.01 + rng() * 0.08);

  lines.push({
    category: 'material',
    resource_name: material.description,
    library_item_id: libraryUuid('e4', (itemIndex % 10) + 1),
    unit: material.unit,
    consumption: materialConsumption,
    unit_cost: material.unit_cost,
    waste_percent: itemIndex % 5 === 0 ? 5 : 0,
    productivity: null,
    amount: computeLineAmount(
      materialConsumption,
      material.unit_cost,
      itemIndex % 5 === 0 ? 5 : 0
    ),
  });

  lines.push({
    category: 'labor',
    resource_name: labor.description,
    library_item_id: libraryUuid('e4', 10 + (itemIndex % 7) + 1),
    unit: labor.unit,
    consumption: laborConsumption,
    unit_cost: labor.unit_cost,
    waste_percent: 0,
    productivity: categoryName === 'Earthworks' ? 1.2 : null,
    amount: computeLineAmount(
      laborConsumption,
      labor.unit_cost,
      0,
      categoryName === 'Earthworks' ? 1.2 : null
    ),
  });

  if (itemIndex % 3 === 0) {
    lines.push({
      category: 'equipment',
      resource_name: equipment.description,
      library_item_id: libraryUuid('e4', 17 + (itemIndex % 5) + 1),
      unit: equipment.unit,
      consumption: equipmentConsumption,
      unit_cost: equipment.unit_cost,
      waste_percent: 0,
      productivity: null,
      amount: computeLineAmount(equipmentConsumption, equipment.unit_cost),
    });
  }

  if (itemIndex % 7 === 0) {
    const sub = PHILIPPINE_RESOURCES.subcontract[
      itemIndex % PHILIPPINE_RESOURCES.subcontract.length
    ];
    const subConsumption = 0.01 + rng() * 0.08;
    lines.push({
      category: 'subcontract',
      resource_name: sub.description,
      library_item_id: libraryUuid('e4', 22 + (itemIndex % 4) + 1),
      unit: sub.unit,
      consumption: subConsumption,
      unit_cost: sub.unit_cost,
      waste_percent: 0,
      productivity: null,
      amount: computeLineAmount(subConsumption, sub.unit_cost),
    });
  }

  return lines;
}

export function buildBoqItems(wbsNodes, targetCount = 100, seed = 88001) {
  const rng = seededRandom(seed);
  const leafNodes = wbsNodes.filter((node) => node.level === 2);
  const items = [];
  let boqIndex = 1;

  for (const leaf of leafNodes) {
    const templates = BOQ_TEMPLATES[leaf.description] ?? [`${leaf.description} work item`];
    const perLeaf = leaf.description === 'Concrete Works' ? 10 : 9;

    for (let index = 0; index < perLeaf && items.length < targetCount; index += 1) {
      const description = templates[index % templates.length];
      const quantity = roundCurrency(8 + rng() * 420 + (index % 3 === 0 ? 0.375 : 0));
      const unit = pickUnit(description);
      const rateLines = buildRateAnalysisLines(boqIndex, leaf.description, rng);
      const categoryTotals = computeCategoryTotals(rateLines);

      const rates = {
        material_rate: categoryTotals.material,
        labor_rate: categoryTotals.labor,
        equipment_rate: categoryTotals.equipment,
        subcontract_rate: categoryTotals.subcontract,
        other_cost_rate: boqIndex % 11 === 0 ? roundCurrency(15 + rng() * 40) : 0,
      };

      const total_rate = calculateTotalRate(rates);
      const total_amount = calculateTotalAmount(quantity, total_rate);

      items.push({
        id: boqUuid(boqIndex),
        project_id: DEMO_PROJECT_ID,
        wbs_id: leaf.id,
        wbs_code: leaf.wbs_code,
        item_code: `BOQ-${String(boqIndex).padStart(3, '0')}`,
        description,
        unit,
        quantity,
        ...rates,
        total_rate,
        total_amount,
        rate_analysis_lines: rateLines,
      });

      boqIndex += 1;
    }
  }

  return items;
}

export function buildPerformanceItems(count, seed = 99001) {
  const rng = seededRandom(seed);
  const items = [];

  for (let index = 1; index <= count; index += 1) {
    const rates = {
      material_rate: roundCurrency(100 + rng() * 500),
      labor_rate: roundCurrency(50 + rng() * 300),
      equipment_rate: roundCurrency(rng() * 120),
      subcontract_rate: roundCurrency(rng() * 200),
      other_cost_rate: roundCurrency(rng() * 25),
    };
    const quantity = roundCurrency(1 + rng() * 250);
    const total_rate = calculateTotalRate(rates);
    const total_amount = calculateTotalAmount(quantity, total_rate);

    items.push({
      id: boqUuid(index),
      wbs_id: wbsUuid(2),
      item_code: `PERF-${String(index).padStart(5, '0')}`,
      quantity,
      ...rates,
      total_rate,
      total_amount,
    });
  }

  return items;
}

export function buildFullDemoSnapshot(targetBoqCount = 100) {
  const wbsNodes = buildWbsNodes();
  const resourceLibrary = buildResourceLibrary();
  const items = buildBoqItems(wbsNodes, targetBoqCount);
  const directCost = sumBoqDirectCost(items);
  const breakdown = calculateEstimateBreakdown(directCost, DEMO_PERCENTAGES);
  const resourceTotals = computeResourceTotals(items);
  const wbsRollup = buildWbsRollup(wbsNodes, items);
  const bidSummary = buildBidSummary(DEMO_PROJECT_META, breakdown);

  return {
    meta: DEMO_PROJECT_META,
    percentages: DEMO_PERCENTAGES,
    wbsNodes,
    resourceLibrary,
    items,
    breakdown,
    resourceTotals,
    wbsRollup,
    bidSummary,
  };
}

export function getExpectedTotals() {
  const snapshot = buildFullDemoSnapshot(100);
  return {
    boq_item_count: snapshot.items.length,
    direct_cost: snapshot.breakdown.direct_cost,
    indirect_cost: snapshot.breakdown.indirect_cost,
    contingency: snapshot.breakdown.contingency,
    markup: snapshot.breakdown.markup,
    vat: snapshot.breakdown.vat,
    grand_total: snapshot.breakdown.grand_total,
    resource_totals: snapshot.resourceTotals,
    bid_grand_total: snapshot.bidSummary.grand_total,
  };
}
