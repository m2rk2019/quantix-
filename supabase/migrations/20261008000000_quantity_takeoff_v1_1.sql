-- Quantix V1.1 — Manual Quantity Takeoff foundation
-- Additive only. Does not alter Import Engine v1, BOQ, WBS, or estimate tables.

BEGIN;

-- ---------------------------------------------------------------------------
-- takeoff_drawings — uploaded PDF drawing sets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.takeoff_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/pdf',
  file_size_bytes BIGINT NOT NULL DEFAULT 0 CHECK (file_size_bytes >= 0),
  content_base64 TEXT NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 1 CHECK (page_count >= 1),
  revision_label TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS takeoff_drawings_project_idx
  ON public.takeoff_drawings (project_id)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS takeoff_drawings_set_updated_at ON public.takeoff_drawings;
CREATE TRIGGER takeoff_drawings_set_updated_at
  BEFORE UPDATE ON public.takeoff_drawings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- takeoff_sheets — pages within a drawing PDF
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.takeoff_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID NOT NULL REFERENCES public.takeoff_drawings (id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  sheet_index INTEGER NOT NULL CHECK (sheet_index >= 0),
  sheet_name TEXT NOT NULL,
  rotation_degrees INTEGER NOT NULL DEFAULT 0
    CHECK (rotation_degrees IN (0, 90, 180, 270)),
  -- Calibration: pixels per meter (metric). Null until calibrated.
  pixels_per_meter NUMERIC(18, 8),
  -- Named scales JSON: [{ "id", "name", "pixels_per_meter", "is_active" }]
  scales JSONB NOT NULL DEFAULT '[]'::JSONB,
  thumbnail_base64 TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (drawing_id, sheet_index)
);

CREATE INDEX IF NOT EXISTS takeoff_sheets_drawing_idx
  ON public.takeoff_sheets (drawing_id, sort_order)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS takeoff_sheets_project_idx
  ON public.takeoff_sheets (project_id)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS takeoff_sheets_set_updated_at ON public.takeoff_sheets;
CREATE TRIGGER takeoff_sheets_set_updated_at
  BEFORE UPDATE ON public.takeoff_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- takeoff_layers — discipline layers per project
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.takeoff_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#2563eb',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS takeoff_layers_project_idx
  ON public.takeoff_layers (project_id, sort_order)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS takeoff_layers_set_updated_at ON public.takeoff_layers;
CREATE TRIGGER takeoff_layers_set_updated_at
  BEFORE UPDATE ON public.takeoff_layers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- takeoff_items — logical takeoff items (groups of measurements)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.takeoff_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  layer_id UUID REFERENCES public.takeoff_layers (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'm',
  notes TEXT,
  -- Future: boq_item_id — intentionally NOT linked in Phase 1
  created_by UUID REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS takeoff_items_project_idx
  ON public.takeoff_items (project_id)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS takeoff_items_set_updated_at ON public.takeoff_items;
CREATE TRIGGER takeoff_items_set_updated_at
  BEFORE UPDATE ON public.takeoff_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- takeoff_measurements — geometry on a sheet
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.takeoff_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  sheet_id UUID NOT NULL REFERENCES public.takeoff_sheets (id) ON DELETE CASCADE,
  layer_id UUID REFERENCES public.takeoff_layers (id) ON DELETE SET NULL,
  takeoff_item_id UUID REFERENCES public.takeoff_items (id) ON DELETE SET NULL,
  tool_type TEXT NOT NULL
    CHECK (tool_type IN (
      'line', 'polyline', 'area', 'rectangle', 'circle', 'count', 'text'
    )),
  color TEXT NOT NULL DEFAULT '#2563eb',
  -- Geometry in PDF page coordinates (points / pixels at render scale 1)
  geometry JSONB NOT NULL DEFAULT '{}'::JSONB,
  length_m NUMERIC(18, 6),
  area_m2 NUMERIC(18, 6),
  count_value INTEGER,
  text_content TEXT,
  notes TEXT,
  scale_id TEXT,
  pixels_per_meter NUMERIC(18, 8),
  created_by UUID REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS takeoff_measurements_sheet_idx
  ON public.takeoff_measurements (sheet_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS takeoff_measurements_project_idx
  ON public.takeoff_measurements (project_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS takeoff_measurements_layer_idx
  ON public.takeoff_measurements (layer_id)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS takeoff_measurements_set_updated_at ON public.takeoff_measurements;
CREATE TRIGGER takeoff_measurements_set_updated_at
  BEFORE UPDATE ON public.takeoff_measurements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- takeoff_revision_history — audit of takeoff mutations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.takeoff_revision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL
    CHECK (entity_type IN (
      'drawing', 'sheet', 'layer', 'measurement', 'item', 'calibration'
    )),
  entity_id UUID,
  action TEXT NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  actor_id UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS takeoff_revision_history_project_idx
  ON public.takeoff_revision_history (project_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS — mirror project visibility patterns
-- ---------------------------------------------------------------------------
ALTER TABLE public.takeoff_drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takeoff_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takeoff_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takeoff_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takeoff_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.takeoff_revision_history ENABLE ROW LEVEL SECURITY;

-- SELECT: authenticated users who can see the project
DROP POLICY IF EXISTS takeoff_drawings_select ON public.takeoff_drawings;
CREATE POLICY takeoff_drawings_select
  ON public.takeoff_drawings FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS takeoff_drawings_insert ON public.takeoff_drawings;
CREATE POLICY takeoff_drawings_insert
  ON public.takeoff_drawings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.deleted_at IS NULL
        AND p.status NOT IN ('approved', 'archived')
        AND (
          public.can_write_all_projects()
          OR public.is_admin_or_above()
          OR p.created_by = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS takeoff_drawings_update ON public.takeoff_drawings;
CREATE POLICY takeoff_drawings_update
  ON public.takeoff_drawings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.deleted_at IS NULL
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
      WHERE p.id = project_id
        AND p.deleted_at IS NULL
        AND (
          public.can_write_all_projects()
          OR public.is_admin_or_above()
          OR p.created_by = auth.uid()
        )
    )
  );

-- Sheets
DROP POLICY IF EXISTS takeoff_sheets_select ON public.takeoff_sheets;
CREATE POLICY takeoff_sheets_select
  ON public.takeoff_sheets FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS takeoff_sheets_insert ON public.takeoff_sheets;
CREATE POLICY takeoff_sheets_insert
  ON public.takeoff_sheets FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.deleted_at IS NULL
        AND p.status NOT IN ('approved', 'archived')
        AND (
          public.can_write_all_projects()
          OR public.is_admin_or_above()
          OR p.created_by = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS takeoff_sheets_update ON public.takeoff_sheets;
CREATE POLICY takeoff_sheets_update
  ON public.takeoff_sheets FOR UPDATE TO authenticated
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
        AND (
          public.can_write_all_projects()
          OR public.is_admin_or_above()
          OR p.created_by = auth.uid()
        )
    )
  );

-- Layers / items / measurements — same write pattern
DROP POLICY IF EXISTS takeoff_layers_select ON public.takeoff_layers;
CREATE POLICY takeoff_layers_select
  ON public.takeoff_layers FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS takeoff_layers_write ON public.takeoff_layers;
CREATE POLICY takeoff_layers_write
  ON public.takeoff_layers FOR ALL TO authenticated
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

DROP POLICY IF EXISTS takeoff_items_select ON public.takeoff_items;
CREATE POLICY takeoff_items_select
  ON public.takeoff_items FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS takeoff_items_write ON public.takeoff_items;
CREATE POLICY takeoff_items_write
  ON public.takeoff_items FOR ALL TO authenticated
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

DROP POLICY IF EXISTS takeoff_measurements_select ON public.takeoff_measurements;
CREATE POLICY takeoff_measurements_select
  ON public.takeoff_measurements FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS takeoff_measurements_write ON public.takeoff_measurements;
CREATE POLICY takeoff_measurements_write
  ON public.takeoff_measurements FOR ALL TO authenticated
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

DROP POLICY IF EXISTS takeoff_revision_history_select ON public.takeoff_revision_history;
CREATE POLICY takeoff_revision_history_select
  ON public.takeoff_revision_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.deleted_at IS NULL
    )
  );

DROP POLICY IF EXISTS takeoff_revision_history_insert ON public.takeoff_revision_history;
CREATE POLICY takeoff_revision_history_insert
  ON public.takeoff_revision_history FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.takeoff_drawings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.takeoff_sheets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.takeoff_layers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.takeoff_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.takeoff_measurements TO authenticated;
GRANT SELECT, INSERT ON public.takeoff_revision_history TO authenticated;

COMMIT;
