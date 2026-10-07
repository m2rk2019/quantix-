/**
 * Playwright E2E: login form → dashboard via email/password.
 *
 *   node scripts/browser-login-form-e2e.mjs --password YOUR_PASSWORD
 *   TEST_LOGIN_PASSWORD=secret node scripts/browser-login-form-e2e.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_LOCAL = resolve(import.meta.dirname, '../.env.local');
const email = 'mgoles@megawide.com.ph';
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

function loadEnvLocal() {
  if (!existsSync(ENV_LOCAL)) return;
  for (const line of readFileSync(ENV_LOCAL, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parsePassword(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--password') {
      return argv[index + 1];
    }
  }

  return process.env.TEST_LOGIN_PASSWORD;
}

loadEnvLocal();

const password = parsePassword(process.argv.slice(2));

if (!password) {
  console.error(
    'Provide password: node scripts/browser-login-form-e2e.mjs --password PASSWORD'
  );
  process.exit(1);
}

const playwright = await import('playwright');
const browser = await playwright.chromium.launch({ headless: true });
const page = await browser.newPage();

const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') {
    consoleErrors.push(message.text());
  }
});

await page.goto(`${appUrl}/login`, { waitUntil: 'networkidle' });
await page.getByLabel('Email *').fill(email);
await page.getByLabel('Password *').fill(password);
await page.getByRole('button', { name: 'Sign In' }).click();

await page.waitForURL('**/dashboard', { timeout: 20000 });

const finalUrl = page.url();
const bodyText = await page.textContent('body');

await browser.close();

console.log('Final URL:', finalUrl);

if (!finalUrl.includes('/dashboard')) {
  console.error('FAILED: did not reach dashboard');
  if (consoleErrors.length) {
    console.error('Console errors:', consoleErrors.join('\n'));
  }
  process.exit(1);
}

if (!bodyText?.includes('Welcome back')) {
  console.error('FAILED: dashboard welcome message missing');
  process.exit(1);
}

console.log('SUCCESS: password login reached dashboard.');
if (consoleErrors.length) {
  console.warn('Console errors:', consoleErrors.join('\n'));
}
