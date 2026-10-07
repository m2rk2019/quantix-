/**
 * Link an existing Supabase Auth user to public.users (no auth user creation).
 *
 * Usage:
 *   npm run provision:profile -- --email mgoles@megawide.com.ph --role super_admin
 *   npm run provision:profile -- --email user@company.com --role admin --name "Full Name"
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ROOT = resolve(import.meta.dirname, '..');
const ENV_LOCAL = resolve(ROOT, '.env.local');

const VALID_ROLES = new Set([
  'super_admin',
  'admin',
  'estimator',
  'quantity_surveyor',
  'viewer',
]);

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
    } else if (token === '--name') {
      args.name = argv[++index];
    } else if (token === '--role') {
      args.role = argv[++index];
    }
  }

  return args;
}

function resolveFullName(email, metadata, explicitName) {
  if (explicitName?.trim()) {
    return explicitName.trim();
  }

  const fromMetadata = metadata?.full_name;
  if (typeof fromMetadata === 'string' && fromMetadata.trim()) {
    return fromMetadata.trim();
  }

  const localPart = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  return localPart || email;
}

loadEnvLocal();

const { email, name, role } = parseArgs(process.argv.slice(2));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !role) {
  console.error(
    'Usage: npm run provision:profile -- --email EMAIL --role ROLE [--name "Full Name"]'
  );
  process.exit(1);
}

if (!VALID_ROLES.has(role)) {
  console.error(`Invalid role. Must be one of: ${[...VALID_ROLES].join(', ')}`);
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let authUser = null;
let page = 1;

while (!authUser) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });

  if (error) {
    console.error(`Failed to list auth users: ${error.message}`);
    process.exit(1);
  }

  authUser = data.users.find(
    (user) => user.email?.toLowerCase() === email
  );

  if (authUser || data.users.length < 200) {
    break;
  }

  page += 1;
}

if (!authUser) {
  console.error(`No Supabase Auth user found for email: ${email}`);
  process.exit(1);
}

const userId = authUser.id;
const profileEmail = authUser.email ?? email;
const fullName = resolveFullName(profileEmail, authUser.user_metadata, name);

const { data: existingById, error: existingByIdError } = await admin
  .from('users')
  .select('id, email, role, deleted_at')
  .eq('id', userId)
  .maybeSingle();

if (existingByIdError) {
  const message = existingByIdError.message ?? 'Profile lookup failed';
  if (message.includes('schema cache') || message.includes('PGRST205')) {
    console.error(
      'public.users does not exist yet. Apply migrations first:\n' +
        '  npm run db:combine-migrations\n' +
        '  Then run supabase/apply-all-migrations.sql in Supabase SQL Editor.'
    );
  } else {
    console.error(`Profile lookup failed: ${message}`);
  }
  process.exit(1);
}

if (existingById && !existingById.deleted_at) {
  if (existingById.role === role) {
    console.log('Profile already provisioned (no changes needed).');
  } else {
    const { error: updateError } = await admin
      .from('users')
      .update({ role, full_name: fullName, email: profileEmail })
      .eq('id', userId);

    if (updateError) {
      console.error(`Profile update failed: ${updateError.message}`);
      process.exit(1);
    }

    console.log(`Profile updated: role set to ${role}.`);
  }

  console.log(`  Auth ID:    ${userId}`);
  console.log(`  Profile ID: ${existingById.id}`);
  console.log(`  IDs match:  ${userId === existingById.id}`);
  console.log(`  Email:      ${profileEmail}`);
  console.log(`  Role:       ${role}`);
  process.exit(0);
}

const { data: emailConflict, error: emailConflictError } = await admin
  .from('users')
  .select('id')
  .eq('email', profileEmail)
  .is('deleted_at', null)
  .maybeSingle();

if (emailConflictError) {
  console.error(`Email conflict check failed: ${emailConflictError.message}`);
  process.exit(1);
}

if (emailConflict && emailConflict.id !== userId) {
  console.error(
    `Cannot provision: active profile exists for ${profileEmail} with a different id.`
  );
  process.exit(1);
}

const { error: insertError } = await admin.from('users').insert({
  id: userId,
  email: profileEmail,
  full_name: fullName,
  role,
});

if (insertError) {
  console.error(`public.users insert failed: ${insertError.message}`);
  process.exit(1);
}

const { data: verifiedProfile, error: verifyError } = await admin
  .from('users')
  .select('id, email, role')
  .eq('id', userId)
  .single();

if (verifyError || !verifiedProfile) {
  console.error(`Verification failed: ${verifyError?.message ?? 'No profile returned'}`);
  process.exit(1);
}

console.log('Profile provisioned successfully.');
console.log(`  Auth ID:    ${userId}`);
console.log(`  Profile ID: ${verifiedProfile.id}`);
console.log(`  IDs match:  ${userId === verifiedProfile.id}`);
console.log(`  Email:      ${verifiedProfile.email}`);
console.log(`  Role:       ${verifiedProfile.role}`);
