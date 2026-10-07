import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = readFileSync('.env.local', 'utf8');
const get = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'));
  return m?.[1]?.trim().replace(/^["']|["']$/g, '');
};
const url = get('NEXT_PUBLIC_SUPABASE_URL');
const key = get('SUPABASE_SERVICE_ROLE_KEY') || get('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const sb = createClient(url, key);

const { data: projects } = await sb
  .from('projects')
  .select('id, project_code, name')
  .ilike('project_code', '%000017%');
console.log('projects', projects);
const pid = projects?.[0]?.id;
if (!pid) process.exit(0);

const { data: summary } = await sb
  .from('estimate_summary')
  .select('direct_cost, grand_total')
  .eq('project_id', pid)
  .maybeSingle();
const { data: boq, error } = await sb
  .from('boq_items')
  .select('id, description, amount, quantity, unit, item_number')
  .eq('project_id', pid);
console.log('summary', summary, 'boq count', boq?.length, error?.message);
const sum = (boq || []).reduce((s, r) => s + Number(r.amount || 0), 0);
console.log('db boq sum', sum);

for (const re of [
  /Maintenance Crew/i,
  /Security Grills/i,
  /MC2 Typ/i,
  /KW-hr Meter Base/i,
  /MAIN: 100AT/i,
  /House Keeping/i,
]) {
  const hits = (boq || []).filter((b) => re.test(b.description));
  console.log(
    String(re),
    hits.map((h) => ({ d: h.description.slice(0, 55), a: h.amount }))
  );
}
