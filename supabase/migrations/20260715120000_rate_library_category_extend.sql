-- Extend rate_library_category with service + productivity (additive).
-- Must commit before new values are used in subsequent statements/migrations.
-- PostgreSQL: newly added enum labels cannot be used until after commit.

ALTER TYPE public.rate_library_category ADD VALUE IF NOT EXISTS 'service';
ALTER TYPE public.rate_library_category ADD VALUE IF NOT EXISTS 'productivity';
