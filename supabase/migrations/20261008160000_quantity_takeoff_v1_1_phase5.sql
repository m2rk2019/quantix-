-- Quantix V1.1 Phase 5 — Takeoff ↔ BOQ integration (additive)
-- Does NOT modify Import Engine / smart-import / master templates / historical archive.

-- Explicit quantity source on BOQ (nullable; derived when null)
ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS quantity_source TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'boq_items_quantity_source_check'
  ) THEN
    ALTER TABLE public.boq_items
      ADD CONSTRAINT boq_items_quantity_source_check
      CHECK (
        quantity_source IS NULL
        OR quantity_source IN ('takeoff', 'excel_import', 'manual')
      );
  END IF;
END $$;

-- Backfill existing rows once (preserve V1 values; only set when null)
UPDATE public.boq_items
SET quantity_source = CASE
  WHEN imported_at IS NOT NULL OR source_workbook IS NOT NULL THEN 'excel_import'
  ELSE 'manual'
END
WHERE quantity_source IS NULL
  AND deleted_at IS NULL;

COMMENT ON COLUMN public.boq_items.quantity_source IS
  'Phase 5: takeoff | excel_import | manual — source of quantity value';

-- Link table: Project → WBS → BOQ ← Measurement
CREATE TABLE IF NOT EXISTS public.takeoff_boq_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  wbs_id UUID NOT NULL REFERENCES public.wbs (id) ON DELETE CASCADE,
  boq_id UUID NOT NULL REFERENCES public.boq_items (id) ON DELETE CASCADE,
  measurement_id UUID NOT NULL REFERENCES public.takeoff_measurements (id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT takeoff_boq_links_measurement_unique UNIQUE (measurement_id)
);

CREATE INDEX IF NOT EXISTS takeoff_boq_links_project_idx
  ON public.takeoff_boq_links (project_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS takeoff_boq_links_boq_idx
  ON public.takeoff_boq_links (boq_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS takeoff_boq_links_wbs_idx
  ON public.takeoff_boq_links (wbs_id)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS takeoff_boq_links_set_updated_at ON public.takeoff_boq_links;
CREATE TRIGGER takeoff_boq_links_set_updated_at
  BEFORE UPDATE ON public.takeoff_boq_links
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.takeoff_boq_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS takeoff_boq_links_select ON public.takeoff_boq_links;
CREATE POLICY takeoff_boq_links_select
  ON public.takeoff_boq_links FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS takeoff_boq_links_write ON public.takeoff_boq_links;
CREATE POLICY takeoff_boq_links_write
  ON public.takeoff_boq_links FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
        AND (
          public.can_write_all_projects()
          OR public.is_admin_or_above()
          OR p.created_by = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
        AND p.status NOT IN ('approved', 'archived')
        AND (
          public.can_write_all_projects()
          OR public.is_admin_or_above()
          OR p.created_by = auth.uid()
        )
    )
  );

COMMENT ON TABLE public.takeoff_boq_links IS
  'Phase 5: links takeoff measurements to BOQ items (many measurements → one BOQ)';
