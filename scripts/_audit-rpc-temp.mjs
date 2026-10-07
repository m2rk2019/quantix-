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
  'Content-Type': 'application/json',
};

async function rpc(name, body) {
  const res = await fetch(`${base}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, text: text.slice(0, 220) };
}

const projectId = (
  await fetch(`${base}/rest/v1/projects?select=id&limit=1`, { headers }).then((r) =>
    r.json(),
  )
)[0]?.id;

console.log('projectId', projectId);

const checks = [
  ['sum_boq_total_amount', { p_project_id: projectId }],
  ['boq_category_totals', { p_project_id: projectId }],
  ['boq_direct_totals_by_wbs', { p_project_id: projectId }],
  ['bulk_soft_delete_wbs', { p_project_id: projectId, p_node_ids: [] }],
  ['can_edit_project_rate_library', { p_project_id: projectId }],
  ['list_project_rate_library_stale', { p_project_id: projectId }],
  ['import_company_resources_to_project', { p_project_id: projectId, p_company_item_ids: [], p_actor: null }],
  ['sync_project_rate_library_from_company', { p_project_id: projectId, p_item_ids: null, p_actor: null }],
];

for (const [name, body] of checks) {
  const r = await rpc(name, body);
  const missing =
    r.status === 404 &&
    (r.text.includes('Could not find the function') || r.text.includes('PGRST202'));
  // PGRST202 with "no matches" after searching named args = missing
  // any other status (200, 400, 403, 409) = function exists
  const exists = !(
    r.text.includes('Could not find the function') ||
    (r.status === 404 && r.text.includes('PGRST202') && r.text.includes('no matches'))
  );
  console.log(exists ? 'FN_OK' : 'FN_MISS', name, r.status, r.text.replace(/\s+/g, ' '));
}

const fav = await fetch(
  `${base}/rest/v1/user_rate_library_favorites?select=user_id,rate_library_item_id&limit=1`,
  { headers },
);
console.log('favorites', fav.status, (await fav.text()).slice(0, 200));

const cs = await fetch(
  `${base}/rest/v1/company_settings?select=default_currency&limit=1`,
  { headers },
);
console.log('currency', await cs.json());

const pd = await fetch(
  `${base}/rest/v1/project_details?select=currency&limit=3`,
  { headers },
);
console.log('project currencies', await pd.json());
