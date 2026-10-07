/**
 * Browser E2E: establish Supabase session cookies and verify /dashboard loads.
 * Uses admin OTP (no password required) to validate middleware + session after code fixes.
 *
 *   node scripts/browser-dashboard-e2e.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

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

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('Missing Supabase env vars.');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const client = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
});

if (linkError) {
  console.error('generateLink failed:', linkError.message);
  process.exit(1);
}

const otp = linkData.properties?.email_otp;
if (!otp) {
  console.error('No OTP from generateLink');
  process.exit(1);
}

const { data: verifyData, error: verifyError } = await client.auth.verifyOtp({
  email,
  token: otp,
  type: 'email',
});

if (verifyError || !verifyData.session) {
  console.error('verifyOtp failed:', verifyError?.message ?? 'no session');
  process.exit(1);
}

const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
const cookieName = `sb-${projectRef}-auth-token`;
const cookieValue = JSON.stringify({
  access_token: verifyData.session.access_token,
  refresh_token: verifyData.session.refresh_token,
  expires_at: verifyData.session.expires_at,
  expires_in: verifyData.session.expires_in,
  token_type: verifyData.session.token_type,
  user: verifyData.user,
});

let playwright;
try {
  playwright = await import('playwright');
} catch {
  console.error('Install playwright: npm install -D playwright && npx playwright install chromium');
  process.exit(1);
}

const browser = await playwright.chromium.launch({ headless: true });
const context = await browser.newContext();
await context.addCookies([
  {
    name: cookieName,
    value: encodeURIComponent(cookieValue),
    domain: 'localhost',
    path: '/',
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  },
]);

const page = await context.newPage();
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') {
    consoleErrors.push(message.text());
  }
});

const response = await page.goto(`${appUrl}/dashboard`, {
  waitUntil: 'networkidle',
  timeout: 30000,
});

const finalUrl = page.url();
const status = response?.status();
const bodyText = await page.textContent('body');

await browser.close();

console.log('Dashboard request status:', status);
console.log('Final URL:', finalUrl);

if (finalUrl.includes('/login')) {
  console.error('FAILED: redirected to login');
  if (consoleErrors.length) {
    console.error('Browser console errors:', consoleErrors.join('\n'));
  }
  process.exit(1);
}

if (!bodyText?.includes('Dashboard')) {
  console.error('FAILED: dashboard content not found');
  process.exit(1);
}

console.log('SUCCESS: dashboard loaded after authenticated session.');
if (consoleErrors.length) {
  console.warn('Browser console errors (non-fatal):', consoleErrors.join('\n'));
}
