-- Phase 5: Tender Submission Package
-- Versioned tender packages with section config, branding, and stored exports.
-- Additive / backward-compatible.

BEGIN;

-- ---------------------------------------------------------------------------
-- Per-project commercial narrative + sign-off (optional; null-safe)
-- ---------------------------------------------------------------------------

ALTER TABLE public.project_details
  ADD COLUMN IF NOT EXISTS assumptions TEXT,
  ADD COLUMN IF NOT EXISTS exclusions TEXT,
  ADD COLUMN IF NOT EXISTS commercial_notes TEXT,
  ADD COLUMN IF NOT EXISTS prepared_by_name TEXT,
  ADD COLUMN IF NOT EXISTS checked_by_name TEXT,
  ADD COLUMN IF NOT EXISTS approved_by_name TEXT;

-- ---------------------------------------------------------------------------
-- tender_submissions — version history per project
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tender_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated'
    CHECK (status IN ('draft', 'generated', 'exported', 'archived')),
  enabled_sections TEXT[] NOT NULL DEFAULT '{}',
  branding JSONB NOT NULL DEFAULT '{}'::JSONB,
  package_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  prepared_by_name TEXT,
  checked_by_name TEXT,
  approved_by_name TEXT,
  generated_by UUID REFERENCES public.users (id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tender_submissions_version_check CHECK (version >= 1),
  UNIQUE (project_id, version)
);

CREATE INDEX IF NOT EXISTS tender_submissions_project_idx
  ON public.tender_submissions (project_id, version DESC);

CREATE INDEX IF NOT EXISTS tender_submissions_generated_at_idx
  ON public.tender_submissions (generated_at DESC);

DROP TRIGGER IF EXISTS tender_submissions_set_updated_at ON public.tender_submissions;
CREATE TRIGGER tender_submissions_set_updated_at
  BEFORE UPDATE ON public.tender_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tender_submission_exports — stored files for reproducibility
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tender_submission_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_submission_id UUID NOT NULL
    REFERENCES public.tender_submissions (id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'excel', 'zip')),
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  content_base64 TEXT NOT NULL,
  generated_by UUID REFERENCES public.users (id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tender_submission_id, export_type)
);

CREATE INDEX IF NOT EXISTS tender_submission_exports_submission_idx
  ON public.tender_submission_exports (tender_submission_id);

-- ---------------------------------------------------------------------------
-- Extend historical snapshot sections for tender_package
-- ---------------------------------------------------------------------------

ALTER TABLE public.historical_project_snapshots
  DROP CONSTRAINT IF EXISTS historical_project_snapshots_section_check;

ALTER TABLE public.historical_project_snapshots
  ADD CONSTRAINT historical_project_snapshots_section_check
  CHECK (
    section IN (
      'project_information',
      'wbs',
      'boq',
      'project_resource_library',
      'estimate_summary',
      'ai_outputs',
      'executive_reports',
      'tender_package'
    )
  );

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE public.tender_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_submission_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tender_submissions_select ON public.tender_submissions;
CREATE POLICY tender_submissions_select
  ON public.tender_submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS tender_submissions_insert ON public.tender_submissions;
CREATE POLICY tender_submissions_insert
  ON public.tender_submissions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.deleted_at IS NULL
        AND (
          public.is_admin_or_above()
          OR public.can_write_all_projects()
          OR public.owns_project(p.id)
        )
    )
  );

DROP POLICY IF EXISTS tender_submissions_update ON public.tender_submissions;
CREATE POLICY tender_submissions_update
  ON public.tender_submissions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.deleted_at IS NULL
        AND (
          public.is_admin_or_above()
          OR public.can_write_all_projects()
          OR public.owns_project(p.id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.deleted_at IS NULL
        AND (
          public.is_admin_or_above()
          OR public.can_write_all_projects()
          OR public.owns_project(p.id)
        )
    )
  );

DROP POLICY IF EXISTS tender_submission_exports_select ON public.tender_submission_exports;
CREATE POLICY tender_submission_exports_select
  ON public.tender_submission_exports FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.tender_submissions ts
      JOIN public.projects p ON p.id = ts.project_id
      WHERE ts.id = tender_submission_id
        AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS tender_submission_exports_insert ON public.tender_submission_exports;
CREATE POLICY tender_submission_exports_insert
  ON public.tender_submission_exports FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.tender_submissions ts
      JOIN public.projects p ON p.id = ts.project_id
      WHERE ts.id = tender_submission_id
        AND p.deleted_at IS NULL
        AND (
          public.is_admin_or_above()
          OR public.can_write_all_projects()
          OR public.owns_project(p.id)
        )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tender_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tender_submission_exports TO authenticated;

COMMIT;
