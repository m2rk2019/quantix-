-- Quantix Sprint 8 — Formula Validation Demo Project
-- Prerequisites: migrations applied; at least one public.users row
-- Run after: supabase/seed.sql instructions

BEGIN;

DO $$
DECLARE
  v_owner UUID;
  v_project_id UUID := 'f8a11111-1111-4111-a111-111111111101';
BEGIN
  SELECT id INTO v_owner FROM public.users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'No active users found. Provision a user before running this seed.';
  END IF;

  DELETE FROM public.projects WHERE id = v_project_id;

  DELETE FROM public.rate_library_items WHERE id::text LIKE 'f8d%';
  DELETE FROM public.company_resource_categories WHERE id::text LIKE 'f8e3%';
  DELETE FROM public.company_units WHERE id::text LIKE 'f8e2%';
  DELETE FROM public.company_suppliers WHERE id::text LIKE 'f8e1%';

  INSERT INTO public.projects (
    id, project_code, project_name, client_name, location, status, created_by, updated_by
  ) VALUES (
    v_project_id, 'QTX-FORMULA-VAL-001', 'Quantix Formula Validation Project',
    'Megawide Construction Corporation', 'Quezon City',
    'draft', v_owner, v_owner
  );

  INSERT INTO public.project_details (
    project_id, description, currency, indirect_cost_percent, contingency_percent,
    markup_percent, vat_percent, measurement_system, default_unit_system, rounding_rule,
    created_by, updated_by
  ) VALUES (
    v_project_id, 'Sprint 8 automated formula validation demo for Philippine construction estimating.',
    'USD', 10, 5,
    8, 12,
    'metric', 'metric_si', 'half_up', v_owner, v_owner
  );

  INSERT INTO public.estimate_summary (
    project_id, direct_cost, indirect_cost, contingency, markup, vat, grand_total,
    created_by, updated_by
  ) VALUES (
    v_project_id, 51996532.64, 5199653.26,
    2859809.3, 4804479.62, 7783256.98,
    72643731.8, v_owner, v_owner
  );

  -- Upsert company_suppliers (skip conflicts on re-run)
  -- Upsert company_units (skip conflicts on re-run)
  -- Upsert company_resource_categories (skip conflicts on re-run)
  INSERT INTO public.company_suppliers (id, code, name, created_by, updated_by)
  VALUES
    ('f8de1-1111-4111-a111-000000000001', 'SUP-HOLCIM', 'Holcim Philippines', v_owner, v_owner),
    ('f8de1-1111-4111-a111-000000000002', 'SUP-REPUBLIC', 'Republic Cement', v_owner, v_owner),
    ('f8de1-1111-4111-a111-000000000003', 'SUP-MKP', 'MKP Construction Supply', v_owner, v_owner),
    ('f8de1-1111-4111-a111-000000000004', 'SUP-STEELASIA', 'SteelAsia Manufacturing', v_owner, v_owner),
    ('f8de1-1111-4111-a111-000000000005', 'SUP-BOY', 'Boysen Paints Philippines', v_owner, v_owner),
    ('f8de1-1111-4111-a111-000000000006', 'SUP-PHILPIPE', 'Philippine Pipe Industries', v_owner, v_owner);

  INSERT INTO public.company_units (id, code, symbol, name, created_by, updated_by)
  VALUES
    ('f8de2-1111-4111-a111-000000000001', 'UOM-M3', 'm3', 'Cubic Meter', v_owner, v_owner),
    ('f8de2-1111-4111-a111-000000000002', 'UOM-M2', 'm2', 'Square Meter', v_owner, v_owner),
    ('f8de2-1111-4111-a111-000000000003', 'UOM-M', 'm', 'Linear Meter', v_owner, v_owner),
    ('f8de2-1111-4111-a111-000000000004', 'UOM-KG', 'kg', 'Kilogram', v_owner, v_owner),
    ('f8de2-1111-4111-a111-000000000005', 'UOM-BAG', 'bag', 'Bag', v_owner, v_owner),
    ('f8de2-1111-4111-a111-000000000006', 'UOM-PC', 'pc', 'Piece', v_owner, v_owner),
    ('f8de2-1111-4111-a111-000000000007', 'UOM-LOT', 'lot', 'Lump Sum', v_owner, v_owner),
    ('f8de2-1111-4111-a111-000000000008', 'UOM-HR', 'hr', 'Hour', v_owner, v_owner),
    ('f8de2-1111-4111-a111-000000000009', 'UOM-DAY', 'day', 'Day', v_owner, v_owner);

  INSERT INTO public.company_resource_categories (id, code, name, resource_type, created_by, updated_by)
  VALUES
    ('f8de3-1111-4111-a111-000000000001', 'CAT-CEMENT', 'Cement & Concrete', 'material', v_owner, v_owner),
    ('f8de3-1111-4111-a111-000000000002', 'CAT-STEEL', 'Steel & Rebar', 'material', v_owner, v_owner),
    ('f8de3-1111-4111-a111-000000000003', 'CAT-FINISH', 'Finishes', 'material', v_owner, v_owner),
    ('f8de3-1111-4111-a111-000000000004', 'CAT-MEP', 'MEP Materials', 'material', v_owner, v_owner),
    ('f8de3-1111-4111-a111-000000000005', 'CAT-SKILLED', 'Skilled Labor', 'labor', v_owner, v_owner),
    ('f8de3-1111-4111-a111-000000000006', 'CAT-SEMI', 'Semi-Skilled Labor', 'labor', v_owner, v_owner),
    ('f8de3-1111-4111-a111-000000000007', 'CAT-PLANT', 'Plant & Equipment', 'equipment', v_owner, v_owner),
    ('f8de3-1111-4111-a111-000000000008', 'CAT-SUB-MEP', 'MEP Subcontract', 'subcontract', v_owner, v_owner);

  INSERT INTO public.rate_library_items (
    id, code, description, unit, unit_cost, category, is_active, created_by, updated_by
  ) VALUES
    ('f8de4-1111-4111-a111-000000000001', 'MAT-CEM-40', 'Portland Cement Type I 40kg bag', 'bag', 285, 'material', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000002', 'MAT-SAND', 'Washed sand', 'm3', 1450, 'material', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000003', 'MAT-GRVL', 'Gravel 3/4"', 'm3', 1650, 'material', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000004', 'MAT-CHB-150', 'CHB 150mm', 'pc', 42, 'material', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000005', 'MAT-REBAR16', 'Deformed bar #16', 'kg', 68, 'material', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000006', 'MAT-GYPSUM', 'Gypsum board 9mm', 'm2', 285, 'material', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000007', 'MAT-PAINT', 'Latex paint 20L pail', 'lot', 4200, 'material', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000008', 'MAT-PVC-4', 'PVC pipe 4" SDR', 'm', 520, 'material', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000009', 'MAT-THHN-35', 'THHN wire 3.5mm2', 'm', 48, 'material', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000010', 'MAT-SPRINKLER', 'Sprinkler head upright', 'pc', 850, 'material', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000011', 'LAB-MASON', 'Mason', 'day', 850, 'labor', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000012', 'LAB-CARP', 'Carpenter', 'day', 900, 'labor', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000013', 'LAB-STEEL', 'Steel fixer', 'day', 950, 'labor', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000014', 'LAB-ELEC', 'Electrician', 'day', 1100, 'labor', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000015', 'LAB-PLUMB', 'Plumber', 'day', 1050, 'labor', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000016', 'LAB-PAINT', 'Painter', 'day', 800, 'labor', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000017', 'LAB-LABORER', 'Laborer/helper', 'day', 650, 'labor', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000018', 'EQ-MIXER', 'Concrete mixer 1 bagger', 'day', 1800, 'equipment', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000019', 'EQ-BACKHOE', 'Backhoe loader', 'day', 12500, 'equipment', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000020', 'EQ-CRANE', 'Tower crane', 'day', 45000, 'equipment', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000021', 'EQ-SCAFF', 'Scaffolding rental', 'day', 2200, 'equipment', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000022', 'EQ-PUMP', 'Concrete pump boom', 'day', 28000, 'equipment', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000023', 'SUB-ELEC', 'Electrical subcontract package', 'lot', 185000, 'subcontract', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000024', 'SUB-PLUMB', 'Plumbing subcontract package', 'lot', 165000, 'subcontract', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000025', 'SUB-FIRE', 'Fire protection specialist', 'lot', 220000, 'subcontract', true, v_owner, v_owner),
    ('f8de4-1111-4111-a111-000000000026', 'SUB-WATERPROOF', 'Waterproofing specialist', 'lot', 95000, 'subcontract', true, v_owner, v_owner);

  INSERT INTO public.wbs (
    id, project_id, parent_id, level, wbs_code, description, sort_order, created_by, updated_by
  ) VALUES
    ('f8b11111-1111-4111-a111-000000000001', v_project_id, NULL, 1, '1', 'Structural', 1, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000002', v_project_id, 'f8b11111-1111-4111-a111-000000000001', 2, '1.1', 'Earthworks', 2, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000003', v_project_id, 'f8b11111-1111-4111-a111-000000000001', 2, '1.2', 'Concrete Works', 3, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000004', v_project_id, 'f8b11111-1111-4111-a111-000000000001', 2, '1.3', 'Rebar Works', 4, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000005', v_project_id, NULL, 1, '2', 'Architectural', 5, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000006', v_project_id, 'f8b11111-1111-4111-a111-000000000005', 2, '2.1', 'Masonry', 6, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000007', v_project_id, 'f8b11111-1111-4111-a111-000000000005', 2, '2.2', 'Plastering', 7, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000008', v_project_id, 'f8b11111-1111-4111-a111-000000000005', 2, '2.3', 'Painting', 8, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000009', v_project_id, 'f8b11111-1111-4111-a111-000000000005', 2, '2.4', 'Ceiling', 9, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000010', v_project_id, 'f8b11111-1111-4111-a111-000000000005', 2, '2.5', 'Flooring', 10, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000011', v_project_id, NULL, 1, '3', 'MEPF', 11, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000012', v_project_id, 'f8b11111-1111-4111-a111-000000000011', 2, '3.1', 'Plumbing', 12, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000013', v_project_id, 'f8b11111-1111-4111-a111-000000000011', 2, '3.2', 'Electrical', 13, v_owner, v_owner),
    ('f8b11111-1111-4111-a111-000000000014', v_project_id, 'f8b11111-1111-4111-a111-000000000011', 2, '3.3', 'Fire Protection', 14, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('f8c11111-1111-4111-a111-000000000001', v_project_id, 'f8b11111-1111-4111-a111-000000000002', 'BOQ-001', 'Excavation for foundation (common soil)', 'm3', 151.62, 1276, 195, 0, 0, 0, 1471, 223033.02, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000002', v_project_id, 'f8b11111-1111-4111-a111-000000000002', 'BOQ-002', 'Backfilling and compaction', 'm2', 42.12, 3102, 47.5, 0, 0, 0, 3149.5, 132656.94, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000003', v_project_id, 'f8b11111-1111-4111-a111-000000000002', 'BOQ-003', 'Gravel bedding 150mm thick', 'm2', 406.26, 23.94, 73.33, 176, 0, 0, 273.27, 111018.67, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000004', v_project_id, 'f8b11111-1111-4111-a111-000000000002', 'BOQ-004', 'Hauling and disposal of excavated material', 'm2', 167.81, 112.88, 262.5, 0, 0, 0, 375.38, 62992.52, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000005', v_project_id, 'f8b11111-1111-4111-a111-000000000002', 'BOQ-005', 'Site grading and levelling', 'm2', 189.26, 577.55, 46.67, 0, 0, 0, 624.22, 118139.88, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000006', v_project_id, 'f8b11111-1111-4111-a111-000000000002', 'BOQ-006', 'Temporary shoring', 'm2', 373.64, 1974, 102.92, 875, 0, 0, 2951.92, 1102955.39, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000007', v_project_id, 'f8b11111-1111-4111-a111-000000000002', 'BOQ-007', 'Dewatering allowance', 'lot', 62.67, 275.6, 99.17, 0, 3455.89, 0, 3830.66, 240067.46, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000008', v_project_id, 'f8b11111-1111-4111-a111-000000000002', 'BOQ-008', 'Rock excavation (minor)', 'm2', 102.25, 24, 217.5, 0, 0, 0, 241.5, 24693.38, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000009', v_project_id, 'f8b11111-1111-4111-a111-000000000002', 'BOQ-009', 'Embankment fill', 'm2', 226.01, 748, 134.58, 2520, 0, 0, 3402.58, 769017.11, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000010', v_project_id, 'f8b11111-1111-4111-a111-000000000003', 'BOQ-010', 'Portland cement concrete footing 3000 psi', 'm3', 58.14, 212.47, 121, 0, 0, 0, 333.47, 19387.95, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000011', v_project_id, 'f8b11111-1111-4111-a111-000000000003', 'BOQ-011', 'Reinforced concrete column', 'm3', 119.77, 1972, 168, 0, 0, 44.14, 2184.14, 261594.45, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000012', v_project_id, 'f8b11111-1111-4111-a111-000000000003', 'BOQ-012', 'Reinforced concrete beam', 'm3', 242.08, 1996.5, 208, 2250, 0, 0, 4454.5, 1078345.36, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000013', v_project_id, 'f8b11111-1111-4111-a111-000000000003', 'BOQ-013', 'Reinforced concrete slab on grade', 'm3', 223.59, 65.1, 136.5, 0, 0, 0, 201.6, 45075.74, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000014', v_project_id, 'f8b11111-1111-4111-a111-000000000003', 'BOQ-014', 'Reinforced concrete suspended slab', 'm3', 73.41, 117.64, 136, 0, 18756.19, 0, 19009.83, 1395511.62, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000015', v_project_id, 'f8b11111-1111-4111-a111-000000000003', 'BOQ-015', 'Concrete stairs', 'm2', 176.91, 553.61, 153, 108, 0, 0, 814.61, 144112.66, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000016', v_project_id, 'f8b11111-1111-4111-a111-000000000003', 'BOQ-016', 'Concrete curb and gutter', 'm2', 276.04, 7056, 237.5, 0, 0, 0, 7293.5, 2013297.74, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000017', v_project_id, 'f8b11111-1111-4111-a111-000000000003', 'BOQ-017', 'Concrete pavement 150mm', 'm2', 196.91, 1014, 143, 0, 0, 0, 1157, 227824.87, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000018', v_project_id, 'f8b11111-1111-4111-a111-000000000003', 'BOQ-018', 'Lean concrete blinding', 'm3', 205.41, 19.68, 178.5, 110, 0, 0, 308.18, 63303.25, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000019', v_project_id, 'f8b11111-1111-4111-a111-000000000003', 'BOQ-019', 'Concrete core filling', 'm2', 13.51, 1589.5, 184, 0, 0, 0, 1773.5, 23959.99, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000020', v_project_id, 'f8b11111-1111-4111-a111-000000000004', 'BOQ-020', 'Supply and install rebar #16', 'kg', 121.75, 239.4, 52, 0, 0, 0, 291.4, 35477.95, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000021', v_project_id, 'f8b11111-1111-4111-a111-000000000004', 'BOQ-021', 'Supply and install rebar #20', 'kg', 114.88, 1479, 144.5, 875, 4846.72, 0, 7345.22, 843818.87, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000022', v_project_id, 'f8b11111-1111-4111-a111-000000000004', 'BOQ-022', 'Supply and install rebar #25', 'kg', 416.73, 1006.5, 252, 0, 0, 39.48, 1297.98, 540907.21, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000023', v_project_id, 'f8b11111-1111-4111-a111-000000000004', 'BOQ-023', 'Cutting and bending rebar', 'kg', 357.94, 47.04, 114, 0, 0, 0, 161.04, 57642.66, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000024', v_project_id, 'f8b11111-1111-4111-a111-000000000004', 'BOQ-024', 'Welded wire mesh 6x6-W1.4xW1.4', 'm', 360.29, 122.4, 165, 2240, 0, 0, 2527.4, 910596.95, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000025', v_project_id, 'f8b11111-1111-4111-a111-000000000004', 'BOQ-025', 'Rebar chairs and spacers', 'm2', 323.23, 128.68, 304.5, 0, 0, 0, 433.18, 140016.77, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000026', v_project_id, 'f8b11111-1111-4111-a111-000000000004', 'BOQ-026', 'Epoxy coated rebar', 'kg', 177.79, 6930, 56, 0, 0, 0, 6986, 1242040.94, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000027', v_project_id, 'f8b11111-1111-4111-a111-000000000004', 'BOQ-027', 'Rebar splicing couplers', 'm2', 192.14, 556.4, 39, 1350, 0, 0, 1945.4, 373789.16, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000028', v_project_id, 'f8b11111-1111-4111-a111-000000000004', 'BOQ-028', 'Stirrups and ties', 'm2', 198.35, 83.04, 144.5, 0, 14758.29, 0, 14985.83, 2972439.38, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000029', v_project_id, 'f8b11111-1111-4111-a111-000000000006', 'BOQ-029', '150mm CHB wall', 'm2', 320.99, 1232.5, 63, 0, 0, 0, 1295.5, 415842.55, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000030', v_project_id, 'f8b11111-1111-4111-a111-000000000006', 'BOQ-030', '100mm CHB wall', 'm2', 346.79, 125.68, 266, 72, 0, 0, 463.68, 160799.59, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000031', v_project_id, 'f8b11111-1111-4111-a111-000000000006', 'BOQ-031', '4" concrete hollow block partition', 'm3', 399.89, 2769.5, 143, 0, 0, 0, 2912.5, 1164679.63, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000032', v_project_id, 'f8b11111-1111-4111-a111-000000000006', 'BOQ-032', 'Brick veneer wall', 'm2', 225.7, 2838, 105, 0, 0, 0, 2943, 664235.1, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000033', v_project_id, 'f8b11111-1111-4111-a111-000000000006', 'BOQ-033', 'Glass block wall', 'm2', 133.68, 35.28, 176, 154, 0, 54.2, 419.48, 56076.09, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000034', v_project_id, 'f8b11111-1111-4111-a111-000000000006', 'BOQ-034', 'Masonry grout filling', 'm2', 287.86, 88.4, 175.5, 0, 0, 0, 263.9, 75966.25, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000035', v_project_id, 'f8b11111-1111-4111-a111-000000000006', 'BOQ-035', 'Wall chipping and preparation', 'm2', 34.51, 257.36, 204, 0, 2353.77, 0, 2815.13, 97150.14, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000036', v_project_id, 'f8b11111-1111-4111-a111-000000000006', 'BOQ-036', 'Masonry lintel', 'm2', 255.96, 5712, 225, 250, 0, 0, 6187, 1583624.52, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000037', v_project_id, 'f8b11111-1111-4111-a111-000000000006', 'BOQ-037', 'Control joint sealant', 'm2', 118.15, 644.8, 123.5, 0, 0, 0, 768.3, 90774.65, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000038', v_project_id, 'f8b11111-1111-4111-a111-000000000007', 'BOQ-038', 'Cement plaster interior 12mm', 'm2', 264.14, 58.08, 297, 0, 0, 0, 355.08, 93790.83, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000039', v_project_id, 'f8b11111-1111-4111-a111-000000000007', 'BOQ-039', 'Cement plaster exterior 15mm', 'm2', 384.92, 1564, 210, 840, 0, 0, 2614, 1006180.88, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000040', v_project_id, 'f8b11111-1111-4111-a111-000000000007', 'BOQ-040', 'Skim coat finish', 'm2', 230.6, 547.63, 208, 0, 0, 0, 755.63, 174248.28, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000041', v_project_id, 'f8b11111-1111-4111-a111-000000000007', 'BOQ-041', 'Plaster on CHB wall', 'm2', 384.14, 1290.5, 130, 0, 0, 0, 1420.5, 545670.87, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000042', v_project_id, 'f8b11111-1111-4111-a111-000000000007', 'BOQ-042', 'Plaster on concrete surface', 'm3', 48.12, 1435.5, 187, 2250, 2480.61, 0, 6353.11, 305711.65, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000043', v_project_id, 'f8b11111-1111-4111-a111-000000000007', 'BOQ-043', 'Corner bead supply and install', 'm2', 383.73, 21, 108, 0, 0, 0, 129, 49501.17, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000044', v_project_id, 'f8b11111-1111-4111-a111-000000000007', 'BOQ-044', 'Plaster repair and patching', 'm2', 231.45, 59.84, 76, 0, 0, 50.72, 186.56, 43179.31, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000045', v_project_id, 'f8b11111-1111-4111-a111-000000000007', 'BOQ-045', 'Acrylic plaster finish', 'm2', 139.84, 329.18, 286, 126, 0, 0, 741.18, 103646.61, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000046', v_project_id, 'f8b11111-1111-4111-a111-000000000007', 'BOQ-046', 'Waterproof plaster additive', 'm2', 223.89, 2478, 304.5, 0, 0, 0, 2782.5, 622973.92, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000047', v_project_id, 'f8b11111-1111-4111-a111-000000000008', 'BOQ-047', 'Interior latex paint 2 coats', 'm2', 52.53, 608.4, 56, 0, 0, 0, 664.4, 34900.93, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000048', v_project_id, 'f8b11111-1111-4111-a111-000000000008', 'BOQ-048', 'Exterior elastomeric paint', 'm2', 122.38, 89.28, 149.5, 154, 0, 0, 392.78, 48068.42, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000049', v_project_id, 'f8b11111-1111-4111-a111-000000000008', 'BOQ-049', 'Epoxy floor paint', 'm2', 167, 1496, 195.5, 0, 8046.99, 0, 9738.49, 1626327.83, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000050', v_project_id, 'f8b11111-1111-4111-a111-000000000008', 'BOQ-050', 'Enamel paint on steel', 'm2', 216.78, 553.61, 72, 0, 0, 0, 625.61, 135619.74, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('f8c11111-1111-4111-a111-000000000051', v_project_id, 'f8b11111-1111-4111-a111-000000000008', 'BOQ-051', 'Primer coat masonry', 'm2', 344.27, 667, 114, 875, 0, 0, 1656, 570111.12, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000052', v_project_id, 'f8b11111-1111-4111-a111-000000000008', 'BOQ-052', 'Wood stain and varnish', 'm2', 188.3, 709.5, 66, 0, 0, 0, 775.5, 146026.65, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000053', v_project_id, 'f8b11111-1111-4111-a111-000000000008', 'BOQ-053', 'Traffic marking paint', 'm2', 332.8, 19.74, 94.5, 0, 0, 0, 114.24, 38019.07, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000054', v_project_id, 'f8b11111-1111-4111-a111-000000000008', 'BOQ-054', 'Anti-mould paint bathroom', 'm2', 107.39, 29.92, 40, 1960, 0, 0, 2029.92, 217993.11, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000055', v_project_id, 'f8b11111-1111-4111-a111-000000000008', 'BOQ-055', 'Paint surface preparation', 'm2', 152.2, 565.58, 110.5, 0, 0, 30.95, 707.03, 107609.97, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000056', v_project_id, 'f8b11111-1111-4111-a111-000000000009', 'BOQ-056', 'Gypsum board ceiling 9mm', 'm2', 64.8, 7098, 110.5, 0, 13778.27, 0, 20986.77, 1359942.7, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000057', v_project_id, 'f8b11111-1111-4111-a111-000000000009', 'BOQ-057', 'Mineral fiber acoustic ceiling', 'm2', 120.86, 613.6, 243, 4050, 0, 0, 4906.6, 593011.68, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000058', v_project_id, 'f8b11111-1111-4111-a111-000000000009', 'BOQ-058', 'Metal furring channel', 'm2', 108.92, 50.4, 275.5, 0, 0, 0, 325.9, 35497.03, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000059', v_project_id, 'f8b11111-1111-4111-a111-000000000009', 'BOQ-059', 'Suspended ceiling T-bar system', 'm2', 129.87, 807.5, 143, 0, 0, 0, 950.5, 123441.44, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000060', v_project_id, 'f8b11111-1111-4111-a111-000000000009', 'BOQ-060', 'Ceiling insulation', 'm2', 406.98, 386.03, 147, 18, 0, 0, 551.03, 224258.19, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000061', v_project_id, 'f8b11111-1111-4111-a111-000000000009', 'BOQ-061', 'Access panel 600x600', 'm2', 317.16, 1218, 160, 0, 0, 0, 1378, 437046.48, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000062', v_project_id, 'f8b11111-1111-4111-a111-000000000009', 'BOQ-062', 'Cornice moulding', 'm2', 132.59, 924, 175.5, 0, 0, 0, 1099.5, 145782.71, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000063', v_project_id, 'f8b11111-1111-4111-a111-000000000009', 'BOQ-063', 'Ceiling painting', 'm2', 364.28, 49.56, 68, 44, 3187.2, 0, 3348.76, 1219886.29, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000064', v_project_id, 'f8b11111-1111-4111-a111-000000000009', 'BOQ-064', 'Moisture resistant gypsum board', 'm2', 234.7, 114.24, 54, 0, 0, 0, 168.24, 39485.93, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000065', v_project_id, 'f8b11111-1111-4111-a111-000000000010', 'BOQ-065', 'Ceramic floor tile 600x600', 'm2', 154.66, 398, 218.5, 0, 0, 0, 616.5, 95347.89, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000066', v_project_id, 'f8b11111-1111-4111-a111-000000000010', 'BOQ-066', 'Vinyl plank flooring', 'm2', 218.84, 2520, 209, 750, 0, 37.55, 3516.55, 769561.8, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000067', v_project_id, 'f8b11111-1111-4111-a111-000000000010', 'BOQ-067', 'Granite floor tile', 'm2', 197.79, 629.2, 231, 0, 0, 0, 860.2, 170138.96, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000068', v_project_id, 'f8b11111-1111-4111-a111-000000000010', 'BOQ-068', 'Cementitious floor topping', 'm2', 179.93, 87.84, 232, 0, 0, 0, 319.84, 57548.81, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000069', v_project_id, 'f8b11111-1111-4111-a111-000000000010', 'BOQ-069', 'Epoxy floor coating', 'm2', 322.48, 1283.5, 143, 560, 0, 0, 1986.5, 640606.52, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000070', v_project_id, 'f8b11111-1111-4111-a111-000000000010', 'BOQ-070', 'Marble flooring', 'm2', 108.55, 203.49, 195.5, 0, 12705.88, 0, 13104.87, 1422533.64, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000071', v_project_id, 'f8b11111-1111-4111-a111-000000000010', 'BOQ-071', 'Floor leveling compound', 'm2', 270.12, 2856.5, 144, 0, 0, 0, 3000.5, 810495.06, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000072', v_project_id, 'f8b11111-1111-4111-a111-000000000010', 'BOQ-072', 'Tile grout and adhesive', 'm2', 214.62, 2194.5, 85.5, 1350, 0, 0, 3630, 779070.6, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000073', v_project_id, 'f8b11111-1111-4111-a111-000000000010', 'BOQ-073', 'Rubber flooring gym', 'm2', 160.97, 23.52, 132, 0, 0, 0, 155.52, 25034.05, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000074', v_project_id, 'f8b11111-1111-4111-a111-000000000012', 'BOQ-074', 'PVC pipe 4" SDR series', 'm', 202.71, 70.72, 220.5, 0, 0, 0, 291.22, 59033.21, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000075', v_project_id, 'f8b11111-1111-4111-a111-000000000012', 'BOQ-075', 'PVC pipe 2" water line', 'm', 278.3, 233.42, 216, 126, 0, 0, 575.42, 160139.39, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000076', v_project_id, 'f8b11111-1111-4111-a111-000000000012', 'BOQ-076', 'Copper pipe 3/4" hot water', 'm', 43.13, 4872, 97.5, 0, 0, 0, 4969.5, 214334.54, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000077', v_project_id, 'f8b11111-1111-4111-a111-000000000012', 'BOQ-077', 'Floor drain stainless 4"', 'm2', 56.03, 681.2, 204, 0, 13510.25, 42.01, 14437.46, 808930.88, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000078', v_project_id, 'f8b11111-1111-4111-a111-000000000012', 'BOQ-078', 'Water closet complete set', 'm2', 228.48, 83.04, 252, 132, 0, 0, 467.04, 106709.3, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000079', v_project_id, 'f8b11111-1111-4111-a111-000000000012', 'BOQ-079', 'Lavatory with faucet', 'm2', 267.09, 365.5, 161.5, 0, 0, 0, 527, 140756.43, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000080', v_project_id, 'f8b11111-1111-4111-a111-000000000012', 'BOQ-080', 'Shower set thermostatic', 'm2', 213.17, 395.01, 220, 0, 0, 0, 615.01, 131101.68, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000081', v_project_id, 'f8b11111-1111-4111-a111-000000000012', 'BOQ-081', 'Gate valve bronze 2"', 'm2', 305.39, 1595, 105, 250, 0, 0, 1950, 595510.5, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000082', v_project_id, 'f8b11111-1111-4111-a111-000000000012', 'BOQ-082', 'Water heater 50L', 'm2', 333.52, 2590.5, 88, 0, 0, 0, 2678.5, 893333.32, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000083', v_project_id, 'f8b11111-1111-4111-a111-000000000013', 'BOQ-083', 'THHN wire 3.5mm2', 'm', 105.68, 69.3, 91, 0, 0, 0, 160.3, 16940.5, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000084', v_project_id, 'f8b11111-1111-4111-a111-000000000013', 'BOQ-084', 'THHN wire 5.5mm2', 'm', 186.71, 131.92, 59.5, 1960, 8989.99, 0, 11141.41, 2080212.66, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000085', v_project_id, 'f8b11111-1111-4111-a111-000000000013', 'BOQ-085', 'PVC conduit 25mm', 'm2', 339.88, 424.94, 54, 0, 0, 0, 478.94, 162782.13, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000086', v_project_id, 'f8b11111-1111-4111-a111-000000000013', 'BOQ-086', 'Panel board 42 circuits', 'm2', 76.69, 2982, 85.5, 0, 0, 0, 3067.5, 235246.58, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000087', v_project_id, 'f8b11111-1111-4111-a111-000000000013', 'BOQ-087', 'Circuit breaker 20A', 'm2', 270.24, 780, 242, 1800, 0, 0, 2822, 762617.28, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000088', v_project_id, 'f8b11111-1111-4111-a111-000000000013', 'BOQ-088', 'LED downlight 12W', 'm2', 14.14, 75.84, 136.5, 0, 0, 54.01, 266.35, 3766.19, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000089', v_project_id, 'f8b11111-1111-4111-a111-000000000013', 'BOQ-089', 'Convenience outlet duplex', 'm2', 151.96, 824.5, 72, 0, 0, 0, 896.5, 136232.14, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000090', v_project_id, 'f8b11111-1111-4111-a111-000000000013', 'BOQ-090', 'Grounding rod copper', 'm2', 157.32, 194.51, 169, 126, 0, 0, 489.51, 77009.71, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000091', v_project_id, 'f8b11111-1111-4111-a111-000000000013', 'BOQ-091', 'Cable tray 300mm', 'm2', 368.46, 1856, 102, 0, 8161.31, 0, 10119.31, 3728560.96, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000092', v_project_id, 'f8b11111-1111-4111-a111-000000000014', 'BOQ-092', 'Sprinkler head upright', 'm2', 308.57, 2145, 45, 0, 0, 0, 2190, 675768.3, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000093', v_project_id, 'f8b11111-1111-4111-a111-000000000014', 'BOQ-093', 'Fire hose cabinet', 'm2', 382.82, 30.66, 123.5, 154, 0, 0, 308.16, 117969.81, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000094', v_project_id, 'f8b11111-1111-4111-a111-000000000014', 'BOQ-094', 'Wet riser pipe 65mm', 'm', 131.79, 28.56, 121, 0, 0, 0, 149.56, 19710.51, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000095', v_project_id, 'f8b11111-1111-4111-a111-000000000014', 'BOQ-095', 'Fire pump electric 750GPM', 'm2', 344.85, 182.54, 315, 0, 0, 0, 497.54, 171576.67, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000096', v_project_id, 'f8b11111-1111-4111-a111-000000000014', 'BOQ-096', 'Fire alarm smoke detector', 'm2', 162.97, 6384, 88, 375, 0, 0, 6847, 1115855.59, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000097', v_project_id, 'f8b11111-1111-4111-a111-000000000014', 'BOQ-097', 'Fire alarm manual pull station', 'm2', 128.56, 1014, 39, 0, 0, 0, 1053, 135373.68, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000098', v_project_id, 'f8b11111-1111-4111-a111-000000000014', 'BOQ-098', 'Fire extinguisher 10lbs ABC', 'm2', 287.36, 21.12, 85, 0, 16183.71, 0, 16289.83, 4681045.55, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000099', v_project_id, 'f8b11111-1111-4111-a111-000000000014', 'BOQ-099', 'Fire door 90min rated', 'm2', 161.58, 1623.5, 189, 840, 0, 52.74, 2705.24, 437112.68, v_owner, v_owner),
    ('f8c11111-1111-4111-a111-000000000100', v_project_id, 'f8b11111-1111-4111-a111-000000000014', 'BOQ-100', 'FM200 suppression heads', 'm2', 42.68, 574.56, 76, 0, 0, 0, 650.56, 27765.9, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000001', 'f8c11111-1111-4111-a111-000000000001', 'f8de4-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 0.88, 1450, 0, NULL, 1276, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000002', 'f8c11111-1111-4111-a111-000000000001', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.26, 900, 0, 1.2, 195, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000003', 'f8c11111-1111-4111-a111-000000000002', 'f8de4-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.88, 1650, 0, NULL, 3102, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000004', 'f8c11111-1111-4111-a111-000000000002', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.06, 950, 0, 1.2, 47.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000005', 'f8c11111-1111-4111-a111-000000000003', 'f8de4-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.57, 42, 0, NULL, 23.94, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000006', 'f8c11111-1111-4111-a111-000000000003', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.08, 1100, 0, 1.2, 73.33, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000007', 'f8c11111-1111-4111-a111-000000000003', 'f8de4-1111-4111-a111-000000000021', 'equipment', 'Scaffolding rental', 'day', 0.08, 2200, 0, NULL, 176, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000008', 'f8c11111-1111-4111-a111-000000000004', 'f8de4-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.66, 68, 0, NULL, 112.88, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000009', 'f8c11111-1111-4111-a111-000000000004', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.3, 1050, 0, 1.2, 262.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000010', 'f8c11111-1111-4111-a111-000000000005', 'f8de4-1111-4111-a111-000000000006', 'material', 'Gypsum board 9mm', 'm2', 1.93, 285, 5, NULL, 577.55, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000011', 'f8c11111-1111-4111-a111-000000000005', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.07, 800, 0, 1.2, 46.67, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000012', 'f8c11111-1111-4111-a111-000000000006', 'f8de4-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 0.47, 4200, 0, NULL, 1974, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000013', 'f8c11111-1111-4111-a111-000000000006', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.19, 650, 0, 1.2, 102.92, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000014', 'f8c11111-1111-4111-a111-000000000006', 'f8de4-1111-4111-a111-000000000019', 'equipment', 'Backhoe loader', 'day', 0.07, 12500, 0, NULL, 875, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000015', 'f8c11111-1111-4111-a111-000000000007', 'f8de4-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 0.53, 520, 0, NULL, 275.6, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000016', 'f8c11111-1111-4111-a111-000000000007', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.14, 850, 0, 1.2, 99.17, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000017', 'f8c11111-1111-4111-a111-000000000007', 'f8de4-1111-4111-a111-000000000026', 'subcontract', 'Waterproofing specialist', 'lot', 0.03637783095240593, 95000, 0, NULL, 3455.89, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000018', 'f8c11111-1111-4111-a111-000000000008', 'f8de4-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 0.5, 48, 0, NULL, 24, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000019', 'f8c11111-1111-4111-a111-000000000008', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.29, 900, 0, 1.2, 217.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000020', 'f8c11111-1111-4111-a111-000000000009', 'f8de4-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.88, 850, 0, NULL, 748, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000021', 'f8c11111-1111-4111-a111-000000000009', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.17, 950, 0, 1.2, 134.58, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000022', 'f8c11111-1111-4111-a111-000000000009', 'f8de4-1111-4111-a111-000000000022', 'equipment', 'Concrete pump boom', 'day', 0.09, 28000, 0, NULL, 2520, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000023', 'f8c11111-1111-4111-a111-000000000010', 'f8de4-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.71, 285, 5, NULL, 212.47, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000024', 'f8c11111-1111-4111-a111-000000000010', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.11, 1100, 0, NULL, 121, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000025', 'f8c11111-1111-4111-a111-000000000011', 'f8de4-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.36, 1450, 0, NULL, 1972, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000026', 'f8c11111-1111-4111-a111-000000000011', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.16, 1050, 0, NULL, 168, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000027', 'f8c11111-1111-4111-a111-000000000012', 'f8de4-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.21, 1650, 0, NULL, 1996.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000028', 'f8c11111-1111-4111-a111-000000000012', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.26, 800, 0, NULL, 208, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000029', 'f8c11111-1111-4111-a111-000000000012', 'f8de4-1111-4111-a111-000000000020', 'equipment', 'Tower crane', 'day', 0.05, 45000, 0, NULL, 2250, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000030', 'f8c11111-1111-4111-a111-000000000013', 'f8de4-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.55, 42, 0, NULL, 65.1, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000031', 'f8c11111-1111-4111-a111-000000000013', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.21, 650, 0, NULL, 136.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000032', 'f8c11111-1111-4111-a111-000000000014', 'f8de4-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.73, 68, 0, NULL, 117.64, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000033', 'f8c11111-1111-4111-a111-000000000014', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.16, 850, 0, NULL, 136, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000034', 'f8c11111-1111-4111-a111-000000000014', 'f8de4-1111-4111-a111-000000000025', 'subcontract', 'Fire protection specialist', 'lot', 0.0852553991600871, 220000, 0, NULL, 18756.19, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000035', 'f8c11111-1111-4111-a111-000000000015', 'f8de4-1111-4111-a111-000000000006', 'material', 'Gypsum board 9mm', 'm2', 1.85, 285, 5, NULL, 553.61, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000036', 'f8c11111-1111-4111-a111-000000000015', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.17, 900, 0, NULL, 153, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000037', 'f8c11111-1111-4111-a111-000000000015', 'f8de4-1111-4111-a111-000000000018', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.06, 1800, 0, NULL, 108, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000038', 'f8c11111-1111-4111-a111-000000000016', 'f8de4-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.68, 4200, 0, NULL, 7056, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000039', 'f8c11111-1111-4111-a111-000000000016', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.25, 950, 0, NULL, 237.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000040', 'f8c11111-1111-4111-a111-000000000017', 'f8de4-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.95, 520, 0, NULL, 1014, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000041', 'f8c11111-1111-4111-a111-000000000017', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.13, 1100, 0, NULL, 143, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000042', 'f8c11111-1111-4111-a111-000000000018', 'f8de4-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 0.41, 48, 0, NULL, 19.68, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000043', 'f8c11111-1111-4111-a111-000000000018', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.17, 1050, 0, NULL, 178.5, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000044', 'f8c11111-1111-4111-a111-000000000018', 'f8de4-1111-4111-a111-000000000021', 'equipment', 'Scaffolding rental', 'day', 0.05, 2200, 0, NULL, 110, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000045', 'f8c11111-1111-4111-a111-000000000019', 'f8de4-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.87, 850, 0, NULL, 1589.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000046', 'f8c11111-1111-4111-a111-000000000019', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.23, 800, 0, NULL, 184, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000047', 'f8c11111-1111-4111-a111-000000000020', 'f8de4-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.8, 285, 5, NULL, 239.4, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000048', 'f8c11111-1111-4111-a111-000000000020', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.08, 650, 0, NULL, 52, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000049', 'f8c11111-1111-4111-a111-000000000021', 'f8de4-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.02, 1450, 0, NULL, 1479, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000050', 'f8c11111-1111-4111-a111-000000000021', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.17, 850, 0, NULL, 144.5, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000051', 'f8c11111-1111-4111-a111-000000000021', 'f8de4-1111-4111-a111-000000000019', 'equipment', 'Backhoe loader', 'day', 0.07, 12500, 0, NULL, 875, 2, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000052', 'f8c11111-1111-4111-a111-000000000021', 'f8de4-1111-4111-a111-000000000024', 'subcontract', 'Plumbing subcontract package', 'lot', 0.029374067056924108, 165000, 0, NULL, 4846.72, 3, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000053', 'f8c11111-1111-4111-a111-000000000022', 'f8de4-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 0.61, 1650, 0, NULL, 1006.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000054', 'f8c11111-1111-4111-a111-000000000022', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.28, 900, 0, NULL, 252, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000055', 'f8c11111-1111-4111-a111-000000000023', 'f8de4-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.12, 42, 0, NULL, 47.04, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000056', 'f8c11111-1111-4111-a111-000000000023', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.12, 950, 0, NULL, 114, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000057', 'f8c11111-1111-4111-a111-000000000024', 'f8de4-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.8, 68, 0, NULL, 122.4, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000058', 'f8c11111-1111-4111-a111-000000000024', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.15, 1100, 0, NULL, 165, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000059', 'f8c11111-1111-4111-a111-000000000024', 'f8de4-1111-4111-a111-000000000022', 'equipment', 'Concrete pump boom', 'day', 0.08, 28000, 0, NULL, 2240, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000060', 'f8c11111-1111-4111-a111-000000000025', 'f8de4-1111-4111-a111-000000000006', 'material', 'Gypsum board 9mm', 'm2', 0.43, 285, 5, NULL, 128.68, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000061', 'f8c11111-1111-4111-a111-000000000025', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.29, 1050, 0, NULL, 304.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000062', 'f8c11111-1111-4111-a111-000000000026', 'f8de4-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.65, 4200, 0, NULL, 6930, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000063', 'f8c11111-1111-4111-a111-000000000026', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.07, 800, 0, NULL, 56, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000064', 'f8c11111-1111-4111-a111-000000000027', 'f8de4-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.07, 520, 0, NULL, 556.4, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000065', 'f8c11111-1111-4111-a111-000000000027', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.06, 650, 0, NULL, 39, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000066', 'f8c11111-1111-4111-a111-000000000027', 'f8de4-1111-4111-a111-000000000020', 'equipment', 'Tower crane', 'day', 0.03, 45000, 0, NULL, 1350, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000067', 'f8c11111-1111-4111-a111-000000000028', 'f8de4-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.73, 48, 0, NULL, 83.04, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000068', 'f8c11111-1111-4111-a111-000000000028', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.17, 850, 0, NULL, 144.5, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000069', 'f8c11111-1111-4111-a111-000000000028', 'f8de4-1111-4111-a111-000000000023', 'subcontract', 'Electrical subcontract package', 'lot', 0.0797745486907661, 185000, 0, NULL, 14758.29, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000070', 'f8c11111-1111-4111-a111-000000000029', 'f8de4-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.45, 850, 0, NULL, 1232.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000071', 'f8c11111-1111-4111-a111-000000000029', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.07, 900, 0, NULL, 63, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000072', 'f8c11111-1111-4111-a111-000000000030', 'f8de4-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.42, 285, 5, NULL, 125.68, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000073', 'f8c11111-1111-4111-a111-000000000030', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.28, 950, 0, NULL, 266, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000074', 'f8c11111-1111-4111-a111-000000000030', 'f8de4-1111-4111-a111-000000000018', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000075', 'f8c11111-1111-4111-a111-000000000031', 'f8de4-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.91, 1450, 0, NULL, 2769.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000076', 'f8c11111-1111-4111-a111-000000000031', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.13, 1100, 0, NULL, 143, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000077', 'f8c11111-1111-4111-a111-000000000032', 'f8de4-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.72, 1650, 0, NULL, 2838, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000078', 'f8c11111-1111-4111-a111-000000000032', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.1, 1050, 0, NULL, 105, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000079', 'f8c11111-1111-4111-a111-000000000033', 'f8de4-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.84, 42, 0, NULL, 35.28, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000080', 'f8c11111-1111-4111-a111-000000000033', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.22, 800, 0, NULL, 176, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000081', 'f8c11111-1111-4111-a111-000000000033', 'f8de4-1111-4111-a111-000000000021', 'equipment', 'Scaffolding rental', 'day', 0.07, 2200, 0, NULL, 154, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000082', 'f8c11111-1111-4111-a111-000000000034', 'f8de4-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.3, 68, 0, NULL, 88.4, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000083', 'f8c11111-1111-4111-a111-000000000034', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.27, 650, 0, NULL, 175.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000084', 'f8c11111-1111-4111-a111-000000000035', 'f8de4-1111-4111-a111-000000000006', 'material', 'Gypsum board 9mm', 'm2', 0.86, 285, 5, NULL, 257.36, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000085', 'f8c11111-1111-4111-a111-000000000035', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.24, 850, 0, NULL, 204, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000086', 'f8c11111-1111-4111-a111-000000000035', 'f8de4-1111-4111-a111-000000000026', 'subcontract', 'Waterproofing specialist', 'lot', 0.02477655688300729, 95000, 0, NULL, 2353.77, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000087', 'f8c11111-1111-4111-a111-000000000036', 'f8de4-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.36, 4200, 0, NULL, 5712, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000088', 'f8c11111-1111-4111-a111-000000000036', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.25, 900, 0, NULL, 225, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000089', 'f8c11111-1111-4111-a111-000000000036', 'f8de4-1111-4111-a111-000000000019', 'equipment', 'Backhoe loader', 'day', 0.02, 12500, 0, NULL, 250, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000090', 'f8c11111-1111-4111-a111-000000000037', 'f8de4-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.24, 520, 0, NULL, 644.8, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000091', 'f8c11111-1111-4111-a111-000000000037', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.13, 950, 0, NULL, 123.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000092', 'f8c11111-1111-4111-a111-000000000038', 'f8de4-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.21, 48, 0, NULL, 58.08, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000093', 'f8c11111-1111-4111-a111-000000000038', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.27, 1100, 0, NULL, 297, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000094', 'f8c11111-1111-4111-a111-000000000039', 'f8de4-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.84, 850, 0, NULL, 1564, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000095', 'f8c11111-1111-4111-a111-000000000039', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.2, 1050, 0, NULL, 210, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000096', 'f8c11111-1111-4111-a111-000000000039', 'f8de4-1111-4111-a111-000000000022', 'equipment', 'Concrete pump boom', 'day', 0.03, 28000, 0, NULL, 840, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000097', 'f8c11111-1111-4111-a111-000000000040', 'f8de4-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.83, 285, 5, NULL, 547.63, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000098', 'f8c11111-1111-4111-a111-000000000040', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.26, 800, 0, NULL, 208, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000099', 'f8c11111-1111-4111-a111-000000000041', 'f8de4-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 0.89, 1450, 0, NULL, 1290.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000100', 'f8c11111-1111-4111-a111-000000000041', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.2, 650, 0, NULL, 130, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000101', 'f8c11111-1111-4111-a111-000000000042', 'f8de4-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 0.87, 1650, 0, NULL, 1435.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000102', 'f8c11111-1111-4111-a111-000000000042', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.22, 850, 0, NULL, 187, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000103', 'f8c11111-1111-4111-a111-000000000042', 'f8de4-1111-4111-a111-000000000020', 'equipment', 'Tower crane', 'day', 0.05, 45000, 0, NULL, 2250, 2, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000104', 'f8c11111-1111-4111-a111-000000000042', 'f8de4-1111-4111-a111-000000000025', 'subcontract', 'Fire protection specialist', 'lot', 0.011275494620203972, 220000, 0, NULL, 2480.61, 3, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000105', 'f8c11111-1111-4111-a111-000000000043', 'f8de4-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.5, 42, 0, NULL, 21, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000106', 'f8c11111-1111-4111-a111-000000000043', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.12, 900, 0, NULL, 108, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000107', 'f8c11111-1111-4111-a111-000000000044', 'f8de4-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 0.88, 68, 0, NULL, 59.84, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000108', 'f8c11111-1111-4111-a111-000000000044', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.08, 950, 0, NULL, 76, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000109', 'f8c11111-1111-4111-a111-000000000045', 'f8de4-1111-4111-a111-000000000006', 'material', 'Gypsum board 9mm', 'm2', 1.1, 285, 5, NULL, 329.18, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000110', 'f8c11111-1111-4111-a111-000000000045', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.26, 1100, 0, NULL, 286, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000111', 'f8c11111-1111-4111-a111-000000000045', 'f8de4-1111-4111-a111-000000000018', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.07, 1800, 0, NULL, 126, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000112', 'f8c11111-1111-4111-a111-000000000046', 'f8de4-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 0.59, 4200, 0, NULL, 2478, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000113', 'f8c11111-1111-4111-a111-000000000046', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.29, 1050, 0, NULL, 304.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000114', 'f8c11111-1111-4111-a111-000000000047', 'f8de4-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.17, 520, 0, NULL, 608.4, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000115', 'f8c11111-1111-4111-a111-000000000047', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.07, 800, 0, NULL, 56, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000116', 'f8c11111-1111-4111-a111-000000000048', 'f8de4-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.86, 48, 0, NULL, 89.28, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000117', 'f8c11111-1111-4111-a111-000000000048', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.23, 650, 0, NULL, 149.5, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000118', 'f8c11111-1111-4111-a111-000000000048', 'f8de4-1111-4111-a111-000000000021', 'equipment', 'Scaffolding rental', 'day', 0.07, 2200, 0, NULL, 154, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000119', 'f8c11111-1111-4111-a111-000000000049', 'f8de4-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.76, 850, 0, NULL, 1496, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000120', 'f8c11111-1111-4111-a111-000000000049', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.23, 850, 0, NULL, 195.5, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000121', 'f8c11111-1111-4111-a111-000000000049', 'f8de4-1111-4111-a111-000000000024', 'subcontract', 'Plumbing subcontract package', 'lot', 0.048769607432186605, 165000, 0, NULL, 8046.99, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000122', 'f8c11111-1111-4111-a111-000000000050', 'f8de4-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.85, 285, 5, NULL, 553.61, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000123', 'f8c11111-1111-4111-a111-000000000050', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.08, 900, 0, NULL, 72, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000124', 'f8c11111-1111-4111-a111-000000000051', 'f8de4-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 0.46, 1450, 0, NULL, 667, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000125', 'f8c11111-1111-4111-a111-000000000051', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.12, 950, 0, NULL, 114, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000126', 'f8c11111-1111-4111-a111-000000000051', 'f8de4-1111-4111-a111-000000000019', 'equipment', 'Backhoe loader', 'day', 0.07, 12500, 0, NULL, 875, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000127', 'f8c11111-1111-4111-a111-000000000052', 'f8de4-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 0.43, 1650, 0, NULL, 709.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000128', 'f8c11111-1111-4111-a111-000000000052', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.06, 1100, 0, NULL, 66, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000129', 'f8c11111-1111-4111-a111-000000000053', 'f8de4-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.47, 42, 0, NULL, 19.74, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000130', 'f8c11111-1111-4111-a111-000000000053', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.09, 1050, 0, NULL, 94.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000131', 'f8c11111-1111-4111-a111-000000000054', 'f8de4-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 0.44, 68, 0, NULL, 29.92, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000132', 'f8c11111-1111-4111-a111-000000000054', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.05, 800, 0, NULL, 40, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000133', 'f8c11111-1111-4111-a111-000000000054', 'f8de4-1111-4111-a111-000000000022', 'equipment', 'Concrete pump boom', 'day', 0.07, 28000, 0, NULL, 1960, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000134', 'f8c11111-1111-4111-a111-000000000055', 'f8de4-1111-4111-a111-000000000006', 'material', 'Gypsum board 9mm', 'm2', 1.89, 285, 5, NULL, 565.58, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000135', 'f8c11111-1111-4111-a111-000000000055', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.17, 650, 0, NULL, 110.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000136', 'f8c11111-1111-4111-a111-000000000056', 'f8de4-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.69, 4200, 0, NULL, 7098, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000137', 'f8c11111-1111-4111-a111-000000000056', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.13, 850, 0, NULL, 110.5, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000138', 'f8c11111-1111-4111-a111-000000000056', 'f8de4-1111-4111-a111-000000000023', 'subcontract', 'Electrical subcontract package', 'lot', 0.07447711065411568, 185000, 0, NULL, 13778.27, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000139', 'f8c11111-1111-4111-a111-000000000057', 'f8de4-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.18, 520, 0, NULL, 613.6, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000140', 'f8c11111-1111-4111-a111-000000000057', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.27, 900, 0, NULL, 243, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000141', 'f8c11111-1111-4111-a111-000000000057', 'f8de4-1111-4111-a111-000000000020', 'equipment', 'Tower crane', 'day', 0.09, 45000, 0, NULL, 4050, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000142', 'f8c11111-1111-4111-a111-000000000058', 'f8de4-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.05, 48, 0, NULL, 50.4, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000143', 'f8c11111-1111-4111-a111-000000000058', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.29, 950, 0, NULL, 275.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000144', 'f8c11111-1111-4111-a111-000000000059', 'f8de4-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.95, 850, 0, NULL, 807.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000145', 'f8c11111-1111-4111-a111-000000000059', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.13, 1100, 0, NULL, 143, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000146', 'f8c11111-1111-4111-a111-000000000060', 'f8de4-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.29, 285, 5, NULL, 386.03, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000147', 'f8c11111-1111-4111-a111-000000000060', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.14, 1050, 0, NULL, 147, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000148', 'f8c11111-1111-4111-a111-000000000060', 'f8de4-1111-4111-a111-000000000018', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.01, 1800, 0, NULL, 18, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000149', 'f8c11111-1111-4111-a111-000000000061', 'f8de4-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 0.84, 1450, 0, NULL, 1218, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000150', 'f8c11111-1111-4111-a111-000000000061', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.2, 800, 0, NULL, 160, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000151', 'f8c11111-1111-4111-a111-000000000062', 'f8de4-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 0.56, 1650, 0, NULL, 924, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000152', 'f8c11111-1111-4111-a111-000000000062', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.27, 650, 0, NULL, 175.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000153', 'f8c11111-1111-4111-a111-000000000063', 'f8de4-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.18, 42, 0, NULL, 49.56, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000154', 'f8c11111-1111-4111-a111-000000000063', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.08, 850, 0, NULL, 68, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000155', 'f8c11111-1111-4111-a111-000000000063', 'f8de4-1111-4111-a111-000000000021', 'equipment', 'Scaffolding rental', 'day', 0.02, 2200, 0, NULL, 44, 2, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000156', 'f8c11111-1111-4111-a111-000000000063', 'f8de4-1111-4111-a111-000000000026', 'subcontract', 'Waterproofing specialist', 'lot', 0.03354945963248611, 95000, 0, NULL, 3187.2, 3, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000157', 'f8c11111-1111-4111-a111-000000000064', 'f8de4-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.68, 68, 0, NULL, 114.24, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000158', 'f8c11111-1111-4111-a111-000000000064', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.06, 900, 0, NULL, 54, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000159', 'f8c11111-1111-4111-a111-000000000065', 'f8de4-1111-4111-a111-000000000006', 'material', 'Gypsum board 9mm', 'm2', 1.33, 285, 5, NULL, 398, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000160', 'f8c11111-1111-4111-a111-000000000065', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.23, 950, 0, NULL, 218.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000161', 'f8c11111-1111-4111-a111-000000000066', 'f8de4-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 0.6, 4200, 0, NULL, 2520, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000162', 'f8c11111-1111-4111-a111-000000000066', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.19, 1100, 0, NULL, 209, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000163', 'f8c11111-1111-4111-a111-000000000066', 'f8de4-1111-4111-a111-000000000019', 'equipment', 'Backhoe loader', 'day', 0.06, 12500, 0, NULL, 750, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000164', 'f8c11111-1111-4111-a111-000000000067', 'f8de4-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.21, 520, 0, NULL, 629.2, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000165', 'f8c11111-1111-4111-a111-000000000067', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.22, 1050, 0, NULL, 231, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000166', 'f8c11111-1111-4111-a111-000000000068', 'f8de4-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.83, 48, 0, NULL, 87.84, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000167', 'f8c11111-1111-4111-a111-000000000068', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.29, 800, 0, NULL, 232, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000168', 'f8c11111-1111-4111-a111-000000000069', 'f8de4-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.51, 850, 0, NULL, 1283.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000169', 'f8c11111-1111-4111-a111-000000000069', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.22, 650, 0, NULL, 143, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000170', 'f8c11111-1111-4111-a111-000000000069', 'f8de4-1111-4111-a111-000000000022', 'equipment', 'Concrete pump boom', 'day', 0.02, 28000, 0, NULL, 560, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000171', 'f8c11111-1111-4111-a111-000000000070', 'f8de4-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.68, 285, 5, NULL, 203.49, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000172', 'f8c11111-1111-4111-a111-000000000070', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.23, 850, 0, NULL, 195.5, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000173', 'f8c11111-1111-4111-a111-000000000070', 'f8de4-1111-4111-a111-000000000025', 'subcontract', 'Fire protection specialist', 'lot', 0.0577539904601872, 220000, 0, NULL, 12705.88, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000174', 'f8c11111-1111-4111-a111-000000000071', 'f8de4-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.97, 1450, 0, NULL, 2856.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000175', 'f8c11111-1111-4111-a111-000000000071', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.16, 900, 0, NULL, 144, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000176', 'f8c11111-1111-4111-a111-000000000072', 'f8de4-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.33, 1650, 0, NULL, 2194.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000177', 'f8c11111-1111-4111-a111-000000000072', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.09, 950, 0, NULL, 85.5, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000178', 'f8c11111-1111-4111-a111-000000000072', 'f8de4-1111-4111-a111-000000000020', 'equipment', 'Tower crane', 'day', 0.03, 45000, 0, NULL, 1350, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000179', 'f8c11111-1111-4111-a111-000000000073', 'f8de4-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.56, 42, 0, NULL, 23.52, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000180', 'f8c11111-1111-4111-a111-000000000073', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.12, 1100, 0, NULL, 132, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000181', 'f8c11111-1111-4111-a111-000000000074', 'f8de4-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.04, 68, 0, NULL, 70.72, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000182', 'f8c11111-1111-4111-a111-000000000074', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.21, 1050, 0, NULL, 220.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000183', 'f8c11111-1111-4111-a111-000000000075', 'f8de4-1111-4111-a111-000000000006', 'material', 'Gypsum board 9mm', 'm2', 0.78, 285, 5, NULL, 233.42, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000184', 'f8c11111-1111-4111-a111-000000000075', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.27, 800, 0, NULL, 216, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000185', 'f8c11111-1111-4111-a111-000000000075', 'f8de4-1111-4111-a111-000000000018', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.07, 1800, 0, NULL, 126, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000186', 'f8c11111-1111-4111-a111-000000000076', 'f8de4-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.16, 4200, 0, NULL, 4872, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000187', 'f8c11111-1111-4111-a111-000000000076', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.15, 650, 0, NULL, 97.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000188', 'f8c11111-1111-4111-a111-000000000077', 'f8de4-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.31, 520, 0, NULL, 681.2, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000189', 'f8c11111-1111-4111-a111-000000000077', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.24, 850, 0, NULL, 204, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000190', 'f8c11111-1111-4111-a111-000000000077', 'f8de4-1111-4111-a111-000000000024', 'subcontract', 'Plumbing subcontract package', 'lot', 0.08188032329082488, 165000, 0, NULL, 13510.25, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000191', 'f8c11111-1111-4111-a111-000000000078', 'f8de4-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.73, 48, 0, NULL, 83.04, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000192', 'f8c11111-1111-4111-a111-000000000078', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.28, 900, 0, NULL, 252, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000193', 'f8c11111-1111-4111-a111-000000000078', 'f8de4-1111-4111-a111-000000000021', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000194', 'f8c11111-1111-4111-a111-000000000079', 'f8de4-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.43, 850, 0, NULL, 365.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000195', 'f8c11111-1111-4111-a111-000000000079', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.17, 950, 0, NULL, 161.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000196', 'f8c11111-1111-4111-a111-000000000080', 'f8de4-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.32, 285, 5, NULL, 395.01, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000197', 'f8c11111-1111-4111-a111-000000000080', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.2, 1100, 0, NULL, 220, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000198', 'f8c11111-1111-4111-a111-000000000081', 'f8de4-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.1, 1450, 0, NULL, 1595, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000199', 'f8c11111-1111-4111-a111-000000000081', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.1, 1050, 0, NULL, 105, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000200', 'f8c11111-1111-4111-a111-000000000081', 'f8de4-1111-4111-a111-000000000019', 'equipment', 'Backhoe loader', 'day', 0.02, 12500, 0, NULL, 250, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000201', 'f8c11111-1111-4111-a111-000000000082', 'f8de4-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.57, 1650, 0, NULL, 2590.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000202', 'f8c11111-1111-4111-a111-000000000082', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.11, 800, 0, NULL, 88, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000203', 'f8c11111-1111-4111-a111-000000000083', 'f8de4-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.65, 42, 0, NULL, 69.3, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000204', 'f8c11111-1111-4111-a111-000000000083', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.14, 650, 0, NULL, 91, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000205', 'f8c11111-1111-4111-a111-000000000084', 'f8de4-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.94, 68, 0, NULL, 131.92, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000206', 'f8c11111-1111-4111-a111-000000000084', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.07, 850, 0, NULL, 59.5, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000207', 'f8c11111-1111-4111-a111-000000000084', 'f8de4-1111-4111-a111-000000000022', 'equipment', 'Concrete pump boom', 'day', 0.07, 28000, 0, NULL, 1960, 2, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000208', 'f8c11111-1111-4111-a111-000000000084', 'f8de4-1111-4111-a111-000000000023', 'subcontract', 'Electrical subcontract package', 'lot', 0.048594532571733004, 185000, 0, NULL, 8989.99, 3, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000209', 'f8c11111-1111-4111-a111-000000000085', 'f8de4-1111-4111-a111-000000000006', 'material', 'Gypsum board 9mm', 'm2', 1.42, 285, 5, NULL, 424.94, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000210', 'f8c11111-1111-4111-a111-000000000085', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.06, 900, 0, NULL, 54, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000211', 'f8c11111-1111-4111-a111-000000000086', 'f8de4-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 0.71, 4200, 0, NULL, 2982, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000212', 'f8c11111-1111-4111-a111-000000000086', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.09, 950, 0, NULL, 85.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000213', 'f8c11111-1111-4111-a111-000000000087', 'f8de4-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.5, 520, 0, NULL, 780, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000214', 'f8c11111-1111-4111-a111-000000000087', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.22, 1100, 0, NULL, 242, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000215', 'f8c11111-1111-4111-a111-000000000087', 'f8de4-1111-4111-a111-000000000020', 'equipment', 'Tower crane', 'day', 0.04, 45000, 0, NULL, 1800, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000216', 'f8c11111-1111-4111-a111-000000000088', 'f8de4-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.58, 48, 0, NULL, 75.84, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000217', 'f8c11111-1111-4111-a111-000000000088', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.13, 1050, 0, NULL, 136.5, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000218', 'f8c11111-1111-4111-a111-000000000089', 'f8de4-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.97, 850, 0, NULL, 824.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000219', 'f8c11111-1111-4111-a111-000000000089', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.09, 800, 0, NULL, 72, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000220', 'f8c11111-1111-4111-a111-000000000090', 'f8de4-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.65, 285, 5, NULL, 194.51, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000221', 'f8c11111-1111-4111-a111-000000000090', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.26, 650, 0, NULL, 169, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000222', 'f8c11111-1111-4111-a111-000000000090', 'f8de4-1111-4111-a111-000000000018', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.07, 1800, 0, NULL, 126, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000223', 'f8c11111-1111-4111-a111-000000000091', 'f8de4-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.28, 1450, 0, NULL, 1856, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000224', 'f8c11111-1111-4111-a111-000000000091', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.12, 850, 0, NULL, 102, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000225', 'f8c11111-1111-4111-a111-000000000091', 'f8de4-1111-4111-a111-000000000026', 'subcontract', 'Waterproofing specialist', 'lot', 0.08590857349336146, 95000, 0, NULL, 8161.31, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000226', 'f8c11111-1111-4111-a111-000000000092', 'f8de4-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.3, 1650, 0, NULL, 2145, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000227', 'f8c11111-1111-4111-a111-000000000092', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.05, 900, 0, NULL, 45, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000228', 'f8c11111-1111-4111-a111-000000000093', 'f8de4-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.73, 42, 0, NULL, 30.66, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000229', 'f8c11111-1111-4111-a111-000000000093', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.13, 950, 0, NULL, 123.5, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000230', 'f8c11111-1111-4111-a111-000000000093', 'f8de4-1111-4111-a111-000000000021', 'equipment', 'Scaffolding rental', 'day', 0.07, 2200, 0, NULL, 154, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000231', 'f8c11111-1111-4111-a111-000000000094', 'f8de4-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 0.42, 68, 0, NULL, 28.56, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000232', 'f8c11111-1111-4111-a111-000000000094', 'f8de4-1111-4111-a111-000000000014', 'labor', 'Electrician', 'day', 0.11, 1100, 0, NULL, 121, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000233', 'f8c11111-1111-4111-a111-000000000095', 'f8de4-1111-4111-a111-000000000006', 'material', 'Gypsum board 9mm', 'm2', 0.61, 285, 5, NULL, 182.54, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000234', 'f8c11111-1111-4111-a111-000000000095', 'f8de4-1111-4111-a111-000000000015', 'labor', 'Plumber', 'day', 0.3, 1050, 0, NULL, 315, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000235', 'f8c11111-1111-4111-a111-000000000096', 'f8de4-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.52, 4200, 0, NULL, 6384, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000236', 'f8c11111-1111-4111-a111-000000000096', 'f8de4-1111-4111-a111-000000000016', 'labor', 'Painter', 'day', 0.11, 800, 0, NULL, 88, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000237', 'f8c11111-1111-4111-a111-000000000096', 'f8de4-1111-4111-a111-000000000019', 'equipment', 'Backhoe loader', 'day', 0.03, 12500, 0, NULL, 375, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000238', 'f8c11111-1111-4111-a111-000000000097', 'f8de4-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.95, 520, 0, NULL, 1014, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000239', 'f8c11111-1111-4111-a111-000000000097', 'f8de4-1111-4111-a111-000000000017', 'labor', 'Laborer/helper', 'day', 0.06, 650, 0, NULL, 39, 1, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000240', 'f8c11111-1111-4111-a111-000000000098', 'f8de4-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 0.44, 48, 0, NULL, 21.12, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000241', 'f8c11111-1111-4111-a111-000000000098', 'f8de4-1111-4111-a111-000000000011', 'labor', 'Mason', 'day', 0.1, 850, 0, NULL, 85, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000242', 'f8c11111-1111-4111-a111-000000000098', 'f8de4-1111-4111-a111-000000000025', 'subcontract', 'Fire protection specialist', 'lot', 0.07356230778619646, 220000, 0, NULL, 16183.71, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000243', 'f8c11111-1111-4111-a111-000000000099', 'f8de4-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.91, 850, 0, NULL, 1623.5, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000244', 'f8c11111-1111-4111-a111-000000000099', 'f8de4-1111-4111-a111-000000000012', 'labor', 'Carpenter', 'day', 0.21, 900, 0, NULL, 189, 1, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000245', 'f8c11111-1111-4111-a111-000000000099', 'f8de4-1111-4111-a111-000000000022', 'equipment', 'Concrete pump boom', 'day', 0.03, 28000, 0, NULL, 840, 2, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by
  ) VALUES
    ('f8e11111-1111-4111-a111-000000000246', 'f8c11111-1111-4111-a111-000000000100', 'f8de4-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.92, 285, 5, NULL, 574.56, 0, v_owner, v_owner),
    ('f8e11111-1111-4111-a111-000000000247', 'f8c11111-1111-4111-a111-000000000100', 'f8de4-1111-4111-a111-000000000013', 'labor', 'Steel fixer', 'day', 0.08, 950, 0, NULL, 76, 1, v_owner, v_owner);

  INSERT INTO public.audit_log (project_id, entity_type, entity_id, action, actor_id, payload)
  VALUES (
    v_project_id, 'project', v_project_id, 'project.created', v_owner,
    jsonb_build_object('module', 'formula_validation', 'remarks', 'Sprint 8 demo seed')
  );
END $$;

COMMIT;
