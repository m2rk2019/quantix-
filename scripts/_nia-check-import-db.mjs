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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const sb = createClient(url, key);

const { data: jobs, error } = await sb
  .from('smart_import_jobs')
  .select(
    'id,status,original_filename,error_message,completed_at,created_at,reconciliation_report,validation_report'
  )
  .order('created_at', { ascending: false })
  .limit(8);
console.log('jobsErr', error?.message);
for (const job of jobs ?? []) {
  console.log({
    id: job.id,
    status: job.status,
    file: job.original_filename,
    error: job.error_message,
    created: job.created_at,
    completed: job.completed_at,
    recon: job.reconciliation_report
      ? {
          overall: job.reconciliation_report.overall_pass,
          excel: job.reconciliation_report.excel_boq_total,
          qx: job.reconciliation_report.quantix_direct_cost,
        }
      : null,
  });
}

const { data: projects, error: pe } = await sb
  .from('projects')
  .select('id,project_code,project_name,created_at')
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .limit(8);
console.log('projErr', pe?.message);
console.log(projects);

if (projects?.[0]) {
  const pid = projects[0].id;
  const { data: wbs } = await sb
    .from('wbs')
    .select('id,level,wbs_code,description,parent_id')
    .eq('project_id', pid)
    .is('deleted_at', null);
  const levels = {};
  for (const n of wbs ?? []) levels[n.level] = (levels[n.level] || 0) + 1;
  const { count: boqCount } = await sb
    .from('boq_items')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', pid)
    .is('deleted_at', null);
  const { count: resCount } = await sb
    .from('project_rate_library_items')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', pid)
    .is('deleted_at', null);
  const { data: summary } = await sb
    .from('estimate_summary')
    .select('direct_cost,grand_total')
    .eq('project_id', pid)
    .maybeSingle();
  const { data: priced } = await sb
    .from('boq_items')
    .select('id,total_rate,total_amount')
    .eq('project_id', pid)
    .is('deleted_at', null);
  const withRates = (priced ?? []).filter(
    (r) => Number(r.total_rate) > 0 || Number(r.total_amount) > 0
  ).length;
  console.log({
    latest_project: projects[0].project_name,
    project_id: pid,
    wbs_count: wbs?.length ?? 0,
    wbs_levels: levels,
    boq_count: boqCount,
    resources: resCount,
    priced_boq: `${withRates}/${priced?.length ?? 0}`,
    estimate: summary,
  });
}
