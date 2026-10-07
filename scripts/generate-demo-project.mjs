/**
 * Generates Quantix V1 demo project seed SQL and Excel import sample.
 * Run: npm run demo:generate
 *
 * Outputs:
 *   supabase/seed-demo-office-building.sql
 *   samples/Demo_Office_Building_BOQ_Import.xlsx
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ExcelJS from 'exceljs';

const ROOT = resolve(import.meta.dirname, '..');
const SQL_PATH = resolve(ROOT, 'supabase/seed-demo-office-building.sql');
const XLSX_PATH = resolve(
  ROOT,
  'samples/Demo_Office_Building_BOQ_Import.xlsx'
);

const PROJECT_ID = 'a1111111-1111-4111-a111-111111111101';
const PROJECT_CODE = 'QTX-2026-900001';

const TARGET_WBS = 150;
const TARGET_BOQ = 2000;

const PERCENTAGES = {
  indirect_cost_percent: 8,
  contingency_percent: 5,
  markup_percent: 10,
  vat_percent: 20,
};

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

function seededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function wbsUuid(index) {
  return `b1111111-1111-4111-a111-${String(index).padStart(12, '0')}`;
}

function boqUuid(index) {
  return `c1111111-1111-4111-a111-${String(index).padStart(12, '0')}`;
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const DIVISIONS = [
  {
    code: '1.1',
    description: 'Preliminaries & General Requirements',
    packages: [
      'Site establishment & compound',
      'Project management & supervision',
      'Health, safety & environmental compliance',
      'Temporary services & hoarding',
      'Surveying, setting out & as-built records',
      'Testing, commissioning coordination',
      'Insurance, bonds & statutory fees',
      'Cleaning & waste management',
      'Traffic management plan',
      'Site security & access control',
    ],
  },
  {
    code: '1.2',
    description: 'Site Works & Earthworks',
    packages: [
      'Site clearance & strip topsoil',
      'Bulk excavation to reduced level',
      'Backfill & compaction',
      'Surface water drainage below slab',
      'Temporary dewatering',
      'Geotextile & separation layers',
      'Hardstanding & laydown areas',
      'Erosion & sediment control',
      'Utility diversions allowance',
      'As-built survey of earthworks',
    ],
  },
  {
    code: '1.3',
    description: 'Substructure & Foundations',
    packages: [
      'Piling mat & working platform',
      'Bored cast-in-place piles',
      'Pile caps & ground beams',
      'Reinforced concrete raft slab',
      'Basement retaining walls',
      'Waterproofing to basement',
      'Substructure blockwork',
      'Subsoil drainage & radon barrier',
      'Substructure concrete works',
      'Substructure reinforcement',
    ],
  },
  {
    code: '1.4',
    description: 'Superstructure — Frame & Slabs',
    packages: [
      'Ground floor structural slab',
      'Reinforced concrete columns',
      'Post-tensioned floor slabs L1–L4',
      'Level 5 structural slab & plant deck',
      'Structural steel stair cores',
      'Metal decking & shear connectors',
      'Concrete pumping & placement',
      'Formwork & falsework',
      'Curing & protection',
      'Structural fire protection',
    ],
  },
  {
    code: '1.5',
    description: 'Building Envelope',
    packages: [
      'Curtain wall glazing system',
      'Aluminium window units',
      'Entrance revolving doors',
      'Built-up roofing system',
      'Roof insulation & fall protection',
      'Parapet & coping details',
      'External cladding panels',
      'Air barrier & cavity closers',
      'Sealants & gaskets',
      'External louvres & brise soleil',
    ],
  },
  {
    code: '1.6',
    description: 'Architectural Finishes — Typical Floors',
    packages: [
      'Raised access flooring L1–L4',
      'Carpet tiles to open plan',
      'Suspended ceilings — metal tile',
      'Partition walls — demountable',
      'Glazed office fronts',
      'Internal fire doors & ironmongery',
      'Wall finishes — paint & vinyl',
      'Skirting & trunking details',
      'Reception & lift lobby finishes',
      'Wayfinding & signage allowance',
    ],
  },
  {
    code: '1.7',
    description: 'Level 5 & Roof Finishes',
    packages: [
      'Executive level raised flooring',
      'Feature ceiling — L5 boardroom',
      'Acoustic wall panels L5',
      'Roof terrace paving',
      'Roof guardrails & safety',
      'Plant room non-slip flooring',
      'L5 toilet & shower upgrades',
      'External terrace planters',
      'Roof access hatches',
      'Lightning protection',
    ],
  },
  {
    code: '1.8',
    description: 'Vertical Transportation',
    packages: [
      'Passenger lifts — 3 nr high-speed',
      'Service/firefighting lift',
      'Lift shaft blockwork & lintels',
      'Lift pit works',
      'Lift guide rail brackets',
      'Lift car finishes',
      'Lift commissioning',
      'Escalator allowance — lobby',
      'Disabled lift access compliance',
      'Lift maintenance access',
    ],
  },
  {
    code: '1.9',
    description: 'Mechanical Services (HVAC & Plumbing)',
    packages: [
      'Air handling units — roof plant',
      'VRF cassettes to open plan',
      'Ductwork & insulation',
      'Chilled water piping',
      'BMS controls & sensors',
      'Toilet ventilation',
      'Cold water distribution',
      'Soil & waste drainage',
      'Rainwater downpipes',
      'Commissioning & TAB',
    ],
  },
  {
    code: '1.10',
    description: 'Electrical & ELV Services',
    packages: [
      'Main switchboard & sub-mains',
      'Small power & lighting L1–L5',
      'Emergency lighting & central test',
      'Structured cabling — Cat6A',
      'Wi-Fi & AV infrastructure',
      'Access control & card readers',
      'CCTV & intruder detection',
      'Lightning & earthing',
      'Solar PV readiness allowance',
      'Electrical commissioning',
    ],
  },
  {
    code: '1.11',
    description: 'Fire Protection & Security',
    packages: [
      'Sprinkler system — office areas',
      'Dry risers & hose reels',
      'Fire alarm & detection',
      'Smoke ventilation to stairs',
      'Fire stopping & penetration seals',
      'Intumescent coatings',
      'Security turnstiles',
      'Reception security desk',
      'PA/VA system',
      'Fire strategy compliance',
    ],
  },
  {
    code: '1.12',
    description: 'External Works & Landscaping',
    packages: [
      'Car park asphalt & line marking',
      'Pedestrian paving to entrance',
      'Boundary fencing & gates',
      'Soft landscaping & planting',
      'External lighting columns',
      'Cycle storage & showers',
      'SUDS attenuation basin',
      'Street furniture',
      'External signage & branding',
      'Landscaping establishment',
    ],
  },
];

const ITEM_TEMPLATES = [
  { desc: 'Supply and install {scope}', unit: 'm²', qty: [18, 420], mat: [18, 95], lab: [12, 48], eq: [1, 12], sub: [0, 22], oth: [0.5, 6] },
  { desc: 'Supply and fix {scope} including fixings', unit: 'm²', qty: [12, 380], mat: [14, 72], lab: [16, 58], eq: [1.5, 10], sub: [0, 15], oth: [0.5, 5] },
  { desc: 'Prepare and pour {scope}', unit: 'm³', qty: [6, 95], mat: [78, 165], lab: [38, 88], eq: [8, 32], sub: [0, 12], oth: [2, 8] },
  { desc: 'Supply and erect reinforcement to {scope}', unit: 'kg', qty: [350, 12000], mat: [0.75, 1.85], lab: [0.28, 0.85], eq: [0.04, 0.18], sub: [0, 0.12], oth: [0.02, 0.06] },
  { desc: 'Allowance for {scope} — lump sum', unit: 'lot', qty: [1, 1], mat: [2500, 42000], lab: [1800, 28000], eq: [400, 6500], sub: [1200, 38000], oth: [150, 2500] },
  { desc: 'Supply and commission {scope}', unit: 'nr', qty: [1, 12], mat: [280, 4500], lab: [95, 1200], eq: [25, 280], sub: [0, 1800], oth: [12, 180] },
  { desc: 'Testing and inspection of {scope}', unit: 'lot', qty: [1, 1], mat: [40, 450], lab: [420, 2800], eq: [80, 650], sub: [0, 1200], oth: [50, 350] },
  { desc: 'Temporary works for {scope}', unit: 'm²', qty: [20, 280], mat: [5, 28], lab: [8, 32], eq: [3, 18], sub: [0, 12], oth: [1, 8] },
  { desc: 'Supply and install insulation to {scope}', unit: 'm²', qty: [25, 520], mat: [12, 48], lab: [8, 28], eq: [0.5, 5], sub: [0, 8], oth: [0.5, 4] },
  { desc: 'Allowance for coordination of {scope}', unit: 'lot', qty: [1, 1], mat: [0, 220], lab: [650, 4200], eq: [0, 180], sub: [0, 850], oth: [35, 280] },
  { desc: 'Supply and lay screed to {scope}', unit: 'm²', qty: [18, 420], mat: [9, 24], lab: [10, 28], eq: [2, 9], sub: [0, 5], oth: [0.5, 4] },
  { desc: 'Demolition and disposal for {scope}', unit: 'm³', qty: [4, 65], mat: [0, 8], lab: [28, 68], eq: [12, 42], sub: [0, 22], oth: [3, 12] },
  { desc: 'Supply and install ductwork serving {scope}', unit: 'm', qty: [12, 180], mat: [22, 78], lab: [16, 52], eq: [3, 14], sub: [0, 18], oth: [1, 6] },
  { desc: 'Cable containment and wiring for {scope}', unit: 'm', qty: [25, 320], mat: [6, 32], lab: [9, 38], eq: [1.5, 8], sub: [0, 12], oth: [0.5, 5] },
];

function pickRange(rand, range) {
  const [min, max] = range;
  return roundCurrency(min + rand() * (max - min));
}

function buildWbsNodes() {
  const nodes = [];
  let index = 1;

  nodes.push({
    id: wbsUuid(index),
    index,
    parentId: null,
    level: 1,
    code: '1.0',
    description: 'Riverside Commerce Centre — 5-Storey Office Building',
    sortOrder: 0,
  });
  index += 1;

  let sort = 0;
  for (const division of DIVISIONS) {
    const divisionId = wbsUuid(index);
    nodes.push({
      id: divisionId,
      index,
      parentId: nodes[0].id,
      level: 2,
      code: division.code,
      description: division.description,
      sortOrder: sort,
    });
    index += 1;
    sort += 1;

    let pkgSort = 0;
    for (const pkg of division.packages) {
      const pkgId = wbsUuid(index);
      nodes.push({
        id: pkgId,
        index,
        parentId: divisionId,
        level: 3,
        code: `${division.code}.${pkgSort + 1}`,
        description: pkg,
        sortOrder: pkgSort,
        divisionCode: division.code,
        scope: pkg,
      });
      index += 1;
      pkgSort += 1;
    }
  }

  const baseCount = nodes.length;
  while (nodes.length < TARGET_WBS) {
    const parents = nodes.filter((node) => node.level === 3);
    const parent = parents[(nodes.length - baseCount) % parents.length];
    const childIndex = nodes.filter((node) => node.parentId === parent.id).length;
    const detailCode = `${parent.code}.${childIndex + 1}`;

    nodes.push({
      id: wbsUuid(index),
      index,
      parentId: parent.id,
      level: 4,
      code: detailCode,
      description: `${parent.description} — detailed scope package ${childIndex + 1}`,
      sortOrder: childIndex,
      divisionCode: parent.divisionCode,
      scope: parent.scope ?? parent.description,
    });
    index += 1;
  }

  return nodes.slice(0, TARGET_WBS);
}

function buildBoqItems(wbsNodes, rand) {
  const items = [];
  const counts = new Map(wbsNodes.map((node) => [node.id, 0]));
  const basePerNode = Math.floor(TARGET_BOQ / wbsNodes.length);
  let remainder = TARGET_BOQ - basePerNode * wbsNodes.length;

  for (const node of wbsNodes) {
    const extra = remainder > 0 ? 1 : 0;
    if (remainder > 0) {
      remainder -= 1;
    }
    counts.set(node.id, basePerNode + extra);
  }

  let boqIndex = 1;
  for (const node of wbsNodes) {
    const count = counts.get(node.id) ?? 1;
    const scope = node.scope ?? node.description;

    for (let line = 0; line < count; line += 1) {
      const template = ITEM_TEMPLATES[(boqIndex + line) % ITEM_TEMPLATES.length];
      const quantity = pickRange(rand, template.qty);
      const rates = {
        material_rate: pickRange(rand, template.mat),
        labor_rate: pickRange(rand, template.lab),
        equipment_rate: pickRange(rand, template.eq),
        subcontract_rate: pickRange(rand, template.sub),
        other_cost_rate: pickRange(rand, template.oth),
      };
      const total_rate = calculateTotalRate(rates);
      const total_amount = calculateTotalAmount(quantity, total_rate);
      const suffix =
        count > 1 ? ` — line ${line + 1}` : '';
      const description = template.desc.replace('{scope}', scope) + suffix;

      items.push({
        id: boqUuid(boqIndex),
        wbsId: node.id,
        wbsCode: node.code,
        item_code: `DEMO-${String(boqIndex).padStart(5, '0')}`,
        description,
        unit: template.unit,
        quantity,
        ...rates,
        total_rate,
        total_amount,
      });
      boqIndex += 1;
    }
  }

  return items.slice(0, TARGET_BOQ);
}

function buildSql(wbsNodes, boqItems, breakdown) {
  const lines = [];

  lines.push(`-- Quantix V1 Demo Project: 5-Storey Office Building`);
  lines.push(`-- Generated by scripts/generate-demo-project.mjs`);
  lines.push(`-- WBS nodes: ${wbsNodes.length} | BOQ items: ${boqItems.length}`);
  lines.push(`-- Apply after all migrations. Requires at least one active public.users row.`);
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');
  lines.push('DO $$');
  lines.push('DECLARE');
  lines.push('  v_owner UUID;');
  lines.push(`  v_project_id UUID := '${PROJECT_ID}';`);
  lines.push('BEGIN');
  lines.push('  SELECT id INTO v_owner');
  lines.push('  FROM public.users');
  lines.push("  WHERE role = 'super_admin' AND deleted_at IS NULL");
  lines.push('  ORDER BY created_at');
  lines.push('  LIMIT 1;');
  lines.push('');
  lines.push('  IF v_owner IS NULL THEN');
  lines.push('    SELECT id INTO v_owner');
  lines.push('    FROM public.users');
  lines.push('    WHERE deleted_at IS NULL');
  lines.push('    ORDER BY created_at');
  lines.push('    LIMIT 1;');
  lines.push('  END IF;');
  lines.push('');
  lines.push('  IF v_owner IS NULL THEN');
  lines.push("    RAISE EXCEPTION 'No active public.users row found. Create an auth user and profile first.';");
  lines.push('  END IF;');
  lines.push('');
  lines.push('  DELETE FROM public.boq_items WHERE project_id = v_project_id;');
  lines.push('  DELETE FROM public.wbs WHERE project_id = v_project_id;');
  lines.push('  DELETE FROM public.estimate_summary WHERE project_id = v_project_id;');
  lines.push('  DELETE FROM public.project_details WHERE project_id = v_project_id;');
  lines.push('  DELETE FROM public.audit_log WHERE project_id = v_project_id;');
  lines.push('  DELETE FROM public.projects WHERE id = v_project_id;');
  lines.push('');
  lines.push('  INSERT INTO public.projects (');
  lines.push('    id, project_code, project_name, client_name, location, status,');
  lines.push('    created_by, updated_by, created_at, updated_at');
  lines.push('  ) VALUES (');
  lines.push(`    v_project_id, ${sqlString(PROJECT_CODE)},`);
  lines.push(`    ${sqlString('Riverside Commerce Centre — 5-Storey Office Building')},`);
  lines.push(`    ${sqlString('Meridian Property Group')},`);
  lines.push(`    ${sqlString('14 Riverside Way, Manchester, UK')},`);
  lines.push("    'in_progress', v_owner, v_owner, now(), now()");
  lines.push('  );');
  lines.push('');
  lines.push('  INSERT INTO public.project_details (');
  lines.push('    project_id, description, owner, consultant, contractor,');
  lines.push('    project_type, contract_type, currency,');
  lines.push('    indirect_cost_percent, contingency_percent, markup_percent, vat_percent,');
  lines.push('    measurement_system, default_unit_system, rounding_rule,');
  lines.push('    created_by, updated_by');
  lines.push('  ) VALUES (');
  lines.push(`    v_project_id,`);
  lines.push(`    ${sqlString('New-build Grade A office accommodation comprising ground reception, four typical open-plan floors, Level 5 executive suite, roof plant, and basement car parking for 120 vehicles.')},`);
  lines.push(`    ${sqlString('Meridian Property Group')},`);
  lines.push(`    ${sqlString('Halewood Design Partners')},`);
  lines.push(`    ${sqlString('Northline Construction Ltd')},`);
  lines.push(`    'commercial', 'lump_sum', 'GBP',`);
  lines.push(`    ${PERCENTAGES.indirect_cost_percent}, ${PERCENTAGES.contingency_percent},`);
  lines.push(`    ${PERCENTAGES.markup_percent}, ${PERCENTAGES.vat_percent},`);
  lines.push("    'metric', 'metric_si', 'half_up', v_owner, v_owner");
  lines.push('  );');
  lines.push('');
  lines.push('  INSERT INTO public.estimate_summary (');
  lines.push('    project_id, direct_cost, indirect_cost, contingency, markup, vat, grand_total,');
  lines.push('    created_by, updated_by');
  lines.push('  ) VALUES (');
  lines.push(`    v_project_id, ${breakdown.direct_cost}, ${breakdown.indirect_cost},`);
  lines.push(`    ${breakdown.contingency}, ${breakdown.markup}, ${breakdown.vat},`);
  lines.push(`    ${breakdown.grand_total}, v_owner, v_owner`);
  lines.push('  );');
  lines.push('');
  lines.push('  INSERT INTO public.audit_log (project_id, entity_type, entity_id, action, actor_id, payload)');
  lines.push('  VALUES (');
  lines.push('    v_project_id, \'project\', v_project_id, \'project.created\', v_owner,');
  lines.push(`    jsonb_build_object('module', 'lifecycle', 'remarks', ${sqlString('Demo office building seed')}, 'project_code', ${sqlString(PROJECT_CODE)})`);
  lines.push('  );');
  lines.push('');

  lines.push('  INSERT INTO public.wbs (');
  lines.push('    id, project_id, parent_id, level, wbs_code, description, sort_order,');
  lines.push('    created_by, updated_by');
  lines.push('  ) VALUES');

  const wbsValues = wbsNodes.map((node, nodeIndex) => {
    const parent = node.parentId ? `uuid '${node.parentId}'` : 'NULL';
    const suffix = nodeIndex < wbsNodes.length - 1 ? ',' : ';';
    return `    ('${node.id}', v_project_id, ${parent}, ${node.level}, ${sqlString(node.code)}, ${sqlString(node.description)}, ${node.sortOrder}, v_owner, v_owner)${suffix}`;
  });
  lines.push(...wbsValues);
  lines.push('');

  const batchSize = 80;
  for (let offset = 0; offset < boqItems.length; offset += batchSize) {
    const batch = boqItems.slice(offset, offset + batchSize);
    lines.push('  INSERT INTO public.boq_items (');
    lines.push('    id, project_id, wbs_id, item_code, description, unit, quantity,');
    lines.push('    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,');
    lines.push('    total_rate, total_amount, created_by, updated_by');
    lines.push('  ) VALUES');

    const values = batch.map((item, batchIndex) => {
      const suffix = batchIndex < batch.length - 1 ? ',' : ';';
      return `    ('${item.id}', v_project_id, '${item.wbsId}', ${sqlString(item.item_code)}, ${sqlString(item.description)}, ${sqlString(item.unit)}, ${item.quantity}, ${item.material_rate}, ${item.labor_rate}, ${item.equipment_rate}, ${item.subcontract_rate}, ${item.other_cost_rate}, ${item.total_rate}, ${item.total_amount}, v_owner, v_owner)${suffix}`;
    });
    lines.push(...values);
    lines.push('');
  }

  lines.push('END $$;');
  lines.push('');
  lines.push('COMMIT;');
  lines.push('');

  return lines.join('\n');
}

async function buildExcel(wbsNodes, boqItems, breakdown) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Quantix Demo Generator';
  workbook.created = new Date();

  const readme = workbook.addWorksheet('README');
  readme.getCell('A1').value = 'Quantix Demo — Office Building BOQ Import Template';
  readme.getCell('A3').value =
    'Sheet "BOQ_Import" lists 2,000 BOQ lines for import/reference. Quantix V1 does not support Excel import in-app; use SQL seed or manual entry.';
  readme.getCell('A5').value = 'Project: Riverside Commerce Centre — 5-Storey Office Building';
  readme.getCell('A6').value = `Project Code: ${PROJECT_CODE}`;
  readme.getCell('A7').value = `WBS Nodes: ${wbsNodes.length}`;
  readme.getCell('A8').value = `BOQ Items: ${boqItems.length}`;
  readme.getCell('A9').value = `Direct Cost (GBP): ${breakdown.direct_cost.toLocaleString('en-GB')}`;
  readme.getCell('A10').value = `Grand Total (GBP): ${breakdown.grand_total.toLocaleString('en-GB')}`;

  const wbsSheet = workbook.addWorksheet('WBS');
  wbsSheet.addRow(['WBS Code', 'Level', 'Description']);
  for (const node of wbsNodes) {
    wbsSheet.addRow([node.code, node.level, node.description]);
  }

  const summary = workbook.addWorksheet('Estimate_Summary');
  summary.addRow(['Component', 'Amount (GBP)']);
  summary.addRow(['Direct Cost', breakdown.direct_cost]);
  summary.addRow(['Indirect Cost', breakdown.indirect_cost]);
  summary.addRow(['Contingency', breakdown.contingency]);
  summary.addRow(['Markup', breakdown.markup]);
  summary.addRow(['VAT', breakdown.vat]);
  summary.addRow(['Grand Total', breakdown.grand_total]);

  const sheet = workbook.addWorksheet('BOQ_Import');
  sheet.addRow([
    'Item No.',
    'WBS Code',
    'Description',
    'Unit',
    'Quantity',
    'Material Rate',
    'Labor Rate',
    'Equipment Rate',
    'Subcontract Rate',
    'Other Cost Rate',
    'Total Rate',
    'Total Amount',
  ]);

  const header = sheet.getRow(1);
  header.font = { bold: true };

  for (const item of boqItems) {
    sheet.addRow([
      item.item_code,
      item.wbsCode,
      item.description,
      item.unit,
      item.quantity,
      item.material_rate,
      item.labor_rate,
      item.equipment_rate,
      item.subcontract_rate,
      item.other_cost_rate,
      item.total_rate,
      item.total_amount,
    ]);
  }

  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.getColumn(1).width = 14;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 60;
  sheet.getColumn(4).width = 8;

  await workbook.xlsx.writeFile(XLSX_PATH);
}

const rand = seededRandom(20260625);
const wbsNodes = buildWbsNodes();
const boqItems = buildBoqItems(wbsNodes, rand);
const directCost = roundCurrency(
  boqItems.reduce((sum, item) => sum + item.total_amount, 0)
);
const breakdown = calculateEstimateBreakdown(directCost, PERCENTAGES);

mkdirSync(resolve(ROOT, 'samples'), { recursive: true });
writeFileSync(SQL_PATH, buildSql(wbsNodes, boqItems, breakdown), 'utf8');
await buildExcel(wbsNodes, boqItems, breakdown);

console.log('Demo project generated.');
console.log(`  WBS nodes:  ${wbsNodes.length}`);
console.log(`  BOQ items:  ${boqItems.length}`);
console.log(`  Direct:     GBP ${breakdown.direct_cost.toLocaleString('en-GB')}`);
console.log(`  Grand total: GBP ${breakdown.grand_total.toLocaleString('en-GB')}`);
console.log(`  SQL:        ${SQL_PATH}`);
console.log(`  Excel:      ${XLSX_PATH}`);
