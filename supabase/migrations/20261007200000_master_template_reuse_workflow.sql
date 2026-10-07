-- Master Template Workflow + BOQ provenance + deterministic matching support
-- Additive / backward-compatible. Does not alter Import Engine v1.

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

-- Permanent import provenance (audit / reconciliation / historical tracking)
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

COMMENT ON COLUMN public.project_details.source_master_template_id IS
  'Master template used to create this project (template reuse workflow).';
COMMENT ON COLUMN public.project_details.template_reuse_report IS
  'Latest Template Reuse Report after importing a BCB against the source template.';
COMMENT ON COLUMN public.boq_items.template_match_status IS
  'exact_match | quantity_changed | unit_rate_changed | new_item | removed_item | uncertain_match';
COMMENT ON COLUMN public.boq_items.needs_estimator_review IS
  'True for new/unmatched/low-confidence items requiring estimator review.';
COMMENT ON COLUMN public.boq_items.source_workbook IS
  'Source Excel workbook filename for this BOQ line.';
COMMENT ON COLUMN public.boq_items.source_sheet IS
  'Source worksheet name for this BOQ line.';
COMMENT ON COLUMN public.boq_items.source_row IS
  '1-based Excel row number in the source sheet.';
COMMENT ON COLUMN public.boq_items.imported_at IS
  'Timestamp when this line was last imported/reconciled from Excel.';
COMMENT ON COLUMN public.boq_items.match_confidence IS
  'Deterministic match confidence (0–1) against master template when applicable.';

COMMIT;
