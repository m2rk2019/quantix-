-- =============================================================================
-- Quantix — extend rate_library_category (idempotent)
-- Safe: ADD VALUE IF NOT EXISTS (no data changes)
-- Run this FIRST, alone, before project-rate-library.sql
-- =============================================================================

ALTER TYPE public.rate_library_category ADD VALUE IF NOT EXISTS 'service';
ALTER TYPE public.rate_library_category ADD VALUE IF NOT EXISTS 'productivity';
