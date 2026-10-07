-- Fix WBS soft-delete RLS: UPDATE WITH CHECK must allow setting deleted_at.
-- Without an explicit WITH CHECK, PostgreSQL reuses USING (deleted_at IS NULL),
-- which blocks soft deletes and returns "new row violates row-level security policy".

BEGIN;

DROP POLICY IF EXISTS wbs_update ON public.wbs;

CREATE POLICY wbs_update
  ON public.wbs
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
