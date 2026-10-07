/**
 * One-click reset — remove Quantix V1 Demo Seed Package data.
 *   npm run reset:demo
 *
 * Clears NIA, STREVI, Megawide commercial, d0e/e1d company seeds,
 * tender + master template demo rows. Demo auth users are retained
 * (re-seeded passwords/roles on next seed:demo).
 */

import { resetDemoSeed } from './seed/demo-seed-ops.mjs';

console.log('Resetting Quantix V1 Demo Seed Package...\n');

try {
  const result = await resetDemoSeed();
  console.log('Demo database reset complete.');
  console.log(`  Cleared projects: ${result.cleared_projects.join(', ')}`);
  console.log('  Removed d0e%/e1d% company library, templates, tenders.');
  console.log(`  Seed version marker: ${result.seed_version}`);
  console.log('\nReload: npm run seed:demo');
} catch (error) {
  console.error('Reset failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
