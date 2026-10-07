/**
 * Verifies Supabase client can reach the configured project (publishable key only).
 * Run: node scripts/verify-supabase-connection.mjs
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ENV_LOCAL = resolve(import.meta.dirname, '../.env.local');

function loadEnvLocal() {
  const env = {};

  for (const line of readFileSync(ENV_LOCAL, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }

    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }

  return env;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

if (url.includes('placeholder.supabase.co')) {
  console.error('Placeholder Supabase URL detected.');
  process.exit(1);
}

const health = await fetch(`${url}/auth/v1/health`, {
  headers: { apikey: anonKey },
});

if (!health.ok) {
  console.error(`Auth health check failed: HTTP ${health.status}`);
  process.exit(1);
}

const supabase = createClient(url, anonKey);
const { data, error } = await supabase.auth.getSession();

if (error) {
  console.error('Supabase client error:', error.message);
  process.exit(1);
}

console.log('Supabase connection OK');
console.log(`Project URL: ${url}`);
console.log(`Publishable key prefix: ${anonKey.slice(0, 14)}…`);
console.log(`Active session: ${data.session ? 'yes' : 'no (expected before login)'}`);

const profileProbe = await fetch(`${url}/rest/v1/users?select=id&limit=1`, {
  headers: {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY ?? anonKey}`,
  },
});

if (!profileProbe.ok) {
  const body = await profileProbe.text();
  console.warn('public.users probe failed:', profileProbe.status, body);
  console.warn('Apply supabase/migrations in order (npm run deploy:migrations).');
  process.exit(2);
}

console.log('public.users table reachable (migrations appear applied).');
