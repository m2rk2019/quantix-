-- Quantix V1 Sprint 4: wbs and boq_items (schema per DATABASE_DESIGN_V1)

CREATE TABLE public.wbs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.wbs (id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 1),
  wbs_code VARCHAR(50) NOT NULL,
  description VARCHAR(500) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CHECK (parent_id IS NULL OR parent_id != id)
);

CREATE UNIQUE INDEX wbs_project_code_active_unique
  ON public.wbs (project_id, wbs_code)
  WHERE deleted_at IS NULL;

CREATE INDEX wbs_project_parent_idx
  ON public.wbs (project_id, parent_id)
  WHERE deleted_at IS NULL;

CREATE INDEX wbs_project_parent_sort_idx
  ON public.wbs (project_id, parent_id, sort_order)
  WHERE deleted_at IS NULL;

CREATE TRIGGER wbs_set_updated_at
  BEFORE UPDATE ON public.wbs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.boq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  wbs_id UUID NOT NULL REFERENCES public.wbs (id) ON DELETE CASCADE,
  item_code VARCHAR(50) NOT NULL,
  description VARCHAR(500) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'item',
  quantity NUMERIC(15, 2) NOT NULL DEFAULT 0,
  material_rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
  labor_rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
  equipment_rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
  subcontract_rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_rate NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CHECK (quantity >= 0),
  CHECK (material_rate >= 0),
  CHECK (labor_rate >= 0),
  CHECK (equipment_rate >= 0),
  CHECK (subcontract_rate >= 0),
  CHECK (total_rate >= 0),
  CHECK (total_amount >= 0)
);

CREATE UNIQUE INDEX boq_items_project_code_active_unique
  ON public.boq_items (project_id, item_code)
  WHERE deleted_at IS NULL;

CREATE INDEX boq_items_wbs_idx
  ON public.boq_items (wbs_id)
  WHERE deleted_at IS NULL;

CREATE INDEX boq_items_project_idx
  ON public.boq_items (project_id)
  WHERE deleted_at IS NULL;

CREATE TRIGGER boq_items_set_updated_at
  BEFORE UPDATE ON public.boq_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS: wbs
ALTER TABLE public.wbs ENABLE ROW LEVEL SECURITY;

CREATE POLICY wbs_select
  ON public.wbs
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

CREATE POLICY wbs_insert
  ON public.wbs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
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

CREATE POLICY wbs_update
  ON public.wbs
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
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

-- RLS: boq_items (read for WBS counts; write deferred to Sprint 5)
ALTER TABLE public.boq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY boq_items_select
  ON public.boq_items
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );
