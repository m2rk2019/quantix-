-- Sprint 14: Historical estimate benchmark actuals + benchmark flag

ALTER TABLE public.project_details
  ADD COLUMN IF NOT EXISTS is_benchmark BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.project_benchmark_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  boq_item_id UUID REFERENCES public.boq_items (id) ON DELETE SET NULL,
  item_code TEXT NOT NULL,
  description TEXT,
  estimated_quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
  actual_quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
  estimated_unit_rate NUMERIC(18, 4) NOT NULL DEFAULT 0,
  actual_unit_rate NUMERIC(18, 4) NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
  actual_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
  awarded_cost NUMERIC(18, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS benchmark_actuals_project_idx
  ON public.project_benchmark_actuals (project_id);

CREATE INDEX IF NOT EXISTS benchmark_actuals_item_code_idx
  ON public.project_benchmark_actuals (project_id, item_code);

CREATE INDEX IF NOT EXISTS project_details_benchmark_idx
  ON public.project_details (is_benchmark)
  WHERE is_benchmark = true;

ALTER TABLE public.project_benchmark_actuals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS benchmark_actuals_select ON public.project_benchmark_actuals;
CREATE POLICY benchmark_actuals_select
  ON public.project_benchmark_actuals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_benchmark_actuals.project_id
        AND p.deleted_at IS NULL
        AND (
          public.is_admin_or_above()
          OR public.can_write_all_projects()
          OR public.current_user_role() = 'viewer'
          OR p.created_by = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS benchmark_actuals_insert ON public.project_benchmark_actuals;
CREATE POLICY benchmark_actuals_insert
  ON public.project_benchmark_actuals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_benchmark_actuals.project_id
        AND p.deleted_at IS NULL
        AND (
          public.is_admin_or_above()
          OR public.can_write_all_projects()
          OR p.created_by = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS benchmark_actuals_update ON public.project_benchmark_actuals;
CREATE POLICY benchmark_actuals_update
  ON public.project_benchmark_actuals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_benchmark_actuals.project_id
        AND p.deleted_at IS NULL
        AND (
          public.is_admin_or_above()
          OR public.can_write_all_projects()
          OR p.created_by = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS benchmark_actuals_delete ON public.project_benchmark_actuals;
CREATE POLICY benchmark_actuals_delete
  ON public.project_benchmark_actuals
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_benchmark_actuals TO authenticated;
