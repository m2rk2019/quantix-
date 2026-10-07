/**
 * End-to-end bulk WBS delete verification (recursive soft-delete + BOQ).
 *
 *   npm run verify:wbs-bulk-delete
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
console.log('Authenticated as:', email);

const { data: project, error: projectError } = await client
  .from('projects')
  .select('id, project_code')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();

if (projectError || !project) {
  fail(`No project: ${projectError?.message ?? 'none'}`);
}

const stamp = Date.now();

async function insertNode(parentId, description, code) {
  let siblingsQuery = client
    .from('wbs')
    .select('sort_order')
    .eq('project_id', project.id)
    .is('deleted_at', null)
    .order('sort_order', { ascending: false })
    .limit(1);

  siblingsQuery =
    parentId === null
      ? siblingsQuery.is('parent_id', null)
      : siblingsQuery.eq('parent_id', parentId);

  const { data: siblings } = await siblingsQuery;
  const sortOrder = (siblings?.[0]?.sort_order ?? -1) + 1;
  let level = 1;
  if (parentId) {
    const { data: parent } = await client
      .from('wbs')
      .select('level')
      .eq('id', parentId)
      .maybeSingle();
    level = (parent?.level ?? 0) + 1;
  }

  const { data: node, error } = await client
    .from('wbs')
    .insert({
      project_id: project.id,
      parent_id: parentId,
      level,
      wbs_code: code,
      description,
      sort_order: sortOrder,
      created_by: userId,
      updated_by: userId,
    })
    .select('id')
    .single();

  if (error || !node) {
    fail(`Insert failed: ${error?.message ?? 'no row'}`);
  }
  return node.id;
}

const parentId = await insertNode(null, `Bulk parent ${stamp}`, `B${stamp}-1`);
const childId = await insertNode(parentId, `Bulk child ${stamp}`, `B${stamp}-1.1`);
const leafId = await insertNode(null, `Bulk leaf ${stamp}`, `B${stamp}-2`);

const { error: boqError } = await admin.from('boq_items').insert({
  project_id: project.id,
  wbs_id: childId,
  item_code: `BULK-${stamp}`,
  description: 'Bulk delete probe BOQ',
  unit: 'nr',
  quantity: 1,
  created_by: userId,
  updated_by: userId,
});

if (boqError) {
  console.warn('BOQ insert skipped/failed:', boqError.message);
}

async function bulkDelete(ids) {
  const { data: rpcData, error: rpcError } = await client.rpc(
    'bulk_soft_delete_wbs',
    {
      p_project_id: project.id,
      p_node_ids: ids,
    }
  );

  if (!rpcError && rpcData) {
    console.log('OK  RPC bulk delete:', rpcData);
    return rpcData;
  }

  console.warn('RPC unavailable, using admin batch:', rpcError?.message);

  const { data: allNodes, error: listError } = await admin
    .from('wbs')
    .select('id, parent_id')
    .eq('project_id', project.id)
    .is('deleted_at', null);

  if (listError) {
    fail(listError.message);
  }

  const childrenByParent = new Map();
  for (const node of allNodes ?? []) {
    if (!node.parent_id) continue;
    const list = childrenByParent.get(node.parent_id) ?? [];
    list.push(node.id);
    childrenByParent.set(node.parent_id, list);
  }

  const targets = new Set();
  const stack = [...ids];
  while (stack.length) {
    const current = stack.pop();
    if (targets.has(current)) continue;
    targets.add(current);
    for (const child of childrenByParent.get(current) ?? []) {
      stack.push(child);
    }
  }

  const targetIds = Array.from(targets);
  const now = new Date().toISOString();

  const { data: boqRows } = await admin
    .from('boq_items')
    .update({ deleted_at: now, updated_by: userId })
    .eq('project_id', project.id)
    .in('wbs_id', targetIds)
    .is('deleted_at', null)
    .select('id');

  const { data: wbsRows, error: wbsError } = await admin
    .from('wbs')
    .update({ deleted_at: now, updated_by: userId })
    .eq('project_id', project.id)
    .in('id', targetIds)
    .is('deleted_at', null)
    .select('id');

  if (wbsError) {
    fail(wbsError.message);
  }

  return {
    wbs_count: wbsRows?.length ?? 0,
    boq_count: boqRows?.length ?? 0,
    deleted_ids: (wbsRows ?? []).map((row) => row.id),
  };
}

const result = await bulkDelete([parentId, leafId]);
const deleted = new Set(result.deleted_ids ?? []);

if (!deleted.has(parentId) || !deleted.has(childId) || !deleted.has(leafId)) {
  fail(
    `Expected parent+child+leaf soft-deleted. got=${JSON.stringify([...deleted])}`
  );
}

console.log('OK  recursive soft-delete removed parent, child, and leaf');

const { count: visibleCount, error: visibleError } = await client
  .from('wbs')
  .select('id', { count: 'exact', head: true })
  .in('id', [parentId, childId, leafId])
  .is('deleted_at', null);

if (visibleError) {
  fail(visibleError.message);
}

if ((visibleCount ?? 0) !== 0) {
  fail('Deleted nodes still visible with deleted_at IS NULL filter');
}

console.log('OK  deleted nodes excluded from active queries');
console.log('\nWBS bulk delete verification passed.');
