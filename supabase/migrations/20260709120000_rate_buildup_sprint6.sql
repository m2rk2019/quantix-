-- Sprint 6: Resource-Based Rate Build-Up (additive)

ALTER TABLE public.boq_rate_analysis_lines
  ADD COLUMN IF NOT EXISTS waste_percent NUMERIC(5, 2) NOT NULL DEFAULT 0;

ALTER TABLE public.boq_rate_analysis_lines
  ADD COLUMN IF NOT EXISTS productivity NUMERIC(15, 4);

ALTER TABLE public.boq_rate_analysis_lines
  DROP CONSTRAINT IF EXISTS boq_rate_analysis_waste_check;

ALTER TABLE public.boq_rate_analysis_lines
  ADD CONSTRAINT boq_rate_analysis_waste_check
  CHECK (waste_percent >= 0 AND waste_percent <= 100);

ALTER TABLE public.boq_rate_analysis_lines
  DROP CONSTRAINT IF EXISTS boq_rate_analysis_productivity_check;

ALTER TABLE public.boq_rate_analysis_lines
  ADD CONSTRAINT boq_rate_analysis_productivity_check
  CHECK (productivity IS NULL OR productivity > 0);

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS ocm_percent NUMERIC(5, 2);

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS contingency_percent NUMERIC(5, 2);

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS profit_percent NUMERIC(5, 2);

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS vat_percent NUMERIC(5, 2);

ALTER TABLE public.boq_items
  ADD COLUMN IF NOT EXISTS rate_buildup_direct_cost NUMERIC(15, 2);

ALTER TABLE public.boq_items
  DROP CONSTRAINT IF EXISTS boq_items_ocm_percent_check;

ALTER TABLE public.boq_items
  ADD CONSTRAINT boq_items_ocm_percent_check
  CHECK (ocm_percent IS NULL OR (ocm_percent >= 0 AND ocm_percent <= 100));

ALTER TABLE public.boq_items
  DROP CONSTRAINT IF EXISTS boq_items_contingency_percent_check;

ALTER TABLE public.boq_items
  ADD CONSTRAINT boq_items_contingency_percent_check
  CHECK (contingency_percent IS NULL OR (contingency_percent >= 0 AND contingency_percent <= 100));

ALTER TABLE public.boq_items
  DROP CONSTRAINT IF EXISTS boq_items_profit_percent_check;

ALTER TABLE public.boq_items
  ADD CONSTRAINT boq_items_profit_percent_check
  CHECK (profit_percent IS NULL OR (profit_percent >= 0 AND profit_percent <= 100));

ALTER TABLE public.boq_items
  DROP CONSTRAINT IF EXISTS boq_items_vat_percent_check;

ALTER TABLE public.boq_items
  ADD CONSTRAINT boq_items_vat_percent_check
  CHECK (vat_percent IS NULL OR (vat_percent >= 0 AND vat_percent <= 100));
