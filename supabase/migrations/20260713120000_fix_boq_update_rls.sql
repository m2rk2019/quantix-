-- Fix boq_items UPDATE RLS: explicit WITH CHECK so updates are not silently
-- blocked when PostgreSQL reuses USING (deleted_at IS NULL) as WITH CHECK.
-- Also ensures authenticated role retains table UPDATE privilege.

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.boq_items TO authenticated;
GRANT ALL ON TABLE public.boq_items TO service_role;

DROP POLICY IF EXISTS boq_items_update ON public.boq_items;

CREATE POLICY boq_items_update
  ON public.boq_items
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.projects p
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
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

COMMIT;
