-- Quantix V1.1 Phase 4 fix script (apply manually if migrations not auto-run)
-- Same as supabase/migrations/20261008140000_quantity_takeoff_v1_1_phase4.sql

ALTER TABLE public.takeoff_layers
  ADD COLUMN IF NOT EXISTS opacity NUMERIC(4, 3) NOT NULL DEFAULT 1.0;

ALTER TABLE public.takeoff_measurements
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'draft';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'takeoff_measurements_review_status_check'
  ) THEN
    ALTER TABLE public.takeoff_measurements
      ADD CONSTRAINT takeoff_measurements_review_status_check
      CHECK (review_status IN ('draft', 'checked', 'approved', 'rejected'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.takeoff_revision_clouds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  sheet_id UUID NOT NULL REFERENCES public.takeoff_sheets (id) ON DELETE CASCADE,
  label TEXT,
  color TEXT NOT NULL DEFAULT '#ef4444',
  geometry JSONB NOT NULL DEFAULT '{}'::JSONB,
  notes TEXT,
  created_by UUID REFERENCES public.users (id),
  created_by_name TEXT,
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.takeoff_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  sheet_id UUID REFERENCES public.takeoff_sheets (id) ON DELETE CASCADE,
  measurement_id UUID REFERENCES public.takeoff_measurements (id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.takeoff_comments (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.users (id),
  created_by_name TEXT,
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
