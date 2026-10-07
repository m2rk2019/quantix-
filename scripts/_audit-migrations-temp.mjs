import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';
import {
  resolveWorkingDatabaseUrl,
  projectRefFromSupabaseUrl,
} from './lib/resolve-database-url.mjs';

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

const projectRef = projectRefFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('projectRef', projectRef);

let url = process.env.DATABASE_URL?.trim() || null;
let label = url ? 'DATABASE_URL' : null;

if (!url) {
  const found = await resolveWorkingDatabaseUrl(
    projectRef,
    process.env.SUPABASE_DB_PASSWORD,
    {
      timeoutMs: 5000,
      concurrency: 10,
      onProgress: (p) => {
        if (p.status === 'found') console.log('found', p.label);
      },
    },
  );
  if (!found.url) {
    console.error('NO_DB', found.errorSummary);
    process.exit(2);
  }
  url = found.url;
  label = found.label;
}

console.log('CONNECTED_VIA', label);

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000,
});
await client.connect();

const { rows } = await client.query(`
WITH checks AS (
  SELECT * FROM (VALUES
    ('01. 20260625120000_create_users_auth.sql',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users'),
      EXISTS(SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='user_role')),
    ('02. 20260626120000_create_projects.sql',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='projects'),
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='project_details')),
    ('03. 20260627120000_project_details_sprint3.sql',
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_details' AND column_name='currency'),
      EXISTS(SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='rounding_rule')),
    ('04. 20260628120000_create_wbs.sql',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='wbs'),
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='boq_items')),
    ('05. 20260629120000_boq_sprint5.sql',
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='boq_items' AND column_name='other_cost_rate'),
      EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='boq_items' AND policyname='boq_items_insert')),
    ('06. 20260630120000_audit_trail_sprint68.sql',
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_log' AND column_name='project_id'),
      true),
    ('07. 20260701120000_performance_sprint69.sql',
      EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='sum_boq_total_amount'),
      true),
    ('08. 20260702120000_grant_schema_permissions.sql',
      has_table_privilege('authenticated','public.projects','SELECT'),
      true),
    ('09. 20260703120000_get_current_user_profile_rpc.sql',
      EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='get_current_user_profile'),
      true),
    ('10. 20260705120000_fix_projects_insert_rls.sql',
      EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='can_create_project'),
      EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='projects_set_ownership')),
    ('11. 20260706120000_boq_category_totals.sql',
      EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='boq_category_totals'),
      true),
    ('12. 20260707120000_rate_library_analysis.sql',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='rate_library_items'),
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='boq_rate_analysis_lines')),
    ('13. 20260708120000_company_resource_library.sql',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='company_suppliers'),
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='rate_library_items' AND column_name='supplier_id')),
    ('14. 20260709120000_rate_buildup_sprint6.sql',
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='boq_items' AND column_name='ocm_percent'),
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='boq_rate_analysis_lines' AND column_name='waste_percent')),
    ('15. 20260710120000_company_settings_sprint13.sql',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='company_settings'),
      true),
    ('16. 20260711120000_benchmark_sprint14.sql',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='project_benchmark_actuals'),
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_details' AND column_name='is_benchmark')),
    ('17. 20260712120000_default_currency_php.sql',
      COALESCE((SELECT column_default LIKE '%PHP%' FROM information_schema.columns WHERE table_schema='public' AND table_name='project_details' AND column_name='currency'), false),
      true),
    ('18. 20260712120000_fix_wbs_soft_delete_rls.sql',
      EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wbs' AND policyname='wbs_update'),
      true),
    ('19. 20260713120000_fix_boq_update_rls.sql',
      EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='boq_items' AND policyname='boq_items_update'),
      true),
    ('20. 20260714120000_bulk_soft_delete_wbs.sql',
      EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='bulk_soft_delete_wbs'),
      true),
    ('21. 20260715120000_rate_library_category_extend.sql',
      EXISTS(SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='rate_library_category' AND e.enumlabel='service'),
      EXISTS(SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='rate_library_category' AND e.enumlabel='productivity')),
    ('22. 20260715120100_project_rate_library.sql',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='project_rate_library_items'),
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='boq_rate_analysis_lines' AND column_name='project_library_item_id')),
    ('23. 20261005120000_fix_project_child_ownership_service_role.sql',
      EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='set_project_child_ownership'),
      true),
    ('24. 20261005130000_historical_projects_repository.sql',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='historical_projects'),
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='historical_project_snapshots')),
    ('25. 20261005140000_tender_submission_package.sql',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tender_submissions'),
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_details' AND column_name='assumptions')),
    ('26. 20261005150000_smart_excel_import_engine.sql',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='smart_import_jobs'),
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_details' AND column_name='smart_import_job_id')),
    ('27. 20261005160000_master_template_import_workflow.sql',
      EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='master_templates'),
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_details' AND column_name='is_master_template'))
  ) AS t(migration, marker_a, marker_b)
)
SELECT migration,
       CASE WHEN marker_a AND marker_b THEN 'APPLIED' ELSE 'MISSING' END AS status,
       marker_a AS a,
       marker_b AS b
FROM checks
ORDER BY migration;
`);

for (const r of rows) {
  console.log(`${r.status}\t${r.migration}\ta=${r.a}\tb=${r.b}`);
}

const cons = await client.query(`
SELECT conname, pg_get_constraintdef(c.oid) AS def
FROM pg_constraint c
JOIN pg_class rel ON rel.oid = c.conrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'public'
  AND rel.relname = 'historical_project_snapshots'
  AND c.contype = 'c';
`);
console.log('\nSECTION_CHECKS:');
for (const r of cons.rows) console.log(r.conname + ' :: ' + r.def);

const detail = await client.query(`
SELECT
  to_regclass('public.historical_project_snapshots') IS NOT NULL AS historical_snapshots,
  to_regclass('public.tender_submissions') IS NOT NULL AS tender_submissions,
  to_regclass('public.smart_import_jobs') IS NOT NULL AS smart_import_jobs,
  to_regclass('public.smart_import_profiles') IS NOT NULL AS smart_import_profiles,
  to_regclass('public.master_templates') IS NOT NULL AS master_templates,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smart_import_jobs' AND column_name='reconciliation_report') AS reconciliation_report,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='smart_import_jobs' AND column_name='master_template_id') AS master_template_id,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_details' AND column_name='cfa_sqm') AS cfa_sqm,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_details' AND column_name='cloned_from_historical_id') AS cloned_from_historical_id,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='project_details' AND column_name='is_master_template') AS is_master_template
`);
console.log('\nDETAIL', detail.rows[0]);

const fn = await client.query(`
SELECT pg_get_functiondef(p.oid) AS def
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname='public' AND p.proname='set_project_child_ownership' LIMIT 1
`);
const def = fn.rows[0]?.def || '';
console.log(
  'SERVICE_ROLE_FIX',
  def.includes('auth.uid() IS NOT NULL') && def.includes('Not authenticated'),
);

try {
  const sm = await client.query(
    'SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version',
  );
  console.log('\nSCHEMA_MIGRATIONS');
  for (const r of sm.rows) console.log(r.version, r.name || '');
} catch (e) {
  console.log('\nSCHEMA_MIGRATIONS', e.message);
}

await client.end();
