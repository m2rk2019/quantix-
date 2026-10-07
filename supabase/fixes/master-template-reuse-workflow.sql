-- Idempotent fix pack for Master Template Reuse + BOQ provenance (V1).
-- Safe to re-run. Does not alter Import Engine v1.

BEGIN;

ALTER TABLE public.project_details
  ADD COLUMN IF NOT EXISTS source_master_template_id UUID
    REFERENCES public.master_templates (id) ON DELETE SET NULL;

ALTER TABLE public.project_details
  ADD COLUMN IF NOT EXISTS template_reuse_report JSONB NOT NULL DEFAULT '{}'::JSONB;

CREATE INDEX IF NOT EXISTS project_details_source_master_template_idx
  ON public.project_details (source_master_template_id)
  WHERE source_master_template_id IS NOT NULL;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS template_match_status TEXT;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS needs_estimator_review BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS source_workbook TEXT;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS source_sheet TEXT;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS source_row INTEGER;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS match_confidence NUMERIC(5,4);

COMMIT;
