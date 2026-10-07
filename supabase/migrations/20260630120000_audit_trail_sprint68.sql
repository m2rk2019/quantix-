-- Sprint 6.8: Audit trail project scope and project-level read access

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects (id);

CREATE INDEX IF NOT EXISTS audit_log_project_id_idx
  ON public.audit_log (project_id, created_at DESC);

UPDATE public.audit_log
SET project_id = (payload->>'project_id')::UUID
WHERE project_id IS NULL
  AND payload ? 'project_id'
  AND (payload->>'project_id') ~* '^[0-9a-f-]{36}$';

UPDATE public.audit_log
SET project_id = entity_id
WHERE project_id IS NULL
  AND entity_type = 'project';

DROP POLICY IF EXISTS audit_log_select_admin ON public.audit_log;

CREATE POLICY audit_log_select
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (
    project_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = audit_log.project_id
        AND p.deleted_at IS NULL
        AND (
          public.is_admin_or_above()
          OR public.can_write_all_projects()
          OR public.current_user_role() = 'viewer'
          OR p.created_by = auth.uid()
        )
    )
  );
