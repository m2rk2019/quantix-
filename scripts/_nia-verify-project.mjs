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

const projectId = process.argv[2] || 'd387f1f1-4271-4e35-832c-e30ba2cb0e66';

const { data: project } = await sb
  .from('projects')
  .select('id,project_code,project_name')
  .eq('id', projectId)
  .single();

const { data: wbs } = await sb
  .from('wbs')
  .select('id,level,wbs_code,description,parent_id')
  .eq('project_id', projectId)
  .is('deleted_at', null);
const levels = {};
for (const n of wbs ?? []) levels[n.level] = (levels[n.level] || 0) + 1;

const { data: boq } = await sb
  .from('boq_items')
  .select('id,total_rate,total_amount,quantity,unit')
  .eq('project_id', projectId)
  .is('deleted_at', null);

const priced = (boq ?? []).filter(
  (r) => Number(r.total_rate) > 0 || Number(r.total_amount) > 0
).length;
const boqSum = (boq ?? []).reduce((s, r) => s + Number(r.total_amount || 0), 0);

const { count: resCount } = await sb
  .from('project_rate_library_items')
  .select('*', { count: 'exact', head: true })
  .eq('project_id', projectId)
  .is('deleted_at', null);

const { data: summary } = await sb
  .from('estimate_summary')
  .select('*')
  .eq('project_id', projectId)
  .maybeSingle();

const { data: job } = await sb
  .from('smart_import_jobs')
  .select('id,status,error_message,reconciliation_report,validation_report,completed_at')
  .eq('original_filename', 'NIA_Budgetary_Cost_Breakdown.xlsx')
  .order('created_at', { ascending: false })
  .limit(5);

const grand = 351522209.41;
const checks = {
  WBS: (wbs?.length ?? 0) >= 5 && !Object.keys(levels).some((l) => Number(l) < 1),
  BOQ: (boq?.length ?? 0) >= 100,
  Resources: (resCount ?? 0) >= 50,
  'Unit Rates': priced >= (boq?.length ?? 1) * 0.95,
  'Estimate Summary':
    summary &&
    Math.abs(Number(summary.direct_cost || summary.grand_total || 0) - grand) /
      grand <
      0.001,
};

console.log(
  JSON.stringify(
    {
      project,
      wbs_count: wbs?.length ?? 0,
      wbs_levels: levels,
      boq_count: boq?.length ?? 0,
      priced_boq: `${priced}/${boq?.length ?? 0}`,
      boq_sum: Math.round(boqSum * 100) / 100,
      resources: resCount,
      estimate: summary
        ? {
            direct_cost: Number(summary.direct_cost),
            grand_total: Number(summary.grand_total),
          }
        : null,
      delta_vs_grand: summary
        ? Math.round(
            (Number(summary.direct_cost || summary.grand_total) - grand) * 100
          ) / 100
        : null,
      jobs: job,
      checks: Object.fromEntries(
        Object.entries(checks).map(([k, v]) => [k, v ? 'PASS' : 'FAIL'])
      ),
    },
    null,
    2
  )
);
