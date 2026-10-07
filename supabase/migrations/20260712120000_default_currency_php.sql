-- Quantix V1 — Default currency PHP (Philippine Peso)
-- Presentation default for new company settings and project details.

ALTER TABLE public.company_settings
  ALTER COLUMN default_currency SET DEFAULT 'PHP';

ALTER TABLE public.project_details
  ALTER COLUMN currency SET DEFAULT 'PHP';

UPDATE public.company_settings
SET default_currency = 'PHP'
WHERE default_currency = 'USD';
