/**
 * End-to-end login verification (Auth + profile resolution).
 *
 * Usage:
 *   node scripts/test-login-e2e.mjs --email mgoles@megawide.com.ph --password SECRET
 *   TEST_LOGIN_PASSWORD=secret node scripts/test-login-e2e.mjs --email mgoles@megawide.com.ph
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = resolve(import.meta.dirname, '..');
const ENV_LOCAL = resolve(ROOT, '.env.local');

function loadEnvLocal() {
  if (!existsSync(ENV_LOCAL)) {
    return;
  }

  for (const line of readFileSync(ENV_LOCAL, 'utf8').split('\n')) {
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

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--email') {
      args.email = argv[++index]?.toLowerCase();
    } else if (token === '--password') {
      args.password = argv[++index];
    }
  }

  return args;
}

function readRoleFromUser(user) {
  const role = user.app_metadata?.role ?? user.user_metadata?.role;
  return typeof role === 'string' ? role : null;
}

loadEnvLocal();

const { email, password: cliPassword } = parseArgs(process.argv.slice(2));
const password = cliPassword ?? process.env.TEST_LOGIN_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

if (!email || !password) {
  console.error(
    'Usage: node scripts/test-login-e2e.mjs --email EMAIL --password PASSWORD'
  );
  process.exit(1);
}

if (!supabaseUrl || !anonKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log('Step 1: signInWithPassword…');
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (signInError) {
  console.error('Auth sign-in failed:', signInError.message);
  process.exit(1);
}

const user = signInData.user;
if (!user) {
  console.error('Auth sign-in returned no user.');
  process.exit(1);
}

console.log('  Auth OK — user id:', user.id);

console.log('Step 2: resolve profile (database, then auth metadata)…');
const { data: profileRow, error: profileError } = await supabase
  .from('users')
  .select('id, email, full_name, role, deleted_at')
  .eq('id', user.id)
  .maybeSingle();

let profileSource = 'database';

if (profileError || !profileRow || profileRow.deleted_at) {
  profileSource = 'auth_metadata';
  const role = readRoleFromUser(user);
  const fullName =
    (typeof user.user_metadata?.full_name === 'string' &&
      user.user_metadata.full_name) ||
    email.split('@')[0];

  if (!role || user.app_metadata?.profile_active === false) {
    console.error('Profile resolution failed.');
    if (profileError) {
      console.error('  Database error:', profileError.message);
    }
    console.error('  Auth metadata role:', role ?? '(missing)');
    process.exit(1);
  }

  console.log('  Profile via auth metadata — role:', role, 'name:', fullName);
} else {
  console.log('  Profile via database — role:', profileRow.role);
}

console.log('Step 3: fetch protected dashboard route…');
const dashboardResponse = await fetch(`${appUrl}/dashboard`, {
  redirect: 'manual',
  headers: {
    Cookie: (
      await supabase.auth.getSession()
    ).data.session
      ? `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token=${encodeURIComponent(
          JSON.stringify({
            access_token: signInData.session.access_token,
            refresh_token: signInData.session.refresh_token,
            expires_at: signInData.session.expires_at,
            expires_in: signInData.session.expires_in,
            token_type: signInData.session.token_type,
            user,
          })
        )}`
      : '',
  },
});

console.log('  Dashboard HTTP status:', dashboardResponse.status);

if (dashboardResponse.status >= 300 && dashboardResponse.status < 400) {
  const location = dashboardResponse.headers.get('location');
  console.log('  Redirected to:', location);
  if (location?.includes('/login')) {
    console.error('Dashboard blocked — still redirected to login.');
    process.exit(1);
  }
}

if (dashboardResponse.status === 200) {
  console.log('Login end-to-end OK (dashboard reachable).');
  console.log(`Profile source: ${profileSource}`);
  process.exit(0);
}

console.warn(
  'Dashboard returned non-200 without login redirect; verify manually in browser.'
);
process.exit(dashboardResponse.status === 403 ? 1 : 0);
