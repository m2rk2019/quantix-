/**
 * One-click load — Megawide Office Building pilot demo.
 *   npm run load:demo
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { applyMegawideDemo } from './lib/megawide-demo-ops.mjs';

const generator = resolve(import.meta.dirname, 'generate-megawide-office-demo.mjs');

const genResult = spawnSync(process.execPath, [generator], { stdio: 'inherit' });
if (genResult.status !== 0) {
  process.exit(genResult.status ?? 1);
}

console.log('\nApplying demo to Supabase...\n');

try {
  const result = await applyMegawideDemo();
  console.log('Megawide Office Building loaded successfully.\n');
  console.log(`  Project ID : ${result.project_id}`);
  console.log(`  Code       : ${result.project_code}`);
  console.log(`  BOQ items  : ${result.boq_item_count}`);
  console.log(`  WBS nodes  : ${result.wbs_node_count}`);
  console.log(`  Library    : ${result.library_item_count} items`);
  console.log(`  Rate lines : ${result.rate_line_count}`);
  console.log(`  Direct cost: PHP ${result.direct_cost.toLocaleString()}`);
  console.log(`  Grand total: PHP ${result.grand_total.toLocaleString()}`);
  console.log('\nOpen: /projects/' + result.project_id);
  console.log('Verify: npm run verify:megawide-office');
} catch (error) {
  console.error('Load failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
