-- Quantix V1 Sprint 5: BOQ module — other_cost_rate and write RLS

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS other_cost_rate NUMERIC(15, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.boq_items
  DROP CONSTRAINT IF EXISTS boq_items_other_cost_rate_check;

ALTER TABLE public.boq_items
  ADD CONSTRAINT boq_items_other_cost_rate_check
    CHECK (other_cost_rate >= 0);

CREATE INDEX IF NOT EXISTS boq_items_project_wbs_idx
  ON public.boq_items (project_id, wbs_id)
  WHERE deleted_at IS NULL;

CREATE POLICY boq_items_insert
  ON public.boq_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
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

CREATE POLICY boq_items_update
  ON public.boq_items
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
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
