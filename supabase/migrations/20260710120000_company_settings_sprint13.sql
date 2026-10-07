-- Sprint 13: Company settings (singleton) + production performance indexes

CREATE TABLE IF NOT EXISTS public.company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'Quantix',
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  default_currency TEXT NOT NULL DEFAULT 'USD',
  default_vat_percent NUMERIC(6, 2) NOT NULL DEFAULT 12.00,
  default_ocm_percent NUMERIC(6, 2) NOT NULL DEFAULT 10.00,
  default_contingency_percent NUMERIC(6, 2) NOT NULL DEFAULT 5.00,
  default_profit_percent NUMERIC(6, 2) NOT NULL DEFAULT 10.00,
  project_code_format TEXT NOT NULL DEFAULT 'QTX-{YYYY}-{SEQ:6}',
  report_header TEXT,
  report_footer TEXT,
  signature_block TEXT,
  theme_color TEXT NOT NULL DEFAULT '#1f4e79',
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS company_settings_singleton_idx
  ON public.company_settings ((true));

INSERT INTO public.company_settings (company_name)
SELECT 'Quantix'
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS company_settings_select ON public.company_settings;
CREATE POLICY company_settings_select
  ON public.company_settings
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS company_settings_update ON public.company_settings;
CREATE POLICY company_settings_update
  ON public.company_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('super_admin', 'admin')
        AND u.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS company_settings_insert ON public.company_settings;
CREATE POLICY company_settings_insert
  ON public.company_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.company_settings)
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('super_admin', 'admin')
        AND u.deleted_at IS NULL
    )
  );

GRANT SELECT ON TABLE public.company_settings TO authenticated;
GRANT UPDATE ON TABLE public.company_settings TO authenticated;
GRANT INSERT ON TABLE public.company_settings TO authenticated;

-- Performance indexes (Sprint 13)
CREATE INDEX IF NOT EXISTS projects_list_updated_idx
  ON public.projects (updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS projects_status_updated_idx
  ON public.projects (status, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS projects_client_name_idx
  ON public.projects (client_name)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS boq_items_project_amount_idx
  ON public.boq_items (project_id, total_amount DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS boq_items_project_description_idx
  ON public.boq_items (project_id, description)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS estimate_summary_project_idx
  ON public.estimate_summary (project_id);

CREATE INDEX IF NOT EXISTS audit_log_action_created_idx
  ON public.audit_log (action, created_at DESC);

CREATE INDEX IF NOT EXISTS wbs_project_level_sort_idx
  ON public.wbs (project_id, level, sort_order)
  WHERE deleted_at IS NULL;
