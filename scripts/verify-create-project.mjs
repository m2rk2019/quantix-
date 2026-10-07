/**
 * End-to-end project creation probe (mirrors create-project.ts).
 *
 *   node scripts/verify-create-project.mjs
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
const { data: sessionData, error: verifyError } = await client.auth.verifyOtp({
  email,
  token: otp,
  type: 'email',
});

if (verifyError || !sessionData.user) {
  console.error('Session setup failed:', verifyError?.message ?? 'no user');
  process.exit(1);
}

const userId = sessionData.user.id;
console.log('Authenticated as:', email, `(${userId})`);

const { data: projectCode, error: codeError } = await client.rpc('generate_project_code');

if (codeError || !projectCode) {
  console.error('FAIL  generate_project_code:', codeError?.message ?? 'no code');
  process.exit(1);
}

console.log('OK    generate_project_code:', projectCode);

const suffix = Date.now();
const { data: project, error: projectError } = await client
  .from('projects')
  .insert({
    project_code: projectCode,
    project_name: `RLS Probe ${suffix}`,
    client_name: 'Quantix QA',
    location: 'Test',
    status: 'draft',
    created_by: userId,
    updated_by: userId,
  })
  .select('id, project_code, created_by')
  .single();

if (projectError || !project) {
  console.error('FAIL  projects insert:', projectError?.message ?? 'no row');
  process.exit(1);
}

console.log('OK    projects insert:', project.id, project.project_code);

if (project.created_by !== userId) {
  console.error('FAIL  created_by mismatch:', project.created_by, '!=', userId);
  process.exit(1);
}

const { error: detailsError } = await client.from('project_details').insert({
  project_id: project.id,
  description: 'RLS probe project',
  currency: 'USD',
  rounding_rule: 'half_up',
  measurement_system: 'metric',
  default_unit_system: 'metric_si',
  created_by: userId,
  updated_by: userId,
});

if (detailsError) {
  console.error('FAIL  project_details insert:', detailsError.message);
  process.exit(1);
}

console.log('OK    project_details insert');

const { error: summaryError } = await client.from('estimate_summary').insert({
  project_id: project.id,
  created_by: userId,
  updated_by: userId,
});

if (summaryError) {
  console.error('FAIL  estimate_summary insert:', summaryError.message);
  process.exit(1);
}

console.log('OK    estimate_summary insert');

const { error: cleanupError } = await admin
  .from('projects')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', project.id);

if (cleanupError) {
  console.warn('WARN  cleanup soft-delete:', cleanupError.message);
} else {
  console.log('OK    cleanup soft-delete');
}

console.log('\nProject creation end-to-end OK.');
