/**
 * Safe Supabase connectivity diagnostic (no secrets printed).
 *
 *   npm run diagnose:supabase
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const ENV_LOCAL = resolve(ROOT, '.env.local');
const EXPECTED_URL = 'https://tfpiuuyvknxdegegvqrm.supabase.co';

function loadEnvLocal() {
  if (!existsSync(ENV_LOCAL)) {
    return;
  }

  for (const line of readFileSync(ENV_LOCAL, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function check(label, ok, detail = '') {
  const status = ok ? 'PASS' : 'FAIL';
  console.log(`${status}  ${label}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? '';

let failed = 0;

console.log('Quantix Supabase connectivity diagnostic\n');

if (
  !check(
    'NEXT_PUBLIC_SUPABASE_URL present',
    Boolean(url),
    url ? 'set' : 'missing'
  )
) {
  failed += 1;
}

if (
  !check(
    'NEXT_PUBLIC_SUPABASE_URL format',
    url.startsWith('https://') && !url.endsWith('/') && !/["'\s]/.test(url),
    url ? 'https host without trailing slash/quotes' : 'n/a'
  )
) {
  failed += 1;
}

if (
  !check(
    'NEXT_PUBLIC_SUPABASE_URL matches active project',
    url === EXPECTED_URL,
    url === EXPECTED_URL ? 'expected host' : 'host mismatch'
  )
) {
  failed += 1;
}

if (
  !check(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY present',
    Boolean(anonKey),
    anonKey ? `length=${anonKey.length}` : 'missing'
  )
) {
  failed += 1;
}

const anonLooksValid =
  anonKey.startsWith('sb_publishable_') || anonKey.startsWith('eyJ');
if (
  !check(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY format',
    anonLooksValid && !/["'\s]/.test(anonKey),
    anonLooksValid ? 'publishable/JWT shape' : 'unexpected shape'
  )
) {
  failed += 1;
}

if (
  !check(
    'Anon key is not service-role',
    !anonKey.startsWith('sb_secret_') && anonKey !== serviceKey,
    'browser-safe'
  )
) {
  failed += 1;
}

if (!url || !anonKey) {
  console.log('\nRESULT: FAIL (missing required env)');
  process.exit(1);
}

async function probe(label, requestUrl, init) {
  try {
    const response = await fetch(requestUrl, {
      ...init,
      signal: AbortSignal.timeout(12_000),
    });
    const ok = response.status > 0;
    check(label, ok, `HTTP ${response.status}`);
    return { ok, status: response.status };
  } catch (error) {
    const message =
      error instanceof Error ? error.name + ': ' + error.message : 'unknown';
    check(label, false, message);
    failed += 1;
    return { ok: false, status: 0 };
  }
}

const rest = await probe(
  'REST endpoint reachable',
  `${url}/rest/v1/`,
  {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  }
);

const authHealth = await probe(
  'Auth health endpoint reachable',
  `${url}/auth/v1/health`,
  {
    method: 'GET',
    headers: {
      apikey: anonKey,
    },
  }
);

const authSignIn = await probe(
  'Auth token endpoint reachable (invalid credentials probe)',
  `${url}/auth/v1/token?grant_type=password`,
  {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'connectivity-probe@invalid.local',
      password: 'invalid-password-probe',
    }),
  }
);

if (authSignIn.ok) {
  // Expected auth failure statuses prove network + Auth are reachable.
  const expectedAuthErrors = [400, 401, 403, 422];
  const originDown = [502, 503, 521, 522, 524];

  if (expectedAuthErrors.includes(authSignIn.status)) {
    check(
      'Auth returns normal error (not network failure)',
      true,
      `HTTP ${authSignIn.status}`
    );
  } else if (originDown.includes(authSignIn.status)) {
    check(
      'Auth origin healthy',
      false,
      `HTTP ${authSignIn.status} (project paused or origin down)`
    );
    failed += 1;
    console.log(
      '\nHint: Host resolves, but Auth returned an origin-down status.'
    );
    console.log(
      'Open the Supabase Dashboard and restore/unpause project tfpiuuyvknxdegegvqrm, then re-run npm run diagnose:supabase.'
    );
  } else {
    check(
      'Auth returns normal error (not network failure)',
      false,
      `unexpected HTTP ${authSignIn.status}`
    );
    failed += 1;
  }
} else if (!rest.ok && !authHealth.ok) {
  console.log(
    '\nHint: DNS/network cannot reach the Supabase project host.'
  );
  console.log(
    'Confirm the project still exists in the Supabase Dashboard and update NEXT_PUBLIC_SUPABASE_URL if the project ref changed.'
  );
}

console.log(
  `\nRESULT: ${failed === 0 ? 'PASS' : 'FAIL'} (${failed} issue${failed === 1 ? '' : 's'})`
);
process.exit(failed === 0 ? 0 : 1);
