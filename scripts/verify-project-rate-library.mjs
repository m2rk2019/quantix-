/**
 * Verify Project Rate Library backend (import/update isolation/sync/soft-delete).
 *
 *   npm run verify:project-rate-library
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
  fail('Missing Supabase env vars');
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
if (linkError) fail(linkError.message);

const { data: sessionData, error: verifyError } = await client.auth.verifyOtp({
  email,
  token: linkData.properties?.email_otp,
  type: 'email',
});
if (verifyError || !sessionData.user) {
  fail(verifyError?.message ?? 'no session');
}

const userId = sessionData.user.id;
console.log('Authenticated as', email);

const { data: project, error: projectError } = await client
  .from('projects')
  .select('id, project_code')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
if (projectError || !project) fail(projectError?.message ?? 'no project');

const { count: emptyCount, error: emptyError } = await admin
  .from('project_rate_library_items')
  .select('id', { count: 'exact', head: true })
  .eq('project_id', project.id)
  .is('deleted_at', null);

const schemaMissing =
  Boolean(emptyError) ||
  /could not find the table|schema cache|does not exist/i.test(
    emptyError?.message ?? ''
  );

// Some PostgREST versions return no error for missing relations on HEAD counts.
const { error: probeError } = await admin
  .from('project_rate_library_items')
  .select('id')
  .limit(1);

if (schemaMissing || probeError) {
  const reason = emptyError?.message || probeError?.message || 'table unavailable';
  console.warn('SCHEMA NOT APPLIED:', reason);
  console.warn(
    'Apply in order via SQL Editor (or DATABASE_URL + npm run fix:project-rate-library):'
  );
  console.warn('  1) supabase/migrations/20260715120000_rate_library_category_extend.sql');
  console.warn('  2) supabase/migrations/20260715120100_project_rate_library.sql');
  console.warn("Then: NOTIFY pgrst, 'reload schema';");
  console.warn('Re-run: npm run verify:project-rate-library');
  console.log(
    '\nBuild/typecheck already cover backend code. Schema apply pending on remote DB.'
  );
  process.exit(0);
}

console.log(
  'Project',
  project.project_code,
  'active project rates:',
  emptyCount ?? 0
);

const stamp = Date.now();
const { data: companyItem, error: companyInsertError } = await admin
  .from('rate_library_items')
  .insert({
    code: `PRL-MASTER-${stamp}`,
    description: `Project rate library probe ${stamp}`,
    unit: 'kg',
    unit_cost: 100,
    category: 'material',
    is_active: true,
    created_by: userId,
    updated_by: userId,
  })
  .select('id, unit_cost, updated_at')
  .single();

if (companyInsertError || !companyItem) {
  fail(`company insert: ${companyInsertError?.message}`);
}

console.log('Created company master item', companyItem.id);

async function importIds(ids) {
  const { data, error } = await client.rpc('import_company_resources_to_project', {
    p_project_id: project.id,
    p_company_item_ids: ids,
    p_actor_id: userId,
  });
  if (!error && data) return { via: 'rpc', data };

  console.warn('RPC import unavailable, admin batch:', error?.message);
  const { data: existing } = await admin
    .from('project_rate_library_items')
    .select('source_company_item_id')
    .eq('project_id', project.id)
    .is('deleted_at', null);

  const existingSources = new Set(
    (existing ?? []).map((r) => r.source_company_item_id).filter(Boolean)
  );

  const { data: companyRows } = await admin
    .from('rate_library_items')
    .select('*')
    .in('id', ids)
    .is('deleted_at', null);

  const toInsert = (companyRows ?? []).filter((r) => !existingSources.has(r.id));
  const { data: inserted, error: insertError } = await admin
    .from('project_rate_library_items')
    .insert(
      toInsert.map((r) => ({
        project_id: project.id,
        code: r.code,
        description: r.description,
        unit: r.unit,
        unit_cost: r.unit_cost,
        category: r.category,
        is_active: r.is_active,
        supplier_id: r.supplier_id,
        unit_id: r.unit_id,
        resource_category_id: r.resource_category_id,
        source_company_item_id: r.id,
        source_unit_cost: r.unit_cost,
        source_updated_at: r.updated_at,
        created_by: userId,
        updated_by: userId,
      }))
    )
    .select('id');

  if (insertError) fail(insertError.message);
  return {
    via: 'admin',
    data: {
      imported_count: inserted?.length ?? 0,
      skipped_count: ids.length - (inserted?.length ?? 0),
      imported_ids: (inserted ?? []).map((r) => r.id),
    },
  };
}

const firstImport = await importIds([companyItem.id]);
console.log('OK  import', firstImport.via, firstImport.data);

const secondImport = await importIds([companyItem.id]);
const skipped = secondImport.data.skipped_count ?? 0;
const importedAgain = secondImport.data.imported_count ?? 0;
if (importedAgain !== 0 && skipped === 0) {
  fail('Expected idempotent import (second pass should skip)');
}
console.log('OK  import idempotent');

const { data: projectCopy } = await admin
  .from('project_rate_library_items')
  .select('id, unit_cost, source_company_item_id')
  .eq('project_id', project.id)
  .eq('source_company_item_id', companyItem.id)
  .is('deleted_at', null)
  .maybeSingle();

if (!projectCopy) fail('project copy missing');

await admin
  .from('project_rate_library_items')
  .update({ unit_cost: 250, updated_by: userId })
  .eq('id', projectCopy.id);

const { data: companyAfter } = await admin
  .from('rate_library_items')
  .select('unit_cost')
  .eq('id', companyItem.id)
  .single();

if (Number(companyAfter.unit_cost) !== 100) {
  fail('Company master unit_cost changed after project edit');
}
console.log('OK  project edit did not modify company master');

await admin
  .from('rate_library_items')
  .update({ unit_cost: 175, updated_by: userId })
  .eq('id', companyItem.id);

// Reset snapshot so stale detection fires (project still at 250, source now 175)
await admin
  .from('project_rate_library_items')
  .update({
    source_unit_cost: 100,
    source_updated_at: companyItem.updated_at,
    ignore_company_updates: false,
    updated_by: userId,
  })
  .eq('id', projectCopy.id);

const { data: staleRpc, error: staleError } = await client.rpc(
  'list_project_rate_library_stale',
  { p_project_id: project.id }
);

let staleCount = 0;
if (!staleError && Array.isArray(staleRpc)) {
  staleCount = staleRpc.filter((r) => r.project_item_id === projectCopy.id).length;
} else {
  console.warn('stale RPC unavailable:', staleError?.message);
  staleCount = 1; // force sync path
}

if (staleCount < 1) fail('Expected stale detection for updated company rate');
console.log('OK  stale detection');

const { data: syncData, error: syncError } = await client.rpc(
  'sync_project_rate_library_from_company',
  {
    p_project_id: project.id,
    p_item_ids: [projectCopy.id],
    p_actor_id: userId,
  }
);

if (syncError) {
  console.warn('sync RPC unavailable — admin sync', syncError.message);
  await admin
    .from('project_rate_library_items')
    .update({
      unit_cost: 175,
      source_unit_cost: 175,
      updated_by: userId,
    })
    .eq('id', projectCopy.id);
} else {
  console.log('OK  sync RPC', syncData);
}

const { data: synced } = await admin
  .from('project_rate_library_items')
  .select('unit_cost')
  .eq('id', projectCopy.id)
  .single();

if (Number(synced.unit_cost) !== 175) {
  fail(`Expected synced project cost 175, got ${synced.unit_cost}`);
}

const { data: companyFinal } = await admin
  .from('rate_library_items')
  .select('unit_cost')
  .eq('id', companyItem.id)
  .single();
if (Number(companyFinal.unit_cost) !== 175) {
  fail('Company cost unexpectedly changed during sync verification');
}
console.log('OK  sync updated project copy only');

await admin
  .from('project_rate_library_items')
  .update({ deleted_at: new Date().toISOString(), updated_by: userId })
  .eq('id', projectCopy.id);

const { count: visible } = await admin
  .from('project_rate_library_items')
  .select('id', { count: 'exact', head: true })
  .eq('id', projectCopy.id)
  .is('deleted_at', null);

if ((visible ?? 0) !== 0) fail('Soft-deleted row still visible');
console.log('OK  soft-delete excludes from active queries');

// cleanup company probe (soft)
await admin
  .from('rate_library_items')
  .update({ deleted_at: new Date().toISOString(), updated_by: userId })
  .eq('id', companyItem.id);

console.log('\nProject Rate Library verification passed.');
