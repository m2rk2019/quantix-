-- Quantix V1 — Apply migrations #8–#17 only
-- Safe to run when migrations #1–#7 are already applied.
-- Paste into Supabase Dashboard → SQL Editor → Run
-- Project: tfpiuuyvknxdegegvqrm
--
-- After success:
--   1. Project Settings → API → Reload schema
--   2. npm run load:demo
--   3. npm run verify:megawide-office

BEGIN;

-- >>> BEGIN 20260702120000_grant_schema_permissions.sql
-- Grant API roles access to Quantix public schema objects.

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
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;
-- <<< END 20260702120000_grant_schema_permissions.sql

-- >>> BEGIN 20260703120000_get_current_user_profile_rpc.sql
-- Profile lookup RPC (SECURITY DEFINER) for authenticated sessions.

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

GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
-- <<< END 20260703120000_get_current_user_profile_rpc.sql

-- >>> BEGIN 20260705120000_fix_projects_insert_rls.sql
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
-- <<< END 20260705120000_fix_projects_insert_rls.sql

-- >>> BEGIN 20260706120000_boq_category_totals.sql
-- BOQ category extended totals (additive RPC, no table changes)

CREATE OR REPLACE FUNCTION public.boq_category_totals(
  p_project_id UUID,
  p_wbs_id UUID DEFAULT NULL
)
RETURNS TABLE (
  material_total NUMERIC,
  labor_total NUMERIC,
  equipment_total NUMERIC,
  subcontract_total NUMERIC,
  grand_total NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(quantity * material_rate), 0) AS material_total,
    COALESCE(SUM(quantity * labor_rate), 0) AS labor_total,
    COALESCE(SUM(quantity * equipment_rate), 0) AS equipment_total,
    COALESCE(SUM(quantity * subcontract_rate), 0) AS subcontract_total,
    COALESCE(SUM(total_amount), 0) AS grand_total
  FROM public.boq_items
  WHERE project_id = p_project_id
    AND deleted_at IS NULL
    AND (p_wbs_id IS NULL OR wbs_id = p_wbs_id);
$$;

GRANT EXECUTE ON FUNCTION public.boq_category_totals(UUID, UUID) TO authenticated;
-- <<< END 20260706120000_boq_category_totals.sql

-- >>> BEGIN 20260707120000_rate_library_analysis.sql
-- Rate Library + Rate Analysis (additive, non-breaking)

DO $guard$
BEGIN
  CREATE TYPE public.rate_library_category AS ENUM (
    'material',
    'labor',
    'equipment',
    'subcontract'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $guard$;

CREATE TABLE IF NOT EXISTS public.rate_library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  description VARCHAR(500) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'item',
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  category public.rate_library_category NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT rate_library_items_unit_cost_check CHECK (unit_cost >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS rate_library_items_code_active_unique
  ON public.rate_library_items (code)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS rate_library_items_category_idx
  ON public.rate_library_items (category)
  WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS rate_library_items_search_idx
  ON public.rate_library_items USING gin (
    to_tsvector('simple', coalesce(code, '') || ' ' || coalesce(description, ''))
  )
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS rate_library_items_set_updated_at ON public.rate_library_items;

CREATE TRIGGER rate_library_items_set_updated_at
  BEFORE UPDATE ON public.rate_library_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.boq_rate_analysis_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_item_id UUID NOT NULL REFERENCES public.boq_items (id) ON DELETE CASCADE,
  library_item_id UUID REFERENCES public.rate_library_items (id) ON DELETE SET NULL,
  category public.rate_library_category NOT NULL,
  resource_name VARCHAR(500) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'item',
  consumption NUMERIC(15, 4) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT boq_rate_analysis_consumption_check CHECK (consumption >= 0),
  CONSTRAINT boq_rate_analysis_unit_cost_check CHECK (unit_cost >= 0),
  CONSTRAINT boq_rate_analysis_amount_check CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS boq_rate_analysis_lines_item_idx
  ON public.boq_rate_analysis_lines (boq_item_id, category, sort_order)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS boq_rate_analysis_lines_set_updated_at ON public.boq_rate_analysis_lines;

CREATE TRIGGER boq_rate_analysis_lines_set_updated_at
  BEFORE UPDATE ON public.boq_rate_analysis_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.user_rate_library_favorites (
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  library_item_id UUID NOT NULL REFERENCES public.rate_library_items (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, library_item_id)
);

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS material_rate_override BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS labor_rate_override BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS equipment_rate_override BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS subcontract_rate_override BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS other_cost_rate_override BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.rate_library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boq_rate_analysis_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rate_library_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY rate_library_items_select
  ON public.rate_library_items
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY rate_library_items_insert
  ON public.rate_library_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.current_user_role() IN (
      'super_admin',
      'admin',
      'estimator',
      'quantity_surveyor'
    )
  );

CREATE POLICY rate_library_items_update
  ON public.rate_library_items
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() IN (
      'super_admin',
      'admin',
      'estimator',
      'quantity_surveyor'
    )
  );

CREATE POLICY boq_rate_analysis_lines_select
  ON public.boq_rate_analysis_lines
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.boq_items AS b
      WHERE b.id = boq_item_id
        AND b.deleted_at IS NULL
    )
  );

CREATE POLICY boq_rate_analysis_lines_write
  ON public.boq_rate_analysis_lines
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.boq_items AS b
      JOIN public.projects AS p ON p.id = b.project_id
      WHERE b.id = boq_item_id
        AND b.deleted_at IS NULL
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
      FROM public.boq_items AS b
      JOIN public.projects AS p ON p.id = b.project_id
      WHERE b.id = boq_item_id
        AND b.deleted_at IS NULL
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

CREATE POLICY user_rate_library_favorites_select
  ON public.user_rate_library_favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_rate_library_favorites_write
  ON public.user_rate_library_favorites
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.rate_library_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boq_rate_analysis_lines TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_rate_library_favorites TO authenticated;
-- <<< END 20260707120000_rate_library_analysis.sql

-- >>> BEGIN 20260708120000_company_resource_library.sql
-- Sprint 5: Company Resource Library (additive, non-breaking)

CREATE TABLE IF NOT EXISTS public.company_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(200),
  email VARCHAR(200),
  phone VARCHAR(50),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS company_suppliers_code_active_unique
  ON public.company_suppliers (code)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS company_suppliers_search_idx
  ON public.company_suppliers USING gin (
    to_tsvector('simple', coalesce(code, '') || ' ' || coalesce(name, ''))
  )
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS company_suppliers_set_updated_at ON public.company_suppliers;

CREATE TRIGGER company_suppliers_set_updated_at
  BEFORE UPDATE ON public.company_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.company_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS company_units_code_active_unique
  ON public.company_units (code)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS company_units_symbol_active_unique
  ON public.company_units (symbol)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS company_units_set_updated_at ON public.company_units;

CREATE TRIGGER company_units_set_updated_at
  BEFORE UPDATE ON public.company_units
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.company_resource_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  resource_type public.rate_library_category NOT NULL,
  description VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS company_resource_categories_code_active_unique
  ON public.company_resource_categories (code)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS company_resource_categories_type_idx
  ON public.company_resource_categories (resource_type)
  WHERE deleted_at IS NULL AND is_active = true;

DROP TRIGGER IF EXISTS company_resource_categories_set_updated_at ON public.company_resource_categories;

CREATE TRIGGER company_resource_categories_set_updated_at
  BEFORE UPDATE ON public.company_resource_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.rate_library_items
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.company_suppliers (id) ON DELETE SET NULL;

ALTER TABLE public.rate_library_items
  ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.company_units (id) ON DELETE SET NULL;

ALTER TABLE public.rate_library_items
  ADD COLUMN IF NOT EXISTS resource_category_id UUID REFERENCES public.company_resource_categories (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS rate_library_items_supplier_idx
  ON public.rate_library_items (supplier_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS rate_library_items_unit_idx
  ON public.rate_library_items (unit_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS rate_library_items_resource_category_idx
  ON public.rate_library_items (resource_category_id)
  WHERE deleted_at IS NULL;

-- Seed common units of measure
INSERT INTO public.company_units (code, symbol, name, description, created_by, updated_by)
SELECT
  v.code,
  v.symbol,
  v.name,
  v.description,
  u.id,
  u.id
FROM (
  VALUES
    ('ITEM', 'item', 'Item', 'Lump sum / each'),
    ('M', 'm', 'Meter', 'Linear meter'),
    ('M2', 'm2', 'Square Meter', 'Area'),
    ('M3', 'm3', 'Cubic Meter', 'Volume'),
    ('KG', 'kg', 'Kilogram', 'Mass'),
    ('TON', 'ton', 'Metric Ton', 'Mass'),
    ('HR', 'hr', 'Hour', 'Labor / equipment time'),
    ('DAY', 'day', 'Day', 'Daily rate'),
    ('LS', 'ls', 'Lump Sum', 'Lump sum amount')
) AS v(code, symbol, name, description)
CROSS JOIN LATERAL (
  SELECT id FROM public.users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1
) AS u
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_units WHERE deleted_at IS NULL AND code = v.code
);

ALTER TABLE public.company_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_resource_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_suppliers_select
  ON public.company_suppliers
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY company_suppliers_manage
  ON public.company_suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY company_suppliers_update
  ON public.company_suppliers
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY company_units_select
  ON public.company_units
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY company_units_manage
  ON public.company_units
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY company_units_update
  ON public.company_units
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY company_resource_categories_select
  ON public.company_resource_categories
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY company_resource_categories_manage
  ON public.company_resource_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY company_resource_categories_update
  ON public.company_resource_categories
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('super_admin', 'admin')
  );

-- Restrict rate library writes to admins (estimators/QS view and use only)
DROP POLICY IF EXISTS rate_library_items_insert ON public.rate_library_items;
DROP POLICY IF EXISTS rate_library_items_update ON public.rate_library_items;

CREATE POLICY rate_library_items_insert
  ON public.rate_library_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.current_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY rate_library_items_update
  ON public.rate_library_items
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('super_admin', 'admin')
  );

GRANT SELECT, INSERT, UPDATE ON public.company_suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.company_units TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.company_resource_categories TO authenticated;
-- <<< END 20260708120000_company_resource_library.sql

-- >>> BEGIN 20260709120000_rate_buildup_sprint6.sql
-- Sprint 6: Resource-Based Rate Build-Up (additive)

ALTER TABLE public.boq_rate_analysis_lines
  ADD COLUMN IF NOT EXISTS waste_percent NUMERIC(5, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.boq_rate_analysis_lines
  ADD COLUMN IF NOT EXISTS productivity NUMERIC(15, 4);

ALTER TABLE public.boq_rate_analysis_lines
  DROP CONSTRAINT IF EXISTS boq_rate_analysis_waste_check;

ALTER TABLE public.boq_rate_analysis_lines
  ADD CONSTRAINT boq_rate_analysis_waste_check
  CHECK (waste_percent >= 0 AND waste_percent <= 100);

ALTER TABLE public.boq_rate_analysis_lines
  DROP CONSTRAINT IF EXISTS boq_rate_analysis_productivity_check;

ALTER TABLE public.boq_rate_analysis_lines
  ADD CONSTRAINT boq_rate_analysis_productivity_check
  CHECK (productivity IS NULL OR productivity > 0);

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS ocm_percent NUMERIC(5, 2);

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS contingency_percent NUMERIC(5, 2);

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS profit_percent NUMERIC(5, 2);

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS vat_percent NUMERIC(5, 2);

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS rate_buildup_direct_cost NUMERIC(15, 2);

ALTER TABLE public.boq_items
  DROP CONSTRAINT IF EXISTS boq_items_ocm_percent_check;

ALTER TABLE public.boq_items
  ADD CONSTRAINT boq_items_ocm_percent_check
  CHECK (ocm_percent IS NULL OR (ocm_percent >= 0 AND ocm_percent <= 100));

ALTER TABLE public.boq_items
  DROP CONSTRAINT IF EXISTS boq_items_contingency_percent_check;

ALTER TABLE public.boq_items
  ADD CONSTRAINT boq_items_contingency_percent_check
  CHECK (contingency_percent IS NULL OR (contingency_percent >= 0 AND contingency_percent <= 100));

ALTER TABLE public.boq_items
  DROP CONSTRAINT IF EXISTS boq_items_profit_percent_check;

ALTER TABLE public.boq_items
  ADD CONSTRAINT boq_items_profit_percent_check
  CHECK (profit_percent IS NULL OR (profit_percent >= 0 AND profit_percent <= 100));

ALTER TABLE public.boq_items
  DROP CONSTRAINT IF EXISTS boq_items_vat_percent_check;

ALTER TABLE public.boq_items
  ADD CONSTRAINT boq_items_vat_percent_check
  CHECK (vat_percent IS NULL OR (vat_percent >= 0 AND vat_percent <= 100));
-- <<< END 20260709120000_rate_buildup_sprint6.sql

-- >>> BEGIN 20260710120000_company_settings_sprint13.sql
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
-- <<< END 20260710120000_company_settings_sprint13.sql

-- >>> BEGIN 20260711120000_benchmark_sprint14.sql
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
-- <<< END 20260711120000_benchmark_sprint14.sql

-- >>> BEGIN 20260712120000_default_currency_php.sql
-- Quantix V1 — Default currency PHP (Philippine Peso)
-- Presentation default for new company settings and project details.

ALTER TABLE public.company_settings
  ALTER COLUMN default_currency SET DEFAULT 'PHP';

ALTER TABLE public.project_details
  ALTER COLUMN currency SET DEFAULT 'PHP';

UPDATE public.company_settings
SET default_currency = 'PHP'
WHERE default_currency = 'USD';
-- <<< END 20260712120000_default_currency_php.sql

NOTIFY pgrst, 'reload schema';

COMMIT;

