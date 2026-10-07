-- =============================================================================
-- Quantix — allow service_role / system updates on project child ownership
-- Idempotent. Does not modify existing estimate/project data.
--
-- Problem: set_project_child_ownership() raised 'Not authenticated' whenever
-- auth.uid() was null (service_role admin clients, background jobs).
-- App session updates still force ownership from auth.uid().
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_project_child_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Authenticated users: stamp ownership from the session.
  IF auth.uid() IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      NEW.created_by := coalesce(NEW.created_by, auth.uid());
      NEW.updated_by := auth.uid();
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.updated_by := auth.uid();
    END IF;
    RETURN NEW;
  END IF;

  -- Service-role / system callers (auth.uid() is null):
  -- allow when ownership fields are already provided; do not invent actors.
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_by IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;
    NEW.updated_by := coalesce(NEW.updated_by, NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Keep caller-supplied updated_by when present; otherwise preserve OLD.
    NEW.updated_by := coalesce(NEW.updated_by, OLD.updated_by, OLD.created_by);
  END IF;

  RETURN NEW;
END;
$$;
