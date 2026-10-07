/**
 * One-time admin utility — reset password for an existing Supabase Auth user.
 * Does not create users or modify public.users.
 *
 * Usage:
 *   npm run reset:user-password -- --user-id UUID --password "NEW_PASSWORD_HERE"
 *
 * Requires in environment or .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY (sign-in verification only)
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createClient } from '@supabase/supabase-js';

const ROOT = resolve(import.meta.dirname, '..');
const ENV_LOCAL = resolve(ROOT, '.env.local');

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    if (token === '--user-id') {
      args.userId = argv[++index]?.trim();
    } else if (token === '--password') {
      args.password = argv[++index];
    }
  }

  return args;
}

function isValidUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function validatePassword(password) {
  if (!password || password.length < 12) {
    return 'Password must be at least 12 characters.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must include a lowercase letter.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include a uppercase letter.';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must include a number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include a special character.';
  }
  return null;
}

function maskEmail(email) {
  if (!email || typeof email !== 'string') {
    return '***';
  }

  const at = email.indexOf('@');
  if (at <= 0) {
    return '***';
  }

  const local = email.slice(0, at);
  const domain = email.slice(at + 1);

  if (local.length <= 1) {
    return `*@${domain}`;
  }

  if (local.length === 2) {
    return `${local[0]}*@${domain}`;
  }

  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 8))}${local.at(-1)}@${domain}`;
}

function printFailure(reason) {
  console.log('FAILURE');
  console.log(`Reason: ${reason}`);
  process.exit(1);
}

loadEnvLocal();

const { userId, password } = parseArgs(process.argv.slice(2));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!userId || !password) {
  printFailure(
    'Missing arguments. Usage: npm run reset:user-password -- --user-id UUID --password "NEW_PASSWORD_HERE"'
  );
}

if (!supabaseUrl || !serviceRoleKey) {
  printFailure('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

if (!isValidUuid(userId)) {
  printFailure('Invalid user ID. Expected a UUID.');
}

const passwordError = validatePassword(password);
if (passwordError) {
  printFailure(passwordError);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data: existingUser, error: lookupError } =
  await admin.auth.admin.getUserById(userId);

if (lookupError) {
  printFailure(`Admin API lookup failed: ${lookupError.message}`);
}

if (!existingUser?.user) {
  printFailure('Auth user not found for the supplied user ID.');
}

const maskedEmail = maskEmail(existingUser.user.email ?? '');

const { data: updatedUser, error: updateError } =
  await admin.auth.admin.updateUserById(userId, { password });

if (updateError) {
  printFailure(`Admin API password reset failed: ${updateError.message}`);
}

if (!updatedUser?.user) {
  printFailure('Admin API returned no user after password reset.');
}

let signInStatus = 'SKIPPED';

if (anonKey && existingUser.user.email) {
  const anon = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: signInError } = await anon.auth.signInWithPassword({
    email: existingUser.user.email,
    password,
  });

  signInStatus = signInError ? 'FAIL' : 'PASS';
}

console.log('SUCCESS');
console.log(`User ID: ${userId}`);
console.log(`Email: ${maskedEmail}`);
console.log(`Sign-in test: ${signInStatus}`);

if (signInStatus === 'FAIL') {
  process.exit(1);
}
