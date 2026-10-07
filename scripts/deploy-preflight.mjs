/**
 * Full pre-deployment gate for Quantix V1.
 * Run: npm run deploy:preflight
 */

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

const steps = [
  { name: 'Environment variables', command: 'node', args: ['scripts/deploy-check-env.mjs'] },
  { name: 'TypeScript', command: 'npm', args: ['run', 'typecheck'] },
  { name: 'ESLint', command: 'npm', args: ['run', 'lint'] },
  { name: 'Production build', command: 'npm', args: ['run', 'build'] },
  { name: 'RC verification', command: 'npm', args: ['run', 'rc:verify'] },
];

console.log('Quantix V1 — deployment preflight\n');

let failed = false;

for (const step of steps) {
  process.stdout.write(`→ ${step.name}... `);

  const result = spawnSync(step.command, step.args, {
    cwd: ROOT,
    stdio: 'pipe',
    shell: process.platform === 'win32',
    env: process.env,
  });

  if (result.status !== 0) {
    failed = true;
    console.log('FAILED\n');
    if (result.stdout?.length) {
      process.stdout.write(result.stdout);
    }
    if (result.stderr?.length) {
      process.stderr.write(result.stderr);
    }
    break;
  }

  console.log('OK');
}

if (failed) {
  console.error('\nPreflight failed. Resolve errors before deploying to production.');
  process.exit(1);
}

console.log('\nPreflight passed. Ready for Vercel deploy and Supabase migration push.');
console.log('See docs/DEPLOYMENT_GUIDE.md for the full production checklist.');
