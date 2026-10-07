-- =============================================================================
-- Quantix V1 Demo Seed Package — reference SQL
-- Version: 1.0.0
-- =============================================================================
-- This file documents fixed demo entity IDs and the wipe/seed shape for company
-- defaults. Full BOQ/WBS rows are applied by `npm run seed:demo` from frozen
-- Import Engine v1.0 fixtures (samples/NIA_*.xlsx, samples/STREVI_*.xlsx) so
-- the database matches regression goldens every run.
--
-- Prefer:  npm run seed:demo  /  npm run reset:demo
-- Do not run this file alone for a complete environment (auth users require API).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Fixed project IDs
-- -----------------------------------------------------------------------------
-- NIA 4PH Rental Housing (approved):  d0e11111-1111-4111-a111-111111111101
-- STREVI Residences (draft):          d0e22222-2222-4222-a222-222222222201
-- Commercial (Megawide pilot):        e1a11111-1111-4111-a111-111111111101
-- Master template:                    d0e33333-3333-4333-a333-333333333301
-- NIA tender package:                 d0e44444-4444-4444-a444-444444444401

-- -----------------------------------------------------------------------------
-- Wipe (same scope as npm run reset:demo)
-- -----------------------------------------------------------------------------
DELETE FROM public.audit_log
WHERE project_id IN (
  'd0e11111-1111-4111-a111-111111111101',
  'd0e22222-2222-4222-a222-222222222201',
  'e1a11111-1111-4111-a111-111111111101'
)
OR entity_id IN (
  'd0e11111-1111-4111-a111-111111111101',
  'd0e22222-2222-4222-a222-222222222201',
  'e1a11111-1111-4111-a111-111111111101'
);

DELETE FROM public.projects
WHERE id IN (
  'd0e11111-1111-4111-a111-111111111101',
  'd0e22222-2222-4222-a222-222222222201',
  'e1a11111-1111-4111-a111-111111111101'
);

DELETE FROM public.tender_submissions WHERE id::text LIKE 'd0e%';
DELETE FROM public.master_templates WHERE id::text LIKE 'd0e%';
DELETE FROM public.rate_library_items
WHERE id::text LIKE 'd0e%' OR id::text LIKE 'e1d%';
DELETE FROM public.company_resource_categories
WHERE id::text LIKE 'd0e%' OR id::text LIKE 'e1d%';
DELETE FROM public.company_units WHERE id::text LIKE 'd0e%';
DELETE FROM public.company_suppliers WHERE id::text LIKE 'e1d%';

-- -----------------------------------------------------------------------------
-- Company default trade categories (resource library taxonomy)
-- created_by must be a real auth user — replaced at runtime by seed:demo
-- -----------------------------------------------------------------------------
-- INSERT INTO public.company_resource_categories
--   (id, code, name, resource_type, description, is_active, created_by, updated_by)
-- VALUES
--   ('d0e90001-0001-4001-a001-000000000001', 'MAT', 'Material', 'material', 'Demo seed trade category: Material', true, :owner, :owner),
--   ('d0e90001-0002-4002-a002-000000000002', 'LAB', 'Labor', 'labor', 'Demo seed trade category: Labor', true, :owner, :owner),
--   ('d0e90001-0003-4003-a003-000000000003', 'EQP', 'Equipment', 'equipment', 'Demo seed trade category: Equipment', true, :owner, :owner),
--   ('d0e90001-0004-4004-a004-000000000004', 'SUB', 'Subcontract', 'subcontract', 'Demo seed trade category: Subcontract', true, :owner, :owner);

-- Units of measure (seeded as rate_library_items UOM-REF-* service rows):
--   m, m2, m3, kg, ton, pc, set, lot, ls, hr, day

-- -----------------------------------------------------------------------------
-- Expected Import Engine v1.0 goldens (must remain PASS)
-- -----------------------------------------------------------------------------
-- NIA:    leaf_count=450  leaf_sum=351522209.41  wbs_count=107
-- STREVI: leaf_count=505  leaf_sum=1859023517.47 wbs_count=125

COMMIT;
