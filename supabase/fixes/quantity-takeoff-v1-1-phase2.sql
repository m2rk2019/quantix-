-- Quantix V1.1 Phase 2 — Takeoff Workspace enhancements
-- Additive only. Does not alter Import Engine v1 or BOQ.

BEGIN;

ALTER TABLE public.takeoff_drawings
  ADD COLUMN IF NOT EXISTS discipline TEXT;

ALTER TABLE public.takeoff_sheets
  ADD COLUMN IF NOT EXISTS discipline TEXT;

ALTER TABLE public.takeoff_measurements
  ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.takeoff_measurements
  ADD COLUMN IF NOT EXISTS discipline TEXT;

ALTER TABLE public.takeoff_measurements
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'm';

ALTER TABLE public.takeoff_measurements
  ADD COLUMN IF NOT EXISTS preset_key TEXT;

ALTER TABLE public.takeoff_measurements
  ADD COLUMN IF NOT EXISTS created_by_name TEXT;

CREATE INDEX IF NOT EXISTS takeoff_sheets_discipline_idx
  ON public.takeoff_sheets (project_id, discipline)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS takeoff_measurements_discipline_idx
  ON public.takeoff_measurements (project_id, discipline)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.takeoff_sheets.discipline IS
  'Drawing discipline for explorer grouping (Architectural, Structural, MEPF, …).';
COMMENT ON COLUMN public.takeoff_measurements.preset_key IS
  'Palette preset key that created this measurement (optional).';

COMMIT;
