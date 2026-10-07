-- Quantix V1 Sprint 2: projects, project_details, estimate_summary, audit_log, project codes

CREATE TYPE public.project_status AS ENUM (
  'draft',
  'in_progress',
  'for_review',
  'approved',
  'archived'
);

CREATE TABLE public.project_code_sequences (
  year INTEGER PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

CREATE OR REPLACE FUNCTION public.generate_project_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  yr INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  seq INTEGER;
BEGIN
  INSERT INTO project_code_sequences (year, last_number)
  VALUES (yr, 1)
  ON CONFLICT (year)
  DO UPDATE SET last_number = project_code_sequences.last_number + 1
  RETURNING last_number INTO seq;

  RETURN format('QTX-%s-%s', yr, lpad(seq::TEXT, 6, '0'));
END;
$$;

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code VARCHAR(50) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  status public.project_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES public.users (id),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.users (id),
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES public.users (id)
);

CREATE UNIQUE INDEX projects_project_code_active_unique
  ON public.projects (project_code)
  WHERE deleted_at IS NULL;

CREATE INDEX projects_status_idx
  ON public.projects (status)
  WHERE deleted_at IS NULL;

CREATE INDEX projects_created_by_idx
  ON public.projects (created_by)
  WHERE deleted_at IS NULL;

CREATE INDEX projects_updated_at_idx
  ON public.projects (updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.project_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects (id) ON DELETE CASCADE,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER project_details_set_updated_at
  BEFORE UPDATE ON public.project_details
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.estimate_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects (id) ON DELETE CASCADE,
  direct_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  indirect_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  contingency NUMERIC(15, 2) NOT NULL DEFAULT 0,
  markup NUMERIC(15, 2) NOT NULL DEFAULT 0,
  vat NUMERIC(15, 2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER estimate_summary_set_updated_at
  BEFORE UPDATE ON public.estimate_summary
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES public.users (id),
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_entity_idx ON public.audit_log (entity_type, entity_id);
CREATE INDEX audit_log_created_at_idx ON public.audit_log (created_at DESC);

CREATE OR REPLACE FUNCTION public.owns_project(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = p_project_id
      AND created_by = auth.uid()
      AND deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.can_write_all_projects()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN (
    'super_admin',
    'admin',
    'quantity_surveyor'
  );
$$;

-- RLS: projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_select
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.can_write_all_projects()
      OR public.current_user_role() = 'viewer'
      OR created_by = auth.uid()
    )
  );

CREATE POLICY projects_insert
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'admin', 'estimator')
    AND created_by = auth.uid()
  );

CREATE POLICY projects_update
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      public.current_user_role() IN ('super_admin', 'admin')
      OR (
        public.current_user_role() = 'quantity_surveyor'
        AND status NOT IN ('approved', 'archived')
      )
      OR (
        public.current_user_role() = 'estimator'
        AND created_by = auth.uid()
        AND status IN ('draft', 'in_progress')
      )
    )
  )
  WITH CHECK (
    deleted_at IS NULL
    OR public.current_user_role() IN ('super_admin', 'admin', 'estimator')
  );

-- RLS: project_details
ALTER TABLE public.project_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_details_select
  ON public.project_details
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

CREATE POLICY project_details_insert
  ON public.project_details
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'admin', 'estimator')
    AND created_by = auth.uid()
  );

CREATE POLICY project_details_update
  ON public.project_details
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.deleted_at IS NULL
        AND (
          public.current_user_role() IN ('super_admin', 'admin')
          OR (
            public.current_user_role() = 'quantity_surveyor'
            AND p.status NOT IN ('approved', 'archived')
          )
          OR (
            public.current_user_role() = 'estimator'
            AND p.created_by = auth.uid()
            AND p.status IN ('draft', 'in_progress')
          )
        )
    )
  );

-- RLS: estimate_summary (read via project access)
ALTER TABLE public.estimate_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY estimate_summary_select
  ON public.estimate_summary
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

CREATE POLICY estimate_summary_insert
  ON public.estimate_summary
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- RLS: audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_insert
  ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = auth.uid());

CREATE POLICY audit_log_select_admin
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_admin_or_above());

GRANT EXECUTE ON FUNCTION public.generate_project_code() TO authenticated;
