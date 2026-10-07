/**
 * Verify auth sign-in and profile resolution without the user's password.
 * Uses service-role generateLink + verifyOtp (magic link OTP).
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ENV_LOCAL = resolve(import.meta.dirname, '../.env.local');

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

loadEnvLocal();

const email = (process.argv[2] ?? 'mgoles@megawide.com.ph').toLowerCase();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  console.error('Missing Supabase env vars in .env.local');
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
  console.error('No email_otp returned from generateLink');
  process.exit(1);
}

const { data: verifyData, error: verifyError } = await client.auth.verifyOtp({
  email,
  token: otp,
  type: 'email',
});

if (verifyError) {
  console.error('verifyOtp failed:', verifyError.message);
  process.exit(1);
}

const user = verifyData.user;
if (!user) {
  console.error('No user after verifyOtp');
  process.exit(1);
}

console.log('Auth session established for:', user.email);

const role = user.app_metadata?.role ?? user.user_metadata?.role;
const fullName = user.user_metadata?.full_name;

console.log('Auth metadata role:', role ?? '(missing)');
console.log('Auth metadata full_name:', fullName ?? '(missing)');

const { data: profileRow, error: profileError } = await client
  .from('users')
  .select('id, role, deleted_at')
  .eq('id', user.id)
  .maybeSingle();

if (profileError) {
  console.log('Database profile query:', profileError.message);
} else if (profileRow) {
  console.log('Database profile role:', profileRow.role);
} else {
  console.log('Database profile: not found');
}

if (!role) {
  console.error('Profile resolution would fail — no role in auth metadata.');
  process.exit(1);
}

console.log('Auth + profile resolution OK');
