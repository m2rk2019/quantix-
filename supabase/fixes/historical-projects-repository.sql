-- Phase 4: Historical Projects Repository
-- Immutable company knowledge captured from completed estimates.
-- Designed so Historical Cost Intelligence / Benchmarking can layer on later
-- without changing live project tables. Additive and backward-compatible.

BEGIN;

-- ---------------------------------------------------------------------------
-- historical_projects — searchable registry (one active row per source project)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.historical_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_project_id UUID REFERENCES public.projects (id) ON DELETE SET NULL,
  project_code TEXT NOT NULL,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT,
  building_type TEXT,
  project_type TEXT,
  contract_type TEXT,
  currency TEXT NOT NULL DEFAULT 'PHP',
  discipline_tags TEXT[] NOT NULL DEFAULT '{}',
  resource_tags TEXT[] NOT NULL DEFAULT '{}',
  supplier_tags TEXT[] NOT NULL DEFAULT '{}',
  estimate_date TIMESTAMPTZ,
  source_status TEXT,
  archive_version INTEGER NOT NULL DEFAULT 1,
  is_knowledge_active BOOLEAN NOT NULL DEFAULT true,
  -- Future HCI / benchmarking hooks (unused by Phase 4 UI)
  is_benchmark_eligible BOOLEAN NOT NULL DEFAULT true,
  cost_intelligence_ready BOOLEAN NOT NULL DEFAULT false,
  grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  direct_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  indirect_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  contingency NUMERIC(15, 2) NOT NULL DEFAULT 0,
  markup NUMERIC(15, 2) NOT NULL DEFAULT 0,
  vat NUMERIC(15, 2) NOT NULL DEFAULT 0,
  boq_item_count INTEGER NOT NULL DEFAULT 0,
  wbs_node_count INTEGER NOT NULL DEFAULT 0,
  resource_count INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT historical_projects_archive_version_check CHECK (archive_version >= 1)
);

ALTER TABLE public.historical_projects
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE UNIQUE INDEX IF NOT EXISTS historical_projects_source_active_unique
  ON public.historical_projects (source_project_id)
  WHERE source_project_id IS NOT NULL AND is_knowledge_active = true;

CREATE INDEX IF NOT EXISTS historical_projects_name_idx
  ON public.historical_projects (project_name);

CREATE INDEX IF NOT EXISTS historical_projects_client_idx
  ON public.historical_projects (client_name);

CREATE INDEX IF NOT EXISTS historical_projects_location_idx
  ON public.historical_projects (location);

CREATE INDEX IF NOT EXISTS historical_projects_building_type_idx
  ON public.historical_projects (building_type);

CREATE INDEX IF NOT EXISTS historical_projects_estimate_date_idx
  ON public.historical_projects (estimate_date DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS historical_projects_discipline_tags_idx
  ON public.historical_projects USING gin (discipline_tags);

CREATE INDEX IF NOT EXISTS historical_projects_resource_tags_idx
  ON public.historical_projects USING gin (resource_tags);

CREATE INDEX IF NOT EXISTS historical_projects_supplier_tags_idx
  ON public.historical_projects USING gin (supplier_tags);

-- Full-text search: to_tsvector() is STABLE — cannot appear in index expressions
-- (42P17). Maintain search_vector via trigger; index the column directly.
CREATE OR REPLACE FUNCTION public.historical_projects_build_search_vector(
  p_row public.historical_projects
)
RETURNS tsvector
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT to_tsvector(
    'pg_catalog.simple'::regconfig,
    coalesce(p_row.project_name, '') || ' ' ||
    coalesce(p_row.project_code, '') || ' ' ||
    coalesce(p_row.client_name, '') || ' ' ||
    coalesce(p_row.location, '') || ' ' ||
    coalesce(p_row.building_type, '') || ' ' ||
    coalesce(array_to_string(p_row.discipline_tags, ' '), '') || ' ' ||
    coalesce(array_to_string(p_row.resource_tags, ' '), '') || ' ' ||
    coalesce(array_to_string(p_row.supplier_tags, ' '), '')
  );
$$;

CREATE OR REPLACE FUNCTION public.historical_projects_search_vector_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := public.historical_projects_build_search_vector(NEW);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS historical_projects_search_vector_trg ON public.historical_projects;
CREATE TRIGGER historical_projects_search_vector_trg
  BEFORE INSERT OR UPDATE
  ON public.historical_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.historical_projects_search_vector_trigger();

UPDATE public.historical_projects hp
SET search_vector = public.historical_projects_build_search_vector(hp)
WHERE search_vector IS NULL;

DROP INDEX IF EXISTS public.historical_projects_search_idx;
CREATE INDEX IF NOT EXISTS historical_projects_search_idx
  ON public.historical_projects USING gin (search_vector);

DROP TRIGGER IF EXISTS historical_projects_set_updated_at ON public.historical_projects;
CREATE TRIGGER historical_projects_set_updated_at
  BEFORE UPDATE ON public.historical_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- historical_project_snapshots — full-fidelity section payloads for clone
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.historical_project_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historical_project_id UUID NOT NULL
    REFERENCES public.historical_projects (id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (
    section IN (
      'project_information',
      'wbs',
      'boq',
      'project_resource_library',
      'estimate_summary',
      'ai_outputs',
      'executive_reports'
    )
  ),
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (historical_project_id, section)
);

CREATE INDEX IF NOT EXISTS historical_project_snapshots_project_idx
  ON public.historical_project_snapshots (historical_project_id);

-- ---------------------------------------------------------------------------
-- Flattened indexes for search + future Historical Cost Intelligence
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.historical_boq_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historical_project_id UUID NOT NULL
    REFERENCES public.historical_projects (id) ON DELETE CASCADE,
  source_boq_item_id UUID,
  wbs_code TEXT,
  wbs_description TEXT,
  discipline TEXT,
  item_code TEXT,
  description TEXT,
  unit TEXT,
  quantity NUMERIC(18, 4) NOT NULL DEFAULT 0,
  unit_rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.historical_boq_lines
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS historical_boq_lines_project_idx
  ON public.historical_boq_lines (historical_project_id);

CREATE INDEX IF NOT EXISTS historical_boq_lines_discipline_idx
  ON public.historical_boq_lines (discipline);

CREATE OR REPLACE FUNCTION public.historical_boq_lines_build_search_vector(
  p_row public.historical_boq_lines
)
RETURNS tsvector
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT to_tsvector(
    'pg_catalog.simple'::regconfig,
    coalesce(p_row.item_code, '') || ' ' || coalesce(p_row.description, '')
  );
$$;

CREATE OR REPLACE FUNCTION public.historical_boq_lines_search_vector_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := public.historical_boq_lines_build_search_vector(NEW);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS historical_boq_lines_search_vector_trg ON public.historical_boq_lines;
CREATE TRIGGER historical_boq_lines_search_vector_trg
  BEFORE INSERT OR UPDATE
  ON public.historical_boq_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.historical_boq_lines_search_vector_trigger();

UPDATE public.historical_boq_lines hp
SET search_vector = public.historical_boq_lines_build_search_vector(hp)
WHERE search_vector IS NULL;

DROP INDEX IF EXISTS public.historical_boq_lines_description_idx;
CREATE INDEX IF NOT EXISTS historical_boq_lines_description_idx
  ON public.historical_boq_lines USING gin (search_vector);

CREATE TABLE IF NOT EXISTS public.historical_resource_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historical_project_id UUID NOT NULL
    REFERENCES public.historical_projects (id) ON DELETE CASCADE,
  source_item_id UUID,
  code TEXT,
  description TEXT,
  category TEXT,
  unit TEXT,
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  supplier_id UUID,
  supplier_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.historical_resource_rates
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS historical_resource_rates_project_idx
  ON public.historical_resource_rates (historical_project_id);

CREATE INDEX IF NOT EXISTS historical_resource_rates_code_idx
  ON public.historical_resource_rates (code);

CREATE INDEX IF NOT EXISTS historical_resource_rates_supplier_idx
  ON public.historical_resource_rates (supplier_name);

CREATE OR REPLACE FUNCTION public.historical_resource_rates_build_search_vector(
  p_row public.historical_resource_rates
)
RETURNS tsvector
LANGUAGE sql
STABLE
PARALLEL SAFE
AS $$
  SELECT to_tsvector(
    'pg_catalog.simple'::regconfig,
    coalesce(p_row.code, '') || ' ' ||
    coalesce(p_row.description, '') || ' ' ||
    coalesce(p_row.supplier_name, '')
  );
$$;

CREATE OR REPLACE FUNCTION public.historical_resource_rates_search_vector_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector := public.historical_resource_rates_build_search_vector(NEW);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS historical_resource_rates_search_vector_trg ON public.historical_resource_rates;
CREATE TRIGGER historical_resource_rates_search_vector_trg
  BEFORE INSERT OR UPDATE
  ON public.historical_resource_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.historical_resource_rates_search_vector_trigger();

UPDATE public.historical_resource_rates hp
SET search_vector = public.historical_resource_rates_build_search_vector(hp)
WHERE search_vector IS NULL;

DROP INDEX IF EXISTS public.historical_resource_rates_search_idx;
CREATE INDEX IF NOT EXISTS historical_resource_rates_search_idx
  ON public.historical_resource_rates USING gin (search_vector);

DROP FUNCTION IF EXISTS public.historical_immutable_tsvector_simple(text);

-- Clone provenance (optional link from new live project → historical source)
ALTER TABLE public.project_details
  ADD COLUMN IF NOT EXISTS cloned_from_historical_id UUID
    REFERENCES public.historical_projects (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS project_details_cloned_from_historical_idx
  ON public.project_details (cloned_from_historical_id)
  WHERE cloned_from_historical_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS — same single-tenant authenticated access as projects
-- ---------------------------------------------------------------------------

ALTER TABLE public.historical_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_project_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_boq_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_resource_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS historical_projects_select ON public.historical_projects;
CREATE POLICY historical_projects_select
  ON public.historical_projects FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS historical_projects_insert ON public.historical_projects;
CREATE POLICY historical_projects_insert
  ON public.historical_projects FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
    OR public.current_user_role() = 'estimator'
  );

DROP POLICY IF EXISTS historical_projects_update ON public.historical_projects;
CREATE POLICY historical_projects_update
  ON public.historical_projects FOR UPDATE TO authenticated
  USING (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
  )
  WITH CHECK (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
  );

DROP POLICY IF EXISTS historical_projects_delete ON public.historical_projects;
CREATE POLICY historical_projects_delete
  ON public.historical_projects FOR DELETE TO authenticated
  USING (public.is_admin_or_above());

DROP POLICY IF EXISTS historical_project_snapshots_select ON public.historical_project_snapshots;
CREATE POLICY historical_project_snapshots_select
  ON public.historical_project_snapshots FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS historical_project_snapshots_insert ON public.historical_project_snapshots;
CREATE POLICY historical_project_snapshots_insert
  ON public.historical_project_snapshots FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
    OR public.current_user_role() = 'estimator'
  );

DROP POLICY IF EXISTS historical_project_snapshots_update ON public.historical_project_snapshots;
CREATE POLICY historical_project_snapshots_update
  ON public.historical_project_snapshots FOR UPDATE TO authenticated
  USING (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
  )
  WITH CHECK (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
  );

DROP POLICY IF EXISTS historical_project_snapshots_delete ON public.historical_project_snapshots;
CREATE POLICY historical_project_snapshots_delete
  ON public.historical_project_snapshots FOR DELETE TO authenticated
  USING (public.is_admin_or_above());

DROP POLICY IF EXISTS historical_boq_lines_select ON public.historical_boq_lines;
CREATE POLICY historical_boq_lines_select
  ON public.historical_boq_lines FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS historical_boq_lines_insert ON public.historical_boq_lines;
CREATE POLICY historical_boq_lines_insert
  ON public.historical_boq_lines FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
    OR public.current_user_role() = 'estimator'
  );

DROP POLICY IF EXISTS historical_boq_lines_delete ON public.historical_boq_lines;
CREATE POLICY historical_boq_lines_delete
  ON public.historical_boq_lines FOR DELETE TO authenticated
  USING (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
  );

DROP POLICY IF EXISTS historical_resource_rates_select ON public.historical_resource_rates;
CREATE POLICY historical_resource_rates_select
  ON public.historical_resource_rates FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS historical_resource_rates_insert ON public.historical_resource_rates;
CREATE POLICY historical_resource_rates_insert
  ON public.historical_resource_rates FOR INSERT TO authenticated
  WITH CHECK (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
    OR public.current_user_role() = 'estimator'
  );

DROP POLICY IF EXISTS historical_resource_rates_delete ON public.historical_resource_rates;
CREATE POLICY historical_resource_rates_delete
  ON public.historical_resource_rates FOR DELETE TO authenticated
  USING (
    public.is_admin_or_above()
    OR public.can_write_all_projects()
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.historical_projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historical_project_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historical_boq_lines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historical_resource_rates TO authenticated;

COMMIT;
