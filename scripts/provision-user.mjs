/**
 * Provision a Supabase Auth user and matching public.users profile.
 * For V1 manual user onboarding — run from a secure operator workstation only.
 *
 * Usage:
 *   npm run deploy:provision-user -- --email user@company.com --name "Full Name" --role estimator --password 'Secret123!'
 *
 * Requires in environment or .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
      args.email = argv[++index];
    } else if (token === '--name') {
      args.name = argv[++index];
    } else if (token === '--role') {
      args.role = argv[++index];
    } else if (token === '--password') {
      args.password = argv[++index];
    }
  }

  return args;
}

loadEnvLocal();

const { email, name, role, password } = parseArgs(process.argv.slice(2));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !name || !role || !password) {
  console.error(
    'Usage: npm run deploy:provision-user -- --email EMAIL --name "Full Name" --role ROLE --password PASS'
  );
  process.exit(1);
}

if (!VALID_ROLES.has(role)) {
  console.error(`Invalid role. Must be one of: ${[...VALID_ROLES].join(', ')}`);
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.'
  );
  process.exit(1);
}

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json',
};

const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  }),
});

if (!createUserResponse.ok) {
  const errorBody = await createUserResponse.text();
  console.error(`Auth user creation failed (${createUserResponse.status}): ${errorBody}`);
  process.exit(1);
}

const authUser = await createUserResponse.json();
const userId = authUser.id;

const profileResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
  method: 'POST',
  headers: {
    ...headers,
    Prefer: 'return=minimal',
  },
  body: JSON.stringify({
    id: userId,
    email,
    full_name: name,
    role,
  }),
});

if (!profileResponse.ok) {
  const errorBody = await profileResponse.text();
  console.error(
    `public.users insert failed (${profileResponse.status}): ${errorBody}`
  );
  console.error(`Auth user ${userId} was created — insert profile manually or delete auth user.`);
  process.exit(1);
}

console.log('User provisioned successfully.');
console.log(`  ID:    ${userId}`);
console.log(`  Email: ${email}`);
console.log(`  Role:  ${role}`);
