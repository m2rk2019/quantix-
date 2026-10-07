-- Quantix V1 Sprint 3: extend project_details for full Project Details module

CREATE TYPE public.measurement_system AS ENUM ('metric', 'imperial');

CREATE TYPE public.rounding_rule AS ENUM (
  'half_up',
  'half_down',
  'round_up',
  'round_down'
);

ALTER TABLE public.project_details
  ADD COLUMN owner VARCHAR(255),
  ADD COLUMN consultant VARCHAR(255),
  ADD COLUMN contractor VARCHAR(255),
  ADD COLUMN project_type VARCHAR(100),
  ADD COLUMN contract_type VARCHAR(100),
  ADD COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  ADD COLUMN vat_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN markup_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN contingency_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN indirect_cost_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN rounding_rule public.rounding_rule NOT NULL DEFAULT 'half_up',
  ADD COLUMN measurement_system public.measurement_system NOT NULL DEFAULT 'metric',
  ADD COLUMN default_unit_system VARCHAR(50) NOT NULL DEFAULT 'metric_si';

ALTER TABLE public.project_details
  ADD CONSTRAINT project_details_vat_percent_range
    CHECK (vat_percent >= 0 AND vat_percent <= 100),
  ADD CONSTRAINT project_details_markup_percent_range
    CHECK (markup_percent >= 0 AND markup_percent <= 100),
  ADD CONSTRAINT project_details_contingency_percent_range
    CHECK (contingency_percent >= 0 AND contingency_percent <= 100),
  ADD CONSTRAINT project_details_indirect_cost_percent_range
    CHECK (indirect_cost_percent >= 0 AND indirect_cost_percent <= 100);

-- estimate_summary: allow updates per authorization rules
CREATE POLICY estimate_summary_update
  ON public.estimate_summary
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.deleted_at IS NULL
        AND (
          public.current_user_role() IN ('super_admin', 'admin')
          OR (
            public.current_user_role() = 'quantity_surveyor'
            AND p.status NOT IN ('approved', 'archived')
          )
          OR (
            public.current_user_role() = 'estimator'
            AND p.created_by = auth.uid()
            AND p.status IN ('draft', 'in_progress')
          )
        )
    )
  );
