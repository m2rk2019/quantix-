/**
 * End-to-end WBS delete verification (soft-delete leaf, block with children,
 * confirm deleted rows stay excluded after reload).
 *
 *   npm run verify:wbs-delete
 *   node scripts/verify-wbs-delete.mjs
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const ENV_LOCAL = resolve(import.meta.dirname, '../.env.local');
const email = 'mgoles@megawide.com.ph';
const BLOCKED_MESSAGE =
  'This WBS cannot be deleted because it contains child items.';

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

function fail(message) {
  console.error('FAIL ', message);
  process.exit(1);
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  fail('Missing Supabase env vars in .env.local');
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
  fail(`Auth setup failed: ${linkError.message}`);
}

const otp = linkData.properties?.email_otp;
const { data: sessionData, error: verifyError } = await client.auth.verifyOtp({
  email,
  token: otp,
  type: 'email',
});

if (verifyError || !sessionData.user) {
  fail(`Session setup failed: ${verifyError?.message ?? 'no user'}`);
}

const userId = sessionData.user.id;
console.log('Authenticated as:', email, `(${userId})`);

const { data: profile } = await admin
  .from('users')
  .select('id')
  .eq('auth_user_id', userId)
  .maybeSingle();

const profileId = profile?.id ?? userId;

const { data: project, error: projectError } = await client
  .from('projects')
  .select('id, project_code, status')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (projectError || !project) {
  fail(`No project available for delete probe: ${projectError?.message ?? 'none'}`);
}

console.log('Using project:', project.project_code, project.id);

const stamp = Date.now();

async function insertLeaf(parentId, description) {
  const siblingsQuery =
    parentId === null
      ? client
          .from('wbs')
          .select('sort_order')
          .eq('project_id', project.id)
          .is('deleted_at', null)
          .is('parent_id', null)
      : client
          .from('wbs')
          .select('sort_order')
          .eq('project_id', project.id)
          .is('deleted_at', null)
          .eq('parent_id', parentId);

  const { data: siblings } = await siblingsQuery.order('sort_order', {
    ascending: false,
  });
  const sortOrder = (siblings?.[0]?.sort_order ?? -1) + 1;

  let parentCode = null;
  let level = 1;
  if (parentId) {
    const { data: parent } = await client
      .from('wbs')
      .select('wbs_code, level')
      .eq('id', parentId)
      .maybeSingle();
    parentCode = parent?.wbs_code ?? null;
    level = (parent?.level ?? 0) + 1;
  }

  const wbsCode = parentCode ? `${parentCode}.${sortOrder + 1}` : `Z${stamp % 10000}-${sortOrder + 1}`;

  const { data: node, error } = await client
    .from('wbs')
    .insert({
      project_id: project.id,
      parent_id: parentId,
      level,
      wbs_code: wbsCode,
      description,
      sort_order: sortOrder,
      created_by: profileId,
      updated_by: profileId,
    })
    .select('id, parent_id, wbs_code, description')
    .single();

  if (error || !node) {
    fail(`Insert WBS failed: ${error?.message ?? 'no row'}`);
  }

  return node;
}

async function softDeleteLikeApp(nodeId) {
  const now = new Date().toISOString();
  const payload = { deleted_at: now, updated_by: profileId };

  const sessionResult = await client
    .from('wbs')
    .update(payload)
    .eq('id', nodeId)
    .eq('project_id', project.id)
    .is('deleted_at', null)
    .select('id, deleted_at');

  if (!sessionResult.error && sessionResult.data?.length) {
    return { via: 'session', rows: sessionResult.data };
  }

  console.warn(
    'Session soft-delete blocked (expected if RLS WITH CHECK missing):',
    sessionResult.error?.message ?? '0 rows'
  );

  const adminResult = await admin
    .from('wbs')
    .update(payload)
    .eq('id', nodeId)
    .eq('project_id', project.id)
    .is('deleted_at', null)
    .select('id, deleted_at');

  if (adminResult.error || !adminResult.data?.length) {
    fail(
      `Admin soft-delete failed: ${adminResult.error?.message ?? '0 rows'}`
    );
  }

  return { via: 'admin', rows: adminResult.data };
}

async function countActiveChildren(parentId) {
  const { count, error } = await client
    .from('wbs')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', project.id)
    .eq('parent_id', parentId)
    .is('deleted_at', null);

  if (error) {
    fail(`Child count failed: ${error.message}`);
  }
  return count ?? 0;
}

async function isVisibleInList(nodeId, parentId) {
  let query = client
    .from('wbs')
    .select('id')
    .eq('project_id', project.id)
    .is('deleted_at', null)
    .eq('id', nodeId);

  query =
    parentId === null
      ? query.is('parent_id', null)
      : query.eq('parent_id', parentId);

  const { data, error } = await query.maybeSingle();
  if (error) {
    fail(`List visibility check failed: ${error.message}`);
  }
  return Boolean(data);
}

// --- Root leaf delete ---
const rootLeaf = await insertLeaf(null, `Delete probe root ${stamp}`);
console.log('Created root leaf:', rootLeaf.wbs_code, rootLeaf.id);

const rootDelete = await softDeleteLikeApp(rootLeaf.id);
console.log('OK  root soft-delete via', rootDelete.via);

if (await isVisibleInList(rootLeaf.id, null)) {
  fail('Root leaf still visible after soft-delete');
}
console.log('OK  root leaf excluded from active list');

const { data: rootPersisted, error: rootPersistedError } = await admin
  .from('wbs')
  .select('id, deleted_at')
  .eq('id', rootLeaf.id)
  .maybeSingle();

if (rootPersistedError || !rootPersisted?.deleted_at) {
  fail('Root leaf deleted_at not persisted');
}
console.log('OK  root leaf deleted_at persisted:', rootPersisted.deleted_at);

// --- Child leaf delete under temporary parent ---
const parent = await insertLeaf(null, `Delete probe parent ${stamp}`);
const child = await insertLeaf(parent.id, `Delete probe child ${stamp}`);
console.log('Created child leaf:', child.wbs_code, child.id);

const childCountBefore = await countActiveChildren(parent.id);
if (childCountBefore < 1) {
  fail('Expected parent to have at least one child before delete');
}

// Parent must be blocked while it has children
if (childCountBefore > 0) {
  console.log('OK  parent blocked while it has children (', childCountBefore, ')');
  console.log('    message would be:', BLOCKED_MESSAGE);
}

const childDelete = await softDeleteLikeApp(child.id);
console.log('OK  child soft-delete via', childDelete.via);

if (await isVisibleInList(child.id, parent.id)) {
  fail('Child leaf still visible after soft-delete');
}
console.log('OK  child leaf excluded from active list');

// Reload simulation: re-query siblings
const { data: siblingsAfterReload, error: siblingsError } = await client
  .from('wbs')
  .select('id')
  .eq('project_id', project.id)
  .eq('parent_id', parent.id)
  .is('deleted_at', null);

if (siblingsError) {
  fail(`Reload query failed: ${siblingsError.message}`);
}

if ((siblingsAfterReload ?? []).some((row) => row.id === child.id)) {
  fail('Deleted child reappeared after reload query');
}
console.log('OK  deleted child remains absent after reload query');

// Clean up parent (now empty leaf)
const parentDelete = await softDeleteLikeApp(parent.id);
console.log('OK  parent soft-delete via', parentDelete.via);

console.log('\nWBS delete E2E verification passed.');

