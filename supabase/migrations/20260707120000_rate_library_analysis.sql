-- Rate Library + Rate Analysis (additive, non-breaking)

CREATE TYPE public.rate_library_category AS ENUM (
  'material',
  'labor',
  'equipment',
  'subcontract'
);

CREATE TABLE public.rate_library_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  description VARCHAR(500) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'item',
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  category public.rate_library_category NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT rate_library_items_unit_cost_check CHECK (unit_cost >= 0)
);

CREATE UNIQUE INDEX rate_library_items_code_active_unique
  ON public.rate_library_items (code)
  WHERE deleted_at IS NULL;

CREATE INDEX rate_library_items_category_idx
  ON public.rate_library_items (category)
  WHERE deleted_at IS NULL AND is_active = true;

CREATE INDEX rate_library_items_search_idx
  ON public.rate_library_items USING gin (
    to_tsvector('simple', coalesce(code, '') || ' ' || coalesce(description, ''))
  )
  WHERE deleted_at IS NULL;

CREATE TRIGGER rate_library_items_set_updated_at
  BEFORE UPDATE ON public.rate_library_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.boq_rate_analysis_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_item_id UUID NOT NULL REFERENCES public.boq_items (id) ON DELETE CASCADE,
  library_item_id UUID REFERENCES public.rate_library_items (id) ON DELETE SET NULL,
  category public.rate_library_category NOT NULL,
  resource_name VARCHAR(500) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'item',
  consumption NUMERIC(15, 4) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
  amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT boq_rate_analysis_consumption_check CHECK (consumption >= 0),
  CONSTRAINT boq_rate_analysis_unit_cost_check CHECK (unit_cost >= 0),
  CONSTRAINT boq_rate_analysis_amount_check CHECK (amount >= 0)
);

CREATE INDEX boq_rate_analysis_lines_item_idx
  ON public.boq_rate_analysis_lines (boq_item_id, category, sort_order)
  WHERE deleted_at IS NULL;

CREATE TRIGGER boq_rate_analysis_lines_set_updated_at
  BEFORE UPDATE ON public.boq_rate_analysis_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.user_rate_library_favorites (
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  library_item_id UUID NOT NULL REFERENCES public.rate_library_items (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, library_item_id)
);

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS material_rate_override BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS labor_rate_override BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS equipment_rate_override BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS subcontract_rate_override BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS other_cost_rate_override BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.rate_library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boq_rate_analysis_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rate_library_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY rate_library_items_select
  ON public.rate_library_items
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY rate_library_items_insert
  ON public.rate_library_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.current_user_role() IN (
      'super_admin',
      'admin',
      'estimator',
      'quantity_surveyor'
    )
  );

CREATE POLICY rate_library_items_update
  ON public.rate_library_items
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() IN (
      'super_admin',
      'admin',
      'estimator',
      'quantity_surveyor'
    )
  );

CREATE POLICY boq_rate_analysis_lines_select
  ON public.boq_rate_analysis_lines
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.boq_items AS b
      WHERE b.id = boq_item_id
        AND b.deleted_at IS NULL
    )
  );

CREATE POLICY boq_rate_analysis_lines_write
  ON public.boq_rate_analysis_lines
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.boq_items AS b
      JOIN public.projects AS p ON p.id = b.project_id
      WHERE b.id = boq_item_id
        AND b.deleted_at IS NULL
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.boq_items AS b
      JOIN public.projects AS p ON p.id = b.project_id
      WHERE b.id = boq_item_id
        AND b.deleted_at IS NULL
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

CREATE POLICY user_rate_library_favorites_select
  ON public.user_rate_library_favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_rate_library_favorites_write
  ON public.user_rate_library_favorites
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.rate_library_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boq_rate_analysis_lines TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.user_rate_library_favorites TO authenticated;
