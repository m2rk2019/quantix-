import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(import.meta.dirname, '../.env.local');
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  const v = t.slice(i + 1).trim();
  if (!(k in process.env)) process.env[k] = v;
}

const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  Accept: 'application/json',
  Prefer: 'count=exact',
};

async function probe(path) {
  const res = await fetch(`${base}/rest/v1/${path}`, { headers });
  const body = await res.text();
  return { status: res.status, body: body.slice(0, 300), cr: res.headers.get('content-range') };
}

const tables = [
  'users',
  'projects',
  'project_details',
  'wbs',
  'boq_items',
  'audit_log',
  'estimate_summary',
  'rate_library_items',
  'boq_rate_analysis_lines',
  'user_rate_library_favorites',
  'company_suppliers',
  'company_units',
  'company_resource_categories',
  'company_settings',
  'project_benchmark_actuals',
  'project_rate_library_items',
  'historical_projects',
  'historical_project_snapshots',
  'historical_boq_lines',
  'historical_resource_rates',
  'tender_submissions',
  'tender_submission_exports',
  'smart_import_profiles',
  'smart_import_jobs',
  'master_templates',
];

console.log('=== TABLES ===');
for (const t of tables) {
  const r = await probe(`${t}?select=id&limit=1`);
  const ok = r.status >= 200 && r.status < 300;
  console.log(ok ? 'OK' : 'MISS', t, r.status, ok ? r.cr : r.body);
}

const cols = [
  'project_details?select=currency&limit=1',
  'project_details?select=is_benchmark&limit=1',
  'project_details?select=assumptions&limit=1',
  'project_details?select=exclusions&limit=1',
  'project_details?select=prepared_by_name&limit=1',
  'project_details?select=smart_import_job_id&limit=1',
  'project_details?select=import_profile_key&limit=1',
  'project_details?select=building_type&limit=1',
  'project_details?select=cfa_sqm&limit=1',
  'project_details?select=is_master_template&limit=1',
  'project_details?select=cloned_from_historical_id&limit=1',
  'boq_items?select=other_cost_rate&limit=1',
  'boq_items?select=ocm_percent&limit=1',
  'boq_rate_analysis_lines?select=waste_percent&limit=1',
  'boq_rate_analysis_lines?select=project_library_item_id&limit=1',
  'rate_library_items?select=supplier_id&limit=1',
  'audit_log?select=project_id&limit=1',
  'smart_import_jobs?select=reconciliation_report&limit=1',
  'smart_import_jobs?select=master_template_id&limit=1',
  'smart_import_jobs?select=analysis&limit=1',
  'smart_import_profiles?select=profile_key&limit=1',
  'master_templates?select=template_key&limit=1',
  'tender_submissions?select=version&limit=1',
  'historical_project_snapshots?select=section&limit=1',
];

console.log('\n=== COLUMNS / OBJECTS ===');
for (const q of cols) {
  const r = await probe(q);
  const ok = r.status >= 200 && r.status < 300;
  console.log(ok ? 'OK' : 'MISS', q.split('?')[0] + '.' + q.match(/select=([^&]+)/)[1], r.status, ok ? '' : r.body);
}

// RPC / functions via rpc endpoint
const rpcs = [
  'get_current_user_profile',
  'sum_boq_total_amount',
  'boq_category_totals',
  'bulk_soft_delete_wbs',
  'can_create_project',
  'can_edit_project_rate_library',
  'import_company_resources_to_project',
  'list_project_rate_library_stale',
  'sync_project_rate_library_from_company',
];

console.log('\n=== RPC ===');
for (const name of rpcs) {
  const res = await fetch(`${base}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const body = await res.text();
  // 404 = missing; other errors mean function exists but bad args
  const missing =
    res.status === 404 ||
    body.includes('Could not find the function') ||
    body.includes('PGRST202');
  console.log(missing ? 'MISS' : 'OK', name, res.status, body.slice(0, 160).replace(/\s+/g, ' '));
}

const openapi = await fetch(`${base}/rest/v1/`, { headers }).then((r) => r.json());
const defs = Object.keys(openapi.definitions || {}).sort();
console.log('\n=== OPENAPI ===');
console.log(defs.join('\n'));

// Try inserting enum value check via rate_library filter - category=service
const enumProbe = await probe(`rate_library_items?select=id&category=eq.service&limit=1`);
console.log('\nENUM service', enumProbe.status, enumProbe.body.slice(0, 200));
const enumProbe2 = await probe(`rate_library_items?select=id&category=eq.productivity&limit=1`);
console.log('ENUM productivity', enumProbe2.status, enumProbe2.body.slice(0, 200));
