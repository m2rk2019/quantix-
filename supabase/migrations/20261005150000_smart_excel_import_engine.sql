-- Phase 7: AI Smart Excel Import Engine
-- Additive / backward-compatible.

BEGIN;

-- ---------------------------------------------------------------------------
-- Reusable import profiles (learning engine)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.smart_import_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  fingerprint JSONB NOT NULL DEFAULT '{}'::JSONB,
  column_mappings JSONB NOT NULL DEFAULT '{}'::JSONB,
  sheet_role_rules JSONB NOT NULL DEFAULT '[]'::JSONB,
  is_system BOOLEAN NOT NULL DEFAULT false,
  success_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS smart_import_profiles_set_updated_at ON public.smart_import_profiles;
CREATE TRIGGER smart_import_profiles_set_updated_at
  BEFORE UPDATE ON public.smart_import_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.smart_import_profiles (
  profile_key,
  display_name,
  description,
  fingerprint,
  column_mappings,
  sheet_role_rules,
  is_system
) VALUES (
  'mcc_budgetary_cost_breakdown',
  'MCC Budgetary Cost Breakdown',
  'Official reference template for MCC Budgetary Cost Breakdown workbooks.',
  '{"header_hints":["item no","item number","description","unit","qty","quantity","unit rate","amount"],"roles":["project_info","bid_summary","boq","resource_analysis","assumptions"]}'::JSONB,
  '{"item_number":["item no","item no.","item number","item#","code"],"description":["description","particulars","scope"],"unit":["unit","uom"],"quantity":["qty","quantity","qty."],"unit_rate":["unit rate","rate","unit cost"],"amount":["amount","total","total amount"]}'::JSONB,
  '[{"role":"boq","content_hints":["item no","unit rate","amount","description"]},{"role":"project_info","content_hints":["project name","client","location","prepared by"]},{"role":"bid_summary","content_hints":["direct cost","vat","grand total","bid price"]},{"role":"resource_analysis","content_hints":["resource","material","labor","equipment"]},{"role":"assumptions","content_hints":["assumption","exclusion","note"]}]'::JSONB,
  true
) ON CONFLICT (profile_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Import jobs + original workbook storage
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.smart_import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL,
  profile_id UUID REFERENCES public.smart_import_profiles (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN (
      'uploaded',
      'analyzing',
      'mapped',
      'importing',
      'validating',
      'completed',
      'failed',
      'needs_review'
    )),
  original_filename TEXT NOT NULL,
  mime_type TEXT,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  content_base64 TEXT NOT NULL,
  analysis JSONB NOT NULL DEFAULT '{}'::JSONB,
  validation_report JSONB NOT NULL DEFAULT '{}'::JSONB,
  resource_matches JSONB NOT NULL DEFAULT '[]'::JSONB,
  ai_findings JSONB NOT NULL DEFAULT '[]'::JSONB,
  error_message TEXT,
  created_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS smart_import_jobs_project_idx
  ON public.smart_import_jobs (project_id);

CREATE INDEX IF NOT EXISTS smart_import_jobs_status_idx
  ON public.smart_import_jobs (status);

DROP TRIGGER IF EXISTS smart_import_jobs_set_updated_at ON public.smart_import_jobs;
CREATE TRIGGER smart_import_jobs_set_updated_at
  BEFORE UPDATE ON public.smart_import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Link project → latest import job / workbook
ALTER TABLE public.project_details
  ADD COLUMN IF NOT EXISTS smart_import_job_id UUID
    REFERENCES public.smart_import_jobs (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS import_profile_key TEXT,
  ADD COLUMN IF NOT EXISTS building_type TEXT,
  ADD COLUMN IF NOT EXISTS project_category TEXT,
  ADD COLUMN IF NOT EXISTS cfa_sqm NUMERIC(18, 2),
  ADD COLUMN IF NOT EXISTS number_of_buildings INTEGER,
  ADD COLUMN IF NOT EXISTS number_of_units INTEGER,
  ADD COLUMN IF NOT EXISTS estimate_revision TEXT;

-- ---------------------------------------------------------------------------
-- Historical snapshot sections for import artifacts
-- ---------------------------------------------------------------------------

ALTER TABLE public.historical_project_snapshots
  DROP CONSTRAINT IF EXISTS historical_project_snapshots_section_check;

ALTER TABLE public.historical_project_snapshots
  ADD CONSTRAINT historical_project_snapshots_section_check
  CHECK (
    section IN (
      'project_information',
      'wbs',
      'boq',
      'project_resource_library',
      'estimate_summary',
      'ai_outputs',
      'executive_reports',
      'tender_package',
      'import_workbook',
      'validation_report',
      'ai_analysis'
    )
  );

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.smart_import_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_import_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS smart_import_profiles_select ON public.smart_import_profiles;
CREATE POLICY smart_import_profiles_select
  ON public.smart_import_profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS smart_import_profiles_write ON public.smart_import_profiles;
CREATE POLICY smart_import_profiles_write
  ON public.smart_import_profiles FOR ALL TO authenticated
  USING (public.is_admin_or_above() OR public.can_write_all_projects())
  WITH CHECK (public.is_admin_or_above() OR public.can_write_all_projects());

DROP POLICY IF EXISTS smart_import_jobs_select ON public.smart_import_jobs;
CREATE POLICY smart_import_jobs_select
  ON public.smart_import_jobs FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS smart_import_jobs_insert ON public.smart_import_jobs;
CREATE POLICY smart_import_jobs_insert
  ON public.smart_import_jobs FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
    OR public.current_user_role() = 'estimator'
  );

DROP POLICY IF EXISTS smart_import_jobs_update ON public.smart_import_jobs;
CREATE POLICY smart_import_jobs_update
  ON public.smart_import_jobs FOR UPDATE TO authenticated
  USING (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
    OR created_by = auth.uid()
  )
  WITH CHECK (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
    OR created_by = auth.uid()
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.smart_import_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.smart_import_jobs TO authenticated;

COMMIT;
