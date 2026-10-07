-- =============================================================================
-- Quantix: fix projects permissions (GRANTs + RLS)
-- =============================================================================
-- Root cause: migrations created tables + RLS but never granted table privileges
-- to Supabase API roles (`authenticated`, `service_role`, `anon`). PostgreSQL
-- returns "permission denied for table projects" before RLS is evaluated.
--
-- Run this entire file once in Supabase Dashboard → SQL Editor.
-- Safe to re-run (idempotent GRANTs + DROP/CREATE policies).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Schema + table GRANTs (all Quantix public tables)
-- -----------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;

-- Explicit grants on project-related objects (belt-and-suspenders)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_details TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.estimate_summary TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wbs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.boq_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.project_code_sequences TO authenticated;

GRANT ALL ON TABLE public.users TO service_role;
GRANT ALL ON TABLE public.projects TO service_role;
GRANT ALL ON TABLE public.project_details TO service_role;
GRANT ALL ON TABLE public.estimate_summary TO service_role;
GRANT ALL ON TABLE public.audit_log TO service_role;
GRANT ALL ON TABLE public.wbs TO service_role;
GRANT ALL ON TABLE public.boq_items TO service_role;
GRANT ALL ON TABLE public.project_code_sequences TO service_role;

-- -----------------------------------------------------------------------------
-- 2. RLS helper functions (SECURITY DEFINER — read role / ownership safely)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid()
    AND deleted_at IS NULL
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('super_admin', 'admin');
$$;

CREATE OR REPLACE FUNCTION public.owns_project(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = p_project_id
      AND created_by = auth.uid()
      AND deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.can_write_all_projects()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN (
    'super_admin',
    'admin',
    'quantity_surveyor'
  );
$$;

-- Portfolio-wide read (all active projects)
CREATE OR REPLACE FUNCTION public.can_read_all_projects()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN (
    'super_admin',
    'admin',
    'quantity_surveyor',
    'viewer'
  );
$$;

-- Read a single project: portfolio roles OR owner (estimator)
CREATE OR REPLACE FUNCTION public.can_read_project(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = p_project_id
      AND p.deleted_at IS NULL
      AND (
        public.can_read_all_projects()
        OR p.created_by = auth.uid()
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_or_above() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_project(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_write_all_projects() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_read_all_projects() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_read_project(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_project_code() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  id uuid,
  email varchar,
  full_name varchar,
  role public.user_role,
  deleted_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id, u.email, u.full_name, u.role, u.deleted_at
  FROM public.users u
  WHERE u.id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 3. users — allow creator names on project list for portfolio roles
-- -----------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_directory ON public.users;
CREATE POLICY users_select_directory
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('viewer', 'quantity_surveyor')
  );

-- -----------------------------------------------------------------------------
-- 4. projects — role-based RLS (PERMISSIVE policies OR together)
-- -----------------------------------------------------------------------------

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_select ON public.projects;
DROP POLICY IF EXISTS projects_select_super_admin ON public.projects;
DROP POLICY IF EXISTS projects_select_admin ON public.projects;
DROP POLICY IF EXISTS projects_select_quantity_surveyor ON public.projects;
DROP POLICY IF EXISTS projects_select_estimator ON public.projects;
DROP POLICY IF EXISTS projects_select_viewer ON public.projects;

-- super_admin: full read
CREATE POLICY projects_select_super_admin
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'super_admin'
  );

-- admin: full read
CREATE POLICY projects_select_admin
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'admin'
  );

-- quantity_surveyor: portfolio read (all active projects)
CREATE POLICY projects_select_quantity_surveyor
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'quantity_surveyor'
  );

-- viewer: read-only, all active projects
CREATE POLICY projects_select_viewer
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'viewer'
  );

-- estimator: owned / assigned projects only (created_by = current user)
CREATE POLICY projects_select_estimator
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'estimator'
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS projects_insert ON public.projects;
CREATE POLICY projects_insert
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'admin', 'estimator')
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS projects_update ON public.projects;
CREATE POLICY projects_update
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.current_user_role() IN ('super_admin', 'admin')
      OR (
        public.current_user_role() = 'quantity_surveyor'
        AND status NOT IN ('approved', 'archived')
      )
      OR (
        public.current_user_role() = 'estimator'
        AND created_by = auth.uid()
        AND status IN ('draft', 'in_progress')
      )
    )
  )
  WITH CHECK (
    deleted_at IS NULL
    OR public.current_user_role() IN ('super_admin', 'admin', 'estimator')
  );

-- -----------------------------------------------------------------------------
-- 5. project_details — inherit project read/write rules
-- -----------------------------------------------------------------------------

ALTER TABLE public.project_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_details_select ON public.project_details;
CREATE POLICY project_details_select
  ON public.project_details
  FOR SELECT
  TO authenticated
  USING (public.can_read_project(project_id));

DROP POLICY IF EXISTS project_details_insert ON public.project_details;
CREATE POLICY project_details_insert
  ON public.project_details
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'admin', 'estimator')
    AND created_by = auth.uid()
    AND public.can_read_project(project_id)
  );

DROP POLICY IF EXISTS project_details_update ON public.project_details;
CREATE POLICY project_details_update
  ON public.project_details
  FOR UPDATE
  TO authenticated
  USING (
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

-- -----------------------------------------------------------------------------
-- 6. estimate_summary
-- -----------------------------------------------------------------------------

ALTER TABLE public.estimate_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS estimate_summary_select ON public.estimate_summary;
CREATE POLICY estimate_summary_select
  ON public.estimate_summary
  FOR SELECT
  TO authenticated
  USING (public.can_read_project(project_id));

DROP POLICY IF EXISTS estimate_summary_insert ON public.estimate_summary;
CREATE POLICY estimate_summary_insert
  ON public.estimate_summary
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.can_read_project(project_id)
  );

DROP POLICY IF EXISTS estimate_summary_update ON public.estimate_summary;
CREATE POLICY estimate_summary_update
  ON public.estimate_summary
  FOR UPDATE
  TO authenticated
  USING (
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

-- -----------------------------------------------------------------------------
-- 7. wbs + boq_items — readable when parent project is readable
-- -----------------------------------------------------------------------------

ALTER TABLE public.wbs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wbs_select ON public.wbs;
CREATE POLICY wbs_select
  ON public.wbs
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.can_read_project(project_id)
  );

DROP POLICY IF EXISTS wbs_insert ON public.wbs;
CREATE POLICY wbs_insert
  ON public.wbs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
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
  );

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
  );

ALTER TABLE public.boq_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS boq_items_select ON public.boq_items;
CREATE POLICY boq_items_select
  ON public.boq_items
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.can_read_project(project_id)
  );

DROP POLICY IF EXISTS boq_items_insert ON public.boq_items;
CREATE POLICY boq_items_insert
  ON public.boq_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
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
  );

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
  );

-- -----------------------------------------------------------------------------
-- 8. audit_log — project-scoped read
-- -----------------------------------------------------------------------------

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_select_admin ON public.audit_log;
DROP POLICY IF EXISTS audit_log_select ON public.audit_log;

CREATE POLICY audit_log_select
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (
    project_id IS NOT NULL
    AND public.can_read_project(project_id)
  );

DROP POLICY IF EXISTS audit_log_insert ON public.audit_log;
CREATE POLICY audit_log_insert
  ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

-- Aggregate helpers used by estimate module
GRANT EXECUTE ON FUNCTION public.sum_boq_total_amount(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.boq_direct_totals_by_wbs(UUID) TO authenticated, service_role;

COMMIT;

-- -----------------------------------------------------------------------------
-- 9. Verification queries (run manually after COMMIT)
-- -----------------------------------------------------------------------------
-- SELECT grantee, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public' AND table_name = 'projects'
-- ORDER BY grantee, privilege_type;
--
-- SELECT id, project_code, project_name FROM public.projects LIMIT 5;
-- (Run the second query while signed in as an authenticated user in SQL editor
--  with "Run as" set to authenticated role, or verify via the app at /projects.)
