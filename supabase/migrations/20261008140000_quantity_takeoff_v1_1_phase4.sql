-- Quantix V1.1 Phase 4 — Drawing Intelligence
-- Additive only. Does NOT touch BOQ / Import Engine / estimate tables.

-- Layer opacity
ALTER TABLE public.takeoff_layers
  ADD COLUMN IF NOT EXISTS opacity NUMERIC(4, 3) NOT NULL DEFAULT 1.0
  CHECK (opacity >= 0 AND opacity <= 1);

-- Measurement review status
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

CREATE INDEX IF NOT EXISTS takeoff_measurements_review_status_idx
  ON public.takeoff_measurements (project_id, review_status)
  WHERE deleted_at IS NULL;

-- Revision clouds (markup)
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

CREATE INDEX IF NOT EXISTS takeoff_revision_clouds_sheet_idx
  ON public.takeoff_revision_clouds (sheet_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS takeoff_revision_clouds_project_idx
  ON public.takeoff_revision_clouds (project_id)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS takeoff_revision_clouds_set_updated_at ON public.takeoff_revision_clouds;
CREATE TRIGGER takeoff_revision_clouds_set_updated_at
  BEFORE UPDATE ON public.takeoff_revision_clouds
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Comments / replies
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
  deleted_at TIMESTAMPTZ,
  CONSTRAINT takeoff_comments_target_check CHECK (
    measurement_id IS NOT NULL OR sheet_id IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS takeoff_comments_project_idx
  ON public.takeoff_comments (project_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS takeoff_comments_measurement_idx
  ON public.takeoff_comments (measurement_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS takeoff_comments_parent_idx
  ON public.takeoff_comments (parent_id)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS takeoff_comments_set_updated_at ON public.takeoff_comments;
CREATE TRIGGER takeoff_comments_set_updated_at
  BEFORE UPDATE ON public.takeoff_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.takeoff_revision_clouds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takeoff_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS takeoff_revision_clouds_select ON public.takeoff_revision_clouds;
CREATE POLICY takeoff_revision_clouds_select
  ON public.takeoff_revision_clouds FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS takeoff_revision_clouds_write ON public.takeoff_revision_clouds;
CREATE POLICY takeoff_revision_clouds_write
  ON public.takeoff_revision_clouds FOR ALL TO authenticated
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

DROP POLICY IF EXISTS takeoff_comments_select ON public.takeoff_comments;
CREATE POLICY takeoff_comments_select
  ON public.takeoff_comments FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS takeoff_comments_write ON public.takeoff_comments;
CREATE POLICY takeoff_comments_write
  ON public.takeoff_comments FOR ALL TO authenticated
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

COMMENT ON COLUMN public.takeoff_measurements.review_status IS
  'Phase 4 review workflow: draft | checked | approved | rejected';
COMMENT ON TABLE public.takeoff_revision_clouds IS
  'Phase 4 revision cloud markups — not linked to BOQ';
COMMENT ON TABLE public.takeoff_comments IS
  'Phase 4 takeoff comments / replies — not linked to BOQ';
