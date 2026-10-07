/**
 * Generate the official MCC Budgetary Cost Breakdown reference workbook.
 *   node scripts/generate-mcc-budgetary-cost-breakdown.mjs
 */

import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(
  __dirname,
  '../samples/MCC_Budgetary_Cost_Breakdown.xlsx'
);

mkdirSync(dirname(outPath), { recursive: true });

const workbook = new ExcelJS.Workbook();
workbook.creator = 'Quantix Smart Import';
workbook.created = new Date();

const cover = workbook.addWorksheet('Project Cover');
cover.addRow(['Project Name', 'MCC Horizon Tower — Budgetary Estimate']);
cover.addRow(['Client', 'Megawide Construction Corporation']);
cover.addRow(['Location', 'Pasig City, Metro Manila']);
cover.addRow(['Building Type', 'Commercial Office']);
cover.addRow(['Contract Type', 'Lump Sum']);
cover.addRow(['Project Category', 'High-rise Building']);
cover.addRow(['CFA', '28500']);
cover.addRow(['Number of Buildings', '1']);
cover.addRow(['Number of Units', '42']);
cover.addRow(['Date', '2026-03-15']);
cover.addRow(['Revision', 'Rev B']);
cover.addRow(['Currency', 'PHP']);
cover.addRow(['Prepared By', 'J. Reyes, Senior Estimator']);

const bid = workbook.addWorksheet('Bid Summary Sheet');
bid.addRow(['Direct Cost', 185000000]);
bid.addRow(['Indirect Cost', 18500000]);
bid.addRow(['Material Cost', 92000000]);
bid.addRow(['Labor Cost', 48000000]);
bid.addRow(['Equipment Cost', 15000000]);
bid.addRow(['Subcontract Cost', 30000000]);
bid.addRow(['Profit', 18500000]);
bid.addRow(['VAT', 26640000]);
bid.addRow(['Bid Price', 248640000]);
bid.addRow(['Grand Total', 248640000]);

const bcb = workbook.addWorksheet('Cost Worksheet');
bcb.addRow(['Item No.', 'Description', 'Unit', 'Qty', 'Unit Rate', 'Amount']);
bcb.addRow(['A', 'GENERAL REQUIREMENTS', '', '', '', '']);
bcb.addRow(['A.1', 'Temporary facilities and site offices', 'lot', 1, 2500000, 2500000]);
bcb.addRow(['A.2', 'Safety, HSE and PPE provisions', 'lot', 1, 1800000, 1800000]);
bcb.addRow(['B', 'STRUCTURAL WORKS', '', '', '', '']);
bcb.addRow(['B.1', 'Structural concrete for columns and beams', 'm3', 1200, 12500, 15000000]);
bcb.addRow(['B.2', 'Reinforcement bars grade 60', 'kg', 450000, 72, 32400000]);
bcb.addRow(['B.3', 'Formworks and falseworks', 'm2', 18000, 850, 15300000]);
bcb.addRow(['C', 'ARCHITECTURAL WORKS', '', '', '', '']);
bcb.addRow(['C.1', 'Masonry CHB walls including plaster', 'm2', 9500, 1850, 17575000]);
bcb.addRow(['C.2', 'Painting works for interior walls', 'm2', 12000, 420, 5040000]);
bcb.addRow(['D', 'ELECTRICAL WORKS', '', '', '', '']);
bcb.addRow(['D.1', 'Power distribution panelboards', 'lot', 1, 8500000, 8500000]);
bcb.addRow(['D.2', 'Lighting fixtures LED system', 'set', 2200, 3200, 7040000]);
bcb.addRow(['E', 'MECHANICAL / HVAC', '', '', '', '']);
bcb.addRow(['E.1', 'VRV / VRF air-conditioning package', 'lot', 1, 22000000, 22000000]);
bcb.addRow(['F', 'FIRE PROTECTION', '', '', '', '']);
bcb.addRow(['F.1', 'Automatic sprinkler system', 'lot', 1, 9800000, 9800000]);
bcb.addRow(['G', 'PLUMBING AND SANITARY', '', '', '', '']);
bcb.addRow(['G.1', 'Cold and hot water piping system', 'lot', 1, 6500000, 6500000]);
bcb.addRow(['H', 'EXTERNAL WORKS', '', '', '', '']);
bcb.addRow(['H.1', 'Site pavement and landscaping', 'lot', 1, 4200000, 4200000]);

const resources = workbook.addWorksheet('Resource Listing');
resources.addRow(['Code', 'Description', 'Unit', 'Unit Cost', 'Category']);
resources.addRow(['MAT-C40', 'Ready-mix concrete 4000 psi', 'm3', 6800, 'material']);
resources.addRow(['MAT-RB60', 'Deformed rebar grade 60', 'kg', 72, 'material']);
resources.addRow(['LAB-MAS', 'Mason skilled', 'day', 950, 'labor']);
resources.addRow(['EQP-MIX', 'Concrete mixer truck', 'day', 18000, 'equipment']);
resources.addRow(['SUB-FP', 'Fire protection subcontract package', 'lot', 9800000, 'subcontract']);

const rateAnalysis = workbook.addWorksheet('Rate Analysis Detail');
rateAnalysis.addRow([
  'BOQ Item',
  'Resource',
  'Category',
  'Unit',
  'Consumption',
  'Unit Cost',
  'Productivity',
  'Amount',
]);
rateAnalysis.addRow(['B.1', 'Ready-mix concrete 4000 psi', 'material', 'm3', 1, 6800, '', 6800]);
rateAnalysis.addRow(['B.2', 'Deformed rebar grade 60', 'material', 'kg', 1, 72, '', 72]);
rateAnalysis.addRow(['C.1', 'Mason skilled', 'labor', 'day', 0.15, 950, 6.5, 142.5]);
rateAnalysis.addRow(['F.1', 'Fire protection subcontract package', 'subcontract', 'lot', 1, 9800000, '', 9800000]);

const notes = workbook.addWorksheet('Assumptions Notes');
notes.addRow(['Assumptions']);
notes.addRow(['1. Rates are budgetary and exclude escalation beyond 90 days.']);
notes.addRow(['2. CFA based on architectural drawings Rev B.']);
notes.addRow(['Exclusions']);
notes.addRow(['1. Loose furniture and IT equipment.']);
notes.addRow(['2. Contaminated soil disposal beyond normal spoil.']);

await workbook.xlsx.writeFile(outPath);
console.log('Wrote', outPath);
