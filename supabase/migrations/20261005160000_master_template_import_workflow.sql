-- Phase 8: Master Template Import Workflow
-- Additive / backward-compatible.

BEGIN;

-- Mark live projects as reusable master templates
ALTER TABLE public.project_details
  ADD COLUMN IF NOT EXISTS is_master_template BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS project_details_master_template_idx
  ON public.project_details (is_master_template)
  WHERE is_master_template = true;

-- Registry of named master templates (frozen snapshot for create-from-template)
CREATE TABLE IF NOT EXISTS public.master_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  source_project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL,
  source_import_job_id UUID REFERENCES public.smart_import_jobs (id) ON DELETE SET NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  wbs_count INTEGER NOT NULL DEFAULT 0,
  boq_count INTEGER NOT NULL DEFAULT 0,
  resource_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS master_templates_active_idx
  ON public.master_templates (is_active, display_name);

DROP TRIGGER IF EXISTS master_templates_set_updated_at ON public.master_templates;
CREATE TRIGGER master_templates_set_updated_at
  BEFORE UPDATE ON public.master_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Import reconciliation report storage
ALTER TABLE public.smart_import_jobs
  ADD COLUMN IF NOT EXISTS reconciliation_report JSONB NOT NULL DEFAULT '{}'::JSONB;

ALTER TABLE public.smart_import_jobs
  ADD COLUMN IF NOT EXISTS master_template_id UUID
    REFERENCES public.master_templates (id) ON DELETE SET NULL;

-- RLS
ALTER TABLE public.master_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS master_templates_select ON public.master_templates;
CREATE POLICY master_templates_select
  ON public.master_templates FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS master_templates_insert ON public.master_templates;
CREATE POLICY master_templates_insert
  ON public.master_templates FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
    OR public.current_user_role() = 'estimator'
  );

DROP POLICY IF EXISTS master_templates_update ON public.master_templates;
CREATE POLICY master_templates_update
  ON public.master_templates FOR UPDATE TO authenticated
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_templates TO authenticated;

COMMIT;
