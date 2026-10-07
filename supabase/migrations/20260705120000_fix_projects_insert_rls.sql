-- Fix projects INSERT RLS: auto-set ownership, resolve role from JWT fallback,
-- and align SELECT / INSERT / UPDATE / DELETE policies for all roles.
--
-- Run in Supabase Dashboard → SQL Editor after prior permission migrations.

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Role resolution (database profile + JWT metadata fallback)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  db_role public.user_role;
  jwt_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT u.role
  INTO db_role
  FROM public.users AS u
  WHERE u.id = auth.uid()
    AND u.deleted_at IS NULL
  LIMIT 1;

  IF db_role IS NOT NULL THEN
    RETURN db_role;
  END IF;

  jwt_role := auth.jwt() -> 'app_metadata' ->> 'role';

  IF jwt_role IS NULL OR jwt_role = '' THEN
    jwt_role := auth.jwt() -> 'user_metadata' ->> 'role';
  END IF;

  IF jwt_role IS NOT NULL AND jwt_role <> '' THEN
    BEGIN
      RETURN jwt_role::public.user_role;
    EXCEPTION
      WHEN invalid_text_representation THEN
        RETURN NULL;
    END;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_create_project()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN (
    'super_admin',
    'admin',
    'estimator'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_all_projects()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('super_admin', 'admin');
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_create_project() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_all_projects() TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. Auto-populate ownership on insert / update
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_project_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.updated_by := auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_set_ownership ON public.projects;

CREATE TRIGGER projects_set_ownership
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_project_ownership();

CREATE OR REPLACE FUNCTION public.set_project_child_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.updated_by := auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_details_set_ownership ON public.project_details;
DROP TRIGGER IF EXISTS estimate_summary_set_ownership ON public.estimate_summary;

CREATE TRIGGER project_details_set_ownership
  BEFORE INSERT OR UPDATE ON public.project_details
  FOR EACH ROW
  EXECUTE FUNCTION public.set_project_child_ownership();

CREATE TRIGGER estimate_summary_set_ownership
  BEFORE INSERT OR UPDATE ON public.estimate_summary
  FOR EACH ROW
  EXECUTE FUNCTION public.set_project_child_ownership();

-- -----------------------------------------------------------------------------
-- 3. projects — drop legacy policies and recreate consistently
-- -----------------------------------------------------------------------------

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS projects_select ON public.projects;
DROP POLICY IF EXISTS projects_select_super_admin ON public.projects;
DROP POLICY IF EXISTS projects_select_admin ON public.projects;
DROP POLICY IF EXISTS projects_select_quantity_surveyor ON public.projects;
DROP POLICY IF EXISTS projects_select_estimator ON public.projects;
DROP POLICY IF EXISTS projects_select_viewer ON public.projects;
DROP POLICY IF EXISTS projects_select_own ON public.projects;
DROP POLICY IF EXISTS projects_insert ON public.projects;
DROP POLICY IF EXISTS projects_insert_super_admin ON public.projects;
DROP POLICY IF EXISTS projects_insert_admin ON public.projects;
DROP POLICY IF EXISTS projects_insert_estimator ON public.projects;
DROP POLICY IF EXISTS projects_update ON public.projects;
DROP POLICY IF EXISTS projects_update_super_admin ON public.projects;
DROP POLICY IF EXISTS projects_update_admin ON public.projects;
DROP POLICY IF EXISTS projects_update_quantity_surveyor ON public.projects;
DROP POLICY IF EXISTS projects_update_estimator ON public.projects;
DROP POLICY IF EXISTS projects_delete ON public.projects;
DROP POLICY IF EXISTS projects_delete_admin ON public.projects;

-- SELECT: portfolio roles see all active projects
CREATE POLICY projects_select_super_admin
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'super_admin'
  );

CREATE POLICY projects_select_admin
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'admin'
  );

CREATE POLICY projects_select_quantity_surveyor
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'quantity_surveyor'
  );

CREATE POLICY projects_select_viewer
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'viewer'
  );

-- SELECT: estimator sees owned projects
CREATE POLICY projects_select_estimator
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'estimator'
    AND created_by = auth.uid()
  );

-- SELECT: creator always sees own rows (covers INSERT ... RETURNING for any role)
CREATE POLICY projects_select_own
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND created_by = auth.uid()
  );

-- INSERT: one policy per role allowed to create projects
CREATE POLICY projects_insert_super_admin
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'super_admin');

CREATE POLICY projects_insert_admin
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY projects_insert_estimator
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'estimator');

-- UPDATE: full control for super_admin / admin (including soft delete)
CREATE POLICY projects_update_super_admin
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'super_admin')
  WITH CHECK (public.current_user_role() = 'super_admin');

CREATE POLICY projects_update_admin
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- UPDATE: quantity_surveyor on non-finalized projects
CREATE POLICY projects_update_quantity_surveyor
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'quantity_surveyor'
    AND status NOT IN ('approved', 'archived')
  )
  WITH CHECK (
    public.current_user_role() = 'quantity_surveyor'
    AND (
      deleted_at IS NULL
      OR deleted_at IS NOT NULL
    )
  );

-- UPDATE: estimator on own draft / in_progress projects (incl. soft delete)
CREATE POLICY projects_update_estimator
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() = 'estimator'
    AND created_by = auth.uid()
    AND status IN ('draft', 'in_progress')
  )
  WITH CHECK (
    public.current_user_role() = 'estimator'
    AND created_by = auth.uid()
  );

-- DELETE: hard delete restricted to super_admin / admin (app uses soft delete)
CREATE POLICY projects_delete_admin
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (public.can_manage_all_projects());

-- -----------------------------------------------------------------------------
-- 4. project_details + estimate_summary insert alignment
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS project_details_insert ON public.project_details;

CREATE POLICY project_details_insert
  ON public.project_details
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_create_project()
    AND public.can_read_project(project_id)
  );

DROP POLICY IF EXISTS estimate_summary_insert ON public.estimate_summary;

CREATE POLICY estimate_summary_insert
  ON public.estimate_summary
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_create_project()
    AND public.can_read_project(project_id)
  );

COMMIT;
