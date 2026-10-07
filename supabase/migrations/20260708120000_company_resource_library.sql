-- Sprint 5: Company Resource Library (additive, non-breaking)

CREATE TABLE public.company_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(200),
  email VARCHAR(200),
  phone VARCHAR(50),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX company_suppliers_code_active_unique
  ON public.company_suppliers (code)
  WHERE deleted_at IS NULL;

CREATE INDEX company_suppliers_search_idx
  ON public.company_suppliers USING gin (
    to_tsvector('simple', coalesce(code, '') || ' ' || coalesce(name, ''))
  )
  WHERE deleted_at IS NULL;

CREATE TRIGGER company_suppliers_set_updated_at
  BEFORE UPDATE ON public.company_suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.company_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX company_units_code_active_unique
  ON public.company_units (code)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX company_units_symbol_active_unique
  ON public.company_units (symbol)
  WHERE deleted_at IS NULL;

CREATE TRIGGER company_units_set_updated_at
  BEFORE UPDATE ON public.company_units
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.company_resource_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  resource_type public.rate_library_category NOT NULL,
  description VARCHAR(500),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.users (id),
  updated_by UUID REFERENCES public.users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX company_resource_categories_code_active_unique
  ON public.company_resource_categories (code)
  WHERE deleted_at IS NULL;

CREATE INDEX company_resource_categories_type_idx
  ON public.company_resource_categories (resource_type)
  WHERE deleted_at IS NULL AND is_active = true;

CREATE TRIGGER company_resource_categories_set_updated_at
  BEFORE UPDATE ON public.company_resource_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.rate_library_items
  ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.company_suppliers (id) ON DELETE SET NULL;

ALTER TABLE public.rate_library_items
  ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.company_units (id) ON DELETE SET NULL;

ALTER TABLE public.rate_library_items
  ADD COLUMN IF NOT EXISTS resource_category_id UUID REFERENCES public.company_resource_categories (id) ON DELETE SET NULL;

CREATE INDEX rate_library_items_supplier_idx
  ON public.rate_library_items (supplier_id)
  WHERE deleted_at IS NULL;

CREATE INDEX rate_library_items_unit_idx
  ON public.rate_library_items (unit_id)
  WHERE deleted_at IS NULL;

CREATE INDEX rate_library_items_resource_category_idx
  ON public.rate_library_items (resource_category_id)
  WHERE deleted_at IS NULL;

-- Seed common units of measure
INSERT INTO public.company_units (code, symbol, name, description, created_by, updated_by)
SELECT
  v.code,
  v.symbol,
  v.name,
  v.description,
  u.id,
  u.id
FROM (
  VALUES
    ('ITEM', 'item', 'Item', 'Lump sum / each'),
    ('M', 'm', 'Meter', 'Linear meter'),
    ('M2', 'm2', 'Square Meter', 'Area'),
    ('M3', 'm3', 'Cubic Meter', 'Volume'),
    ('KG', 'kg', 'Kilogram', 'Mass'),
    ('TON', 'ton', 'Metric Ton', 'Mass'),
    ('HR', 'hr', 'Hour', 'Labor / equipment time'),
    ('DAY', 'day', 'Day', 'Daily rate'),
    ('LS', 'ls', 'Lump Sum', 'Lump sum amount')
) AS v(code, symbol, name, description)
CROSS JOIN LATERAL (
  SELECT id FROM public.users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1
) AS u
WHERE NOT EXISTS (
  SELECT 1 FROM public.company_units WHERE deleted_at IS NULL AND code = v.code
);

ALTER TABLE public.company_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_resource_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_suppliers_select
  ON public.company_suppliers
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY company_suppliers_manage
  ON public.company_suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY company_suppliers_update
  ON public.company_suppliers
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY company_units_select
  ON public.company_units
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY company_units_manage
  ON public.company_units
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY company_units_update
  ON public.company_units
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY company_resource_categories_select
  ON public.company_resource_categories
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY company_resource_categories_manage
  ON public.company_resource_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('super_admin', 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY company_resource_categories_update
  ON public.company_resource_categories
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('super_admin', 'admin')
  );

-- Restrict rate library writes to admins (estimators/QS view and use only)
DROP POLICY IF EXISTS rate_library_items_insert ON public.rate_library_items;
DROP POLICY IF EXISTS rate_library_items_update ON public.rate_library_items;

CREATE POLICY rate_library_items_insert
  ON public.rate_library_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.current_user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY rate_library_items_update
  ON public.rate_library_items
  FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND public.current_user_role() IN ('super_admin', 'admin')
  );

GRANT SELECT, INSERT, UPDATE ON public.company_suppliers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.company_units TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.company_resource_categories TO authenticated;
