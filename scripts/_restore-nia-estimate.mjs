import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!(k in process.env)) process.env[k] = v;
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NIA_ID = 'd387f1f1-4271-4e35-832c-e30ba2cb0e66';
const before = JSON.parse(
  readFileSync('docs/_BEFORE_NIA_STREVI_SNAPSHOT_FULL.json', 'utf8')
).nia_db;

const { count: activeBoq } = await sb
  .from('boq_items')
  .select('*', { count: 'exact', head: true })
  .eq('project_id', NIA_ID)
  .is('deleted_at', null);
const { count: deletedBoq } = await sb
  .from('boq_items')
  .select('*', { count: 'exact', head: true })
  .eq('project_id', NIA_ID)
  .not('deleted_at', 'is', null);

const { data: boq } = await sb
  .from('boq_items')
  .select('total_amount')
  .eq('project_id', NIA_ID)
  .is('deleted_at', null);
const sum = (boq || []).reduce((s, r) => s + Number(r.total_amount || 0), 0);

const { data: summary } = await sb
  .from('estimate_summary')
  .select('*')
  .eq('project_id', NIA_ID)
  .maybeSingle();

console.log(
  JSON.stringify(
    {
      activeBoq,
      deletedBoq,
      sum: Math.round(sum * 100) / 100,
      summary,
      beforeEstimate: before.estimate,
    },
    null,
    2
  )
);

// Restore estimate to BEFORE
const { error } = await sb
  .from('estimate_summary')
  .update({
    direct_cost: before.estimate.direct_cost,
    indirect_cost: before.estimate.indirect_cost,
    contingency: before.estimate.contingency,
    markup: before.estimate.markup,
    vat: before.estimate.vat,
    grand_total: before.estimate.grand_total,
  })
  .eq('project_id', NIA_ID);
console.log('restore estimate error', error?.message || null);

const { data: summary2 } = await sb
  .from('estimate_summary')
  .select('direct_cost, grand_total')
  .eq('project_id', NIA_ID)
  .maybeSingle();
console.log('after restore', summary2);
