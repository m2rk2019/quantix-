-- Rollback for 20260715120100_project_rate_library.sql
-- Does NOT remove enum values 'service' / 'productivity' (PostgreSQL cannot
-- safely drop enum labels that may already be referenced).

BEGIN;

DROP FUNCTION IF EXISTS public.sync_project_rate_library_from_company(uuid, uuid[], uuid);
DROP FUNCTION IF EXISTS public.list_project_rate_library_stale(uuid);
DROP FUNCTION IF EXISTS public.import_company_resources_to_project(uuid, uuid[], uuid);
DROP FUNCTION IF EXISTS public.can_edit_project_rate_library(uuid);

DROP INDEX IF EXISTS public.boq_rate_analysis_lines_project_library_idx;

ALTER TABLE public.boq_rate_analysis_lines
  DROP COLUMN IF EXISTS project_library_item_id;

DROP POLICY IF EXISTS project_rate_library_items_update ON public.project_rate_library_items;
DROP POLICY IF EXISTS project_rate_library_items_insert ON public.project_rate_library_items;
DROP POLICY IF EXISTS project_rate_library_items_select ON public.project_rate_library_items;

DROP TRIGGER IF EXISTS project_rate_library_items_set_updated_at
  ON public.project_rate_library_items;

DROP TABLE IF EXISTS public.project_rate_library_items;

COMMIT;
