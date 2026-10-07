-- Project Rate Library (Master–Project architecture, Phase 1).
-- Additive and non-breaking: company rate_library_items unchanged;
-- project_rate_library_items starts empty for all projects.
-- Rate analysis continues to use library_item_id → rate_library_items.

BEGIN;

-- ---------------------------------------------------------------------------
-- project_rate_library_items
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.project_rate_library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description VARCHAR(500) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'item',
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  category public.rate_library_category NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  supplier_id UUID REFERENCES public.company_suppliers (id) ON DELETE SET NULL,
  unit_id UUID REFERENCES public.company_units (id) ON DELETE SET NULL,
  resource_category_id UUID REFERENCES public.company_resource_categories (id) ON DELETE SET NULL,
  source_company_item_id UUID REFERENCES public.rate_library_items (id) ON DELETE SET NULL,
  source_unit_cost NUMERIC(15, 2),
  source_updated_at TIMESTAMPTZ,
  ignore_company_updates BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT project_rate_library_items_unit_cost_check CHECK (unit_cost >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS project_rate_library_items_project_code_active_unique
  ON public.project_rate_library_items (project_id, code)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS project_rate_library_items_project_source_active_unique
  ON public.project_rate_library_items (project_id, source_company_item_id)
  WHERE deleted_at IS NULL AND source_company_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS project_rate_library_items_project_category_idx
  ON public.project_rate_library_items (project_id, category)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS project_rate_library_items_project_active_idx
  ON public.project_rate_library_items (project_id)
  WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX IF NOT EXISTS project_rate_library_items_source_idx
  ON public.project_rate_library_items (source_company_item_id)
  WHERE deleted_at IS NULL AND source_company_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS project_rate_library_items_search_idx
  ON public.project_rate_library_items USING gin (
    to_tsvector('simple', coalesce(code, '') || ' ' || coalesce(description, ''))
  )
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS project_rate_library_items_set_updated_at
  ON public.project_rate_library_items;
CREATE TRIGGER project_rate_library_items_set_updated_at
  BEFORE UPDATE ON public.project_rate_library_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Phase 2 prep: optional link from analysis lines to project-owned copies
ALTER TABLE public.boq_rate_analysis_lines
  ADD COLUMN IF NOT EXISTS project_library_item_id UUID
    REFERENCES public.project_rate_library_items (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS boq_rate_analysis_lines_project_library_idx
  ON public.boq_rate_analysis_lines (project_library_item_id)
  WHERE deleted_at IS NULL AND project_library_item_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.project_rate_library_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS project_rate_library_items_select ON public.project_rate_library_items;
CREATE POLICY project_rate_library_items_select
  ON public.project_rate_library_items
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = project_id
        AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS project_rate_library_items_insert ON public.project_rate_library_items;
CREATE POLICY project_rate_library_items_insert
  ON public.project_rate_library_items
  FOR INSERT
  TO authenticated
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

DROP POLICY IF EXISTS project_rate_library_items_update ON public.project_rate_library_items;
CREATE POLICY project_rate_library_items_update
  ON public.project_rate_library_items
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

GRANT SELECT, INSERT, UPDATE ON public.project_rate_library_items TO authenticated;
GRANT ALL ON public.project_rate_library_items TO service_role;

-- ---------------------------------------------------------------------------
-- Helper: can the current user edit a project's rate library?
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_edit_project_rate_library(p_project_id uuid)
RETURNS boolean
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
  );
$$;

REVOKE ALL ON FUNCTION public.can_edit_project_rate_library(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_edit_project_rate_library(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_project_rate_library(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- Import company resources → project-owned copies (single statement)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.import_company_resources_to_project(
  p_project_id uuid,
  p_company_item_ids uuid[],
  p_actor_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := coalesce(p_actor_id, auth.uid());
  v_imported_ids uuid[] := ARRAY[]::uuid[];
  v_skipped int := 0;
  v_requested int := 0;
BEGIN
  IF auth.uid() IS NULL AND p_actor_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Actor required';
  END IF;

  -- Session callers must pass project edit RLS; service-role callers supply p_actor_id
  -- after application-level authorization.
  IF auth.uid() IS NOT NULL
     AND NOT public.can_edit_project_rate_library(p_project_id) THEN
    RAISE EXCEPTION 'You do not have permission to edit the project rate library.';
  END IF;

  IF p_company_item_ids IS NULL OR cardinality(p_company_item_ids) = 0 THEN
    RETURN jsonb_build_object(
      'imported_count', 0,
      'skipped_count', 0,
      'imported_ids', '[]'::jsonb
    );
  END IF;

  v_requested := cardinality(p_company_item_ids);

  WITH candidates AS (
    SELECT DISTINCT ON (r.id)
      r.id AS source_id,
      r.code,
      r.description,
      r.unit,
      r.unit_cost,
      r.category,
      r.is_active,
      r.supplier_id,
      r.unit_id,
      r.resource_category_id,
      r.updated_at AS source_updated_at
    FROM public.rate_library_items r
    WHERE r.id = ANY (p_company_item_ids)
      AND r.deleted_at IS NULL
    ORDER BY r.id
  ),
  filtered AS (
    SELECT c.*
    FROM candidates c
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.project_rate_library_items p
      WHERE p.project_id = p_project_id
        AND p.deleted_at IS NULL
        AND p.source_company_item_id = c.source_id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.project_rate_library_items p
      WHERE p.project_id = p_project_id
        AND p.deleted_at IS NULL
        AND lower(p.code) = lower(c.code)
    )
  ),
  inserted AS (
    INSERT INTO public.project_rate_library_items (
      project_id,
      code,
      description,
      unit,
      unit_cost,
      category,
      is_active,
      supplier_id,
      unit_id,
      resource_category_id,
      source_company_item_id,
      source_unit_cost,
      source_updated_at,
      ignore_company_updates,
      created_by,
      updated_by
    )
    SELECT
      p_project_id,
      f.code,
      f.description,
      f.unit,
      f.unit_cost,
      f.category,
      f.is_active,
      f.supplier_id,
      f.unit_id,
      f.resource_category_id,
      f.source_id,
      f.unit_cost,
      f.source_updated_at,
      false,
      v_actor,
      v_actor
    FROM filtered f
    RETURNING id
  )
  SELECT coalesce(array_agg(id), ARRAY[]::uuid[])
  INTO v_imported_ids
  FROM inserted;

  v_skipped := greatest(
    0,
    v_requested - coalesce(cardinality(v_imported_ids), 0)
  );

  RETURN jsonb_build_object(
    'imported_count', coalesce(cardinality(v_imported_ids), 0),
    'skipped_count', v_skipped,
    'imported_ids', to_jsonb(coalesce(v_imported_ids, ARRAY[]::uuid[]))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.import_company_resources_to_project(uuid, uuid[], uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.import_company_resources_to_project(uuid, uuid[], uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_company_resources_to_project(uuid, uuid[], uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- Stale detection (company rates newer than project snapshots)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.list_project_rate_library_stale(
  p_project_id uuid
)
RETURNS TABLE (
  project_item_id uuid,
  source_company_item_id uuid,
  code varchar,
  description varchar,
  category public.rate_library_category,
  project_unit_cost numeric,
  company_unit_cost numeric,
  source_unit_cost numeric,
  company_updated_at timestamptz,
  source_updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id AS project_item_id,
    p.source_company_item_id,
    p.code,
    p.description,
    p.category,
    p.unit_cost AS project_unit_cost,
    c.unit_cost AS company_unit_cost,
    p.source_unit_cost,
    c.updated_at AS company_updated_at,
    p.source_updated_at
  FROM public.project_rate_library_items p
  INNER JOIN public.rate_library_items c
    ON c.id = p.source_company_item_id
  WHERE p.project_id = p_project_id
    AND p.deleted_at IS NULL
    AND p.source_company_item_id IS NOT NULL
    AND p.ignore_company_updates = false
    AND c.deleted_at IS NULL
    AND (
      c.unit_cost IS DISTINCT FROM p.source_unit_cost
      OR c.updated_at IS DISTINCT FROM p.source_updated_at
    );
$$;

REVOKE ALL ON FUNCTION public.list_project_rate_library_stale(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_project_rate_library_stale(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_project_rate_library_stale(uuid) TO service_role;

-- ---------------------------------------------------------------------------
-- Sync selected/all stale project rates from company master
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_project_rate_library_from_company(
  p_project_id uuid,
  p_item_ids uuid[] DEFAULT NULL,
  p_actor_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := coalesce(p_actor_id, auth.uid());
  v_updated_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF auth.uid() IS NOT NULL AND NOT public.can_edit_project_rate_library(p_project_id) THEN
    RAISE EXCEPTION 'You do not have permission to edit the project rate library.';
  END IF;

  WITH stale AS (
    SELECT s.project_item_id, s.company_unit_cost, s.company_updated_at
    FROM public.list_project_rate_library_stale(p_project_id) s
    WHERE p_item_ids IS NULL
       OR s.project_item_id = ANY (p_item_ids)
  ),
  updated AS (
    UPDATE public.project_rate_library_items p
    SET
      unit_cost = stale.company_unit_cost,
      source_unit_cost = stale.company_unit_cost,
      source_updated_at = stale.company_updated_at,
      updated_by = v_actor
    FROM stale
    WHERE p.id = stale.project_item_id
      AND p.project_id = p_project_id
      AND p.deleted_at IS NULL
    RETURNING p.id
  )
  SELECT coalesce(array_agg(id), ARRAY[]::uuid[])
  INTO v_updated_ids
  FROM updated;

  RETURN jsonb_build_object(
    'updated_count', coalesce(cardinality(v_updated_ids), 0),
    'updated_ids', to_jsonb(coalesce(v_updated_ids, ARRAY[]::uuid[]))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sync_project_rate_library_from_company(uuid, uuid[], uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_project_rate_library_from_company(uuid, uuid[], uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_project_rate_library_from_company(uuid, uuid[], uuid) TO service_role;

COMMIT;
