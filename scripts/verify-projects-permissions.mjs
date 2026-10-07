/**
 * Verify authenticated access to projects (and related tables) after running
 * supabase/fixes/fix-projects-permissions.sql in Supabase SQL Editor.
 *
 *   node scripts/verify-projects-permissions.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ENV_LOCAL = resolve(import.meta.dirname, '../.env.local');
const email = 'mgoles@megawide.com.ph';

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
  console.error('Auth setup failed:', linkError.message);
  process.exit(1);
}

const otp = linkData.properties?.email_otp;
const { error: verifyError } = await client.auth.verifyOtp({
  email,
  token: otp,
  type: 'email',
});

if (verifyError) {
  console.error('Session setup failed:', verifyError.message);
  process.exit(1);
}

const probes = [
  {
    name: 'projects (list query)',
    run: () =>
      client
        .from('projects')
        .select(
          'id, project_code, project_name, creator:users!projects_created_by_fkey(full_name)',
          { count: 'exact', head: false }
        )
        .is('deleted_at', null)
        .limit(5),
  },
  {
    name: 'users (own profile)',
    run: () =>
      client.from('users').select('id, role').limit(1),
  },
  {
    name: 'project_details',
    run: () => client.from('project_details').select('id').limit(1),
  },
  {
    name: 'estimate_summary',
    run: () => client.from('estimate_summary').select('id').limit(1),
  },
  {
    name: 'wbs',
    run: () => client.from('wbs').select('id').limit(1),
  },
  {
    name: 'boq_items',
    run: () => client.from('boq_items').select('id').limit(1),
  },
];

let failed = false;

for (const probe of probes) {
  const { error, count, data } = await probe.run();

  if (error) {
    console.error(`FAIL  ${probe.name}: ${error.message}`);
    failed = true;
    continue;
  }

  const size = count ?? data?.length ?? 0;
  console.log(`OK    ${probe.name} (${size} row(s) visible)`);
}

if (failed) {
  console.error('\nRun supabase/fixes/fix-projects-permissions.sql in Supabase SQL Editor.');
  process.exit(1);
}

console.log('\nAll project permission probes passed.');
