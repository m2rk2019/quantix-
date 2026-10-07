-- Master Template Versioning (V1 acceptance)
-- Additive / backward-compatible. Does not alter Import Engine v1.
-- Every save creates a NEW immutable version row — never overwrite snapshots.

BEGIN;

-- Version + origin metadata on master_templates
ALTER TABLE public.master_templates
  ADD COLUMN IF NOT EXISTS template_version TEXT NOT NULL DEFAULT '1.0';

ALTER TABLE public.master_templates
  ADD COLUMN IF NOT EXISTS created_from_project_id UUID
    REFERENCES public.projects (id) ON DELETE SET NULL;

-- Backfill origin from legacy source_project_id
UPDATE public.master_templates
SET created_from_project_id = source_project_id
WHERE created_from_project_id IS NULL
  AND source_project_id IS NOT NULL;

-- template_key is now the family key; uniqueness is (template_key, template_version)
ALTER TABLE public.master_templates
  DROP CONSTRAINT IF EXISTS master_templates_template_key_key;

CREATE UNIQUE INDEX IF NOT EXISTS master_templates_key_version_uidx
  ON public.master_templates (template_key, template_version);

CREATE INDEX IF NOT EXISTS master_templates_family_created_idx
  ON public.master_templates (template_key, created_at DESC);

CREATE INDEX IF NOT EXISTS master_templates_created_from_project_idx
  ON public.master_templates (created_from_project_id)
  WHERE created_from_project_id IS NOT NULL;

-- Projects permanently store the exact template version they originated from
ALTER TABLE public.project_details
  ADD COLUMN IF NOT EXISTS source_master_template_version TEXT;

COMMENT ON COLUMN public.master_templates.template_version IS
  'Immutable semantic version within a template family (1.0, 1.1, …). Display as v{version}.';
COMMENT ON COLUMN public.master_templates.created_from_project_id IS
  'Approved project this template version was saved from.';
COMMENT ON COLUMN public.project_details.source_master_template_version IS
  'Frozen template_version string copied at project creation — never changes when new template versions are saved.';

-- Immutable core fields: never overwrite an existing master template snapshot/version
CREATE OR REPLACE FUNCTION public.prevent_master_template_overwrite()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.snapshot IS DISTINCT FROM NEW.snapshot
     OR OLD.template_version IS DISTINCT FROM NEW.template_version
     OR OLD.template_key IS DISTINCT FROM NEW.template_key
     OR OLD.created_from_project_id IS DISTINCT FROM NEW.created_from_project_id
     OR OLD.source_project_id IS DISTINCT FROM NEW.source_project_id
     OR OLD.created_by IS DISTINCT FROM NEW.created_by
     OR OLD.created_at IS DISTINCT FROM NEW.created_at
  THEN
    RAISE EXCEPTION
      'Master templates are immutable. Save as Master Template creates a new version; do not overwrite existing rows.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS master_templates_prevent_overwrite ON public.master_templates;
CREATE TRIGGER master_templates_prevent_overwrite
  BEFORE UPDATE ON public.master_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_master_template_overwrite();

COMMIT;
