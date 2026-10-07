/**
 * Sync public.users role into Supabase Auth metadata (works without table GRANTs).
 *
 * Usage:
 *   node scripts/sync-auth-metadata.mjs --email mgoles@megawide.com.ph --role super_admin
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
    'Usage: node scripts/sync-auth-metadata.mjs --email EMAIL --role ROLE [--name "Full Name"]'
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

  authUser = data.users.find((user) => user.email?.toLowerCase() === email);

  if (authUser || data.users.length < 200) {
    break;
  }

  page += 1;
}

if (!authUser) {
  console.error(`No Supabase Auth user found for email: ${email}`);
  process.exit(1);
}

const fullName = resolveFullName(email, authUser.user_metadata, name);

const { data: updatedUser, error: updateError } = await admin.auth.admin.updateUserById(
  authUser.id,
  {
    app_metadata: {
      ...authUser.app_metadata,
      role,
      profile_active: true,
      quantix_profile_synced: true,
    },
    user_metadata: {
      ...authUser.user_metadata,
      full_name: fullName,
    },
  }
);

if (updateError) {
  console.error(`Auth metadata sync failed: ${updateError.message}`);
  process.exit(1);
}

console.log('Auth metadata synced successfully.');
console.log(`  Auth ID:   ${updatedUser.user.id}`);
console.log(`  Email:     ${updatedUser.user.email}`);
console.log(`  Role:      ${role}`);
console.log(`  Full name: ${fullName}`);
