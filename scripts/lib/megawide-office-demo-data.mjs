/**
 * Local Pilot — Megawide Office Building demo dataset.
 * Philippine construction · ~600 BOQ · rate analysis · ₱300–600M grand total.
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
  validateProjectSnapshot,
} from './estimating-formulas.mjs';

export const MEGAWIDE_PROJECT_ID = 'e1a11111-1111-4111-a111-111111111101';
export const MEGAWIDE_PROJECT_CODE = 'QTX-PILOT-MEGAWIDE-001';

export const MEGAWIDE_PROJECT_META = {
  project_id: MEGAWIDE_PROJECT_ID,
  project_code: MEGAWIDE_PROJECT_CODE,
  project_name: 'Megawide Office Building',
  client_name: 'Megawide Construction Corporation',
  location: 'Makati City, Philippines',
  description:
    '12-storey Grade A office building pilot demo — complete WBS, BOQ, rate analysis, and Philippine construction rates.',
  estimate_date: '2026-06-26',
  prepared_by: 'Quantix Pilot Seed',
  project_type: 'commercial',
};

export const MEGAWIDE_PERCENTAGES = {
  indirect_cost_percent: 10,
  contingency_percent: 5,
  markup_percent: 8,
  vat_percent: 12,
};

export const TARGET_BOQ_COUNT = 600;
export const TARGET_GRAND_MIN = 300_000_000;
export const TARGET_GRAND_MAX = 600_000_000;

const WBS_TREE = [
  {
    code: '1',
    description: 'Civil & Structural',
    children: [
      { code: '1.1', description: 'Concrete' },
      { code: '1.2', description: 'Rebars' },
      { code: '1.3', description: 'Formworks' },
      { code: '1.4', description: 'Structural Steel' },
    ],
  },
  {
    code: '2',
    description: 'Architectural',
    children: [
      { code: '2.1', description: 'Masonry' },
      { code: '2.2', description: 'Roofing' },
      { code: '2.3', description: 'Ceiling' },
      { code: '2.4', description: 'Doors' },
      { code: '2.5', description: 'Windows' },
      { code: '2.6', description: 'Painting' },
    ],
  },
  {
    code: '3',
    description: 'MEPF',
    children: [
      { code: '3.1', description: 'Plumbing' },
      { code: '3.2', description: 'Fire Protection' },
      { code: '3.3', description: 'Electrical' },
      { code: '3.4', description: 'HVAC' },
    ],
  },
  {
    code: '4',
    description: 'Site Works',
    children: [{ code: '4.1', description: 'External Works' }],
  },
];

const BOQ_TEMPLATES = {
  Concrete: [
    'Portland cement concrete footing 4000 psi',
    'Reinforced concrete column 400mm',
    'Reinforced concrete beam 300x600',
    'Reinforced concrete slab on grade 150mm',
    'Reinforced concrete suspended slab 200mm',
    'Post-tensioned slab band',
    'Concrete core wall 300mm',
    'Concrete stairs and landings',
    'Lean concrete blinding 50mm',
    'Concrete pump allowance',
    'Concrete curing compound',
    'Waterstop installation',
    'Expansion joint filler',
    'Concrete testing cubes',
    'Night pour premium allowance',
    'Concrete vibration and finishing',
    'Grouting under base plates',
    'RC retaining wall 250mm',
    'Concrete pile cap',
    'Concrete grade beam',
    'Concrete topping 75mm',
    'Fiber mesh reinforcement',
    'Chemical admixture allowance',
    'Concrete washout facility',
    'Mass concrete pour monitoring',
    'Concrete cold joint treatment',
    'RC shear wall coupling beam',
    'Concrete sump pit',
    'Concrete equipment pad',
    'Concrete pavement 200mm',
    'Concrete curb and gutter',
    'Concrete bollard',
    'Concrete planter wall',
    'Concrete ramp 1:12',
    'Concrete lift pit',
    'Concrete tank slab',
    'Concrete isolation joint',
    'Concrete anchor bolt setting',
    'Concrete surface hardener',
    'Concrete repair mortar',
  ],
  Rebars: [
    'Supply and install rebar #16',
    'Supply and install rebar #20',
    'Supply and install rebar #25',
    'Supply and install rebar #32',
    'Cutting and bending rebar',
    'Welded wire mesh 6x6',
    'Rebar chairs and spacers',
    'Epoxy coated rebar',
    'Rebar splicing couplers',
    'Stirrups and ties',
    'Post-tensioning strand',
    'PT anchorage heads',
    'Rebar testing allowance',
    'Rebar welding',
    'Rebar threading',
    'Galvanized rebar',
    'Rebar cage prefabrication',
    'Rebar dowels',
    'Rebar lap splice',
    'Rebar corrosion inhibitor',
    'Rebar protective caps',
    'Rebar inventory wastage',
    'Rebar transport and handling',
    'Rebar fixing labor',
    'Rebar inspection hold points',
    'Rebar bending schedule prep',
    'Rebar mesh sheets',
    'Rebar U-bars',
    'Rebar cranking',
    'Rebar seismic detailing',
    'Rebar column cage',
    'Rebar beam cage',
    'Rebar slab mesh top',
    'Rebar slab mesh bottom',
    'Rebar chair plastic',
    'Rebar tying wire',
    'Rebar cutting disc',
    'Rebar bending machine',
    'Rebar storage racks',
    'Rebar mill certificate',
  ],
  Formworks: [
    'Plywood formwork slab soffit',
    'Plywood formwork beam sides',
    'Plywood formwork column',
    'Phenolic formwork wall',
    'Timber formwork footing',
    'Formwork oil application',
    'Formwork ties and walers',
    'Formwork stripping and cleaning',
    'Aluminum formwork panel',
    'Formwork bracing and shoring',
    'Formwork chamfer strips',
    'Formwork release agent',
    'Formwork repair plywood',
    'Formwork leveling wedges',
    'Formwork soldier piles',
    'Formwork jump system',
    'Formwork climbing platform',
    'Formwork tie rod',
    'Formwork cone plug',
    'Formwork beam clamp',
    'Formwork prop steel',
    'Formwork H-beam waler',
    'Formwork plywood 18mm',
    'Formwork edge protection',
    'Formwork inspection',
    'Formwork design allowance',
    'Formwork rental extension',
    'Formwork transport',
    'Formwork storage yard',
    'Formwork carpenter labor',
    'Formwork helper labor',
    'Formwork nails and screws',
    'Formwork timber batten',
    'Formwork circular column',
    'Formwork curved slab',
    'Formwork stair soffit',
    'Formwork core wall',
    'Formwork lift shaft',
    'Formwork curing blanket',
    'Formwork night shift premium',
  ],
  'Structural Steel': [
    'Structural steel column W14',
    'Structural steel beam W18',
    'Steel bracing member',
    'Steel base plate 400x400',
    'Steel anchor bolts M24',
    'Steel connection plates',
    'Steel stair stringer',
    'Steel handrail',
    'Steel decking composite',
    'Steel shear studs',
    'Steel fireproofing intumescent',
    'Steel primer and paint',
    'Steel erection labor',
    'Steel welding SMAW',
    'Steel bolted connection',
    'Steel grating floor',
    'Steel lintel angle',
    'Steel embed plates',
    'Steel crane lift allowance',
    'Steel shop drawing',
    'Steel fabrication',
    'Steel galvanizing',
    'Steel moment connection',
    'Steel purlin C-channel',
    'Steel roof truss',
    'Steel mezzanine framing',
    'Steel equipment support',
    'Steel platform',
    'Steel cat ladder',
    'Steel blast cleaning',
    'Steel touch-up paint',
    'Steel survey and layout',
    'Steel temporary bracing',
    'Steel shims and grouting',
    'Steel inspection',
    'Steel transport',
    'Steel unloading',
    'Steel storage',
    'Steel trial assembly',
    'Steel warranty documentation',
  ],
  Masonry: [
    '150mm CHB wall reinforced',
    '100mm CHB partition',
    '4" CHB infill',
    'Brick veneer wall',
    'Glass block wall',
    'Masonry grout filling',
    'Wall chipping and prep',
    'Masonry lintel',
    'Control joint sealant',
    'Masonry cleaning',
    'CHB pilaster',
    'CHB stiffener column',
    'Masonry bond beam',
    'Masonry wall tie',
    'Masonry damp proof course',
    'Masonry acoustic wall',
    'Masonry fire rating wall',
    'Masonry core filling grout',
    'Masonry tooling joints',
    'Masonry scaffolding',
    'Masonry mortar mix',
    'Masonry sample panel',
    'Masonry testing',
    'Masonry night work',
    'Masonry waste allowance',
    'Masonry cutting disc',
    'Masonry joint raking',
    'Masonry waterproof additive',
    'Masonry expansion joint',
    'Masonry corner reinforcement',
    'Masonry opening reinforcement',
    'Masonry shelf angle',
    'Masonry veneer ties',
    'Masonry weep holes',
    'Masonry cleaning acid',
    'Masonry protection board',
    'Masonry curing',
    'Masonry inspection',
    'Masonry as-built survey',
    'Masonry touch-up',
  ],
  Roofing: [
    'Standing seam metal roof',
    'Roof insulation 50mm',
    'Roof vapor barrier',
    'Roof flashing galvanized',
    'Roof gutter and downpipe',
    'Roof skylight curb',
    'Roof walkway pads',
    'Roof safety anchor',
    'Roof waterproof membrane',
    'Roof drain stainless',
    'Roof parapet coping',
    'Roof expansion joint cover',
    'Roof sealant lap',
    'Roof ridge cap',
    'Roof eave trim',
    'Roof underlayment',
    'Roof cricket saddle',
    'Roof equipment curb',
    'Roof lightning clip',
    'Roof maintenance hatch',
    'Roof fall protection',
    'Roof insulation taper',
    'Roof deck metal',
    'Roof fastener concealed',
    'Roof testing flood',
    'Roof warranty inspection',
    'Roof night seal',
    'Roof transport hoist',
    'Roof debris netting',
    'Roof bird screen',
    'Roof overflow scupper',
    'Roof snow guard N/A',
    'Roof solar mounting prep',
    'Roof acoustic layer',
    'Roof fire barrier',
    'Roof shop drawing',
    'Roof mock-up panel',
    'Roof cleaning',
    'Roof touch-up paint',
    'Roof as-built',
  ],
  Ceiling: [
    'Gypsum board ceiling 12.5mm',
    'Mineral fiber acoustic tile',
    'Metal furring channel',
    'Suspended ceiling T-bar',
    'Ceiling insulation',
    'Access panel 600x600',
    'Cornice moulding',
    'Ceiling painting',
    'Moisture resistant gypsum',
    'Linear LED cove',
    'Ceiling seismic clip',
    'Ceiling hanger wire',
    'Ceiling shadow gap',
    'Ceiling bulkhead',
    'Ceiling soffit feature',
    'Ceiling acoustic baffle',
    'Ceiling fire rated board',
    'Ceiling level survey',
    'Ceiling joint compound',
    'Ceiling mesh tape',
    'Ceiling primer',
    'Ceiling access ladder',
    'Ceiling MEP coordination',
    'Ceiling night work',
    'Ceiling protection',
    'Ceiling repair patch',
    'Ceiling corner bead',
    'Ceiling control joint',
    'Ceiling inspection',
    'Ceiling warranty',
    'Ceiling mock-up room',
    'Ceiling cleaning',
    'Ceiling touch-up',
    'Ceiling as-built',
    'Ceiling debris removal',
    'Ceiling scaffolding',
    'Ceiling transport',
    'Ceiling storage',
    'Ceiling layout marking',
    'Ceiling final acceptance',
  ],
  Doors: [
    'Solid core wood door 900x2100',
    'Hollow metal door fire rated',
    'Aluminum glazed door',
    'Door frame steel',
    'Door hardware set passage',
    'Door closer hydraulic',
    'Door vision panel',
    'Door access control prep',
    'Door weather stripping',
    'Door threshold',
    'Door kick plate',
    'Door stop floor mount',
    'Door coordinator',
    'Door panic hardware',
    'Door smoke seal',
    'Door acoustic seal',
    'Door vision lite kit',
    'Door installation labor',
    'Door protection film',
    'Door adjustment',
    'Door testing',
    'Door warranty',
    'Door shop drawing',
    'Door mock-up',
    'Door transport',
    'Door storage',
    'Door frame grouting',
    'Door hinge heavy duty',
    'Door lockset cylindrical',
    'Door master keying',
    'Door signage prep',
    'Door astragal',
    'Door astragal meeting',
    'Door louvers',
    'Door vision frame',
    'Door silencer',
    'Door bumper',
    'Door coordinator overhead',
    'Door hold open',
    'Door final QC',
  ],
  Windows: [
    'Aluminum window fixed 1200x1500',
    'Aluminum window sliding',
    'Curtain wall mullion',
    'Glazing tempered 12mm',
    'Window sealant structural',
    'Window flashing membrane',
    'Window sill stone',
    'Window insect screen',
    'Window safety restrictor',
    'Window testing water',
    'Window testing air',
    'Window thermal break',
    'Window powder coat finish',
    'Window installation labor',
    'Window protection board',
    'Window cleaning access',
    'Window shop drawing',
    'Window mock-up',
    'Window transport',
    'Window storage',
    'Window anchor bracket',
    'Window setting blocks',
    'Window backer rod',
    'Window cap flashing',
    'Window head flashing',
    'Window jamb flashing',
    'Window sill flashing',
    'Window acoustic laminate',
    'Window low-E coating',
    'Window warranty',
    'Window night seal',
    'Window debris removal',
    'Window inspection',
    'Window touch-up',
    'Window as-built',
    'Window spare glass',
    'Window crane lift',
    'Window scaffold access',
    'Window final acceptance',
    'Window O&M manual',
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
    'Fire retardant paint',
    'Intumescent paint steel',
    'PU floor coating',
    'Anti-carbonation coating',
    'Paint roller and brush',
    'Paint masking protection',
    'Paint scaffolding',
    'Paint night premium',
    'Paint touch-up kit',
    'Paint color sample',
    'Paint warranty',
    'Paint inspection',
    'Paint cleaning solvent',
    'Paint thinning allowance',
    'Paint spray machine',
    'Paint compressor',
    'Paint waste disposal',
    'Paint safety PPE',
    'Paint humidity control',
    'Paint curing time',
    'Paint stripe marking',
    'Paint stencil numbering',
    'Paint final QC',
    'Paint as-built',
    'Paint debris removal',
    'Paint transport',
    'Paint storage',
    'Paint mock-up panel',
    'Paint adhesion test',
    'Paint dry film gauge',
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
    'Septic tank connection',
    'Grease interceptor',
    'Water meter assembly',
    'PRV station',
    'Pipe insulation 25mm',
    'Pipe hanger support',
    'Pipe pressure testing',
    'Pipe disinfection',
    'Pipe trenching allowance',
    'Pipe core drilling',
    'Pipe sleeve fire stop',
    'Pipe identification label',
    'Pipe access panel',
    'Pipe cleanout',
    'Pipe vent stack',
    'Pipe storm drain',
    'Pipe sump pump',
    'Pipe backflow preventer',
    'Pipe expansion loop',
    'Pipe seismic brace',
    'Pipe commissioning',
    'Pipe O&M manual',
    'Pipe warranty',
    'Pipe night work',
    'Pipe protection',
    'Pipe touch-up',
    'Pipe inspection',
    'Pipe as-built',
    'Pipe debris removal',
    'Pipe transport',
    'Pipe storage',
  ],
  'Fire Protection': [
    'Sprinkler head upright',
    'Fire hose cabinet',
    'Wet riser pipe 65mm',
    'Fire pump electric 750GPM',
    'Fire alarm smoke detector',
    'Fire alarm manual pull',
    'Fire extinguisher 10lbs ABC',
    'Fire door 90min rated',
    'FM200 suppression head',
    'Fire protection testing',
    'Fire jockey pump',
    'Fire control panel',
    'Fire strobe horn',
    'Fire damper',
    'Fire stopping penetration',
    'Fire hydrant valve',
    'Fire department connection',
    'Fire flow test',
    'Fire commissioning',
    'Fire O&M manual',
    'Fire warranty',
    'Fire night work',
    'Fire protection shop drawing',
    'Fire mock-up test',
    'Fire pipe hanger seismic',
    'Fire valve supervisory switch',
    'Fire flow switch',
    'Fire tamper switch',
    'Fire inspection',
    'Fire as-built',
    'Fire debris removal',
    'Fire transport',
    'Fire storage',
    'Fire touch-up paint',
    'Fire identification',
    'Fire training handover',
    'Fire spare heads',
    'Fire spare fuses',
    'Fire final acceptance',
    'Fire authority witness',
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
    'Busbar riser',
    'Generator ATS panel',
    'Emergency lighting',
    'UPS distribution',
    'Motor control center',
    'VFD panel',
    'Lighting control relay',
    'Cable pulling lubricant',
    'Cable megger testing',
    'Electrical commissioning',
    'Electrical O&M manual',
    'Electrical warranty',
    'Electrical night work',
    'Electrical shop drawing',
    'Electrical mock-up',
    'Electrical seismic bracing',
    'Electrical fire stopping',
    'Electrical labeling',
    'Electrical inspection',
    'Electrical as-built',
    'Electrical debris removal',
    'Electrical transport',
    'Electrical storage',
    'Electrical touch-up',
    'Electrical spare breakers',
    'Electrical load bank test',
    'Electrical thermographic scan',
    'Electrical authority witness',
    'Electrical final acceptance',
    'Electrical training',
  ],
  HVAC: [
    'VRF outdoor unit 16HP',
    'VRF indoor cassette',
    'Ductwork galvanized 24ga',
    'Chilled water pipe 65mm',
    'AHU 10000 CFM',
    'Exhaust fan toilet',
    'Fresh air louver',
    'Volume control damper',
    'Duct insulation 25mm',
    'Refrigerant piping copper',
    'BMS control panel',
    'Thermostat digital',
    'Duct smoke detector',
    'Fire damper HVAC',
    'Duct access door',
    'Duct testing leakage',
    'Air balancing',
    'HVAC commissioning',
    'HVAC O&M manual',
    'HVAC warranty',
    'HVAC night work',
    'HVAC shop drawing',
    'HVAC mock-up',
    'HVAC seismic bracing',
    'HVAC vibration isolator',
    'HVAC condensate drain',
    'HVAC refrigerant charge',
    'HVAC insulation jacket',
    'HVAC inspection',
    'HVAC as-built',
    'HVAC debris removal',
    'HVAC transport',
    'HVAC storage',
    'HVAC touch-up',
    'HVAC spare filters',
    'HVAC TAB report',
    'HVAC authority witness',
    'HVAC final acceptance',
    'HVAC training',
    'HVAC maintenance contract prep',
  ],
  'External Works': [
    'Site excavation bulk',
    'Site grading and compaction',
    'Asphalt road 50mm',
    'Concrete sidewalk 150mm',
    'Interlocking pavers driveway',
    'Landscape topsoil',
    'Sodding lawn',
    'Tree planting 3m height',
    'Perimeter fence RC posts',
    'Gate house structure',
    'Storm drain RC pipe 600mm',
    'Manhole RC 1200',
    'Catch basin',
    'Site lighting pole',
    'Bollard RC protective',
    'Car park marking',
    'Wheel stop concrete',
    'Retaining wall segmental',
    'Riprap slope protection',
    'Silt fence sediment',
    'Erosion control mat',
    'Demolition allowance',
    'Hauling offsite',
    'Site signage',
    'Temporary road',
    'Construction water supply',
    'Site power temporary',
    'Site toilet portable',
    'Site waste segregation',
    'Landscaping irrigation',
    'Fountain water feature',
    'Outdoor furniture allowance',
    'Bike rack stainless',
    'EV charging rough-in',
    'Guard house fit-out',
    'CCTV pole foundation',
    'Flagpole foundation',
    'External painting',
    'External cleaning',
    'External final acceptance',
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
    { code: 'SUP-DAIKIN', name: 'Daikin Philippines' },
    { code: 'SUP-SCHNEIDER', name: 'Schneider Electric PH' },
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
    { code: 'UOM-TON', symbol: 'ton', name: 'Metric Ton' },
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
    { code: 'MAT-GYPSUM', description: 'Gypsum board 12.5mm', unit: 'm2', unit_cost: 320 },
    { code: 'MAT-PAINT', description: 'Latex paint 20L pail', unit: 'lot', unit_cost: 4200 },
    { code: 'MAT-PVC-4', description: 'PVC pipe 4" SDR', unit: 'm', unit_cost: 520 },
    { code: 'MAT-THHN-35', description: 'THHN wire 3.5mm2', unit: 'm', unit_cost: 48 },
    { code: 'MAT-SPRINKLER', description: 'Sprinkler head upright', unit: 'pc', unit_cost: 850 },
    { code: 'MAT-PLY-18', description: 'Marine plywood 18mm', unit: 'm2', unit_cost: 680 },
    { code: 'MAT-STEEL-W14', description: 'Wide flange W14 section', unit: 'kg', unit_cost: 72 },
    { code: 'MAT-METAL-ROOF', description: 'Standing seam metal sheet', unit: 'm2', unit_cost: 1250 },
    { code: 'MAT-ALUM-WIN', description: 'Aluminum window frame', unit: 'm2', unit_cost: 4800 },
    { code: 'MAT-VRF-ODU', description: 'VRF outdoor unit 16HP', unit: 'pc', unit_cost: 485000 },
    { code: 'MAT-ASPHALT', description: 'Asphalt premix', unit: 'm2', unit_cost: 890 },
  ],
  labor: [
    { code: 'LAB-MASON', description: 'Mason', unit: 'day', unit_cost: 850 },
    { code: 'LAB-CARP', description: 'Carpenter', unit: 'day', unit_cost: 900 },
    { code: 'LAB-STEEL', description: 'Steel fixer', unit: 'day', unit_cost: 950 },
    { code: 'LAB-ELEC', description: 'Electrician', unit: 'day', unit_cost: 1100 },
    { code: 'LAB-PLUMB', description: 'Plumber', unit: 'day', unit_cost: 1050 },
    { code: 'LAB-PAINT', description: 'Painter', unit: 'day', unit_cost: 800 },
    { code: 'LAB-LABORER', description: 'Laborer/helper', unit: 'day', unit_cost: 650 },
    { code: 'LAB-RIGGER', description: 'Steel rigger', unit: 'day', unit_cost: 1200 },
    { code: 'LAB-HVAC', description: 'HVAC technician', unit: 'day', unit_cost: 1150 },
  ],
  equipment: [
    { code: 'EQ-MIXER', description: 'Concrete mixer 1 bagger', unit: 'day', unit_cost: 1800 },
    { code: 'EQ-BACKHOE', description: 'Backhoe loader', unit: 'day', unit_cost: 12500 },
    { code: 'EQ-CRANE', description: 'Tower crane', unit: 'day', unit_cost: 45000 },
    { code: 'EQ-SCAFF', description: 'Scaffolding rental', unit: 'day', unit_cost: 2200 },
    { code: 'EQ-PUMP', description: 'Concrete pump boom', unit: 'day', unit_cost: 28000 },
    { code: 'EQ-LIFT', description: 'Scissor lift 12m', unit: 'day', unit_cost: 8500 },
  ],
  subcontract: [
    { code: 'SUB-ELEC', description: 'Electrical subcontract package', unit: 'lot', unit_cost: 185000 },
    { code: 'SUB-PLUMB', description: 'Plumbing subcontract package', unit: 'lot', unit_cost: 165000 },
    { code: 'SUB-FIRE', description: 'Fire protection specialist', unit: 'lot', unit_cost: 220000 },
    { code: 'SUB-HVAC', description: 'HVAC specialist package', unit: 'lot', unit_cost: 320000 },
    { code: 'SUB-CURTAIN', description: 'Curtain wall specialist', unit: 'lot', unit_cost: 450000 },
  ],
};

function wbsUuid(index) {
  return `e1b11111-1111-4111-a111-${String(index).padStart(12, '0')}`;
}

function boqUuid(index) {
  return `e1c11111-1111-4111-a111-${String(index).padStart(12, '0')}`;
}

function libraryUuid(prefix, index) {
  return `e1d${prefix}111-1111-4111-a111-${String(index).padStart(12, '0')}`;
}

function rateLineUuid(index) {
  return `e1e11111-1111-4111-a111-${String(index).padStart(12, '0')}`;
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

  const rootId = wbsUuid(index);
  index += 1;
  sortOrder += 1;
  nodes.push({
    id: rootId,
    parent_id: null,
    wbs_code: '0',
    description: 'Megawide Office Building',
    level: 1,
    sort_order: sortOrder,
  });

  for (const group of WBS_TREE) {
    const groupId = wbsUuid(index);
    index += 1;
    sortOrder += 1;
    nodes.push({
      id: groupId,
      parent_id: rootId,
      wbs_code: group.code,
      description: group.description,
      level: 2,
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
        level: 3,
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
  if (description.includes('pipe') || description.includes('wire') || description.includes('conduit')) {
    return 'm';
  }
  if (
    description.includes('rebar') ||
    description.includes('steel column') ||
    description.includes('steel beam') ||
    description.includes('Wide flange')
  ) {
    return 'kg';
  }
  if (description.includes('lot') || description.includes('allowance') || description.includes('package')) {
    return 'lot';
  }
  if (
    description.includes('Excavation') ||
    description.includes('concrete') ||
    description.includes('sand') ||
    description.includes('grout') ||
    description.includes('m3')
  ) {
    return 'm3';
  }
  if (description.includes('door') || description.includes('window') || description.includes('head') && description.includes('Sprinkler')) {
    return 'pc';
  }
  return 'm2';
}

function buildRateAnalysisLines(itemIndex, discipline, library, rng) {
  const lines = [];
  const materials = library.items.filter((item) => item.category === 'material');
  const labor = library.items.filter((item) => item.category === 'labor');
  const equipment = library.items.filter((item) => item.category === 'equipment');
  const subcontract = library.items.filter((item) => item.category === 'subcontract');

  const material = materials[itemIndex % materials.length];
  const laborItem = labor[itemIndex % labor.length];
  const equipmentItem = equipment[itemIndex % equipment.length];

  const materialConsumption = roundCurrency(0.5 + rng() * 2.2);
  const laborConsumption = roundCurrency(0.08 + rng() * 0.35);
  const equipmentConsumption = roundCurrency(0.02 + rng() * 0.12);

  lines.push({
    category: 'material',
    resource_name: material.description,
    library_item_id: material.id,
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
    resource_name: laborItem.description,
    library_item_id: laborItem.id,
    unit: laborItem.unit,
    consumption: laborConsumption,
    unit_cost: laborItem.unit_cost,
    waste_percent: 0,
    productivity: discipline === 'External Works' ? 1.15 : null,
    amount: computeLineAmount(
      laborConsumption,
      laborItem.unit_cost,
      0,
      discipline === 'External Works' ? 1.15 : null
    ),
  });

  if (itemIndex % 3 === 0) {
    lines.push({
      category: 'equipment',
      resource_name: equipmentItem.description,
      library_item_id: equipmentItem.id,
      unit: equipmentItem.unit,
      consumption: equipmentConsumption,
      unit_cost: equipmentItem.unit_cost,
      waste_percent: 0,
      productivity: null,
      amount: computeLineAmount(equipmentConsumption, equipmentItem.unit_cost),
    });
  }

  if (itemIndex % 7 === 0) {
    const sub = subcontract[itemIndex % subcontract.length];
    const subConsumption = roundCurrency(0.02 + rng() * 0.1);
    lines.push({
      category: 'subcontract',
      resource_name: sub.description,
      library_item_id: sub.id,
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

function recomputeItemAmounts(item) {
  const rates = {
    material_rate: item.material_rate,
    labor_rate: item.labor_rate,
    equipment_rate: item.equipment_rate,
    subcontract_rate: item.subcontract_rate,
    other_cost_rate: item.other_cost_rate,
  };
  item.total_rate = calculateTotalRate(rates);
  item.total_amount = calculateTotalAmount(item.quantity, item.total_rate);
}

export function buildBoqItems(wbsNodes, library, targetCount = TARGET_BOQ_COUNT, seed = 99026) {
  const rng = seededRandom(seed);
  const leafNodes = wbsNodes.filter((node) => node.level === 3);
  const items = [];
  let boqIndex = 1;
  const perLeaf = Math.ceil(targetCount / leafNodes.length);

  for (const leaf of leafNodes) {
    const templates = BOQ_TEMPLATES[leaf.description] ?? [`${leaf.description} work item`];

    for (let index = 0; index < perLeaf && items.length < targetCount; index += 1) {
      const description = templates[index % templates.length];
      const quantity = roundCurrency(12 + rng() * 180 + (index % 4 === 0 ? 45.5 : 0));
      const unit = pickUnit(description);
      const rateLines = buildRateAnalysisLines(boqIndex, leaf.description, library, rng);
      const categoryTotals = computeCategoryTotals(rateLines);

      const rates = {
        material_rate: categoryTotals.material,
        labor_rate: categoryTotals.labor,
        equipment_rate: categoryTotals.equipment,
        subcontract_rate: categoryTotals.subcontract,
        other_cost_rate: boqIndex % 11 === 0 ? roundCurrency(25 + rng() * 80) : 0,
      };

      const total_rate = calculateTotalRate(rates);
      const total_amount = calculateTotalAmount(quantity, total_rate);

      items.push({
        id: boqUuid(boqIndex),
        project_id: MEGAWIDE_PROJECT_ID,
        wbs_id: leaf.id,
        wbs_code: leaf.wbs_code,
        item_code: `MWB-${String(boqIndex).padStart(4, '0')}`,
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

function scaleItemQuantities(items, factor) {
  for (const item of items) {
    item.quantity = roundCurrency(item.quantity * factor);
    recomputeItemAmounts(item);
  }
}

export function buildBenchmarkActuals(items, seed = 441026) {
  const rng = seededRandom(seed);
  return items.map((item) => {
    const varianceFactor = 0.97 + rng() * 0.06;
    const actualQty = roundCurrency(item.quantity * varianceFactor);
    const actualRate = roundCurrency(item.total_rate * (0.98 + rng() * 0.04));
    const awarded = roundCurrency(actualQty * actualRate);
    return {
      item_code: item.item_code,
      description: item.description,
      boq_item_id: item.id,
      estimated_quantity: item.quantity,
      actual_quantity: actualQty,
      estimated_unit_rate: item.total_rate,
      actual_unit_rate: actualRate,
      estimated_cost: item.total_amount,
      actual_cost: awarded,
      awarded_cost: awarded,
    };
  });
}

export function buildFullMegawideSnapshot(targetBoqCount = TARGET_BOQ_COUNT) {
  const wbsNodes = buildWbsNodes();
  const resourceLibrary = buildResourceLibrary();
  let items = buildBoqItems(wbsNodes, resourceLibrary, targetBoqCount);

  let directCost = sumBoqDirectCost(items);
  let breakdown = calculateEstimateBreakdown(directCost, MEGAWIDE_PERCENTAGES);

  const targetGrand = 450_000_000;
  for (let pass = 0; pass < 3; pass += 1) {
    if (breakdown.grand_total >= TARGET_GRAND_MIN && breakdown.grand_total <= TARGET_GRAND_MAX) break;
    const qtyScale = targetGrand / breakdown.grand_total;
    scaleItemQuantities(items, qtyScale);
    directCost = sumBoqDirectCost(items);
    breakdown = calculateEstimateBreakdown(directCost, MEGAWIDE_PERCENTAGES);
  }

  const resourceTotals = computeResourceTotals(items);
  const wbsRollup = buildWbsRollup(wbsNodes, items);
  const bidSummary = buildBidSummary(MEGAWIDE_PROJECT_META, breakdown);
  const benchmarkActuals = buildBenchmarkActuals(items);

  const validationFailures = validateProjectSnapshot({
    items,
    wbsNodes,
    percentages: MEGAWIDE_PERCENTAGES,
    breakdown,
    resourceTotals,
    bidSummary,
  });

  return {
    meta: MEGAWIDE_PROJECT_META,
    percentages: MEGAWIDE_PERCENTAGES,
    wbsNodes,
    resourceLibrary,
    items,
    breakdown,
    resourceTotals,
    wbsRollup,
    bidSummary,
    benchmarkActuals,
    validationFailures,
  };
}

export function getMegawideExpectedTotals() {
  const snapshot = buildFullMegawideSnapshot();
  return {
    boq_item_count: snapshot.items.length,
    wbs_node_count: snapshot.wbsNodes.length,
    direct_cost: snapshot.breakdown.direct_cost,
    grand_total: snapshot.breakdown.grand_total,
    bid_grand_total: snapshot.bidSummary.grand_total,
    wbs_rollup_total: snapshot.wbsRollup.reduce((sum, node) => sum + node.combined_total, 0),
    validation_failure_count: snapshot.validationFailures.length,
  };
}

export { wbsUuid, boqUuid, libraryUuid, rateLineUuid };
