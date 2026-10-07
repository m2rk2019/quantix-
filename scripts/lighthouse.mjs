import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const TARGET_URL = process.env.LIGHTHOUSE_URL ?? 'http://localhost:3000/login';
const THRESHOLDS = {
  performance: 0.95,
  accessibility: 0.95,
  'best-practices': 0.95,
};

async function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} exited with code ${code ?? 'unknown'}`));
    });
  });
}

async function main() {
  console.log(`Running Lighthouse against ${TARGET_URL}`);

  await delay(1500);

  await run('npx', [
    'lighthouse',
    TARGET_URL,
    '--quiet',
    '--chrome-flags=--headless',
    '--only-categories=performance,accessibility,best-practices',
    '--output=json',
    '--output-path=./lighthouse-report.json',
  ]);

  const report = JSON.parse(
    await import('node:fs').then((fs) =>
      fs.promises.readFile('./lighthouse-report.json', 'utf8')
    )
  );

  const categories = report.categories ?? {};
  const failures = [];

  for (const [key, threshold] of Object.entries(THRESHOLDS)) {
    const score = categories[key]?.score ?? 0;
    const percent = Math.round(score * 100);
    console.log(`${key}: ${percent}%`);

    if (score < threshold) {
      failures.push(`${key} scored ${percent}% (target ${threshold * 100}%)`);
    }
  }

  if (failures.length > 0) {
    console.error('Lighthouse thresholds not met:');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log('Lighthouse thresholds met.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
