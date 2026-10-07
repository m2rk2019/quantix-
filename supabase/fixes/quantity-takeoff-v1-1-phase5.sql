-- Quantix V1.1 Phase 5 fix script (manual apply)
ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS quantity_source TEXT;

UPDATE public.boq_items
SET quantity_source = CASE
  WHEN imported_at IS NOT NULL OR source_workbook IS NOT NULL THEN 'excel_import'
  ELSE 'manual'
END
WHERE quantity_source IS NULL AND deleted_at IS NULL;

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
