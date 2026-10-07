/**
 * Fixed IDs for Quantix V1 Demo Seed Package — identical every run.
 * Prefix d0e… = demo seed entities (safe to wipe on reset).
 */

export const DEMO_SEED_VERSION = '1.0.0';

export const DEMO_PASSWORD = 'DemoSeed1!';

/** Demo auth users (emails are stable keys). */
export const DEMO_USERS = [
  {
    key: 'super_admin',
    email: 'demo.superadmin@quantix.local',
    full_name: 'Demo Super Admin',
    role: 'super_admin',
    label: 'Super Admin',
  },
  {
    key: 'estimator',
    email: 'demo.estimator@quantix.local',
    full_name: 'Demo Estimator',
    role: 'estimator',
    label: 'Estimator',
  },
  {
    key: 'reviewer',
    email: 'demo.reviewer@quantix.local',
    full_name: 'Demo Reviewer',
    role: 'quantity_surveyor',
    label: 'Reviewer',
  },
  {
    key: 'approver',
    email: 'demo.approver@quantix.local',
    full_name: 'Demo Approver',
    role: 'admin',
    label: 'Approver',
  },
  {
    key: 'viewer',
    email: 'demo.viewer@quantix.local',
    full_name: 'Demo Viewer',
    role: 'viewer',
    label: 'Viewer',
  },
];

export const NIA_PROJECT = {
  id: 'd0e11111-1111-4111-a111-111111111101',
  code: 'QTX-DEMO-NIA-001',
  name: 'NIA 4PH Rental Housing Project',
  client: 'Quezon City / NIA Road Pilot',
  location: 'Nia Road, Brgy. Pinyahan, Quezon City',
  status: 'approved',
  sample: 'samples/NIA_Budgetary_Cost_Breakdown.xlsx',
  expected_boq: 450,
  expected_direct: 351522209.41,
};

export const STREVI_PROJECT = {
  id: 'd0e22222-2222-4222-a222-222222222201',
  code: 'QTX-DEMO-STREVI-001',
  name: 'STREVI Residences',
  client: 'STREVI Pilot Client',
  location: 'Philippines',
  status: 'draft',
  sample: 'samples/STREVI_BCB_Breakdown.xlsx',
  expected_boq: 505,
  expected_direct: 1859023517.47,
};

/** Reuses existing Megawide commercial demo ID for compatibility with load:demo. */
export const COMMERCIAL_PROJECT_ID = 'e1a11111-1111-4111-a111-111111111101';

export const COMPANY_TEMPLATE_ID = 'd0e33333-3333-4333-a333-333333333301';
export const NIA_TENDER_ID = 'd0e44444-4444-4444-a444-444444444401';

export const DEMO_MARKUPS = {
  indirect_cost_percent: 10,
  contingency_percent: 5,
  markup_percent: 8,
  vat_percent: 12,
};

export const TRADE_CATEGORIES = [
  {
    id: 'd0e90001-0001-4001-a001-000000000001',
    name: 'Material',
    code: 'DEMO-MAT',
    resource_type: 'material',
    sort_order: 1,
  },
  {
    id: 'd0e90001-0002-4002-a002-000000000002',
    name: 'Labor',
    code: 'DEMO-LAB',
    resource_type: 'labor',
    sort_order: 2,
  },
  {
    id: 'd0e90001-0003-4003-a003-000000000003',
    name: 'Equipment',
    code: 'DEMO-EQP',
    resource_type: 'equipment',
    sort_order: 3,
  },
  {
    id: 'd0e90001-0004-4004-a004-000000000004',
    name: 'Subcontract',
    code: 'DEMO-SUB',
    resource_type: 'subcontract',
    sort_order: 4,
  },
];

/** Seeded into company_units with fixed demo IDs. */
export const UNITS_OF_MEASURE = [
  { code: 'DEMO-M', symbol: 'm', name: 'Meter' },
  { code: 'DEMO-M2', symbol: 'm2', name: 'Square Meter' },
  { code: 'DEMO-M3', symbol: 'm3', name: 'Cubic Meter' },
  { code: 'DEMO-KG', symbol: 'kg', name: 'Kilogram' },
  { code: 'DEMO-TON', symbol: 'ton', name: 'Metric Ton' },
  { code: 'DEMO-PC', symbol: 'pc', name: 'Piece' },
  { code: 'DEMO-SET', symbol: 'set', name: 'Set' },
  { code: 'DEMO-LOT', symbol: 'lot', name: 'Lot' },
  { code: 'DEMO-LS', symbol: 'ls', name: 'Lump Sum' },
  { code: 'DEMO-HR', symbol: 'hr', name: 'Hour' },
  { code: 'DEMO-DAY', symbol: 'day', name: 'Day' },
];
