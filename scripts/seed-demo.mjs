/**
 * One-click Quantix V1 Demo Seed Package.
 *   npm run seed:demo
 *
 * Populates a fresh (or reset) database with NIA, STREVI, commercial demo,
 * company defaults, and demo users. Does not modify Import Engine source.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyDemoSeed } from './seed/demo-seed-ops.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = resolve(ROOT, 'docs/demo-seed');

console.log('Quantix V1 Demo Seed Package\n');

try {
  const result = await applyDemoSeed();
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    resolve(OUT_DIR, 'LAST_SEED_REPORT.json'),
    JSON.stringify(result, null, 2),
    'utf8'
  );

  console.log('\nDemo seed complete.\n');
  console.log(`  Version     : ${result.seed_version}`);
  console.log(`  Content hash: ${result.content_hash.slice(0, 16)}…`);
  console.log('\nProjects:');
  for (const key of ['nia', 'strevi', 'commercial']) {
    const p = result.projects[key];
    console.log(
      `  - ${p.name} [${p.status ?? 'demo'}]  BOQ ${p.boq_items}  WBS ${p.wbs_nodes}`
    );
    console.log(`    /projects/${p.id}`);
  }
  console.log('\nDemo users (password: DemoSeed1!):');
  for (const u of result.users) {
    console.log(`  - ${u.label.padEnd(12)} ${u.email}  (${u.role})`);
  }
  console.log('\nCompany defaults:');
  console.log(`  Trade categories : ${result.company.trade_categories}`);
  console.log(`  Units of measure : ${result.company.units_of_measure.length}`);
  console.log(`  Resource library : ${result.company.resource_library_items}`);
  console.log(`  Master template  : ${result.company.master_template_id}`);
  console.log('\nDocs: docs/DEMO_SEED.md');
  console.log('Reset: npm run reset:demo');
} catch (error) {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
}
