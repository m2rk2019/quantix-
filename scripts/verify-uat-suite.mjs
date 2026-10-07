/**
 * Sprint 15A — UAT suite orchestrator.
 *   npm run verify:uat-suite
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const AUTOMATED_STEPS = [
  { name: 'Estimating engine', script: 'verify:estimating-engine' },
  { name: 'Rate analysis', script: 'verify:rate-analysis' },
  { name: 'AI engineering', script: 'verify:ai-engineering' },
  { name: 'Executive dashboard', script: 'verify:executive-dashboard' },
  { name: 'Company settings', script: 'verify:company-settings' },
  { name: 'Historical benchmarks', script: 'verify:historical-benchmarks' },
  { name: 'Release candidate', script: 'rc:verify' },
];

console.log('Quantix V1 — UAT Automated Suite');
console.log('=================================\n');

let failed = 0;
let passed = 0;

for (const step of AUTOMATED_STEPS) {
  process.stdout.write(`→ ${step.name} (${step.script})... `);

  const result = spawnSync('npm', ['run', step.script], {
    cwd: ROOT,
    stdio: 'pipe',
    shell: process.platform === 'win32',
    env: process.env,
  });

  if (result.status !== 0) {
    failed += 1;
    console.log('FAIL\n');
    if (result.stdout?.length) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr?.length) {
      process.stderr.write(result.stderr);
    }
  } else {
    passed += 1;
    console.log('PASS');
  }
}

console.log('\n=================================');
console.log(`Automated checks: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error('\nRESULT: FAIL');
  console.error('Resolve failing scripts before production deployment.');
  console.error('See docs/UAT_RESULTS.md for recording manual UAT outcomes.');
  process.exit(1);
}

console.log('\nRESULT: PASS');
console.log('All automated UAT checks passed.');
console.log('Complete manual scenarios in docs/UAT_CHECKLIST.md and record in docs/UAT_RESULTS.md.');
process.exit(0);
