-- Quantix V1 Local Pilot — Megawide Office Building
-- Prerequisites: migrations applied; at least one public.users row
-- Apply: npm run load:demo

BEGIN;

DO $$
DECLARE
  v_owner UUID;
  v_project_id UUID := 'e1a11111-1111-4111-a111-111111111101';
BEGIN
  SELECT id INTO v_owner FROM public.users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'No active users found. Provision a user before running this seed.';
  END IF;

  DELETE FROM public.audit_log WHERE project_id = v_project_id OR entity_id = v_project_id;
  DELETE FROM public.projects WHERE id = v_project_id;

  DELETE FROM public.rate_library_items WHERE id::text LIKE 'e1d%';
  DELETE FROM public.company_resource_categories WHERE id::text LIKE 'e1d%';
  DELETE FROM public.company_units WHERE id::text LIKE 'e1d%';
  DELETE FROM public.company_suppliers WHERE id::text LIKE 'e1d%';

  INSERT INTO public.projects (
    id, project_code, project_name, client_name, location, status, created_by, updated_by
  ) VALUES (
    v_project_id, 'QTX-PILOT-MEGAWIDE-001', 'Megawide Office Building',
    'Megawide Construction Corporation', 'Makati City, Philippines',
    'in_progress', v_owner, v_owner
  );

  INSERT INTO public.project_details (
    project_id, description, currency, project_type, indirect_cost_percent, contingency_percent,
    markup_percent, vat_percent, measurement_system, default_unit_system, rounding_rule,
    is_benchmark, created_by, updated_by
  ) VALUES (
    v_project_id, '12-storey Grade A office building pilot demo — complete WBS, BOQ, rate analysis, and Philippine construction rates.',
    'PHP', 'commercial',
    10, 5,
    8, 12,
    'metric', 'metric_si', 'half_up', true, v_owner, v_owner
  );

  INSERT INTO public.estimate_summary (
    project_id, direct_cost, indirect_cost, contingency, markup, vat, grand_total,
    created_by, updated_by
  ) VALUES (
    v_project_id, 322076283.02, 32207628.3,
    17714195.57, 29759848.55, 48210954.65,
    449968910.09, v_owner, v_owner
  );

  INSERT INTO public.company_suppliers (id, code, name, created_by, updated_by)
  VALUES
    ('e1de1111-1111-4111-a111-000000000001', 'SUP-HOLCIM', 'Holcim Philippines', v_owner, v_owner),
    ('e1de1111-1111-4111-a111-000000000002', 'SUP-REPUBLIC', 'Republic Cement', v_owner, v_owner),
    ('e1de1111-1111-4111-a111-000000000003', 'SUP-MKP', 'MKP Construction Supply', v_owner, v_owner),
    ('e1de1111-1111-4111-a111-000000000004', 'SUP-STEELASIA', 'SteelAsia Manufacturing', v_owner, v_owner),
    ('e1de1111-1111-4111-a111-000000000005', 'SUP-BOY', 'Boysen Paints Philippines', v_owner, v_owner),
    ('e1de1111-1111-4111-a111-000000000006', 'SUP-PHILPIPE', 'Philippine Pipe Industries', v_owner, v_owner),
    ('e1de1111-1111-4111-a111-000000000007', 'SUP-DAIKIN', 'Daikin Philippines', v_owner, v_owner),
    ('e1de1111-1111-4111-a111-000000000008', 'SUP-SCHNEIDER', 'Schneider Electric PH', v_owner, v_owner);

  INSERT INTO public.company_units (id, code, symbol, name, created_by, updated_by)
  VALUES
    ('e1de2111-1111-4111-a111-000000000001', 'UOM-M3', 'm3', 'Cubic Meter', v_owner, v_owner),
    ('e1de2111-1111-4111-a111-000000000002', 'UOM-M2', 'm2', 'Square Meter', v_owner, v_owner),
    ('e1de2111-1111-4111-a111-000000000003', 'UOM-M', 'm', 'Linear Meter', v_owner, v_owner),
    ('e1de2111-1111-4111-a111-000000000004', 'UOM-KG', 'kg', 'Kilogram', v_owner, v_owner),
    ('e1de2111-1111-4111-a111-000000000005', 'UOM-BAG', 'bag', 'Bag', v_owner, v_owner),
    ('e1de2111-1111-4111-a111-000000000006', 'UOM-PC', 'pc', 'Piece', v_owner, v_owner),
    ('e1de2111-1111-4111-a111-000000000007', 'UOM-LOT', 'lot', 'Lump Sum', v_owner, v_owner),
    ('e1de2111-1111-4111-a111-000000000008', 'UOM-HR', 'hr', 'Hour', v_owner, v_owner),
    ('e1de2111-1111-4111-a111-000000000009', 'UOM-DAY', 'day', 'Day', v_owner, v_owner),
    ('e1de2111-1111-4111-a111-000000000010', 'UOM-TON', 'ton', 'Metric Ton', v_owner, v_owner);

  INSERT INTO public.company_resource_categories (id, code, name, resource_type, created_by, updated_by)
  VALUES
    ('e1de3111-1111-4111-a111-000000000001', 'CAT-CEMENT', 'Cement & Concrete', 'material', v_owner, v_owner),
    ('e1de3111-1111-4111-a111-000000000002', 'CAT-STEEL', 'Steel & Rebar', 'material', v_owner, v_owner),
    ('e1de3111-1111-4111-a111-000000000003', 'CAT-FINISH', 'Finishes', 'material', v_owner, v_owner),
    ('e1de3111-1111-4111-a111-000000000004', 'CAT-MEP', 'MEP Materials', 'material', v_owner, v_owner),
    ('e1de3111-1111-4111-a111-000000000005', 'CAT-SKILLED', 'Skilled Labor', 'labor', v_owner, v_owner),
    ('e1de3111-1111-4111-a111-000000000006', 'CAT-SEMI', 'Semi-Skilled Labor', 'labor', v_owner, v_owner),
    ('e1de3111-1111-4111-a111-000000000007', 'CAT-PLANT', 'Plant & Equipment', 'equipment', v_owner, v_owner),
    ('e1de3111-1111-4111-a111-000000000008', 'CAT-SUB-MEP', 'MEP Subcontract', 'subcontract', v_owner, v_owner);

  INSERT INTO public.rate_library_items (
    id, code, description, unit, unit_cost, category, is_active, created_by, updated_by
  ) VALUES
    ('e1de4111-1111-4111-a111-000000000001', 'MAT-CEM-40', 'Portland Cement Type I 40kg bag', 'bag', 285, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000002', 'MAT-SAND', 'Washed sand', 'm3', 1450, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000003', 'MAT-GRVL', 'Gravel 3/4"', 'm3', 1650, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000004', 'MAT-CHB-150', 'CHB 150mm', 'pc', 42, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000005', 'MAT-REBAR16', 'Deformed bar #16', 'kg', 68, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000006', 'MAT-GYPSUM', 'Gypsum board 12.5mm', 'm2', 320, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000007', 'MAT-PAINT', 'Latex paint 20L pail', 'lot', 4200, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000008', 'MAT-PVC-4', 'PVC pipe 4" SDR', 'm', 520, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000009', 'MAT-THHN-35', 'THHN wire 3.5mm2', 'm', 48, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000010', 'MAT-SPRINKLER', 'Sprinkler head upright', 'pc', 850, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000011', 'MAT-PLY-18', 'Marine plywood 18mm', 'm2', 680, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000012', 'MAT-STEEL-W14', 'Wide flange W14 section', 'kg', 72, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000013', 'MAT-METAL-ROOF', 'Standing seam metal sheet', 'm2', 1250, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000014', 'MAT-ALUM-WIN', 'Aluminum window frame', 'm2', 4800, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000015', 'MAT-VRF-ODU', 'VRF outdoor unit 16HP', 'pc', 485000, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000016', 'MAT-ASPHALT', 'Asphalt premix', 'm2', 890, 'material', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000017', 'LAB-MASON', 'Mason', 'day', 850, 'labor', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000018', 'LAB-CARP', 'Carpenter', 'day', 900, 'labor', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000019', 'LAB-STEEL', 'Steel fixer', 'day', 950, 'labor', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000020', 'LAB-ELEC', 'Electrician', 'day', 1100, 'labor', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000021', 'LAB-PLUMB', 'Plumber', 'day', 1050, 'labor', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000022', 'LAB-PAINT', 'Painter', 'day', 800, 'labor', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000023', 'LAB-LABORER', 'Laborer/helper', 'day', 650, 'labor', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000024', 'LAB-RIGGER', 'Steel rigger', 'day', 1200, 'labor', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000025', 'LAB-HVAC', 'HVAC technician', 'day', 1150, 'labor', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000026', 'EQ-MIXER', 'Concrete mixer 1 bagger', 'day', 1800, 'equipment', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000027', 'EQ-BACKHOE', 'Backhoe loader', 'day', 12500, 'equipment', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000028', 'EQ-CRANE', 'Tower crane', 'day', 45000, 'equipment', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000029', 'EQ-SCAFF', 'Scaffolding rental', 'day', 2200, 'equipment', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000030', 'EQ-PUMP', 'Concrete pump boom', 'day', 28000, 'equipment', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000031', 'EQ-LIFT', 'Scissor lift 12m', 'day', 8500, 'equipment', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000032', 'SUB-ELEC', 'Electrical subcontract package', 'lot', 185000, 'subcontract', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000033', 'SUB-PLUMB', 'Plumbing subcontract package', 'lot', 165000, 'subcontract', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000034', 'SUB-FIRE', 'Fire protection specialist', 'lot', 220000, 'subcontract', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000035', 'SUB-HVAC', 'HVAC specialist package', 'lot', 320000, 'subcontract', true, v_owner, v_owner),
    ('e1de4111-1111-4111-a111-000000000036', 'SUB-CURTAIN', 'Curtain wall specialist', 'lot', 450000, 'subcontract', true, v_owner, v_owner);

  INSERT INTO public.wbs (
    id, project_id, parent_id, level, wbs_code, description, sort_order, created_by, updated_by
  ) VALUES
    ('e1b11111-1111-4111-a111-000000000001', v_project_id, NULL, 1, '0', 'Megawide Office Building', 1, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000002', v_project_id, 'e1b11111-1111-4111-a111-000000000001', 2, '1', 'Civil & Structural', 2, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000003', v_project_id, 'e1b11111-1111-4111-a111-000000000002', 3, '1.1', 'Concrete', 3, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000004', v_project_id, 'e1b11111-1111-4111-a111-000000000002', 3, '1.2', 'Rebars', 4, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000005', v_project_id, 'e1b11111-1111-4111-a111-000000000002', 3, '1.3', 'Formworks', 5, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000006', v_project_id, 'e1b11111-1111-4111-a111-000000000002', 3, '1.4', 'Structural Steel', 6, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000007', v_project_id, 'e1b11111-1111-4111-a111-000000000001', 2, '2', 'Architectural', 7, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000008', v_project_id, 'e1b11111-1111-4111-a111-000000000007', 3, '2.1', 'Masonry', 8, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000009', v_project_id, 'e1b11111-1111-4111-a111-000000000007', 3, '2.2', 'Roofing', 9, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000010', v_project_id, 'e1b11111-1111-4111-a111-000000000007', 3, '2.3', 'Ceiling', 10, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000011', v_project_id, 'e1b11111-1111-4111-a111-000000000007', 3, '2.4', 'Doors', 11, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000012', v_project_id, 'e1b11111-1111-4111-a111-000000000007', 3, '2.5', 'Windows', 12, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000013', v_project_id, 'e1b11111-1111-4111-a111-000000000007', 3, '2.6', 'Painting', 13, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000014', v_project_id, 'e1b11111-1111-4111-a111-000000000001', 2, '3', 'MEPF', 14, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000015', v_project_id, 'e1b11111-1111-4111-a111-000000000014', 3, '3.1', 'Plumbing', 15, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000016', v_project_id, 'e1b11111-1111-4111-a111-000000000014', 3, '3.2', 'Fire Protection', 16, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000017', v_project_id, 'e1b11111-1111-4111-a111-000000000014', 3, '3.3', 'Electrical', 17, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000018', v_project_id, 'e1b11111-1111-4111-a111-000000000014', 3, '3.4', 'HVAC', 18, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000019', v_project_id, 'e1b11111-1111-4111-a111-000000000001', 2, '4', 'Site Works', 19, v_owner, v_owner),
    ('e1b11111-1111-4111-a111-000000000020', v_project_id, 'e1b11111-1111-4111-a111-000000000019', 3, '4.1', 'External Works', 20, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('e1c11111-1111-4111-a111-000000000001', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0001', 'Portland cement concrete footing 4000 psi', 'm3', 18.61, 1711, 306, 0, 0, 0, 2017, 37536.37, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000002', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0002', 'Reinforced concrete column 400mm', 'm3', 18.71, 2409, 152, 0, 0, 0, 2561, 47916.31, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000003', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0003', 'Reinforced concrete beam 300x600', 'm3', 11.95, 65.1, 253, 286, 0, 0, 604.1, 7219, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000004', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0004', 'Reinforced concrete slab on grade 150mm', 'm3', 6.81, 120.36, 189, 0, 0, 0, 309.36, 2106.74, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000005', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0005', 'Reinforced concrete suspended slab 200mm', 'm3', 25.45, 564.48, 336, 0, 0, 0, 900.48, 22917.22, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000006', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0006', 'Post-tensioned slab band', 'm2', 3.41, 4242, 247, 108, 0, 0, 4597, 15675.77, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000007', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0007', 'Concrete core wall 300mm', 'm2', 10.09, 317.2, 492, 0, 26400, 0, 27209.2, 274540.83, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000008', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0008', 'Concrete stairs and landings', 'm2', 3.15, 65.76, 161, 0, 0, 0, 226.76, 714.29, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000009', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0009', 'Lean concrete blinding 50mm', 'm3', 26.23, 1071, 297.5, 220, 0, 0, 1588.5, 41666.36, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000010', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0010', 'Concrete pump allowance', 'lot', 14.97, 1249.5, 261, 0, 0, 0, 1510.5, 22612.19, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000011', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0011', 'Concrete curing compound', 'm2', 9.67, 38.88, 275.5, 0, 0, 97.15, 411.53, 3979.5, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000012', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0012', 'Waterstop installation', 'm2', 8.61, 1925, 407, 108, 0, 0, 2440, 21008.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000013', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0013', 'Expansion joint filler', 'm2', 23.18, 5568, 346.5, 0, 0, 0, 5914.5, 137098.11, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000014', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0014', 'Concrete testing cubes', 'm2', 4.12, 999100, 192, 0, 18000, 0, 1017292, 4191243.04, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000015', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0015', 'Night pour premium allowance', 'lot', 5.11, 663.5, 71.5, 242, 0, 0, 977, 4992.47, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000016', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0016', 'Concrete vibration and finishing', 'm2', 6.8, 478.8, 504, 0, 0, 0, 982.8, 6683.04, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000017', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0017', 'Grouting under base plates', 'm2', 21.03, 2479.5, 460, 0, 0, 0, 2939.5, 61817.69, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000018', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0018', 'RC retaining wall 250mm', 'm2', 3.45, 2574, 263.5, 144, 0, 0, 2981.5, 10286.18, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000019', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0019', 'Concrete pile cap', 'm2', 3.42, 42.84, 198, 0, 0, 0, 240.84, 823.67, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000020', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0020', 'Concrete grade beam', 'm2', 16.98, 75.68, 95, 0, 0, 0, 170.68, 2898.15, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000021', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0021', 'Concrete topping 75mm', 'm2', 16.41, 515.2, 231, 66, 3300, 0, 4112.2, 67481.2, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000022', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0022', 'Fiber mesh reinforcement', 'm2', 17.08, 5670, 136.5, 0, 0, 92.02, 5898.52, 100746.72, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000023', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0023', 'Chemical admixture allowance', 'lot', 16.66, 1341.6, 336, 0, 0, 0, 1677.6, 27948.82, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000024', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0024', 'Concrete washout facility', 'm2', 4.12, 127.68, 78, 126, 0, 0, 331.68, 1366.52, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000025', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0025', 'Mass concrete pour monitoring', 'm3', 16.15, 767.55, 240, 0, 0, 0, 1007.55, 16271.93, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000026', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0026', 'Concrete cold joint treatment', 'm2', 5.44, 1523.2, 218.5, 0, 0, 0, 1741.7, 9474.85, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000027', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0027', 'RC shear wall coupling beam', 'm2', 8.69, 140.4, 178.5, 176, 0, 0, 494.9, 4300.68, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000028', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0028', 'Concrete sump pit', 'm2', 7.3, 3000, 360, 0, 22400, 0, 25760, 188048, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000029', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0029', 'Concrete equipment pad', 'm2', 21.8, 7200, 95, 0, 0, 0, 7295, 159031, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000030', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0030', 'Concrete pavement 200mm', 'm2', 5.67, 1181460, 165, 54, 0, 0, 1181679, 6700119.93, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000031', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0031', 'Concrete curb and gutter', 'm2', 19.31, 2118.2, 388.5, 0, 0, 0, 2506.7, 48404.38, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000032', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0032', 'Concrete bollard', 'm2', 11.85, 171, 288, 0, 0, 0, 459, 5439.15, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000033', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0033', 'Concrete planter wall', 'm2', 10.63, 3813.5, 253.5, 198, 0, 34.83, 4299.83, 45707.19, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000034', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0034', 'Concrete ramp 1:12', 'm2', 16.11, 3448.5, 468, 0, 0, 0, 3916.5, 63094.81, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000035', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0035', 'Concrete lift pit', 'm2', 11.89, 29.99, 448.5, 0, 5550, 0, 6028.49, 71678.75, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000036', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0036', 'Concrete tank slab', 'm2', 9.35, 106.76, 280.5, 162, 0, 0, 549.26, 5135.58, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000037', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0037', 'Concrete isolation joint', 'm2', 22.98, 742.4, 144, 0, 0, 0, 886.4, 20369.47, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000038', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0038', 'Concrete anchor bolt setting', 'm2', 8.24, 9954, 228, 0, 0, 0, 10182, 83899.68, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000039', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0039', 'Concrete surface hardener', 'm2', 14.88, 369.2, 319, 286, 0, 0, 974.2, 14496.1, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000040', v_project_id, 'e1b11111-1111-4111-a111-000000000003', 'MWB-0040', 'Concrete repair mortar', 'm2', 3.37, 117.94, 231, 0, 0, 0, 348.94, 1175.93, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000041', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0041', 'Supply and install rebar #16', 'kg', 12.29, 476, 168, 0, 0, 0, 644, 7914.76, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000042', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0042', 'Supply and install rebar #20', 'kg', 18.22, 1598, 195, 162, 6600, 0, 8555, 155872.1, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000043', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0043', 'Supply and install rebar #25', 'kg', 13.96, 103.68, 384, 0, 0, 0, 487.68, 6808.01, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000044', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0044', 'Supply and install rebar #32', 'kg', 14.25, 2075, 333.5, 0, 0, 92.51, 2501.01, 35639.39, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000045', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0045', 'Cutting and bending rebar', 'kg', 17.36, 4586.4, 238, 198, 0, 0, 5022.4, 87188.86, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000046', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0046', 'Welded wire mesh 6x6', 'm', 4.43, 582000, 225, 0, 0, 0, 582225, 2579256.75, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000047', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0047', 'Rebar chairs and spacers', 'm2', 21.26, 1094.7, 123.5, 0, 0, 0, 1218.2, 25898.93, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000048', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0048', 'Epoxy coated rebar', 'kg', 7.67, 245.1, 99, 72, 0, 0, 416.1, 3191.49, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000049', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0049', 'Rebar splicing couplers', 'm2', 25.1, 3654, 84, 0, 49500, 0, 53238, 1336273.8, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000050', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0050', 'Stirrups and ties', 'm2', 14.94, 4591.13, 208, 0, 0, 0, 4799.13, 71699, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('e1c11111-1111-4111-a111-000000000051', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0051', 'Post-tensioning strand', 'm2', 14.63, 99.54, 234, 88, 0, 0, 421.54, 6167.13, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000052', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0052', 'PT anchorage heads', 'm2', 20.07, 91.8, 324, 0, 0, 0, 415.8, 8345.11, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000053', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0053', 'Rebar testing allowance', 'lot', 14.58, 387.2, 379.5, 0, 0, 0, 766.7, 11178.49, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000054', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0054', 'Rebar welding', 'm2', 18.33, 7308, 272, 144, 0, 0, 7724, 141580.92, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000055', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0055', 'Rebar threading', 'm2', 1.95, 868.14, 153, 0, 0, 49.38, 1070.52, 2087.51, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000056', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0056', 'Galvanized rebar', 'kg', 13.13, 63.84, 294.5, 0, 19800, 0, 20158.34, 264679, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000057', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0057', 'Rebar cage prefabrication', 'm2', 6.61, 1802, 121, 154, 0, 0, 2077, 13728.97, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000058', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0058', 'Rebar dowels', 'm2', 11.61, 1734, 147, 0, 0, 0, 1881, 21838.41, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000059', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0059', 'Rebar lap splice', 'm2', 2.01, 182.88, 232, 0, 0, 0, 414.88, 833.91, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000060', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0060', 'Rebar corrosion inhibitor', 'm2', 7.21, 879.38, 227.5, 72, 0, 0, 1178.88, 8499.72, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000061', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0061', 'Rebar protective caps', 'm2', 16.16, 3600, 300, 0, 0, 0, 3900, 63024, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000062', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0062', 'Rebar inventory wastage', 'm2', 5.63, 291000, 92, 0, 0, 0, 291092, 1638847.96, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000063', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0063', 'Rebar transport and handling', 'm2', 14.41, 2144.9, 348.5, 154, 22400, 0, 25047.4, 360933.03, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000064', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0064', 'Rebar fixing labor', 'm2', 20.62, 732.45, 261, 0, 0, 0, 993.45, 20484.94, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000065', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0065', 'Rebar inspection hold points', 'm2', 13.66, 3714.9, 323, 0, 0, 0, 4037.9, 55157.71, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000066', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0066', 'Rebar bending schedule prep', 'm2', 5.8, 2640, 154, 198, 0, 41.03, 3033.03, 17591.57, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000067', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0067', 'Rebar mesh sheets', 'm2', 1.66, 69.72, 451.5, 0, 0, 0, 521.22, 865.23, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000068', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0068', 'Rebar U-bars', 'm2', 4.71, 161.16, 344, 0, 0, 0, 505.16, 2379.3, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000069', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0069', 'Rebar cranking', 'm2', 17.82, 851.2, 58.5, 132, 0, 0, 1041.7, 18563.09, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000070', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0070', 'Rebar seismic detailing', 'm2', 9.98, 6262.2, 324, 0, 22200, 0, 28786.2, 287286.28, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000071', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0071', 'Rebar column cage', 'm2', 15.59, 1388.4, 391, 0, 0, 0, 1779.4, 27740.85, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000072', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0072', 'Rebar beam cage', 'm2', 21.25, 110.88, 297.5, 72, 0, 0, 480.38, 10208.08, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000073', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0073', 'Rebar slab mesh top', 'm2', 14.05, 1062.5, 72, 0, 0, 0, 1134.5, 15939.73, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000074', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0074', 'Rebar slab mesh bottom', 'm2', 6.94, 1530, 332.5, 0, 0, 0, 1862.5, 12925.75, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000075', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0075', 'Rebar chair plastic', 'm2', 18.5, 61.24, 462, 132, 0, 0, 655.24, 12121.94, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000076', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0076', 'Rebar tying wire', 'm', 5.66, 900, 294, 0, 0, 0, 1194, 6758.04, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000077', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0077', 'Rebar cutting disc', 'm2', 25.53, 8496, 168, 0, 11000, 69.05, 19733.05, 503784.77, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000078', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0078', 'Rebar bending machine', 'm2', 15.56, 1042750, 221, 234, 0, 0, 1043205, 16232269.8, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000079', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0079', 'Rebar storage racks', 'm2', 10.15, 1174.8, 228, 0, 0, 0, 1402.8, 14238.42, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000080', v_project_id, 'e1b11111-1111-4111-a111-000000000004', 'MWB-0080', 'Rebar mill certificate', 'm2', 15.65, 158.6, 241.5, 0, 0, 0, 400.1, 6261.57, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000081', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0081', 'Plywood formwork slab soffit', 'm2', 14.64, 855.5, 331.5, 88, 0, 0, 1275, 18666, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000082', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0082', 'Plywood formwork beam sides', 'm2', 13.74, 1369.5, 252, 0, 0, 0, 1621.5, 22279.41, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000083', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0083', 'Plywood formwork column', 'm2', 4.73, 65.52, 171, 0, 0, 0, 236.52, 1118.74, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000084', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0084', 'Phenolic formwork wall', 'm2', 7.45, 84.32, 297, 126, 49500, 0, 50007.32, 372554.53, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000085', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0085', 'Timber formwork footing', 'm2', 14.69, 907.2, 346.5, 0, 0, 0, 1253.7, 18416.85, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000086', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0086', 'Formwork oil application', 'm2', 3.82, 7182, 304, 0, 0, 0, 7486, 28596.52, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000087', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0087', 'Formwork ties and walers', 'm2', 7.36, 1248, 156, 242, 0, 0, 1646, 12114.56, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000088', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0088', 'Formwork stripping and cleaning', 'm2', 8.85, 32.64, 408, 0, 0, 98.91, 539.55, 4775.02, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000089', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0089', 'Aluminum formwork panel', 'm2', 18.73, 960.5, 115, 0, 0, 0, 1075.5, 20144.12, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000090', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0090', 'Formwork bracing and shoring', 'm2', 9.97, 1420.86, 263.5, 198, 0, 0, 1882.36, 18767.13, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000091', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0091', 'Formwork chamfer strips', 'm2', 4.58, 180, 270, 0, 3300, 0, 3750, 17175, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000092', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0092', 'Formwork release agent', 'm2', 4.11, 3175, 190, 0, 0, 0, 3365, 13830.15, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000093', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0093', 'Formwork repair plywood', 'm2', 12.92, 12384, 220, 66, 0, 0, 12670, 163696.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000094', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0094', 'Formwork leveling wedges', 'm2', 1.85, 1149450, 94.5, 0, 0, 0, 1149544.5, 2126657.33, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000095', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0095', 'Formwork soldier piles', 'm2', 3.23, 635.46, 128, 0, 0, 0, 763.46, 2465.98, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000096', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0096', 'Formwork jump system', 'm2', 7.14, 527.25, 52, 216, 0, 0, 795.25, 5678.09, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000097', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0097', 'Formwork climbing platform', 'm2', 24.52, 2697, 468, 0, 0, 0, 3165, 77605.8, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000098', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0098', 'Formwork tie rod', 'm2', 20.44, 2112, 483, 0, 22400, 0, 24995, 510897.8, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000099', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0099', 'Formwork cone plug', 'm2', 11.34, 28.56, 93.5, 154, 0, 47.95, 324.01, 3674.27, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000100', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0100', 'Formwork beam clamp', 'm2', 11.49, 129.95, 90, 0, 0, 0, 219.95, 2527.23, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('e1c11111-1111-4111-a111-000000000101', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0101', 'Formwork prop steel', 'm2', 9.51, 323.2, 142.5, 0, 0, 0, 465.7, 4428.81, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000102', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0102', 'Formwork H-beam waler', 'm2', 8.88, 8652, 231, 216, 0, 0, 9099, 80799.12, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000103', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0103', 'Formwork plywood 18mm', 'm2', 9.97, 1346.8, 325.5, 0, 0, 0, 1672.3, 16672.83, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000104', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0104', 'Formwork edge protection', 'm2', 13.93, 68.64, 88, 0, 0, 0, 156.64, 2182, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000105', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0105', 'Formwork inspection', 'm2', 16.22, 669.38, 156, 242, 12950, 0, 14017.38, 227361.9, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000106', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0106', 'Formwork design allowance', 'lot', 15.77, 1346.4, 336, 0, 0, 0, 1682.4, 26531.45, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000107', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0107', 'Formwork rental extension', 'm2', 17.64, 52.56, 460, 0, 0, 0, 512.56, 9041.56, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000108', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0108', 'Formwork transport', 'm2', 19.11, 3100, 340, 198, 0, 0, 3638, 69522.18, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000109', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0109', 'Formwork storage yard', 'm2', 20.43, 10128, 360, 0, 0, 0, 10488, 214269.84, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000110', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0110', 'Formwork carpenter labor', 'm2', 8.19, 1049055, 351.5, 0, 0, 88.48, 1049494.98, 8595363.89, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000111', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0111', 'Formwork helper labor', 'm2', 9.5, 631.9, 220, 44, 0, 0, 895.9, 8511.05, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000112', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0112', 'Formwork nails and screws', 'm2', 6.33, 515.85, 451.5, 0, 17600, 0, 18567.35, 117531.33, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000113', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0113', 'Formwork timber batten', 'm2', 24.83, 2363.5, 176, 0, 0, 0, 2539.5, 63055.79, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000114', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0114', 'Formwork circular column', 'm2', 8.13, 891, 214.5, 234, 0, 0, 1339.5, 10890.14, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000115', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0115', 'Formwork curved slab', 'm2', 16.88, 69.24, 456, 0, 0, 0, 525.24, 8866.05, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000116', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0116', 'Formwork stair soffit', 'm2', 12.41, 133.28, 149.5, 0, 0, 0, 282.78, 3509.3, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000117', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0117', 'Formwork core wall', 'm2', 19.01, 851.2, 340, 110, 0, 0, 1301.2, 24735.81, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000118', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0118', 'Formwork lift shaft', 'm2', 13.83, 5418, 279, 0, 0, 0, 5697, 78789.51, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000119', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0119', 'Formwork curing blanket', 'm2', 19.28, 1320.8, 370.5, 0, 27000, 0, 28691.3, 553168.26, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000120', v_project_id, 'e1b11111-1111-4111-a111-000000000005', 'MWB-0120', 'Formwork night shift premium', 'm2', 21.27, 118.44, 209, 108, 0, 0, 435.44, 9261.81, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000121', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0121', 'Structural steel column W14', 'kg', 24.39, 2040, 231, 0, 0, 63.33, 2334.33, 56934.31, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000122', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0122', 'Structural steel beam W18', 'kg', 13.52, 1727.2, 288, 0, 0, 0, 2015.2, 27245.5, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000123', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0123', 'Steel bracing member', 'm2', 16.56, 103.68, 97.5, 66, 0, 0, 267.18, 4424.5, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000124', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0124', 'Steel base plate 400x400', 'm2', 2.91, 987.5, 372, 0, 0, 0, 1359.5, 3956.15, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000125', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0125', 'Steel anchor bolts M24', 'm2', 15.91, 3628.8, 333.5, 0, 0, 0, 3962.3, 63040.19, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000126', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0126', 'Steel connection plates', 'm2', 18.92, 989400, 178.5, 108, 16500, 0, 1006186.5, 19037048.58, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000127', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0127', 'Steel stair stringer', 'm2', 14.45, 863.3, 243, 0, 0, 0, 1106.3, 15986.03, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000128', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0128', 'Steel handrail', 'm2', 4.17, 729.6, 152, 0, 0, 0, 881.6, 3676.27, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000129', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0129', 'Steel decking composite', 'm2', 17.52, 2363.5, 319, 242, 0, 0, 2924.5, 51237.24, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000130', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0130', 'Steel shear studs', 'm2', 1.82, 4625.78, 220.5, 0, 0, 0, 4846.28, 8820.23, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000131', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0131', 'Steel fireproofing intumescent', 'm2', 15.76, 49.56, 200, 0, 0, 0, 249.56, 3933.07, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000132', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0132', 'Steel primer and paint', 'm2', 13.23, 35.36, 58.5, 72, 0, 30.19, 196.05, 2593.74, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000133', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0133', 'Steel erection labor', 'm2', 22.93, 457.6, 156, 0, 28800, 0, 29413.6, 674453.85, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000134', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0134', 'Steel welding SMAW', 'm2', 14.42, 5796, 230, 0, 0, 0, 6026, 86894.92, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000135', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0135', 'Steel bolted connection', 'm2', 4.97, 1261.26, 136, 154, 0, 0, 1551.26, 7709.76, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000136', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0136', 'Steel grating floor', 'm2', 16.55, 107.52, 180, 0, 0, 0, 287.52, 4758.46, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000137', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0137', 'Steel lintel angle', 'm2', 12.53, 2048.5, 180.5, 0, 0, 0, 2229, 27929.37, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000138', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0138', 'Steel embed plates', 'm2', 15.22, 1720.4, 209, 180, 0, 0, 2109.4, 32105.07, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000139', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0139', 'Steel crane lift allowance', 'lot', 19.58, 190.8, 304.5, 0, 0, 0, 495.3, 9697.97, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000140', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0140', 'Steel shop drawing', 'm2', 3.6, 1535.63, 304, 0, 11100, 0, 12939.63, 46582.67, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000141', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0141', 'Steel fabrication', 'm2', 16.93, 4320, 97.5, 132, 0, 0, 4549.5, 77023.04, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000142', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0142', 'Steel galvanizing', 'm2', 16.4, 1154300, 252, 0, 0, 0, 1154552, 18934652.8, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000143', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0143', 'Steel moment connection', 'm2', 21.04, 1014.6, 368, 0, 0, 53.44, 1436.04, 30214.28, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000144', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0144', 'Steel purlin C-channel', 'm2', 3.22, 741, 221, 234, 0, 0, 1196, 3851.12, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000145', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0145', 'Steel roof truss', 'm2', 26.04, 3212.48, 225, 0, 0, 0, 3437.48, 89511.98, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000146', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0146', 'Steel mezzanine framing', 'm2', 18.2, 1716, 332.5, 0, 0, 0, 2048.5, 37282.7, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000147', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0147', 'Steel equipment support', 'm2', 8.58, 65.94, 374, 132, 26400, 0, 26971.94, 231419.25, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000148', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0148', 'Steel platform', 'm2', 10.38, 53.72, 283.5, 0, 0, 0, 337.22, 3500.34, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000149', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0149', 'Steel cat ladder', 'm2', 7.72, 796.8, 256, 0, 0, 0, 1052.8, 8127.62, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000150', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0150', 'Steel blast cleaning', 'm2', 7.21, 11510.1, 162.5, 162, 0, 0, 11834.6, 85327.47, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('e1c11111-1111-4111-a111-000000000151', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0151', 'Steel touch-up paint', 'm2', 9.96, 343.2, 504, 0, 0, 0, 847.2, 8438.11, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000152', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0152', 'Steel survey and layout', 'm2', 14.68, 28.8, 218.5, 0, 0, 0, 247.3, 3630.36, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000153', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0153', 'Steel temporary bracing', 'm2', 12.77, 663, 246.5, 110, 0, 0, 1019.5, 13019.02, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000154', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0154', 'Steel shims and grouting', 'm3', 8.84, 1774.8, 198, 0, 22500, 83.16, 24555.96, 217074.69, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000155', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0155', 'Steel inspection', 'm2', 18.3, 164.05, 370.5, 0, 0, 0, 534.55, 9782.27, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000156', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0156', 'Steel transport', 'm2', 1.84, 975, 319, 72, 0, 0, 1366, 2513.44, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000157', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0157', 'Steel unloading', 'm2', 18.88, 10992, 168, 0, 0, 0, 11160, 210700.8, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000158', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0158', 'Steel storage', 'm2', 3.95, 1265850, 264, 0, 0, 0, 1266114, 5001150.3, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000159', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0159', 'Steel trial assembly', 'm2', 2.03, 587.4, 247, 242, 0, 0, 1076.4, 2185.09, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000160', v_project_id, 'e1b11111-1111-4111-a111-000000000006', 'MWB-0160', 'Steel warranty documentation', 'm2', 19.66, 427.93, 132, 0, 0, 0, 559.93, 11008.22, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000161', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0161', '150mm CHB wall reinforced', 'm2', 13.23, 3262.5, 333.5, 0, 18150, 0, 21746, 287699.58, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000162', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0162', '100mm CHB partition', 'm2', 2.9, 3267, 229.5, 162, 0, 0, 3658.5, 10609.65, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000163', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0163', '4" CHB infill', 'm2', 9.39, 89.88, 153, 0, 0, 0, 242.88, 2280.64, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000164', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0164', 'Brick veneer wall', 'm2', 16.56, 48.96, 85.5, 0, 0, 0, 134.46, 2226.66, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000165', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0165', 'Glass block wall', 'm2', 12.77, 278.88, 286, 198, 0, 94.55, 857.43, 10949.38, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000166', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0166', 'Masonry grout filling', 'm3', 4.11, 2814, 126, 0, 0, 0, 2940, 12083.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000167', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0167', 'Wall chipping and prep', 'm2', 7.8, 566.8, 320, 0, 0, 0, 886.8, 6917.04, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000168', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0168', 'Masonry lintel', 'm2', 3.41, 104.64, 123.5, 54, 28800, 0, 29082.14, 99170.1, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000169', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0169', 'Control joint sealant', 'm2', 10.27, 1615, 264, 0, 0, 0, 1879, 19297.33, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000170', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0170', 'Masonry cleaning', 'm2', 8.42, 963.9, 460, 0, 0, 0, 1423.9, 11989.24, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000171', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0171', 'CHB pilaster', 'm2', 13.69, 180, 85, 264, 0, 0, 529, 7242.01, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000172', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0172', 'CHB stiffener column', 'm2', 15.34, 1987.5, 315, 0, 0, 0, 2302.5, 35320.35, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000173', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0173', 'Masonry bond beam', 'm2', 7.06, 6192, 180.5, 0, 0, 0, 6372.5, 44989.85, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000174', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0174', 'Masonry wall tie', 'm2', 8.64, 1178550, 418, 180, 0, 0, 1179148, 10187838.72, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000175', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0175', 'Masonry damp proof course', 'm2', 9.46, 2392.32, 147, 0, 14800, 0, 17339.32, 164029.97, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000176', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0176', 'Masonry acoustic wall', 'm2', 7.89, 210.9, 296, 0, 0, 66.69, 573.59, 4525.63, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000177', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0177', 'Masonry fire rating wall', 'm2', 11.01, 2088, 71.5, 132, 0, 0, 2291.5, 25229.42, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000178', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0178', 'Masonry core filling grout', 'm3', 2.99, 1600.5, 432, 0, 0, 0, 2032.5, 6077.18, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000179', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0179', 'Masonry tooling joints', 'm2', 6.71, 39.48, 322, 0, 0, 0, 361.48, 2425.53, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000180', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0180', 'Masonry scaffolding', 'm2', 11.02, 179.21, 136, 252, 0, 0, 567.21, 6250.65, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000181', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0181', 'Masonry mortar mix', 'm2', 24.68, 457.6, 162, 0, 0, 0, 619.6, 15291.73, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000182', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0182', 'Masonry sample panel', 'm2', 16.44, 3864, 342, 0, 22000, 0, 26206, 430826.64, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000183', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0183', 'Masonry testing', 'm2', 3.23, 265.2, 396, 66, 0, 0, 727.2, 2348.86, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000184', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0184', 'Masonry night work', 'm2', 6.33, 113.76, 147, 0, 0, 0, 260.76, 1650.61, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000185', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0185', 'Masonry waste allowance', 'lot', 17.23, 1053.15, 192, 0, 0, 0, 1245.15, 21453.93, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000186', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0186', 'Masonry cutting disc', 'm2', 1.64, 550.8, 273, 198, 0, 0, 1021.8, 1675.75, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000187', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0187', 'Masonry joint raking', 'm2', 10.66, 72, 372, 0, 0, 102.01, 546.01, 5820.47, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000188', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0188', 'Masonry waterproof additive', 'm2', 16.8, 2662.5, 425.5, 0, 0, 0, 3088, 51878.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000189', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0189', 'Masonry expansion joint', 'm2', 26.05, 12624, 102, 44, 9000, 0, 21770, 567108.5, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000190', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0190', 'Masonry corner reinforcement', 'm2', 7.47, 600915, 153, 0, 0, 0, 601068, 4489977.96, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000191', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0191', 'Masonry opening reinforcement', 'm2', 17.17, 1566.4, 285, 0, 0, 0, 1851.4, 31788.54, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000192', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0192', 'Masonry shelf angle', 'm2', 3.14, 495.9, 418, 108, 0, 0, 1021.9, 3208.77, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000193', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0193', 'Masonry veneer ties', 'm2', 8.97, 3726.5, 304.5, 0, 0, 0, 4031, 36158.07, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000194', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0194', 'Masonry weep holes', 'm2', 14.39, 4042.5, 64, 0, 0, 0, 4106.5, 59092.54, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000195', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0195', 'Masonry cleaning acid', 'm2', 14.13, 101.43, 136.5, 264, 0, 0, 501.93, 7092.27, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000196', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0196', 'Masonry protection board', 'm2', 19.4, 149.6, 288, 0, 9900, 0, 10337.6, 200549.44, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000197', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0197', 'Masonry curing', 'm2', 8.58, 217.6, 379.5, 0, 0, 0, 597.1, 5123.12, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000198', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0198', 'Masonry inspection', 'm2', 11.63, 11298, 221, 36, 0, 68.13, 11623.13, 135177, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000199', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0199', 'Masonry as-built survey', 'm2', 18.09, 728, 306, 0, 0, 0, 1034, 18705.06, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000200', v_project_id, 'e1b11111-1111-4111-a111-000000000008', 'MWB-0200', 'Masonry touch-up', 'm2', 2.65, 41.33, 342, 0, 0, 0, 383.33, 1015.82, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('e1c11111-1111-4111-a111-000000000201', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0201', 'Standing seam metal roof', 'm2', 25.79, 1734, 187, 88, 0, 0, 2009, 51812.11, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000202', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0202', 'Roof insulation 50mm', 'm2', 5.44, 625.6, 336, 0, 0, 0, 961.6, 5231.1, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000203', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0203', 'Roof vapor barrier', 'm2', 8.95, 182.16, 232, 0, 28800, 0, 29214.16, 261466.73, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000204', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0204', 'Roof flashing galvanized', 'm2', 4.1, 2400, 214.5, 234, 0, 0, 2848.5, 11678.85, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000205', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0205', 'Roof gutter and downpipe', 'm', 12.62, 9576, 168, 0, 0, 0, 9744, 122969.28, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000206', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0206', 'Roof skylight curb', 'm2', 2.92, 1159150, 184, 0, 0, 0, 1159334, 3385255.28, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000207', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0207', 'Roof walkway pads', 'm2', 3.31, 1308.3, 85, 132, 0, 0, 1525.3, 5048.74, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000208', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0208', 'Roof safety anchor', 'm2', 10.51, 763.8, 126, 0, 0, 0, 889.8, 9351.8, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000209', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0209', 'Roof waterproof membrane', 'm2', 15.1, 1972, 161.5, 0, 0, 79.28, 2212.78, 33412.98, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000210', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0210', 'Roof drain stainless', 'm2', 16.56, 3395.7, 297, 72, 18500, 0, 22264.7, 368703.43, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000211', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0211', 'Roof parapet coping', 'm2', 16.09, 81.06, 262.5, 0, 0, 0, 343.56, 5527.88, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000212', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0212', 'Roof expansion joint cover', 'm2', 15.36, 42.84, 152, 0, 0, 0, 194.84, 2992.74, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000213', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0213', 'Roof sealant lap', 'm2', 9.01, 697.6, 91, 110, 0, 0, 898.6, 8096.39, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000214', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0214', 'Roof ridge cap', 'm2', 4.99, 7392, 348, 0, 0, 0, 7740, 38622.6, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000215', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0215', 'Roof eave trim', 'm2', 1.81, 758.94, 368, 0, 0, 0, 1126.94, 2039.76, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000216', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0216', 'Roof underlayment', 'm2', 4.74, 124.32, 195.5, 54, 0, 0, 373.82, 1771.91, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000217', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0217', 'Roof cricket saddle', 'm2', 20.31, 586.5, 162, 0, 15400, 0, 16148.5, 327976.03, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000218', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0218', 'Roof equipment curb', 'm2', 13.96, 367.2, 237.5, 0, 0, 0, 604.7, 8441.61, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000219', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0219', 'Roof lightning clip', 'm2', 9.03, 106.56, 275, 242, 0, 0, 623.56, 5630.75, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000220', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0220', 'Roof maintenance hatch', 'm2', 12.76, 1168.13, 367.5, 0, 0, 32.26, 1567.89, 20006.28, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000221', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0221', 'Roof fall protection', 'm2', 7.61, 11808, 160, 0, 0, 0, 11968, 91076.48, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000222', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0222', 'Roof insulation taper', 'm2', 19.26, 1003950, 273, 144, 0, 0, 1004367, 19344108.42, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000223', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0223', 'Roof deck metal', 'm2', 19.44, 489.5, 192, 0, 0, 0, 681.5, 13248.36, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000224', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0224', 'Roof fastener concealed', 'm2', 17.7, 532.95, 195.5, 0, 36000, 0, 36728.45, 650093.56, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000225', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0225', 'Roof testing flood', 'm2', 22.25, 2847.08, 280.5, 154, 0, 0, 3281.58, 73015.16, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000226', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0226', 'Roof warranty inspection', 'm2', 9.7, 2161.5, 288, 0, 0, 0, 2449.5, 23760.15, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000227', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0227', 'Roof night seal', 'm2', 7.07, 47.88, 218.5, 0, 0, 0, 266.38, 1883.31, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000228', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0228', 'Roof transport hoist', 'm2', 8.61, 156.4, 319, 72, 0, 0, 547.4, 4713.11, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000229', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0229', 'Roof debris netting', 'm2', 6.38, 803.2, 378, 0, 0, 0, 1181.2, 7536.06, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000230', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0230', 'Roof bird screen', 'm2', 8.87, 6923.7, 144, 0, 0, 0, 7067.7, 62690.5, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000231', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0231', 'Roof overflow scupper', 'm2', 15.31, 1320.8, 123.5, 242, 18150, 86.27, 19922.57, 305014.55, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000232', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0232', 'Roof snow guard N/A', 'm2', 8.89, 79.2, 432, 0, 0, 0, 511.2, 4544.57, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000233', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0233', 'Roof solar mounting prep', 'm2', 8.85, 2031.5, 207, 0, 0, 0, 2238.5, 19810.72, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000234', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0234', 'Roof acoustic layer', 'm2', 17.38, 1502.8, 178.5, 180, 0, 0, 1861.3, 32349.39, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000235', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0235', 'Roof fire barrier', 'm2', 8.27, 175.39, 333, 0, 0, 0, 508.39, 4204.39, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000236', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0236', 'Roof shop drawing', 'm2', 11.16, 1062.5, 247, 0, 0, 0, 1309.5, 14614.02, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000237', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0237', 'Roof mock-up panel', 'm2', 18.58, 2640, 198, 242, 0, 0, 3080, 57226.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000238', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0238', 'Roof cleaning', 'm2', 3.58, 625650, 315, 0, 25600, 0, 651565, 2332602.7, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000239', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0239', 'Roof touch-up paint', 'm2', 4.86, 480.6, 88, 0, 0, 0, 568.6, 2763.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000240', v_project_id, 'e1b11111-1111-4111-a111-000000000009', 'MWB-0240', 'Roof as-built', 'm2', 19.84, 757.1, 175.5, 126, 0, 0, 1058.6, 21002.62, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000241', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0241', 'Gypsum board ceiling 12.5mm', 'm2', 8.39, 2755, 288, 0, 0, 0, 3043, 25530.77, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000242', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0242', 'Mineral fiber acoustic tile', 'm2', 14.83, 3267, 448.5, 0, 0, 44.73, 3760.23, 55764.21, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000243', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0243', 'Metal furring channel', 'm2', 5.95, 23.52, 357, 286, 0, 0, 666.52, 3965.79, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000244', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0244', 'Suspended ceiling T-bar', 'm2', 20.69, 166.6, 108, 0, 0, 0, 274.6, 5681.47, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000245', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0245', 'Ceiling insulation', 'm2', 10.25, 581.28, 313.5, 0, 5550, 0, 6444.78, 66059, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000246', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0246', 'Access panel 600x600', 'm2', 1.47, 8652, 165, 162, 0, 0, 8979, 13199.13, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000247', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0247', 'Cornice moulding', 'm2', 4.7, 941.2, 115.5, 0, 0, 0, 1056.7, 4966.49, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000248', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0248', 'Ceiling painting', 'm2', 13.89, 78.24, 200, 0, 0, 0, 278.24, 3864.75, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000249', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0249', 'Moisture resistant gypsum', 'm2', 12.95, 510, 110.5, 132, 0, 0, 752.5, 9744.88, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000250', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0250', 'Linear LED cove', 'm2', 20.98, 1870.68, 396, 0, 0, 0, 2266.68, 47554.95, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('e1c11111-1111-4111-a111-000000000251', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0251', 'Ceiling seismic clip', 'm2', 5.07, 74.16, 253, 0, 0, 0, 327.16, 1658.7, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000252', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0252', 'Ceiling hanger wire', 'm', 9.02, 662.5, 170, 198, 8800, 0, 9830.5, 88671.11, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000253', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0253', 'Ceiling shadow gap', 'm2', 13.86, 10272, 216, 0, 0, 36.5, 10524.5, 145869.57, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000254', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0254', 'Ceiling bulkhead', 'm2', 16.66, 771150, 104.5, 0, 0, 0, 771254.5, 12849099.97, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000255', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0255', 'Ceiling soffit feature', 'm2', 8.67, 1635.38, 286, 176, 0, 0, 2097.38, 18184.28, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000256', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0256', 'Ceiling acoustic baffle', 'm2', 16.89, 564.3, 105, 0, 0, 0, 669.3, 11304.48, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000257', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0257', 'Ceiling fire rated board', 'm2', 7.23, 2450.5, 264, 0, 0, 0, 2714.5, 19625.84, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000258', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0258', 'Ceiling level survey', 'm2', 10.19, 2211, 156, 162, 0, 0, 2529, 25770.51, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000259', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0259', 'Ceiling joint compound', 'm2', 20.58, 36.96, 312, 0, 13500, 0, 13848.96, 285011.6, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000260', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0260', 'Ceiling mesh tape', 'm2', 13.41, 129.95, 460, 0, 0, 0, 589.95, 7911.23, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000261', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0261', 'Ceiling primer', 'm2', 12.77, 844.8, 365.5, 242, 0, 0, 1452.3, 18545.87, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000262', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0262', 'Ceiling access ladder', 'm2', 3.93, 10668, 234, 0, 0, 0, 10902, 42844.86, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000263', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0263', 'Ceiling MEP coordination', 'm2', 6.79, 483.6, 313.5, 0, 0, 0, 797.1, 5412.31, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000264', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0264', 'Ceiling night work', 'm2', 20.44, 87.36, 242, 90, 0, 81.91, 501.27, 10245.96, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000265', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0265', 'Ceiling protection', 'm2', 20.16, 1151.33, 283.5, 0, 0, 0, 1434.83, 28926.17, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000266', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0266', 'Ceiling repair patch', 'm2', 6.9, 578, 80, 0, 4950, 0, 5608, 38695.2, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000267', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0267', 'Ceiling corner bead', 'm2', 8.45, 182.16, 78, 110, 0, 0, 370.16, 3127.85, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000268', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0268', 'Ceiling control joint', 'm2', 13.71, 1312.5, 264, 0, 0, 0, 1576.5, 21613.82, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000269', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0269', 'Ceiling inspection', 'm2', 9.52, 3552, 172.5, 0, 0, 0, 3724.5, 35457.24, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000270', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0270', 'Ceiling warranty', 'm2', 15.65, 315735, 195.5, 234, 0, 0, 316164.5, 4947974.43, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000271', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0271', 'Ceiling mock-up room', 'm2', 18.46, 1237.1, 378, 0, 0, 0, 1615.1, 29814.75, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000272', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0272', 'Ceiling cleaning', 'm2', 8.33, 664.05, 190, 0, 0, 0, 854.05, 7114.24, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000273', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0273', 'Ceiling touch-up', 'm2', 23.59, 1203.5, 297, 66, 16000, 0, 17566.5, 414393.74, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000274', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0274', 'Ceiling as-built', 'm2', 7.89, 3910.5, 252, 0, 0, 0, 4162.5, 32842.13, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000275', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0275', 'Ceiling debris removal', 'm2', 3.21, 82.47, 128, 0, 0, 79.78, 290.25, 931.7, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000276', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0276', 'Ceiling scaffolding', 'm2', 11.08, 131.24, 123.5, 162, 0, 0, 416.74, 4617.48, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000277', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0277', 'Ceiling transport', 'm2', 23.5, 380.8, 144, 0, 0, 0, 524.8, 12332.8, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000278', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0278', 'Ceiling storage', 'm2', 14.95, 4998, 437, 0, 0, 0, 5435, 81253.25, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000279', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0279', 'Ceiling layout marking', 'm2', 16.57, 1185.6, 195.5, 154, 0, 0, 1535.1, 25436.61, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000280', v_project_id, 'e1b11111-1111-4111-a111-000000000010', 'MWB-0280', 'Ceiling final acceptance', 'm2', 3.82, 122.47, 297, 0, 7400, 0, 7819.47, 29870.38, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000281', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0281', 'Solid core wood door 900x2100', 'pc', 16.56, 1045.5, 294.5, 0, 0, 0, 1340, 22190.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000282', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0282', 'Hollow metal door fire rated', 'pc', 1.41, 1638.8, 154, 126, 0, 0, 1918.8, 2705.51, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000283', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0283', 'Aluminum glazed door', 'pc', 4.86, 108.72, 199.5, 0, 0, 0, 308.22, 1497.95, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000284', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0284', 'Door frame steel', 'm2', 3.89, 2962.5, 336, 0, 0, 0, 3298.5, 12831.17, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000285', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0285', 'Door hardware set passage', 'm2', 15.97, 5594.4, 130, 154, 0, 0, 5878.4, 93878.05, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000286', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0286', 'Door closer hydraulic', 'm2', 7.7, 1183400, 156, 0, 0, 46.69, 1183602.69, 9113740.71, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000287', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0287', 'Door vision panel', 'm2', 11.17, 1023.5, 425.5, 0, 26400, 0, 27849, 311073.33, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000288', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0288', 'Door access control prep', 'm2', 20.14, 575.7, 110.5, 144, 0, 0, 830.2, 16720.23, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000289', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0289', 'Door weather stripping', 'm2', 8.84, 2305.5, 270, 0, 0, 0, 2575.5, 22767.42, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000290', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0290', 'Door threshold', 'm2', 4.9, 2772, 180.5, 0, 0, 0, 2952.5, 14467.25, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000291', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0291', 'Door kick plate', 'm2', 12.88, 99.12, 121, 44, 0, 0, 264.12, 3401.87, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000292', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0292', 'Door stop floor mount', 'm2', 21, 78.2, 399, 0, 0, 0, 477.2, 10021.2, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000293', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0293', 'Door coordinator', 'm2', 18.81, 537.6, 120, 0, 0, 0, 657.6, 12369.46, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000294', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0294', 'Door panic hardware', 'm2', 7.02, 4158, 84.5, 234, 36000, 0, 40476.5, 284145.03, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000295', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0295', 'Door smoke seal', 'm2', 9.23, 1386.84, 300, 0, 0, 0, 1686.84, 15569.53, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000296', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0296', 'Door acoustic seal', 'm2', 19.31, 99.36, 126.5, 0, 0, 0, 225.86, 4361.36, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000297', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0297', 'Door vision lite kit', 'm2', 25.27, 1402.5, 68, 220, 0, 104.02, 1794.52, 45347.52, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000298', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0298', 'Door installation labor', 'm2', 10.3, 1462, 270, 0, 0, 0, 1732, 17839.6, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000299', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0299', 'Door protection film', 'm2', 13.86, 150.48, 190, 0, 0, 0, 340.48, 4719.05, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000300', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0300', 'Door adjustment', 'm2', 19.76, 774.38, 396, 180, 0, 0, 1350.38, 26683.51, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('e1c11111-1111-4111-a111-000000000301', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0301', 'Door testing', 'm2', 17.85, 3072, 241.5, 0, 6600, 0, 9913.5, 176955.98, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000302', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0302', 'Door warranty', 'm2', 13.15, 1236750, 320, 0, 0, 0, 1237070, 16267470.5, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000303', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0303', 'Door shop drawing', 'm2', 17.65, 1708.8, 65, 44, 0, 0, 1817.8, 32084.17, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000304', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0304', 'Door mock-up', 'm2', 10.92, 615.6, 456, 0, 0, 0, 1071.6, 11701.87, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000305', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0305', 'Door transport', 'm2', 22.64, 2557.8, 391, 0, 0, 0, 2948.8, 66760.83, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000306', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0306', 'Door storage', 'm2', 5.63, 1831.5, 340, 180, 0, 0, 2351.5, 13238.95, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000307', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0307', 'Door frame grouting', 'm3', 15.92, 80.64, 144, 0, 0, 0, 224.64, 3576.27, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000308', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0308', 'Door hinge heavy duty', 'm2', 17.56, 131.92, 123.5, 0, 35200, 65.25, 35520.67, 623742.97, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000309', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0309', 'Door lockset cylindrical', 'm2', 14.51, 857.6, 440, 264, 0, 0, 1561.6, 22658.82, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000310', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0310', 'Door master keying', 'm2', 13.54, 6703.2, 210, 0, 0, 0, 6913.2, 93604.73, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000311', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0311', 'Door signage prep', 'm2', 17.05, 1378, 64, 0, 0, 0, 1442, 24586.1, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000312', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0312', 'Door astragal', 'm2', 11.61, 74.88, 169, 90, 0, 0, 333.88, 3876.35, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000313', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0313', 'Door astragal meeting', 'm2', 17.65, 1946.5, 348, 0, 0, 0, 2294.5, 40497.92, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000314', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0314', 'Door louvers', 'm2', 14.87, 1604.8, 299, 0, 0, 0, 1903.8, 28309.51, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000315', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0315', 'Door vision frame', 'm2', 5.72, 144.4, 263.5, 110, 16650, 0, 17167.9, 98200.39, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000316', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0316', 'Door silencer', 'm2', 17.04, 1175, 360, 0, 0, 0, 1535, 26156.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000317', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0317', 'Door bumper', 'm2', 14.56, 11088, 237.5, 0, 0, 0, 11325.5, 164899.28, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000318', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0318', 'Door coordinator overhead', 'm2', 11.04, 441350, 220, 54, 0, 0, 441624, 4875528.96, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000319', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0319', 'Door hold open', 'm2', 11.19, 489.5, 409.5, 0, 0, 69.49, 968.49, 10837.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000320', v_project_id, 'e1b11111-1111-4111-a111-000000000011', 'MWB-0320', 'Door final QC', 'm2', 5.59, 577.55, 96, 0, 0, 0, 673.55, 3765.14, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000321', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0321', 'Aluminum window fixed 1200x1500', 'pc', 23.26, 1783.5, 156, 264, 0, 0, 2203.5, 51253.41, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000322', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0322', 'Aluminum window sliding', 'pc', 8.48, 2409, 396, 0, 8800, 0, 11605, 98410.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000323', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0323', 'Curtain wall mullion', 'm2', 18.24, 24.78, 276, 0, 0, 0, 300.78, 5486.23, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000324', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0324', 'Glazing tempered 12mm', 'm2', 10.86, 129.88, 85, 198, 0, 0, 412.88, 4483.88, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000325', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0325', 'Window sealant structural', 'm2', 19.46, 248.64, 189, 0, 0, 0, 437.64, 8516.47, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000326', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0326', 'Window flashing membrane', 'm2', 2.32, 6258, 285, 0, 0, 0, 6543, 15179.76, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000327', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0327', 'Window sill stone', 'm2', 5.45, 977.6, 440, 132, 0, 0, 1549.6, 8445.32, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000328', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0328', 'Window insect screen', 'm2', 2.46, 129.12, 178.5, 0, 0, 0, 307.62, 756.75, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000329', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0329', 'Window safety restrictor', 'm2', 25, 603.5, 336, 0, 54000, 0, 54939.5, 1373487.5, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000330', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0330', 'Window testing water', 'm2', 12.48, 785.4, 279.5, 216, 0, 41.55, 1322.45, 16504.18, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000331', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0331', 'Window testing air', 'm2', 7.38, 85.68, 312, 0, 0, 0, 397.68, 2934.88, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000332', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0332', 'Window thermal break', 'm2', 3.62, 2287.5, 471.5, 0, 0, 0, 2759, 9987.58, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000333', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0333', 'Window powder coat finish', 'm2', 9.88, 3984, 161.5, 198, 0, 0, 4343.5, 42913.78, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000334', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0334', 'Window installation labor', 'm2', 10.87, 310400, 189, 0, 0, 0, 310589, 3376102.43, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000335', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0335', 'Window protection board', 'm2', 8.91, 1523.24, 161.5, 0, 0, 0, 1684.74, 15011.03, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000336', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0336', 'Window cleaning access', 'm2', 14.57, 253.65, 308, 144, 11550, 0, 12255.65, 178564.82, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000337', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0337', 'Window shop drawing', 'm2', 6.59, 2334.5, 94.5, 0, 0, 0, 2429, 16007.11, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000338', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0338', 'Window mock-up', 'm2', 17.02, 4141.5, 80, 0, 0, 0, 4221.5, 71849.93, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000339', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0339', 'Window transport', 'm2', 20.74, 90.72, 162.5, 110, 0, 0, 363.22, 7533.18, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000340', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0340', 'Window storage', 'm2', 19.37, 128.52, 300, 0, 0, 0, 428.52, 8300.43, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000341', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0341', 'Window anchor bracket', 'm2', 13.38, 752, 391, 0, 0, 95.97, 1238.97, 16577.42, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000342', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0342', 'Window setting blocks', 'm2', 19.11, 8106, 102, 180, 0, 0, 8388, 160294.68, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000343', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0343', 'Window backer rod', 'm2', 10.04, 733.2, 81, 0, 25600, 0, 26414.2, 265198.57, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000344', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0344', 'Window cap flashing', 'm2', 18.82, 72.48, 133, 0, 0, 0, 205.48, 3867.13, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000345', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0345', 'Window head flashing', 'm2', 20.65, 1856.4, 165, 286, 0, 0, 2307.4, 47647.81, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000346', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0346', 'Window jamb flashing', 'm2', 1.95, 1421.2, 336, 0, 0, 0, 1757.2, 3426.54, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000347', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0347', 'Window sill flashing', 'm2', 13.16, 177.84, 232, 0, 0, 0, 409.84, 5393.49, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000348', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0348', 'Window acoustic laminate', 'm2', 6.98, 3100, 58.5, 90, 0, 0, 3248.5, 22674.53, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000349', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0349', 'Window low-E coating', 'm2', 15.79, 4464, 432, 0, 0, 0, 4896, 77307.84, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000350', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0350', 'Window warranty', 'm2', 8.55, 901372.5, 115, 0, 14800, 0, 916287.5, 7834258.13, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('e1c11111-1111-4111-a111-000000000351', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0351', 'Window night seal', 'm2', 5.21, 2278.4, 76.5, 154, 0, 0, 2508.9, 13071.37, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000352', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0352', 'Window debris removal', 'm2', 15.63, 182.4, 144, 0, 0, 74.23, 400.63, 6261.85, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000353', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0353', 'Window inspection', 'm2', 25.4, 3349.5, 152, 0, 0, 0, 3501.5, 88938.1, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000354', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0354', 'Window touch-up', 'm2', 2.12, 1287, 385, 216, 0, 0, 1888, 4002.56, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000355', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0355', 'Window as-built', 'm2', 5.95, 73.21, 283.5, 0, 0, 0, 356.71, 2122.42, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000356', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0356', 'Window spare glass', 'm2', 3.82, 36.72, 280, 0, 0, 0, 316.72, 1209.87, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000357', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0357', 'Window crane lift', 'm2', 11.57, 806.4, 97.5, 198, 6600, 0, 7701.9, 89110.98, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000358', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0358', 'Window scaffold access', 'm2', 21.13, 3990, 348, 0, 0, 0, 4338, 91661.94, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000359', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0359', 'Window final acceptance', 'm2', 14.82, 748.8, 483, 0, 0, 0, 1231.8, 18255.28, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000360', v_project_id, 'e1b11111-1111-4111-a111-000000000012', 'MWB-0360', 'Window O&M manual', 'm2', 2.89, 64.51, 102, 180, 0, 0, 346.51, 1001.41, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000361', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0361', 'Interior latex paint 2 coats', 'm2', 25.72, 1156, 351, 0, 0, 0, 1507, 38760.04, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000362', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0362', 'Exterior elastomeric paint', 'm2', 1.63, 1625.2, 256.5, 0, 0, 0, 1881.7, 3067.17, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000363', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0363', 'Epoxy floor paint', 'm2', 18.16, 110.88, 341, 132, 0, 89.19, 673.07, 12222.95, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000364', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0364', 'Enamel paint on steel', 'm2', 20.79, 900, 346.5, 0, 54000, 0, 55246.5, 1148574.73, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000365', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0365', 'Primer coat masonry', 'm2', 12.49, 7509.6, 88, 0, 0, 0, 7597.6, 94894.02, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000366', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0366', 'Wood stain and varnish', 'm2', 6.28, 368600, 52, 144, 0, 0, 368796, 2316038.88, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000367', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0367', 'Traffic marking paint', 'm2', 17.13, 729.8, 204, 0, 0, 0, 933.8, 15995.99, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000368', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0368', 'Anti-mould paint bathroom', 'm2', 10.17, 256.5, 414, 0, 0, 0, 670.5, 6818.99, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000369', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0369', 'Paint surface preparation', 'm2', 19.25, 1551.5, 255, 198, 0, 0, 2004.5, 38586.63, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000370', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0370', 'Signage painting', 'm2', 3.57, 3776.85, 261, 0, 0, 0, 4037.85, 14415.12, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000371', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0371', 'Fire retardant paint', 'm2', 18.67, 43.68, 95, 0, 19800, 0, 19938.68, 372255.16, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000372', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0372', 'Intumescent paint steel', 'm2', 13.54, 80.24, 154, 72, 0, 0, 306.24, 4146.49, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000373', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0373', 'PU floor coating', 'm2', 9.99, 569.6, 451.5, 0, 0, 0, 1021.1, 10200.79, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000374', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0374', 'Anti-carbonation coating', 'm2', 13.62, 3948, 176, 0, 0, 89.39, 4213.39, 57386.37, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000375', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0375', 'Paint roller and brush', 'm2', 1.59, 748.02, 253.5, 66, 0, 0, 1067.52, 1697.36, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000376', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0376', 'Paint masking protection', 'm2', 19.97, 99.84, 480, 0, 0, 0, 579.84, 11579.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000377', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0377', 'Paint scaffolding', 'm2', 6.41, 1394, 149.5, 0, 0, 0, 1543.5, 9893.84, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000378', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0378', 'Paint night premium', 'm2', 11.88, 1604.8, 280.5, 36, 12800, 0, 14721.3, 174889.04, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000379', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0379', 'Paint touch-up kit', 'm2', 12.95, 179.28, 216, 0, 0, 0, 395.28, 5118.88, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000380', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0380', 'Paint color sample', 'm2', 17.29, 3491.25, 247, 0, 0, 0, 3738.25, 64634.34, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000381', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0381', 'Paint warranty', 'm2', 23.62, 4416, 451, 66, 0, 0, 4933, 116517.46, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000382', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0382', 'Paint inspection', 'm2', 16.96, 557750, 136.5, 0, 0, 0, 557886.5, 9461755.04, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000383', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0383', 'Paint cleaning solvent', 'm2', 12.46, 1993.6, 128, 0, 0, 0, 2121.6, 26435.14, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000384', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0384', 'Paint thinning allowance', 'lot', 12.49, 701.1, 175.5, 162, 0, 0, 1038.6, 12972.11, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000385', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0385', 'Paint spray machine', 'm2', 10.36, 3516.98, 432, 0, 11100, 29.7, 15078.68, 156215.12, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000386', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0386', 'Paint compressor', 'm2', 14.38, 3036, 356.5, 0, 0, 0, 3392.5, 48784.15, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000387', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0387', 'Paint waste disposal', 'm2', 16.69, 53.34, 255, 264, 0, 0, 572.34, 9552.35, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000388', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0388', 'Paint safety PPE', 'm2', 21.17, 80.24, 288, 0, 0, 0, 368.24, 7795.64, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000389', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0389', 'Paint humidity control', 'm2', 20.21, 387.2, 294.5, 0, 0, 0, 681.7, 13777.16, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000390', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0390', 'Paint curing time', 'm2', 6.77, 9922.5, 473, 180, 0, 0, 10575.5, 71596.13, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000391', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0391', 'Paint stripe marking', 'm2', 7.6, 1258.4, 336, 0, 0, 0, 1594.4, 12117.44, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000392', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0392', 'Paint stencil numbering', 'm2', 20.61, 54.24, 64, 0, 15400, 0, 15518.24, 319830.93, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000393', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0393', 'Paint final QC', 'm2', 18.64, 2031.5, 182, 308, 0, 0, 2521.5, 47000.76, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000394', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0394', 'Paint as-built', 'm2', 14.69, 374, 336, 0, 0, 0, 710, 10429.9, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000395', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0395', 'Paint debris removal', 'm2', 4.35, 42.34, 195.5, 0, 0, 0, 237.84, 1034.6, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000396', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0396', 'Paint transport', 'm2', 18.64, 700, 255, 234, 0, 34.15, 1223.15, 22799.52, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000397', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0397', 'Paint storage', 'm2', 9.09, 2880, 117, 0, 0, 0, 2997, 27242.73, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000398', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0398', 'Paint mock-up panel', 'm2', 2.95, 1236750, 114, 0, 0, 0, 1236864, 3648748.8, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000399', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0399', 'Paint adhesion test', 'm2', 2.7, 1388.4, 110, 176, 18000, 0, 19674.4, 53120.88, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000400', v_project_id, 'e1b11111-1111-4111-a111-000000000013', 'MWB-0400', 'Paint dry film gauge', 'm2', 18.91, 727.18, 388.5, 0, 0, 0, 1115.68, 21097.51, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('e1c11111-1111-4111-a111-000000000401', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0401', 'PVC pipe 4" SDR series', 'm', 21.68, 2436, 248, 0, 0, 0, 2684, 58189.12, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000402', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0402', 'PVC pipe 2" water line', 'm', 18.42, 3778.5, 182, 252, 0, 0, 4212.5, 77594.25, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000403', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0403', 'Copper pipe 3/4" hot water', 'm', 20.47, 88.62, 324, 0, 0, 0, 412.62, 8446.33, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000404', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0404', 'Floor drain stainless 4"', 'm2', 17.75, 70.72, 287.5, 0, 0, 0, 358.22, 6358.41, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000405', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0405', 'Water closet complete set', 'm2', 16.62, 483.84, 127.5, 198, 0, 0, 809.34, 13451.23, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000406', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0406', 'Lavatory with faucet', 'm2', 7.03, 6384, 108, 0, 4950, 0, 11442, 80437.26, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000407', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0407', 'Shower set thermostatic', 'm2', 5.62, 306.8, 85.5, 0, 0, 34.07, 426.37, 2396.2, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000408', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0408', 'Gate valve bronze 2"', 'm2', 8.32, 47.52, 462, 180, 0, 0, 689.52, 5736.81, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000409', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0409', 'Water heater 50L', 'm2', 23.23, 926.5, 189, 0, 0, 0, 1115.5, 25913.07, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000410', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0410', 'Septic tank connection', 'm2', 19.64, 621.18, 80, 0, 0, 0, 701.18, 13771.18, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000411', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0411', 'Grease interceptor', 'm2', 13.59, 54.72, 149.5, 242, 0, 0, 446.22, 6064.13, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000412', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0412', 'Water meter assembly', 'm2', 3.07, 3025, 144, 0, 0, 0, 3169, 9728.83, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000413', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0413', 'PRV station', 'm2', 11.98, 9072, 241.5, 0, 35200, 0, 44513.5, 533271.73, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000414', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0414', 'Pipe insulation 25mm', 'm2', 10.62, 921500, 119, 72, 0, 0, 921691, 9788358.42, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000415', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0415', 'Pipe hanger support', 'm2', 11.04, 1429.79, 324, 0, 0, 0, 1753.79, 19361.84, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000416', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0416', 'Pipe pressure testing', 'm2', 8.86, 379.05, 190, 0, 0, 0, 569.05, 5041.78, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000417', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0417', 'Pipe disinfection', 'm2', 25.49, 3378.5, 121, 242, 0, 0, 3741.5, 95370.84, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000418', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0418', 'Pipe trenching allowance', 'lot', 18.29, 4455, 399, 0, 0, 64.34, 4918.34, 89956.44, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000419', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0419', 'Pipe core drilling', 'm2', 11.86, 33.6, 160, 0, 0, 0, 193.6, 2296.1, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000420', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0420', 'Pipe sleeve fire stop', 'm2', 4.27, 156.37, 104, 216, 22200, 0, 22676.37, 96828.1, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000421', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0421', 'Pipe identification label', 'm2', 25.34, 361.6, 336, 0, 0, 0, 697.6, 17677.18, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000422', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0422', 'Pipe access panel', 'm2', 19.02, 8400, 310.5, 0, 0, 0, 8710.5, 165673.71, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000423', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0423', 'Pipe cleanout', 'm2', 3.2, 525.2, 340, 286, 0, 0, 1151.2, 3683.84, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000424', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0424', 'Pipe vent stack', 'm2', 11.26, 80.16, 243, 0, 0, 0, 323.16, 3638.78, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000425', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0425', 'Pipe storm drain', 'm2', 20.38, 1909.95, 399, 0, 0, 0, 2308.95, 47056.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000426', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0426', 'Pipe sump pump', 'm2', 2.62, 1067.6, 341, 198, 0, 0, 1606.6, 4209.29, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000427', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0427', 'Pipe backflow preventer', 'm2', 10.92, 89.28, 273, 0, 4400, 0, 4762.28, 52004.1, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000428', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0428', 'Pipe expansion loop', 'm2', 19.02, 637.5, 320, 0, 0, 0, 957.5, 18211.65, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000429', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0429', 'Pipe seismic brace', 'm2', 11.98, 2976, 240.5, 198, 0, 80.86, 3495.36, 41874.41, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000430', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0430', 'Pipe commissioning', 'm2', 2.07, 264810, 360, 0, 0, 0, 265170, 548901.9, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000431', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0431', 'Pipe O&M manual', 'm2', 6.93, 1450.7, 391, 0, 0, 0, 1841.7, 12762.98, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000432', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0432', 'Pipe warranty', 'm2', 19.73, 473.1, 102, 234, 0, 0, 809.1, 15963.54, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000433', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0433', 'Pipe night work', 'm2', 8.01, 3161, 99, 0, 0, 0, 3260, 26112.6, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000434', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0434', 'Pipe protection', 'm2', 14.11, 1683, 228, 0, 13500, 0, 15411, 217449.21, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000435', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0435', 'Pipe touch-up', 'm2', 2.09, 26.46, 132, 198, 0, 0, 356.46, 745, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000436', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0436', 'Pipe inspection', 'm2', 3.44, 95.88, 157.5, 0, 0, 0, 253.38, 871.63, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000437', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0437', 'Pipe as-built', 'm2', 10.53, 697.6, 312, 0, 0, 0, 1009.6, 10631.09, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000438', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0438', 'Pipe debris removal', 'm2', 12.27, 7518, 52, 54, 0, 0, 7624, 93546.48, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000439', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0439', 'Pipe transport', 'm2', 15.84, 728, 432, 0, 0, 0, 1160, 18374.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000440', v_project_id, 'e1b11111-1111-4111-a111-000000000015', 'MWB-0440', 'Pipe storage', 'm2', 1.57, 130.03, 207, 0, 0, 33.13, 370.16, 581.15, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000441', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0441', 'Sprinkler head upright', 'pc', 13.01, 2227, 187, 264, 8250, 0, 10928, 142173.28, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000442', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0442', 'Fire hose cabinet', 'm2', 9.84, 1598, 288, 0, 0, 0, 1886, 18558.24, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000443', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0443', 'Wet riser pipe 65mm', 'm', 15.9, 73.44, 256.5, 0, 0, 0, 329.94, 5246.05, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000444', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0444', 'Fire pump electric 750GPM', 'm2', 11.65, 1712.5, 385, 72, 0, 0, 2169.5, 25274.68, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000445', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0445', 'Fire alarm smoke detector', 'm2', 12.63, 4788, 147, 0, 0, 0, 4935, 62329.05, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000446', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0446', 'Fire alarm manual pull', 'm2', 12.04, 412250, 80, 0, 0, 0, 412330, 4964453.2, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000447', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0447', 'Fire extinguisher 10lbs ABC', 'm2', 2.18, 1388.4, 117, 264, 0, 0, 1769.4, 3857.29, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000448', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0448', 'Fire door 90min rated', 'pc', 7.26, 646.95, 216, 0, 22400, 0, 23262.95, 168889.02, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000449', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0449', 'FM200 suppression head', 'm2', 20.6, 3741, 333.5, 0, 0, 0, 4074.5, 83934.7, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000450', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0450', 'Fire protection testing', 'm2', 14.84, 2304.23, 144.5, 126, 0, 0, 2574.73, 38208.99, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('e1c11111-1111-4111-a111-000000000451', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0451', 'Fire jockey pump', 'm2', 3.03, 49.98, 306, 0, 0, 60.93, 416.91, 1263.24, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000452', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0452', 'Fire control panel', 'm2', 15.42, 165.92, 256.5, 0, 0, 0, 422.42, 6513.72, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000453', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0453', 'Fire strobe horn', 'm2', 12.42, 172.8, 341, 132, 0, 0, 645.8, 8020.84, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000454', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0454', 'Fire damper', 'm2', 17.8, 6006, 451.5, 0, 0, 0, 6457.5, 114943.5, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000455', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0455', 'Fire stopping penetration', 'm2', 14.83, 660.66, 192, 0, 11100, 0, 11952.66, 177257.95, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000456', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0456', 'Fire hydrant valve', 'm2', 6.54, 106.08, 130, 126, 0, 0, 362.08, 2368, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000457', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0457', 'Fire department connection', 'm2', 19.68, 731, 456, 0, 0, 0, 1187, 23360.16, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000458', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0458', 'Fire flow test', 'm2', 16.56, 1761.2, 345, 0, 0, 0, 2106.2, 34878.67, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000459', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0459', 'Fire commissioning', 'm2', 5.58, 92.16, 153, 176, 0, 0, 421.16, 2350.07, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000460', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0460', 'Fire O&M manual', 'm2', 4.07, 2336.25, 252, 0, 0, 0, 2588.25, 10534.18, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000461', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0461', 'Fire warranty', 'm2', 14.5, 12000, 275.5, 0, 0, 0, 12275.5, 177994.75, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000462', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0462', 'Fire night work', 'm2', 8.05, 853600, 275, 180, 8800, 64.79, 862919.79, 6946504.31, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000463', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0463', 'Fire protection shop drawing', 'm2', 8.98, 2153.8, 94.5, 0, 0, 0, 2248.3, 20189.73, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000464', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0464', 'Fire mock-up test', 'm2', 18.14, 695.4, 112, 0, 0, 0, 807.4, 14646.24, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000465', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0465', 'Fire pipe hanger seismic', 'm', 21.8, 2801.4, 208, 286, 0, 0, 3295.4, 71839.72, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000466', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0466', 'Fire valve supervisory switch', 'm2', 15.86, 2640, 132, 0, 0, 0, 2772, 43963.92, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000467', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0467', 'Fire flow switch', 'm2', 13.83, 103.74, 299, 0, 0, 0, 402.74, 5569.89, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000468', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0468', 'Fire tamper switch', 'm2', 3.96, 116.28, 85, 144, 0, 0, 345.28, 1367.31, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000469', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0469', 'Fire inspection', 'm2', 10.58, 860.8, 342, 0, 36000, 0, 37202.8, 393605.62, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000470', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0470', 'Fire as-built', 'm2', 16.04, 2513.7, 199.5, 0, 0, 0, 2713.2, 43519.73, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000471', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0471', 'Fire debris removal', 'm2', 9.2, 483.6, 440, 242, 0, 0, 1165.6, 10723.52, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000472', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0472', 'Fire transport', 'm2', 8.46, 62.88, 304.5, 0, 0, 0, 367.38, 3108.03, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000473', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0473', 'Fire storage', 'm2', 17.8, 1479, 328, 0, 0, 61.66, 1868.66, 33262.15, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000474', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0474', 'Fire touch-up paint', 'm2', 7.69, 1475.6, 234, 54, 0, 0, 1763.6, 13562.08, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000475', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0475', 'Fire identification', 'm2', 18.12, 86.94, 480, 0, 0, 0, 566.94, 10272.95, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000476', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0476', 'Fire training handover', 'm2', 15.39, 1350, 276, 0, 6600, 0, 8226, 126598.14, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000477', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0477', 'Fire spare heads', 'm2', 8.23, 2976, 221, 198, 0, 0, 3395, 27940.85, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000478', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0478', 'Fire spare fuses', 'm2', 6.59, 712950, 81, 0, 0, 0, 713031, 4698874.29, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000479', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0479', 'Fire final acceptance', 'm2', 2.75, 1254.9, 256.5, 0, 0, 0, 1511.4, 4156.35, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000480', v_project_id, 'e1b11111-1111-4111-a111-000000000016', 'MWB-0480', 'Fire authority witness', 'm2', 10.01, 697.25, 253, 198, 0, 0, 1148.25, 11493.98, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000481', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0481', 'THHN wire 3.5mm2', 'm', 17.64, 1290.5, 378, 0, 0, 0, 1668.5, 29432.34, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000482', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0482', 'THHN wire 5.5mm2', 'm', 12.38, 3679.5, 240, 0, 0, 0, 3919.5, 48523.41, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000483', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0483', 'PVC conduit 25mm', 'm', 6.12, 22.26, 71.5, 198, 35200, 0, 35491.76, 217209.57, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000484', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0484', 'Panel board 42 circuits', 'm2', 16.74, 70.72, 204, 0, 0, 52.45, 327.17, 5476.83, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000485', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0485', 'Circuit breaker 20A', 'm2', 19.39, 561.12, 287.5, 0, 0, 0, 848.62, 16454.74, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000486', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0486', 'LED downlight 12W', 'm2', 5.22, 8820, 246.5, 72, 0, 0, 9138.5, 47702.97, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000487', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0487', 'Convenience outlet duplex', 'm2', 15.41, 681.2, 90, 0, 0, 0, 771.2, 11884.19, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000488', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0488', 'Grounding rod copper', 'm2', 20.43, 66.24, 180.5, 0, 0, 0, 246.74, 5040.9, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000489', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0489', 'Cable tray 300mm', 'm2', 6.84, 1581, 451, 110, 0, 0, 2142, 14651.28, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000490', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0490', 'Lightning protection system', 'm2', 5.44, 1863.54, 273, 0, 22200, 0, 24336.54, 132390.78, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000491', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0491', 'Busbar riser', 'm2', 13.08, 149.76, 280, 0, 0, 0, 429.76, 5621.26, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000492', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0492', 'Generator ATS panel', 'm2', 18.52, 787.5, 169, 234, 0, 0, 1190.5, 22048.06, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000493', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0493', 'Emergency lighting', 'm2', 18.38, 9024, 444, 0, 0, 0, 9468, 174021.84, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000494', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0494', 'UPS distribution', 'm2', 7.63, 1047600, 115, 0, 0, 0, 1047715, 7994065.45, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000495', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0495', 'Motor control center', 'm2', 5.96, 2336.25, 221, 242, 0, 50.11, 2849.36, 16982.19, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000496', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0496', 'VFD panel', 'm2', 14.39, 356.25, 270, 0, 0, 0, 626.25, 9011.74, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000497', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0497', 'Lighting control relay', 'm2', 23.44, 1870.5, 408.5, 0, 11000, 0, 13279, 311259.76, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000498', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0498', 'Cable pulling lubricant', 'm2', 18.3, 4323, 429, 198, 0, 0, 4950, 90585, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000499', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0499', 'Cable megger testing', 'm2', 5.51, 97.44, 252, 0, 0, 0, 349.44, 1925.41, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000500', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0500', 'Electrical commissioning', 'm2', 20.66, 56.41, 208, 0, 0, 0, 264.41, 5462.71, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('e1c11111-1111-4111-a111-000000000501', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0501', 'Electrical O&M manual', 'm2', 12.45, 320, 214.5, 132, 0, 0, 666.5, 8297.92, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000502', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0502', 'Electrical warranty', 'm2', 6.41, 9996, 480, 0, 0, 0, 10476, 67151.16, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000503', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0503', 'Electrical night work', 'm2', 5.21, 613.6, 149.5, 0, 0, 0, 763.1, 3975.75, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000504', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0504', 'Electrical shop drawing', 'm2', 7.55, 52.8, 331.5, 126, 13500, 0, 14010.3, 105777.76, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000505', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0505', 'Electrical mock-up', 'm2', 15.28, 1222.73, 225, 0, 0, 0, 1447.73, 22121.31, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000506', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0506', 'Electrical seismic bracing', 'm2', 10.29, 877.2, 294.5, 0, 0, 80.75, 1252.45, 12887.71, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000507', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0507', 'Electrical fire stopping', 'm2', 8.24, 62.64, 275, 88, 0, 0, 425.64, 3507.27, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000508', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0508', 'Electrical labeling', 'm2', 2.53, 2987.5, 346.5, 0, 0, 0, 3334, 8435.02, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000509', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0509', 'Electrical inspection', 'm2', 19.53, 6960, 248, 0, 0, 0, 7208, 140772.24, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000510', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0510', 'Electrical as-built', 'm2', 5.4, 763875, 208, 216, 0, 0, 764299, 4127214.6, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000511', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0511', 'Electrical debris removal', 'm2', 7.27, 1806.7, 264, 0, 9900, 0, 11970.7, 87026.99, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000512', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0512', 'Electrical transport', 'm2', 18.46, 159.6, 230, 0, 0, 0, 389.6, 7192.02, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000513', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0513', 'Electrical storage', 'm2', 8.5, 1029.5, 212.5, 132, 0, 0, 1374, 11679, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000514', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0514', 'Electrical touch-up', 'm2', 19.59, 4389, 153, 0, 0, 0, 4542, 88977.78, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000515', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0515', 'Electrical spare breakers', 'm2', 3.36, 45.86, 114, 0, 0, 0, 159.86, 537.13, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000516', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0516', 'Electrical load bank test', 'm2', 3.21, 130.56, 154, 90, 0, 0, 374.56, 1202.34, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000517', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0517', 'Electrical thermographic scan', 'm2', 21.96, 246.4, 241.5, 0, 0, 66.27, 554.17, 12169.57, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000518', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0518', 'Electrical authority witness', 'm2', 7.2, 6216, 328, 0, 12800, 0, 19344, 139276.8, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000519', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0519', 'Electrical final acceptance', 'm2', 10.86, 379.6, 234, 110, 0, 0, 723.6, 7858.3, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000520', v_project_id, 'e1b11111-1111-4111-a111-000000000017', 'MWB-0520', 'Electrical training', 'm2', 17.64, 59.47, 432, 0, 0, 0, 491.47, 8669.53, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000521', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0521', 'VRF outdoor unit 16HP', 'pc', 19.8, 1470.5, 356.5, 0, 0, 0, 1827, 36174.6, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000522', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0522', 'VRF indoor cassette', 'pc', 6.13, 1557.2, 178.5, 216, 0, 0, 1951.7, 11963.92, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000523', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0523', 'Ductwork galvanized 24ga', 'm2', 20.52, 41.76, 225, 0, 0, 0, 266.76, 5473.92, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000524', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0524', 'Chilled water pipe 65mm', 'm', 4.57, 2512.5, 228, 0, 0, 0, 2740.5, 12524.09, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000525', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0525', 'AHU 10000 CFM', 'm2', 16.69, 8467.2, 286, 176, 5550, 0, 14479.2, 241657.85, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000526', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0526', 'Exhaust fan toilet', 'm2', 20.79, 722650, 357, 0, 0, 0, 723007, 15031315.53, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000527', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0527', 'Fresh air louver', 'm2', 4.52, 2216.1, 264, 0, 0, 0, 2480.1, 11210.05, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000528', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0528', 'Volume control damper', 'm2', 14.42, 572.85, 156, 72, 0, 64.93, 865.78, 12484.55, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000529', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0529', 'Duct insulation 25mm', 'm2', 21.03, 3291.5, 204, 0, 0, 0, 3495.5, 73510.37, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000530', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0530', 'Refrigerant piping copper', 'm2', 10.77, 1455.3, 437, 0, 0, 0, 1892.3, 20380.07, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000531', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0531', 'BMS control panel', 'm2', 14.21, 99.12, 331.5, 198, 0, 0, 628.62, 8932.69, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000532', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0532', 'Thermostat digital', 'm2', 1.39, 182.92, 153, 0, 13200, 0, 13535.92, 18814.93, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000533', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0533', 'Duct smoke detector', 'm2', 25.76, 464, 114, 0, 0, 0, 578, 14889.28, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000534', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0534', 'Fire damper HVAC', 'm2', 9.76, 3570, 308, 54, 0, 0, 3932, 38376.32, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000535', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0535', 'Duct access door', 'pc', 17.08, 928.2, 126, 0, 0, 0, 1054.2, 18005.74, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000536', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0536', 'Duct testing leakage', 'm2', 14.22, 112.32, 344, 0, 0, 0, 456.32, 6488.87, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000537', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0537', 'Air balancing', 'm2', 12.8, 1776.5, 214.5, 264, 0, 0, 2255, 28864, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000538', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0538', 'HVAC commissioning', 'm2', 13.44, 367.2, 456, 0, 0, 0, 823.2, 11063.81, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000539', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0539', 'HVAC O&M manual', 'm2', 12.03, 41.04, 437, 0, 31500, 102.34, 32080.38, 385926.97, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000540', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0540', 'HVAC warranty', 'm2', 3, 2848.13, 195.5, 72, 0, 0, 3115.63, 9346.89, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000541', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0541', 'HVAC night work', 'm2', 23.3, 12288, 90, 0, 0, 0, 12378, 288407.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000542', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0542', 'HVAC shop drawing', 'm2', 9.95, 863300, 275.5, 0, 0, 0, 863575.5, 8592576.23, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000543', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0543', 'HVAC mock-up', 'm2', 18.81, 1424, 407, 286, 0, 0, 2117, 39820.77, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000544', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0544', 'HVAC seismic bracing', 'm2', 9.76, 567.15, 315, 0, 0, 0, 882.15, 8609.78, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000545', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0545', 'HVAC vibration isolator', 'm2', 20.91, 3973.73, 320, 0, 0, 0, 4293.73, 89781.89, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000546', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0546', 'HVAC condensate drain', 'm2', 6.53, 2590.5, 201.5, 162, 11550, 0, 14504, 94711.12, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000547', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0547', 'HVAC refrigerant charge', 'm2', 5.32, 55.86, 312, 0, 0, 0, 367.86, 1957.02, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000548', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0548', 'HVAC insulation jacket', 'm2', 21.24, 146.88, 333.5, 0, 0, 0, 480.38, 10203.27, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000549', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0549', 'HVAC inspection', 'm2', 13.79, 716.8, 93.5, 264, 0, 0, 1074.3, 14814.6, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000550', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0550', 'HVAC as-built', 'm2', 13.39, 11245.5, 99, 0, 0, 93.92, 11438.42, 153160.44, v_owner, v_owner);

  INSERT INTO public.boq_items (
    id, project_id, wbs_id, item_code, description, unit, quantity,
    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,
    total_rate, total_amount, created_by, updated_by
  ) VALUES
    ('e1c11111-1111-4111-a111-000000000551', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0551', 'HVAC debris removal', 'm2', 3.83, 686.4, 313.5, 0, 0, 0, 999.9, 3829.62, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000552', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0552', 'HVAC transport', 'm2', 10.79, 105.6, 363, 54, 0, 0, 522.6, 5638.85, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000553', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0553', 'HVAC storage', 'm2', 10.6, 1292, 126, 0, 38400, 0, 39818, 422070.8, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000554', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0554', 'HVAC touch-up', 'm2', 19.67, 1686.4, 128, 0, 0, 0, 1814.4, 35689.25, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000555', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0555', 'HVAC spare filters', 'm2', 8.02, 198.07, 84.5, 44, 0, 0, 326.57, 2619.09, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000556', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0556', 'HVAC TAB report', 'm2', 1.65, 2462.5, 264, 0, 0, 0, 2726.5, 4498.72, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000557', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0557', 'HVAC authority witness', 'm2', 22.03, 10992, 391, 0, 0, 0, 11383, 250767.49, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000558', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0558', 'HVAC final acceptance', 'm2', 12.89, 839050, 136, 144, 0, 0, 839330, 10818963.7, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000559', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0559', 'HVAC training', 'm2', 15.03, 916.7, 225, 0, 0, 0, 1141.7, 17159.75, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000560', v_project_id, 'e1b11111-1111-4111-a111-000000000018', 'MWB-0560', 'HVAC maintenance contract prep', 'm2', 7.97, 311.22, 285, 0, 14800, 0, 15396.22, 122707.87, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000561', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0561', 'Site excavation bulk', 'm2', 11.75, 1580.5, 86.09, 220, 0, 80.91, 1967.5, 23118.13, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000562', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0562', 'Site grading and compaction', 'm2', 18.37, 940.5, 237.39, 0, 0, 0, 1177.89, 21637.84, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000563', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0563', 'Asphalt road 50mm', 'm2', 19.9, 58.8, 173.91, 0, 0, 0, 232.71, 4630.93, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000564', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0564', 'Concrete sidewalk 150mm', 'm2', 2.88, 85, 101.74, 162, 0, 0, 348.74, 1004.37, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000565', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0565', 'Interlocking pavers driveway', 'm2', 20.28, 369.6, 156.52, 0, 0, 0, 526.12, 10669.71, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000566', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0566', 'Landscape topsoil', 'm2', 19.87, 9408, 410, 0, 0, 0, 9818, 195083.66, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000567', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0567', 'Sodding lawn', 'm2', 6.91, 603.2, 133.04, 242, 22000, 0, 22978.24, 158779.64, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000568', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0568', 'Tree planting 3m height', 'm2', 5.98, 89.76, 234.78, 0, 0, 0, 324.54, 1940.75, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000569', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0569', 'Perimeter fence RC posts', 'm2', 24.1, 2031.5, 289.13, 0, 0, 0, 2320.63, 55927.18, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000570', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0570', 'Gate house structure', 'm2', 3.17, 1320.9, 258.26, 216, 0, 0, 1795.16, 5690.66, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000571', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0571', 'Storm drain RC pipe 600mm', 'm', 6.09, 175.68, 210, 0, 0, 0, 385.68, 2348.79, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000572', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0572', 'Manhole RC 1200', 'm2', 10.69, 3062.5, 104.35, 0, 0, 104.24, 3271.09, 34967.95, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000573', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0573', 'Catch basin', 'm2', 13.8, 10224, 197.83, 264, 0, 0, 10685.83, 147464.45, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000574', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0574', 'Site lighting pole', 'm2', 17.4, 649900, 146.09, 0, 18000, 0, 668046.09, 11624001.97, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000575', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0575', 'Bollard RC protective', 'm2', 8.68, 2149.35, 140, 0, 0, 0, 2289.35, 19871.56, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000576', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0576', 'Car park marking', 'm2', 2.18, 701.1, 133.04, 216, 0, 0, 1050.14, 2289.31, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000577', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0577', 'Wheel stop concrete', 'm3', 12.71, 2943.5, 328.7, 0, 0, 0, 3272.2, 41589.66, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000578', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0578', 'Retaining wall segmental', 'm2', 8.87, 4405.5, 346.96, 0, 0, 0, 4752.46, 42154.32, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000579', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0579', 'Riprap slope protection', 'm2', 15.46, 44.94, 200.87, 44, 0, 0, 289.81, 4480.46, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000580', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0580', 'Silt fence sediment', 'm2', 18.6, 54.26, 264.78, 0, 0, 0, 319.04, 5934.14, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000581', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0581', 'Erosion control mat', 'm2', 18.85, 163.2, 111.3, 0, 9900, 0, 10174.5, 191789.33, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000582', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0582', 'Demolition allowance', 'lot', 19.39, 5628, 113.04, 36, 0, 0, 5777.04, 112016.81, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000583', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0583', 'Hauling offsite', 'm2', 18.75, 858, 114.78, 0, 0, 55.4, 1028.18, 19278.38, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000584', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0584', 'Site signage', 'm2', 13.02, 38.4, 330, 0, 0, 0, 368.4, 4796.57, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000585', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0585', 'Temporary road', 'm2', 16.27, 526.58, 162.61, 110, 0, 0, 799.19, 13002.82, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000586', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0586', 'Construction water supply', 'm2', 5.55, 605.2, 172.17, 0, 0, 0, 777.37, 4314.4, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000587', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0587', 'Site power temporary', 'm2', 4.54, 55.44, 280.87, 0, 0, 0, 336.31, 1526.85, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000588', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0588', 'Site toilet portable', 'm2', 3.02, 2400, 306.09, 108, 22400, 0, 25214.09, 76146.55, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000589', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0589', 'Site waste segregation', 'm2', 22.87, 7776, 383.48, 0, 0, 0, 8159.48, 186607.31, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000590', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0590', 'Landscaping irrigation', 'm2', 3, 723135, 76.52, 0, 0, 0, 723211.52, 2169634.56, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000591', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0591', 'Fountain water feature', 'm2', 20.21, 1975.8, 146.96, 264, 0, 0, 2386.76, 48236.42, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000592', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0592', 'Outdoor furniture allowance', 'lot', 18.61, 581.4, 344.35, 0, 0, 0, 925.75, 17228.21, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000593', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0593', 'Bike rack stainless', 'm2', 15.83, 971.5, 160, 0, 0, 0, 1131.5, 17911.65, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000594', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0594', 'EV charging rough-in', 'm2', 21.21, 1980, 140.43, 126, 0, 88.56, 2334.99, 49525.14, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000595', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0595', 'Guard house fit-out', 'm2', 20.73, 103.19, 62.61, 0, 3700, 0, 3865.8, 80138.03, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000596', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0596', 'CCTV pole foundation', 'm2', 18.76, 66.64, 123.91, 0, 0, 0, 190.55, 3574.72, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000597', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0597', 'Flagpole foundation', 'm2', 16.08, 556.8, 210.43, 308, 0, 0, 1075.23, 17289.7, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000598', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0598', 'External painting', 'm2', 12.26, 3822, 292.17, 0, 0, 0, 4114.17, 50439.72, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000599', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0599', 'External cleaning', 'm2', 15.3, 1066, 125.22, 0, 0, 0, 1191.22, 18225.67, v_owner, v_owner),
    ('e1c11111-1111-4111-a111-000000000600', v_project_id, 'e1b11111-1111-4111-a111-000000000020', 'MWB-0600', 'External final acceptance', 'm2', 16.44, 71.06, 67.83, 126, 0, 0, 264.89, 4354.79, v_owner, v_owner);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000001', 'e1c11111-1111-4111-a111-000000000001', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.18, 1450, 0, NULL, 1711, 0),
    ('e1e11111-1111-4111-a111-000000000002', 'e1c11111-1111-4111-a111-000000000001', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.34, 900, 0, NULL, 306, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000003', 'e1c11111-1111-4111-a111-000000000002', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.46, 1650, 0, NULL, 2409, 0),
    ('e1e11111-1111-4111-a111-000000000004', 'e1c11111-1111-4111-a111-000000000002', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.16, 950, 0, NULL, 152, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000005', 'e1c11111-1111-4111-a111-000000000003', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.55, 42, 0, NULL, 65.1, 0),
    ('e1e11111-1111-4111-a111-000000000006', 'e1c11111-1111-4111-a111-000000000003', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.23, 1100, 0, NULL, 253, 1),
    ('e1e11111-1111-4111-a111-000000000007', 'e1c11111-1111-4111-a111-000000000003', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.13, 2200, 0, NULL, 286, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000008', 'e1c11111-1111-4111-a111-000000000004', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.77, 68, 0, NULL, 120.36, 0),
    ('e1e11111-1111-4111-a111-000000000009', 'e1c11111-1111-4111-a111-000000000004', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.18, 1050, 0, NULL, 189, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000010', 'e1c11111-1111-4111-a111-000000000005', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.68, 320, 5, NULL, 564.48, 0),
    ('e1e11111-1111-4111-a111-000000000011', 'e1c11111-1111-4111-a111-000000000005', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.42, 800, 0, NULL, 336, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000012', 'e1c11111-1111-4111-a111-000000000006', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.01, 4200, 0, NULL, 4242, 0),
    ('e1e11111-1111-4111-a111-000000000013', 'e1c11111-1111-4111-a111-000000000006', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.38, 650, 0, NULL, 247, 1),
    ('e1e11111-1111-4111-a111-000000000014', 'e1c11111-1111-4111-a111-000000000006', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.06, 1800, 0, NULL, 108, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000015', 'e1c11111-1111-4111-a111-000000000007', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 0.61, 520, 0, NULL, 317.2, 0),
    ('e1e11111-1111-4111-a111-000000000016', 'e1c11111-1111-4111-a111-000000000007', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.41, 1200, 0, NULL, 492, 1),
    ('e1e11111-1111-4111-a111-000000000017', 'e1c11111-1111-4111-a111-000000000007', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.12, 220000, 0, NULL, 26400, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000018', 'e1c11111-1111-4111-a111-000000000008', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.37, 48, 0, NULL, 65.76, 0),
    ('e1e11111-1111-4111-a111-000000000019', 'e1c11111-1111-4111-a111-000000000008', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.14, 1150, 0, NULL, 161, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000020', 'e1c11111-1111-4111-a111-000000000009', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.26, 850, 0, NULL, 1071, 0),
    ('e1e11111-1111-4111-a111-000000000021', 'e1c11111-1111-4111-a111-000000000009', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.35, 850, 0, NULL, 297.5, 1),
    ('e1e11111-1111-4111-a111-000000000022', 'e1c11111-1111-4111-a111-000000000009', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.1, 2200, 0, NULL, 220, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000023', 'e1c11111-1111-4111-a111-000000000010', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 1.75, 680, 5, NULL, 1249.5, 0),
    ('e1e11111-1111-4111-a111-000000000024', 'e1c11111-1111-4111-a111-000000000010', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.29, 900, 0, NULL, 261, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000025', 'e1c11111-1111-4111-a111-000000000011', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 0.54, 72, 0, NULL, 38.88, 0),
    ('e1e11111-1111-4111-a111-000000000026', 'e1c11111-1111-4111-a111-000000000011', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.29, 950, 0, NULL, 275.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000027', 'e1c11111-1111-4111-a111-000000000012', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 1.54, 1250, 0, NULL, 1925, 0),
    ('e1e11111-1111-4111-a111-000000000028', 'e1c11111-1111-4111-a111-000000000012', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.37, 1100, 0, NULL, 407, 1),
    ('e1e11111-1111-4111-a111-000000000029', 'e1c11111-1111-4111-a111-000000000012', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.06, 1800, 0, NULL, 108, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000030', 'e1c11111-1111-4111-a111-000000000013', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 1.16, 4800, 0, NULL, 5568, 0),
    ('e1e11111-1111-4111-a111-000000000031', 'e1c11111-1111-4111-a111-000000000013', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.33, 1050, 0, NULL, 346.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000032', 'e1c11111-1111-4111-a111-000000000014', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.06, 485000, 0, NULL, 999100, 0),
    ('e1e11111-1111-4111-a111-000000000033', 'e1c11111-1111-4111-a111-000000000014', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.24, 800, 0, NULL, 192, 1),
    ('e1e11111-1111-4111-a111-000000000034', 'e1c11111-1111-4111-a111-000000000014', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.04, 450000, 0, NULL, 18000, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000035', 'e1c11111-1111-4111-a111-000000000015', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 0.71, 890, 5, NULL, 663.5, 0),
    ('e1e11111-1111-4111-a111-000000000036', 'e1c11111-1111-4111-a111-000000000015', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.11, 650, 0, NULL, 71.5, 1),
    ('e1e11111-1111-4111-a111-000000000037', 'e1c11111-1111-4111-a111-000000000015', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000038', 'e1c11111-1111-4111-a111-000000000016', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.68, 285, 0, NULL, 478.8, 0),
    ('e1e11111-1111-4111-a111-000000000039', 'e1c11111-1111-4111-a111-000000000016', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.42, 1200, 0, NULL, 504, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000040', 'e1c11111-1111-4111-a111-000000000017', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.71, 1450, 0, NULL, 2479.5, 0),
    ('e1e11111-1111-4111-a111-000000000041', 'e1c11111-1111-4111-a111-000000000017', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.4, 1150, 0, NULL, 460, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000042', 'e1c11111-1111-4111-a111-000000000018', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.56, 1650, 0, NULL, 2574, 0),
    ('e1e11111-1111-4111-a111-000000000043', 'e1c11111-1111-4111-a111-000000000018', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.31, 850, 0, NULL, 263.5, 1),
    ('e1e11111-1111-4111-a111-000000000044', 'e1c11111-1111-4111-a111-000000000018', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.08, 1800, 0, NULL, 144, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000045', 'e1c11111-1111-4111-a111-000000000019', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.02, 42, 0, NULL, 42.84, 0),
    ('e1e11111-1111-4111-a111-000000000046', 'e1c11111-1111-4111-a111-000000000019', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.22, 900, 0, NULL, 198, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000047', 'e1c11111-1111-4111-a111-000000000020', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.06, 68, 5, NULL, 75.68, 0),
    ('e1e11111-1111-4111-a111-000000000048', 'e1c11111-1111-4111-a111-000000000020', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.1, 950, 0, NULL, 95, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000049', 'e1c11111-1111-4111-a111-000000000021', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.61, 320, 0, NULL, 515.2, 0),
    ('e1e11111-1111-4111-a111-000000000050', 'e1c11111-1111-4111-a111-000000000021', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.21, 1100, 0, NULL, 231, 1),
    ('e1e11111-1111-4111-a111-000000000051', 'e1c11111-1111-4111-a111-000000000021', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.03, 2200, 0, NULL, 66, 2),
    ('e1e11111-1111-4111-a111-000000000052', 'e1c11111-1111-4111-a111-000000000021', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.02, 165000, 0, NULL, 3300, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000053', 'e1c11111-1111-4111-a111-000000000022', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.35, 4200, 0, NULL, 5670, 0),
    ('e1e11111-1111-4111-a111-000000000054', 'e1c11111-1111-4111-a111-000000000022', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.13, 1050, 0, NULL, 136.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000055', 'e1c11111-1111-4111-a111-000000000023', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 2.58, 520, 0, NULL, 1341.6, 0),
    ('e1e11111-1111-4111-a111-000000000056', 'e1c11111-1111-4111-a111-000000000023', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.42, 800, 0, NULL, 336, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000057', 'e1c11111-1111-4111-a111-000000000024', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.66, 48, 0, NULL, 127.68, 0),
    ('e1e11111-1111-4111-a111-000000000058', 'e1c11111-1111-4111-a111-000000000024', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.12, 650, 0, NULL, 78, 1),
    ('e1e11111-1111-4111-a111-000000000059', 'e1c11111-1111-4111-a111-000000000024', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.07, 1800, 0, NULL, 126, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000060', 'e1c11111-1111-4111-a111-000000000025', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.86, 850, 5, NULL, 767.55, 0),
    ('e1e11111-1111-4111-a111-000000000061', 'e1c11111-1111-4111-a111-000000000025', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.2, 1200, 0, NULL, 240, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000062', 'e1c11111-1111-4111-a111-000000000026', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.24, 680, 0, NULL, 1523.2, 0),
    ('e1e11111-1111-4111-a111-000000000063', 'e1c11111-1111-4111-a111-000000000026', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.19, 1150, 0, NULL, 218.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000064', 'e1c11111-1111-4111-a111-000000000027', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.95, 72, 0, NULL, 140.4, 0),
    ('e1e11111-1111-4111-a111-000000000065', 'e1c11111-1111-4111-a111-000000000027', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.21, 850, 0, NULL, 178.5, 1),
    ('e1e11111-1111-4111-a111-000000000066', 'e1c11111-1111-4111-a111-000000000027', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.08, 2200, 0, NULL, 176, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000067', 'e1c11111-1111-4111-a111-000000000028', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 2.4, 1250, 0, NULL, 3000, 0),
    ('e1e11111-1111-4111-a111-000000000068', 'e1c11111-1111-4111-a111-000000000028', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.4, 900, 0, NULL, 360, 1),
    ('e1e11111-1111-4111-a111-000000000069', 'e1c11111-1111-4111-a111-000000000028', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.07, 320000, 0, NULL, 22400, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000070', 'e1c11111-1111-4111-a111-000000000029', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 1.5, 4800, 0, NULL, 7200, 0),
    ('e1e11111-1111-4111-a111-000000000071', 'e1c11111-1111-4111-a111-000000000029', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.1, 950, 0, NULL, 95, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000072', 'e1c11111-1111-4111-a111-000000000030', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.32, 485000, 5, NULL, 1181460, 0),
    ('e1e11111-1111-4111-a111-000000000073', 'e1c11111-1111-4111-a111-000000000030', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.15, 1100, 0, NULL, 165, 1),
    ('e1e11111-1111-4111-a111-000000000074', 'e1c11111-1111-4111-a111-000000000030', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.03, 1800, 0, NULL, 54, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000075', 'e1c11111-1111-4111-a111-000000000031', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 2.38, 890, 0, NULL, 2118.2, 0),
    ('e1e11111-1111-4111-a111-000000000076', 'e1c11111-1111-4111-a111-000000000031', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.37, 1050, 0, NULL, 388.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000077', 'e1c11111-1111-4111-a111-000000000032', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.6, 285, 0, NULL, 171, 0),
    ('e1e11111-1111-4111-a111-000000000078', 'e1c11111-1111-4111-a111-000000000032', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.36, 800, 0, NULL, 288, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000079', 'e1c11111-1111-4111-a111-000000000033', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.63, 1450, 0, NULL, 3813.5, 0),
    ('e1e11111-1111-4111-a111-000000000080', 'e1c11111-1111-4111-a111-000000000033', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.39, 650, 0, NULL, 253.5, 1),
    ('e1e11111-1111-4111-a111-000000000081', 'e1c11111-1111-4111-a111-000000000033', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.09, 2200, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000082', 'e1c11111-1111-4111-a111-000000000034', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.09, 1650, 0, NULL, 3448.5, 0),
    ('e1e11111-1111-4111-a111-000000000083', 'e1c11111-1111-4111-a111-000000000034', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.39, 1200, 0, NULL, 468, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000084', 'e1c11111-1111-4111-a111-000000000035', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.68, 42, 5, NULL, 29.99, 0),
    ('e1e11111-1111-4111-a111-000000000085', 'e1c11111-1111-4111-a111-000000000035', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.39, 1150, 0, NULL, 448.5, 1),
    ('e1e11111-1111-4111-a111-000000000086', 'e1c11111-1111-4111-a111-000000000035', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.03, 185000, 0, NULL, 5550, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000087', 'e1c11111-1111-4111-a111-000000000036', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.57, 68, 0, NULL, 106.76, 0),
    ('e1e11111-1111-4111-a111-000000000088', 'e1c11111-1111-4111-a111-000000000036', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.33, 850, 0, NULL, 280.5, 1),
    ('e1e11111-1111-4111-a111-000000000089', 'e1c11111-1111-4111-a111-000000000036', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.09, 1800, 0, NULL, 162, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000090', 'e1c11111-1111-4111-a111-000000000037', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.32, 320, 0, NULL, 742.4, 0),
    ('e1e11111-1111-4111-a111-000000000091', 'e1c11111-1111-4111-a111-000000000037', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.16, 900, 0, NULL, 144, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000092', 'e1c11111-1111-4111-a111-000000000038', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 2.37, 4200, 0, NULL, 9954, 0),
    ('e1e11111-1111-4111-a111-000000000093', 'e1c11111-1111-4111-a111-000000000038', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.24, 950, 0, NULL, 228, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000094', 'e1c11111-1111-4111-a111-000000000039', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 0.71, 520, 0, NULL, 369.2, 0),
    ('e1e11111-1111-4111-a111-000000000095', 'e1c11111-1111-4111-a111-000000000039', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.29, 1100, 0, NULL, 319, 1),
    ('e1e11111-1111-4111-a111-000000000096', 'e1c11111-1111-4111-a111-000000000039', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.13, 2200, 0, NULL, 286, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000097', 'e1c11111-1111-4111-a111-000000000040', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.34, 48, 5, NULL, 117.94, 0),
    ('e1e11111-1111-4111-a111-000000000098', 'e1c11111-1111-4111-a111-000000000040', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.22, 1050, 0, NULL, 231, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000099', 'e1c11111-1111-4111-a111-000000000041', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.56, 850, 0, NULL, 476, 0),
    ('e1e11111-1111-4111-a111-000000000100', 'e1c11111-1111-4111-a111-000000000041', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.21, 800, 0, NULL, 168, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000101', 'e1c11111-1111-4111-a111-000000000042', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.35, 680, 0, NULL, 1598, 0),
    ('e1e11111-1111-4111-a111-000000000102', 'e1c11111-1111-4111-a111-000000000042', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.3, 650, 0, NULL, 195, 1),
    ('e1e11111-1111-4111-a111-000000000103', 'e1c11111-1111-4111-a111-000000000042', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.09, 1800, 0, NULL, 162, 2),
    ('e1e11111-1111-4111-a111-000000000104', 'e1c11111-1111-4111-a111-000000000042', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.03, 220000, 0, NULL, 6600, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000105', 'e1c11111-1111-4111-a111-000000000043', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.44, 72, 0, NULL, 103.68, 0),
    ('e1e11111-1111-4111-a111-000000000106', 'e1c11111-1111-4111-a111-000000000043', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.32, 1200, 0, NULL, 384, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000107', 'e1c11111-1111-4111-a111-000000000044', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 1.66, 1250, 0, NULL, 2075, 0),
    ('e1e11111-1111-4111-a111-000000000108', 'e1c11111-1111-4111-a111-000000000044', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.29, 1150, 0, NULL, 333.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000109', 'e1c11111-1111-4111-a111-000000000045', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.91, 4800, 5, NULL, 4586.4, 0),
    ('e1e11111-1111-4111-a111-000000000110', 'e1c11111-1111-4111-a111-000000000045', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.28, 850, 0, NULL, 238, 1),
    ('e1e11111-1111-4111-a111-000000000111', 'e1c11111-1111-4111-a111-000000000045', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.09, 2200, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000112', 'e1c11111-1111-4111-a111-000000000046', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.2, 485000, 0, NULL, 582000, 0),
    ('e1e11111-1111-4111-a111-000000000113', 'e1c11111-1111-4111-a111-000000000046', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.25, 900, 0, NULL, 225, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000114', 'e1c11111-1111-4111-a111-000000000047', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.23, 890, 0, NULL, 1094.7, 0),
    ('e1e11111-1111-4111-a111-000000000115', 'e1c11111-1111-4111-a111-000000000047', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.13, 950, 0, NULL, 123.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000116', 'e1c11111-1111-4111-a111-000000000048', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.86, 285, 0, NULL, 245.1, 0),
    ('e1e11111-1111-4111-a111-000000000117', 'e1c11111-1111-4111-a111-000000000048', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.09, 1100, 0, NULL, 99, 1),
    ('e1e11111-1111-4111-a111-000000000118', 'e1c11111-1111-4111-a111-000000000048', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000119', 'e1c11111-1111-4111-a111-000000000049', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.52, 1450, 0, NULL, 3654, 0),
    ('e1e11111-1111-4111-a111-000000000120', 'e1c11111-1111-4111-a111-000000000049', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.08, 1050, 0, NULL, 84, 1),
    ('e1e11111-1111-4111-a111-000000000121', 'e1c11111-1111-4111-a111-000000000049', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.11, 450000, 0, NULL, 49500, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000122', 'e1c11111-1111-4111-a111-000000000050', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.65, 1650, 5, NULL, 4591.13, 0),
    ('e1e11111-1111-4111-a111-000000000123', 'e1c11111-1111-4111-a111-000000000050', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.26, 800, 0, NULL, 208, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000124', 'e1c11111-1111-4111-a111-000000000051', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 2.37, 42, 0, NULL, 99.54, 0),
    ('e1e11111-1111-4111-a111-000000000125', 'e1c11111-1111-4111-a111-000000000051', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.36, 650, 0, NULL, 234, 1),
    ('e1e11111-1111-4111-a111-000000000126', 'e1c11111-1111-4111-a111-000000000051', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.04, 2200, 0, NULL, 88, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000127', 'e1c11111-1111-4111-a111-000000000052', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.35, 68, 0, NULL, 91.8, 0),
    ('e1e11111-1111-4111-a111-000000000128', 'e1c11111-1111-4111-a111-000000000052', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.27, 1200, 0, NULL, 324, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000129', 'e1c11111-1111-4111-a111-000000000053', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.21, 320, 0, NULL, 387.2, 0),
    ('e1e11111-1111-4111-a111-000000000130', 'e1c11111-1111-4111-a111-000000000053', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.33, 1150, 0, NULL, 379.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000131', 'e1c11111-1111-4111-a111-000000000054', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.74, 4200, 0, NULL, 7308, 0),
    ('e1e11111-1111-4111-a111-000000000132', 'e1c11111-1111-4111-a111-000000000054', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.32, 850, 0, NULL, 272, 1),
    ('e1e11111-1111-4111-a111-000000000133', 'e1c11111-1111-4111-a111-000000000054', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.08, 1800, 0, NULL, 144, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000134', 'e1c11111-1111-4111-a111-000000000055', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.59, 520, 5, NULL, 868.14, 0),
    ('e1e11111-1111-4111-a111-000000000135', 'e1c11111-1111-4111-a111-000000000055', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.17, 900, 0, NULL, 153, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000136', 'e1c11111-1111-4111-a111-000000000056', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.33, 48, 0, NULL, 63.84, 0),
    ('e1e11111-1111-4111-a111-000000000137', 'e1c11111-1111-4111-a111-000000000056', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.31, 950, 0, NULL, 294.5, 1),
    ('e1e11111-1111-4111-a111-000000000138', 'e1c11111-1111-4111-a111-000000000056', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.12, 165000, 0, NULL, 19800, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000139', 'e1c11111-1111-4111-a111-000000000057', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 2.12, 850, 0, NULL, 1802, 0),
    ('e1e11111-1111-4111-a111-000000000140', 'e1c11111-1111-4111-a111-000000000057', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.11, 1100, 0, NULL, 121, 1),
    ('e1e11111-1111-4111-a111-000000000141', 'e1c11111-1111-4111-a111-000000000057', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.07, 2200, 0, NULL, 154, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000142', 'e1c11111-1111-4111-a111-000000000058', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.55, 680, 0, NULL, 1734, 0),
    ('e1e11111-1111-4111-a111-000000000143', 'e1c11111-1111-4111-a111-000000000058', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.14, 1050, 0, NULL, 147, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000144', 'e1c11111-1111-4111-a111-000000000059', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.54, 72, 0, NULL, 182.88, 0),
    ('e1e11111-1111-4111-a111-000000000145', 'e1c11111-1111-4111-a111-000000000059', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.29, 800, 0, NULL, 232, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000146', 'e1c11111-1111-4111-a111-000000000060', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.67, 1250, 5, NULL, 879.38, 0),
    ('e1e11111-1111-4111-a111-000000000147', 'e1c11111-1111-4111-a111-000000000060', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.35, 650, 0, NULL, 227.5, 1),
    ('e1e11111-1111-4111-a111-000000000148', 'e1c11111-1111-4111-a111-000000000060', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000149', 'e1c11111-1111-4111-a111-000000000061', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.75, 4800, 0, NULL, 3600, 0),
    ('e1e11111-1111-4111-a111-000000000150', 'e1c11111-1111-4111-a111-000000000061', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.25, 1200, 0, NULL, 300, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000151', 'e1c11111-1111-4111-a111-000000000062', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 0.6, 485000, 0, NULL, 291000, 0),
    ('e1e11111-1111-4111-a111-000000000152', 'e1c11111-1111-4111-a111-000000000062', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.08, 1150, 0, NULL, 92, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000153', 'e1c11111-1111-4111-a111-000000000063', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 2.41, 890, 0, NULL, 2144.9, 0),
    ('e1e11111-1111-4111-a111-000000000154', 'e1c11111-1111-4111-a111-000000000063', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.41, 850, 0, NULL, 348.5, 1),
    ('e1e11111-1111-4111-a111-000000000155', 'e1c11111-1111-4111-a111-000000000063', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.07, 2200, 0, NULL, 154, 2),
    ('e1e11111-1111-4111-a111-000000000156', 'e1c11111-1111-4111-a111-000000000063', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.07, 320000, 0, NULL, 22400, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000157', 'e1c11111-1111-4111-a111-000000000064', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.57, 285, 0, NULL, 732.45, 0),
    ('e1e11111-1111-4111-a111-000000000158', 'e1c11111-1111-4111-a111-000000000064', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.29, 900, 0, NULL, 261, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000159', 'e1c11111-1111-4111-a111-000000000065', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.44, 1450, 5, NULL, 3714.9, 0),
    ('e1e11111-1111-4111-a111-000000000160', 'e1c11111-1111-4111-a111-000000000065', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.34, 950, 0, NULL, 323, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000161', 'e1c11111-1111-4111-a111-000000000066', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.6, 1650, 0, NULL, 2640, 0),
    ('e1e11111-1111-4111-a111-000000000162', 'e1c11111-1111-4111-a111-000000000066', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.14, 1100, 0, NULL, 154, 1),
    ('e1e11111-1111-4111-a111-000000000163', 'e1c11111-1111-4111-a111-000000000066', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.11, 1800, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000164', 'e1c11111-1111-4111-a111-000000000067', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.66, 42, 0, NULL, 69.72, 0),
    ('e1e11111-1111-4111-a111-000000000165', 'e1c11111-1111-4111-a111-000000000067', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.43, 1050, 0, NULL, 451.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000166', 'e1c11111-1111-4111-a111-000000000068', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 2.37, 68, 0, NULL, 161.16, 0),
    ('e1e11111-1111-4111-a111-000000000167', 'e1c11111-1111-4111-a111-000000000068', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.43, 800, 0, NULL, 344, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000168', 'e1c11111-1111-4111-a111-000000000069', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.66, 320, 0, NULL, 851.2, 0),
    ('e1e11111-1111-4111-a111-000000000169', 'e1c11111-1111-4111-a111-000000000069', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.09, 650, 0, NULL, 58.5, 1),
    ('e1e11111-1111-4111-a111-000000000170', 'e1c11111-1111-4111-a111-000000000069', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000171', 'e1c11111-1111-4111-a111-000000000070', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.42, 4200, 5, NULL, 6262.2, 0),
    ('e1e11111-1111-4111-a111-000000000172', 'e1c11111-1111-4111-a111-000000000070', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.27, 1200, 0, NULL, 324, 1),
    ('e1e11111-1111-4111-a111-000000000173', 'e1c11111-1111-4111-a111-000000000070', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.12, 185000, 0, NULL, 22200, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000174', 'e1c11111-1111-4111-a111-000000000071', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 2.67, 520, 0, NULL, 1388.4, 0),
    ('e1e11111-1111-4111-a111-000000000175', 'e1c11111-1111-4111-a111-000000000071', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.34, 1150, 0, NULL, 391, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000176', 'e1c11111-1111-4111-a111-000000000072', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.31, 48, 0, NULL, 110.88, 0),
    ('e1e11111-1111-4111-a111-000000000177', 'e1c11111-1111-4111-a111-000000000072', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.35, 850, 0, NULL, 297.5, 1),
    ('e1e11111-1111-4111-a111-000000000178', 'e1c11111-1111-4111-a111-000000000072', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000179', 'e1c11111-1111-4111-a111-000000000073', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.25, 850, 0, NULL, 1062.5, 0),
    ('e1e11111-1111-4111-a111-000000000180', 'e1c11111-1111-4111-a111-000000000073', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.08, 900, 0, NULL, 72, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000181', 'e1c11111-1111-4111-a111-000000000074', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.25, 680, 0, NULL, 1530, 0),
    ('e1e11111-1111-4111-a111-000000000182', 'e1c11111-1111-4111-a111-000000000074', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.35, 950, 0, NULL, 332.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000183', 'e1c11111-1111-4111-a111-000000000075', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 0.81, 72, 5, NULL, 61.24, 0),
    ('e1e11111-1111-4111-a111-000000000184', 'e1c11111-1111-4111-a111-000000000075', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.42, 1100, 0, NULL, 462, 1),
    ('e1e11111-1111-4111-a111-000000000185', 'e1c11111-1111-4111-a111-000000000075', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000186', 'e1c11111-1111-4111-a111-000000000076', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.72, 1250, 0, NULL, 900, 0),
    ('e1e11111-1111-4111-a111-000000000187', 'e1c11111-1111-4111-a111-000000000076', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.28, 1050, 0, NULL, 294, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000188', 'e1c11111-1111-4111-a111-000000000077', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 1.77, 4800, 0, NULL, 8496, 0),
    ('e1e11111-1111-4111-a111-000000000189', 'e1c11111-1111-4111-a111-000000000077', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.21, 800, 0, NULL, 168, 1),
    ('e1e11111-1111-4111-a111-000000000190', 'e1c11111-1111-4111-a111-000000000077', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.05, 220000, 0, NULL, 11000, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000191', 'e1c11111-1111-4111-a111-000000000078', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.15, 485000, 0, NULL, 1042750, 0),
    ('e1e11111-1111-4111-a111-000000000192', 'e1c11111-1111-4111-a111-000000000078', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.34, 650, 0, NULL, 221, 1),
    ('e1e11111-1111-4111-a111-000000000193', 'e1c11111-1111-4111-a111-000000000078', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.13, 1800, 0, NULL, 234, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000194', 'e1c11111-1111-4111-a111-000000000079', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.32, 890, 0, NULL, 1174.8, 0),
    ('e1e11111-1111-4111-a111-000000000195', 'e1c11111-1111-4111-a111-000000000079', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.19, 1200, 0, NULL, 228, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000196', 'e1c11111-1111-4111-a111-000000000080', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.53, 285, 5, NULL, 158.6, 0),
    ('e1e11111-1111-4111-a111-000000000197', 'e1c11111-1111-4111-a111-000000000080', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.21, 1150, 0, NULL, 241.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000198', 'e1c11111-1111-4111-a111-000000000081', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 0.59, 1450, 0, NULL, 855.5, 0),
    ('e1e11111-1111-4111-a111-000000000199', 'e1c11111-1111-4111-a111-000000000081', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.39, 850, 0, NULL, 331.5, 1),
    ('e1e11111-1111-4111-a111-000000000200', 'e1c11111-1111-4111-a111-000000000081', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.04, 2200, 0, NULL, 88, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000201', 'e1c11111-1111-4111-a111-000000000082', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 0.83, 1650, 0, NULL, 1369.5, 0),
    ('e1e11111-1111-4111-a111-000000000202', 'e1c11111-1111-4111-a111-000000000082', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.28, 900, 0, NULL, 252, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000203', 'e1c11111-1111-4111-a111-000000000083', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.56, 42, 0, NULL, 65.52, 0),
    ('e1e11111-1111-4111-a111-000000000204', 'e1c11111-1111-4111-a111-000000000083', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.18, 950, 0, NULL, 171, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000205', 'e1c11111-1111-4111-a111-000000000084', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.24, 68, 0, NULL, 84.32, 0),
    ('e1e11111-1111-4111-a111-000000000206', 'e1c11111-1111-4111-a111-000000000084', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.27, 1100, 0, NULL, 297, 1),
    ('e1e11111-1111-4111-a111-000000000207', 'e1c11111-1111-4111-a111-000000000084', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.07, 1800, 0, NULL, 126, 2),
    ('e1e11111-1111-4111-a111-000000000208', 'e1c11111-1111-4111-a111-000000000084', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.11, 450000, 0, NULL, 49500, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000209', 'e1c11111-1111-4111-a111-000000000085', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.7, 320, 5, NULL, 907.2, 0),
    ('e1e11111-1111-4111-a111-000000000210', 'e1c11111-1111-4111-a111-000000000085', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.33, 1050, 0, NULL, 346.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000211', 'e1c11111-1111-4111-a111-000000000086', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.71, 4200, 0, NULL, 7182, 0),
    ('e1e11111-1111-4111-a111-000000000212', 'e1c11111-1111-4111-a111-000000000086', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.38, 800, 0, NULL, 304, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000213', 'e1c11111-1111-4111-a111-000000000087', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 2.4, 520, 0, NULL, 1248, 0),
    ('e1e11111-1111-4111-a111-000000000214', 'e1c11111-1111-4111-a111-000000000087', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.24, 650, 0, NULL, 156, 1),
    ('e1e11111-1111-4111-a111-000000000215', 'e1c11111-1111-4111-a111-000000000087', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000216', 'e1c11111-1111-4111-a111-000000000088', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 0.68, 48, 0, NULL, 32.64, 0),
    ('e1e11111-1111-4111-a111-000000000217', 'e1c11111-1111-4111-a111-000000000088', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.34, 1200, 0, NULL, 408, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000218', 'e1c11111-1111-4111-a111-000000000089', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.13, 850, 0, NULL, 960.5, 0),
    ('e1e11111-1111-4111-a111-000000000219', 'e1c11111-1111-4111-a111-000000000089', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.1, 1150, 0, NULL, 115, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000220', 'e1c11111-1111-4111-a111-000000000090', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 1.99, 680, 5, NULL, 1420.86, 0),
    ('e1e11111-1111-4111-a111-000000000221', 'e1c11111-1111-4111-a111-000000000090', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.31, 850, 0, NULL, 263.5, 1),
    ('e1e11111-1111-4111-a111-000000000222', 'e1c11111-1111-4111-a111-000000000090', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.11, 1800, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000223', 'e1c11111-1111-4111-a111-000000000091', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.5, 72, 0, NULL, 180, 0),
    ('e1e11111-1111-4111-a111-000000000224', 'e1c11111-1111-4111-a111-000000000091', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.3, 900, 0, NULL, 270, 1),
    ('e1e11111-1111-4111-a111-000000000225', 'e1c11111-1111-4111-a111-000000000091', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.02, 165000, 0, NULL, 3300, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000226', 'e1c11111-1111-4111-a111-000000000092', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 2.54, 1250, 0, NULL, 3175, 0),
    ('e1e11111-1111-4111-a111-000000000227', 'e1c11111-1111-4111-a111-000000000092', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.2, 950, 0, NULL, 190, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000228', 'e1c11111-1111-4111-a111-000000000093', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 2.58, 4800, 0, NULL, 12384, 0),
    ('e1e11111-1111-4111-a111-000000000229', 'e1c11111-1111-4111-a111-000000000093', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.2, 1100, 0, NULL, 220, 1),
    ('e1e11111-1111-4111-a111-000000000230', 'e1c11111-1111-4111-a111-000000000093', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.03, 2200, 0, NULL, 66, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000231', 'e1c11111-1111-4111-a111-000000000094', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.37, 485000, 0, NULL, 1149450, 0),
    ('e1e11111-1111-4111-a111-000000000232', 'e1c11111-1111-4111-a111-000000000094', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.09, 1050, 0, NULL, 94.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000233', 'e1c11111-1111-4111-a111-000000000095', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 0.68, 890, 5, NULL, 635.46, 0),
    ('e1e11111-1111-4111-a111-000000000234', 'e1c11111-1111-4111-a111-000000000095', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.16, 800, 0, NULL, 128, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000235', 'e1c11111-1111-4111-a111-000000000096', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.85, 285, 0, NULL, 527.25, 0),
    ('e1e11111-1111-4111-a111-000000000236', 'e1c11111-1111-4111-a111-000000000096', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.08, 650, 0, NULL, 52, 1),
    ('e1e11111-1111-4111-a111-000000000237', 'e1c11111-1111-4111-a111-000000000096', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.12, 1800, 0, NULL, 216, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000238', 'e1c11111-1111-4111-a111-000000000097', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.86, 1450, 0, NULL, 2697, 0),
    ('e1e11111-1111-4111-a111-000000000239', 'e1c11111-1111-4111-a111-000000000097', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.39, 1200, 0, NULL, 468, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000240', 'e1c11111-1111-4111-a111-000000000098', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.28, 1650, 0, NULL, 2112, 0),
    ('e1e11111-1111-4111-a111-000000000241', 'e1c11111-1111-4111-a111-000000000098', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.42, 1150, 0, NULL, 483, 1),
    ('e1e11111-1111-4111-a111-000000000242', 'e1c11111-1111-4111-a111-000000000098', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.07, 320000, 0, NULL, 22400, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000243', 'e1c11111-1111-4111-a111-000000000099', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.68, 42, 0, NULL, 28.56, 0),
    ('e1e11111-1111-4111-a111-000000000244', 'e1c11111-1111-4111-a111-000000000099', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.11, 850, 0, NULL, 93.5, 1),
    ('e1e11111-1111-4111-a111-000000000245', 'e1c11111-1111-4111-a111-000000000099', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.07, 2200, 0, NULL, 154, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000246', 'e1c11111-1111-4111-a111-000000000100', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.82, 68, 5, NULL, 129.95, 0),
    ('e1e11111-1111-4111-a111-000000000247', 'e1c11111-1111-4111-a111-000000000100', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.1, 900, 0, NULL, 90, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000248', 'e1c11111-1111-4111-a111-000000000101', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.01, 320, 0, NULL, 323.2, 0),
    ('e1e11111-1111-4111-a111-000000000249', 'e1c11111-1111-4111-a111-000000000101', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.15, 950, 0, NULL, 142.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000250', 'e1c11111-1111-4111-a111-000000000102', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 2.06, 4200, 0, NULL, 8652, 0),
    ('e1e11111-1111-4111-a111-000000000251', 'e1c11111-1111-4111-a111-000000000102', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.21, 1100, 0, NULL, 231, 1),
    ('e1e11111-1111-4111-a111-000000000252', 'e1c11111-1111-4111-a111-000000000102', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.12, 1800, 0, NULL, 216, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000253', 'e1c11111-1111-4111-a111-000000000103', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 2.59, 520, 0, NULL, 1346.8, 0),
    ('e1e11111-1111-4111-a111-000000000254', 'e1c11111-1111-4111-a111-000000000103', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.31, 1050, 0, NULL, 325.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000255', 'e1c11111-1111-4111-a111-000000000104', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.43, 48, 0, NULL, 68.64, 0),
    ('e1e11111-1111-4111-a111-000000000256', 'e1c11111-1111-4111-a111-000000000104', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.11, 800, 0, NULL, 88, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000257', 'e1c11111-1111-4111-a111-000000000105', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.75, 850, 5, NULL, 669.38, 0),
    ('e1e11111-1111-4111-a111-000000000258', 'e1c11111-1111-4111-a111-000000000105', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.24, 650, 0, NULL, 156, 1),
    ('e1e11111-1111-4111-a111-000000000259', 'e1c11111-1111-4111-a111-000000000105', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2),
    ('e1e11111-1111-4111-a111-000000000260', 'e1c11111-1111-4111-a111-000000000105', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.07, 185000, 0, NULL, 12950, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000261', 'e1c11111-1111-4111-a111-000000000106', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 1.98, 680, 0, NULL, 1346.4, 0),
    ('e1e11111-1111-4111-a111-000000000262', 'e1c11111-1111-4111-a111-000000000106', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.28, 1200, 0, NULL, 336, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000263', 'e1c11111-1111-4111-a111-000000000107', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 0.73, 72, 0, NULL, 52.56, 0),
    ('e1e11111-1111-4111-a111-000000000264', 'e1c11111-1111-4111-a111-000000000107', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.4, 1150, 0, NULL, 460, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000265', 'e1c11111-1111-4111-a111-000000000108', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 2.48, 1250, 0, NULL, 3100, 0),
    ('e1e11111-1111-4111-a111-000000000266', 'e1c11111-1111-4111-a111-000000000108', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.4, 850, 0, NULL, 340, 1),
    ('e1e11111-1111-4111-a111-000000000267', 'e1c11111-1111-4111-a111-000000000108', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.11, 1800, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000268', 'e1c11111-1111-4111-a111-000000000109', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 2.11, 4800, 0, NULL, 10128, 0),
    ('e1e11111-1111-4111-a111-000000000269', 'e1c11111-1111-4111-a111-000000000109', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.4, 900, 0, NULL, 360, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000270', 'e1c11111-1111-4111-a111-000000000110', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.06, 485000, 5, NULL, 1049055, 0),
    ('e1e11111-1111-4111-a111-000000000271', 'e1c11111-1111-4111-a111-000000000110', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.37, 950, 0, NULL, 351.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000272', 'e1c11111-1111-4111-a111-000000000111', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 0.71, 890, 0, NULL, 631.9, 0),
    ('e1e11111-1111-4111-a111-000000000273', 'e1c11111-1111-4111-a111-000000000111', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.2, 1100, 0, NULL, 220, 1),
    ('e1e11111-1111-4111-a111-000000000274', 'e1c11111-1111-4111-a111-000000000111', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.02, 2200, 0, NULL, 44, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000275', 'e1c11111-1111-4111-a111-000000000112', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.81, 285, 0, NULL, 515.85, 0),
    ('e1e11111-1111-4111-a111-000000000276', 'e1c11111-1111-4111-a111-000000000112', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.43, 1050, 0, NULL, 451.5, 1),
    ('e1e11111-1111-4111-a111-000000000277', 'e1c11111-1111-4111-a111-000000000112', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.08, 220000, 0, NULL, 17600, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000278', 'e1c11111-1111-4111-a111-000000000113', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.63, 1450, 0, NULL, 2363.5, 0),
    ('e1e11111-1111-4111-a111-000000000279', 'e1c11111-1111-4111-a111-000000000113', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.22, 800, 0, NULL, 176, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000280', 'e1c11111-1111-4111-a111-000000000114', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 0.54, 1650, 0, NULL, 891, 0),
    ('e1e11111-1111-4111-a111-000000000281', 'e1c11111-1111-4111-a111-000000000114', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.33, 650, 0, NULL, 214.5, 1),
    ('e1e11111-1111-4111-a111-000000000282', 'e1c11111-1111-4111-a111-000000000114', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.13, 1800, 0, NULL, 234, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000283', 'e1c11111-1111-4111-a111-000000000115', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.57, 42, 5, NULL, 69.24, 0),
    ('e1e11111-1111-4111-a111-000000000284', 'e1c11111-1111-4111-a111-000000000115', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.38, 1200, 0, NULL, 456, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000285', 'e1c11111-1111-4111-a111-000000000116', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.96, 68, 0, NULL, 133.28, 0),
    ('e1e11111-1111-4111-a111-000000000286', 'e1c11111-1111-4111-a111-000000000116', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.13, 1150, 0, NULL, 149.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000287', 'e1c11111-1111-4111-a111-000000000117', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.66, 320, 0, NULL, 851.2, 0),
    ('e1e11111-1111-4111-a111-000000000288', 'e1c11111-1111-4111-a111-000000000117', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.4, 850, 0, NULL, 340, 1),
    ('e1e11111-1111-4111-a111-000000000289', 'e1c11111-1111-4111-a111-000000000117', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.05, 2200, 0, NULL, 110, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000290', 'e1c11111-1111-4111-a111-000000000118', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.29, 4200, 0, NULL, 5418, 0),
    ('e1e11111-1111-4111-a111-000000000291', 'e1c11111-1111-4111-a111-000000000118', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.31, 900, 0, NULL, 279, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000292', 'e1c11111-1111-4111-a111-000000000119', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 2.54, 520, 0, NULL, 1320.8, 0),
    ('e1e11111-1111-4111-a111-000000000293', 'e1c11111-1111-4111-a111-000000000119', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.39, 950, 0, NULL, 370.5, 1),
    ('e1e11111-1111-4111-a111-000000000294', 'e1c11111-1111-4111-a111-000000000119', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.06, 450000, 0, NULL, 27000, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000295', 'e1c11111-1111-4111-a111-000000000120', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.35, 48, 5, NULL, 118.44, 0),
    ('e1e11111-1111-4111-a111-000000000296', 'e1c11111-1111-4111-a111-000000000120', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.19, 1100, 0, NULL, 209, 1),
    ('e1e11111-1111-4111-a111-000000000297', 'e1c11111-1111-4111-a111-000000000120', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.06, 1800, 0, NULL, 108, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000298', 'e1c11111-1111-4111-a111-000000000121', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 2.4, 850, 0, NULL, 2040, 0),
    ('e1e11111-1111-4111-a111-000000000299', 'e1c11111-1111-4111-a111-000000000121', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.22, 1050, 0, NULL, 231, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000300', 'e1c11111-1111-4111-a111-000000000122', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.54, 680, 0, NULL, 1727.2, 0),
    ('e1e11111-1111-4111-a111-000000000301', 'e1c11111-1111-4111-a111-000000000122', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.36, 800, 0, NULL, 288, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000302', 'e1c11111-1111-4111-a111-000000000123', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.44, 72, 0, NULL, 103.68, 0),
    ('e1e11111-1111-4111-a111-000000000303', 'e1c11111-1111-4111-a111-000000000123', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.15, 650, 0, NULL, 97.5, 1),
    ('e1e11111-1111-4111-a111-000000000304', 'e1c11111-1111-4111-a111-000000000123', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.03, 2200, 0, NULL, 66, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000305', 'e1c11111-1111-4111-a111-000000000124', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.79, 1250, 0, NULL, 987.5, 0),
    ('e1e11111-1111-4111-a111-000000000306', 'e1c11111-1111-4111-a111-000000000124', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.31, 1200, 0, NULL, 372, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000307', 'e1c11111-1111-4111-a111-000000000125', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.72, 4800, 5, NULL, 3628.8, 0),
    ('e1e11111-1111-4111-a111-000000000308', 'e1c11111-1111-4111-a111-000000000125', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.29, 1150, 0, NULL, 333.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000309', 'e1c11111-1111-4111-a111-000000000126', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.04, 485000, 0, NULL, 989400, 0),
    ('e1e11111-1111-4111-a111-000000000310', 'e1c11111-1111-4111-a111-000000000126', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.21, 850, 0, NULL, 178.5, 1),
    ('e1e11111-1111-4111-a111-000000000311', 'e1c11111-1111-4111-a111-000000000126', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.06, 1800, 0, NULL, 108, 2),
    ('e1e11111-1111-4111-a111-000000000312', 'e1c11111-1111-4111-a111-000000000126', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.1, 165000, 0, NULL, 16500, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000313', 'e1c11111-1111-4111-a111-000000000127', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 0.97, 890, 0, NULL, 863.3, 0),
    ('e1e11111-1111-4111-a111-000000000314', 'e1c11111-1111-4111-a111-000000000127', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.27, 900, 0, NULL, 243, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000315', 'e1c11111-1111-4111-a111-000000000128', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.56, 285, 0, NULL, 729.6, 0),
    ('e1e11111-1111-4111-a111-000000000316', 'e1c11111-1111-4111-a111-000000000128', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.16, 950, 0, NULL, 152, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000317', 'e1c11111-1111-4111-a111-000000000129', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.63, 1450, 0, NULL, 2363.5, 0),
    ('e1e11111-1111-4111-a111-000000000318', 'e1c11111-1111-4111-a111-000000000129', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.29, 1100, 0, NULL, 319, 1),
    ('e1e11111-1111-4111-a111-000000000319', 'e1c11111-1111-4111-a111-000000000129', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000320', 'e1c11111-1111-4111-a111-000000000130', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.67, 1650, 5, NULL, 4625.78, 0),
    ('e1e11111-1111-4111-a111-000000000321', 'e1c11111-1111-4111-a111-000000000130', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.21, 1050, 0, NULL, 220.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000322', 'e1c11111-1111-4111-a111-000000000131', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.18, 42, 0, NULL, 49.56, 0),
    ('e1e11111-1111-4111-a111-000000000323', 'e1c11111-1111-4111-a111-000000000131', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.25, 800, 0, NULL, 200, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000324', 'e1c11111-1111-4111-a111-000000000132', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 0.52, 68, 0, NULL, 35.36, 0),
    ('e1e11111-1111-4111-a111-000000000325', 'e1c11111-1111-4111-a111-000000000132', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.09, 650, 0, NULL, 58.5, 1),
    ('e1e11111-1111-4111-a111-000000000326', 'e1c11111-1111-4111-a111-000000000132', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000327', 'e1c11111-1111-4111-a111-000000000133', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.43, 320, 0, NULL, 457.6, 0),
    ('e1e11111-1111-4111-a111-000000000328', 'e1c11111-1111-4111-a111-000000000133', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.13, 1200, 0, NULL, 156, 1),
    ('e1e11111-1111-4111-a111-000000000329', 'e1c11111-1111-4111-a111-000000000133', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.09, 320000, 0, NULL, 28800, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000330', 'e1c11111-1111-4111-a111-000000000134', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.38, 4200, 0, NULL, 5796, 0),
    ('e1e11111-1111-4111-a111-000000000331', 'e1c11111-1111-4111-a111-000000000134', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.2, 1150, 0, NULL, 230, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000332', 'e1c11111-1111-4111-a111-000000000135', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 2.31, 520, 5, NULL, 1261.26, 0),
    ('e1e11111-1111-4111-a111-000000000333', 'e1c11111-1111-4111-a111-000000000135', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.16, 850, 0, NULL, 136, 1),
    ('e1e11111-1111-4111-a111-000000000334', 'e1c11111-1111-4111-a111-000000000135', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.07, 2200, 0, NULL, 154, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000335', 'e1c11111-1111-4111-a111-000000000136', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.24, 48, 0, NULL, 107.52, 0),
    ('e1e11111-1111-4111-a111-000000000336', 'e1c11111-1111-4111-a111-000000000136', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.2, 900, 0, NULL, 180, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000337', 'e1c11111-1111-4111-a111-000000000137', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 2.41, 850, 0, NULL, 2048.5, 0),
    ('e1e11111-1111-4111-a111-000000000338', 'e1c11111-1111-4111-a111-000000000137', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.19, 950, 0, NULL, 180.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000339', 'e1c11111-1111-4111-a111-000000000138', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.53, 680, 0, NULL, 1720.4, 0),
    ('e1e11111-1111-4111-a111-000000000340', 'e1c11111-1111-4111-a111-000000000138', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.19, 1100, 0, NULL, 209, 1),
    ('e1e11111-1111-4111-a111-000000000341', 'e1c11111-1111-4111-a111-000000000138', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.1, 1800, 0, NULL, 180, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000342', 'e1c11111-1111-4111-a111-000000000139', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.65, 72, 0, NULL, 190.8, 0),
    ('e1e11111-1111-4111-a111-000000000343', 'e1c11111-1111-4111-a111-000000000139', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.29, 1050, 0, NULL, 304.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000344', 'e1c11111-1111-4111-a111-000000000140', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 1.17, 1250, 5, NULL, 1535.63, 0),
    ('e1e11111-1111-4111-a111-000000000345', 'e1c11111-1111-4111-a111-000000000140', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.38, 800, 0, NULL, 304, 1),
    ('e1e11111-1111-4111-a111-000000000346', 'e1c11111-1111-4111-a111-000000000140', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.06, 185000, 0, NULL, 11100, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000347', 'e1c11111-1111-4111-a111-000000000141', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.9, 4800, 0, NULL, 4320, 0),
    ('e1e11111-1111-4111-a111-000000000348', 'e1c11111-1111-4111-a111-000000000141', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.15, 650, 0, NULL, 97.5, 1),
    ('e1e11111-1111-4111-a111-000000000349', 'e1c11111-1111-4111-a111-000000000141', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000350', 'e1c11111-1111-4111-a111-000000000142', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.38, 485000, 0, NULL, 1154300, 0),
    ('e1e11111-1111-4111-a111-000000000351', 'e1c11111-1111-4111-a111-000000000142', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.21, 1200, 0, NULL, 252, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000352', 'e1c11111-1111-4111-a111-000000000143', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.14, 890, 0, NULL, 1014.6, 0),
    ('e1e11111-1111-4111-a111-000000000353', 'e1c11111-1111-4111-a111-000000000143', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.32, 1150, 0, NULL, 368, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000354', 'e1c11111-1111-4111-a111-000000000144', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.6, 285, 0, NULL, 741, 0),
    ('e1e11111-1111-4111-a111-000000000355', 'e1c11111-1111-4111-a111-000000000144', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.26, 850, 0, NULL, 221, 1),
    ('e1e11111-1111-4111-a111-000000000356', 'e1c11111-1111-4111-a111-000000000144', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.13, 1800, 0, NULL, 234, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000357', 'e1c11111-1111-4111-a111-000000000145', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.11, 1450, 5, NULL, 3212.48, 0),
    ('e1e11111-1111-4111-a111-000000000358', 'e1c11111-1111-4111-a111-000000000145', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.25, 900, 0, NULL, 225, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000359', 'e1c11111-1111-4111-a111-000000000146', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.04, 1650, 0, NULL, 1716, 0),
    ('e1e11111-1111-4111-a111-000000000360', 'e1c11111-1111-4111-a111-000000000146', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.35, 950, 0, NULL, 332.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000361', 'e1c11111-1111-4111-a111-000000000147', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.57, 42, 0, NULL, 65.94, 0),
    ('e1e11111-1111-4111-a111-000000000362', 'e1c11111-1111-4111-a111-000000000147', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.34, 1100, 0, NULL, 374, 1),
    ('e1e11111-1111-4111-a111-000000000363', 'e1c11111-1111-4111-a111-000000000147', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2),
    ('e1e11111-1111-4111-a111-000000000364', 'e1c11111-1111-4111-a111-000000000147', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.12, 220000, 0, NULL, 26400, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000365', 'e1c11111-1111-4111-a111-000000000148', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 0.79, 68, 0, NULL, 53.72, 0),
    ('e1e11111-1111-4111-a111-000000000366', 'e1c11111-1111-4111-a111-000000000148', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.27, 1050, 0, NULL, 283.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000367', 'e1c11111-1111-4111-a111-000000000149', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.49, 320, 0, NULL, 796.8, 0),
    ('e1e11111-1111-4111-a111-000000000368', 'e1c11111-1111-4111-a111-000000000149', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.32, 800, 0, NULL, 256, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000369', 'e1c11111-1111-4111-a111-000000000150', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 2.61, 4200, 5, NULL, 11510.1, 0),
    ('e1e11111-1111-4111-a111-000000000370', 'e1c11111-1111-4111-a111-000000000150', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.25, 650, 0, NULL, 162.5, 1),
    ('e1e11111-1111-4111-a111-000000000371', 'e1c11111-1111-4111-a111-000000000150', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.09, 1800, 0, NULL, 162, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000372', 'e1c11111-1111-4111-a111-000000000151', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 0.66, 520, 0, NULL, 343.2, 0),
    ('e1e11111-1111-4111-a111-000000000373', 'e1c11111-1111-4111-a111-000000000151', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.42, 1200, 0, NULL, 504, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000374', 'e1c11111-1111-4111-a111-000000000152', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 0.6, 48, 0, NULL, 28.8, 0),
    ('e1e11111-1111-4111-a111-000000000375', 'e1c11111-1111-4111-a111-000000000152', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.19, 1150, 0, NULL, 218.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000376', 'e1c11111-1111-4111-a111-000000000153', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.78, 850, 0, NULL, 663, 0),
    ('e1e11111-1111-4111-a111-000000000377', 'e1c11111-1111-4111-a111-000000000153', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.29, 850, 0, NULL, 246.5, 1),
    ('e1e11111-1111-4111-a111-000000000378', 'e1c11111-1111-4111-a111-000000000153', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.05, 2200, 0, NULL, 110, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000379', 'e1c11111-1111-4111-a111-000000000154', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.61, 680, 0, NULL, 1774.8, 0),
    ('e1e11111-1111-4111-a111-000000000380', 'e1c11111-1111-4111-a111-000000000154', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.22, 900, 0, NULL, 198, 1),
    ('e1e11111-1111-4111-a111-000000000381', 'e1c11111-1111-4111-a111-000000000154', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.05, 450000, 0, NULL, 22500, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000382', 'e1c11111-1111-4111-a111-000000000155', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.17, 72, 5, NULL, 164.05, 0),
    ('e1e11111-1111-4111-a111-000000000383', 'e1c11111-1111-4111-a111-000000000155', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.39, 950, 0, NULL, 370.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000384', 'e1c11111-1111-4111-a111-000000000156', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.78, 1250, 0, NULL, 975, 0),
    ('e1e11111-1111-4111-a111-000000000385', 'e1c11111-1111-4111-a111-000000000156', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.29, 1100, 0, NULL, 319, 1),
    ('e1e11111-1111-4111-a111-000000000386', 'e1c11111-1111-4111-a111-000000000156', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000387', 'e1c11111-1111-4111-a111-000000000157', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 2.29, 4800, 0, NULL, 10992, 0),
    ('e1e11111-1111-4111-a111-000000000388', 'e1c11111-1111-4111-a111-000000000157', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.16, 1050, 0, NULL, 168, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000389', 'e1c11111-1111-4111-a111-000000000158', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.61, 485000, 0, NULL, 1265850, 0),
    ('e1e11111-1111-4111-a111-000000000390', 'e1c11111-1111-4111-a111-000000000158', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.33, 800, 0, NULL, 264, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000391', 'e1c11111-1111-4111-a111-000000000159', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 0.66, 890, 0, NULL, 587.4, 0),
    ('e1e11111-1111-4111-a111-000000000392', 'e1c11111-1111-4111-a111-000000000159', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.38, 650, 0, NULL, 247, 1),
    ('e1e11111-1111-4111-a111-000000000393', 'e1c11111-1111-4111-a111-000000000159', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000394', 'e1c11111-1111-4111-a111-000000000160', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.43, 285, 5, NULL, 427.93, 0),
    ('e1e11111-1111-4111-a111-000000000395', 'e1c11111-1111-4111-a111-000000000160', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.11, 1200, 0, NULL, 132, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000396', 'e1c11111-1111-4111-a111-000000000161', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.25, 1450, 0, NULL, 3262.5, 0),
    ('e1e11111-1111-4111-a111-000000000397', 'e1c11111-1111-4111-a111-000000000161', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.29, 1150, 0, NULL, 333.5, 1),
    ('e1e11111-1111-4111-a111-000000000398', 'e1c11111-1111-4111-a111-000000000161', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.11, 165000, 0, NULL, 18150, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000399', 'e1c11111-1111-4111-a111-000000000162', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.98, 1650, 0, NULL, 3267, 0),
    ('e1e11111-1111-4111-a111-000000000400', 'e1c11111-1111-4111-a111-000000000162', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.27, 850, 0, NULL, 229.5, 1),
    ('e1e11111-1111-4111-a111-000000000401', 'e1c11111-1111-4111-a111-000000000162', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.09, 1800, 0, NULL, 162, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000402', 'e1c11111-1111-4111-a111-000000000163', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 2.14, 42, 0, NULL, 89.88, 0),
    ('e1e11111-1111-4111-a111-000000000403', 'e1c11111-1111-4111-a111-000000000163', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.17, 900, 0, NULL, 153, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000404', 'e1c11111-1111-4111-a111-000000000164', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 0.72, 68, 0, NULL, 48.96, 0),
    ('e1e11111-1111-4111-a111-000000000405', 'e1c11111-1111-4111-a111-000000000164', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.09, 950, 0, NULL, 85.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000406', 'e1c11111-1111-4111-a111-000000000165', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 0.83, 320, 5, NULL, 278.88, 0),
    ('e1e11111-1111-4111-a111-000000000407', 'e1c11111-1111-4111-a111-000000000165', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.26, 1100, 0, NULL, 286, 1),
    ('e1e11111-1111-4111-a111-000000000408', 'e1c11111-1111-4111-a111-000000000165', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.09, 2200, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000409', 'e1c11111-1111-4111-a111-000000000166', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 0.67, 4200, 0, NULL, 2814, 0),
    ('e1e11111-1111-4111-a111-000000000410', 'e1c11111-1111-4111-a111-000000000166', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.12, 1050, 0, NULL, 126, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000411', 'e1c11111-1111-4111-a111-000000000167', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.09, 520, 0, NULL, 566.8, 0),
    ('e1e11111-1111-4111-a111-000000000412', 'e1c11111-1111-4111-a111-000000000167', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.4, 800, 0, NULL, 320, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000413', 'e1c11111-1111-4111-a111-000000000168', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.18, 48, 0, NULL, 104.64, 0),
    ('e1e11111-1111-4111-a111-000000000414', 'e1c11111-1111-4111-a111-000000000168', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.19, 650, 0, NULL, 123.5, 1),
    ('e1e11111-1111-4111-a111-000000000415', 'e1c11111-1111-4111-a111-000000000168', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.03, 1800, 0, NULL, 54, 2),
    ('e1e11111-1111-4111-a111-000000000416', 'e1c11111-1111-4111-a111-000000000168', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.09, 320000, 0, NULL, 28800, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000417', 'e1c11111-1111-4111-a111-000000000169', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.9, 850, 0, NULL, 1615, 0),
    ('e1e11111-1111-4111-a111-000000000418', 'e1c11111-1111-4111-a111-000000000169', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.22, 1200, 0, NULL, 264, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000419', 'e1c11111-1111-4111-a111-000000000170', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 1.35, 680, 5, NULL, 963.9, 0),
    ('e1e11111-1111-4111-a111-000000000420', 'e1c11111-1111-4111-a111-000000000170', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.4, 1150, 0, NULL, 460, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000421', 'e1c11111-1111-4111-a111-000000000171', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.5, 72, 0, NULL, 180, 0),
    ('e1e11111-1111-4111-a111-000000000422', 'e1c11111-1111-4111-a111-000000000171', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.1, 850, 0, NULL, 85, 1),
    ('e1e11111-1111-4111-a111-000000000423', 'e1c11111-1111-4111-a111-000000000171', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.12, 2200, 0, NULL, 264, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000424', 'e1c11111-1111-4111-a111-000000000172', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 1.59, 1250, 0, NULL, 1987.5, 0),
    ('e1e11111-1111-4111-a111-000000000425', 'e1c11111-1111-4111-a111-000000000172', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.35, 900, 0, NULL, 315, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000426', 'e1c11111-1111-4111-a111-000000000173', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 1.29, 4800, 0, NULL, 6192, 0),
    ('e1e11111-1111-4111-a111-000000000427', 'e1c11111-1111-4111-a111-000000000173', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.19, 950, 0, NULL, 180.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000428', 'e1c11111-1111-4111-a111-000000000174', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.43, 485000, 0, NULL, 1178550, 0),
    ('e1e11111-1111-4111-a111-000000000429', 'e1c11111-1111-4111-a111-000000000174', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.38, 1100, 0, NULL, 418, 1),
    ('e1e11111-1111-4111-a111-000000000430', 'e1c11111-1111-4111-a111-000000000174', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.1, 1800, 0, NULL, 180, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000431', 'e1c11111-1111-4111-a111-000000000175', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 2.56, 890, 5, NULL, 2392.32, 0),
    ('e1e11111-1111-4111-a111-000000000432', 'e1c11111-1111-4111-a111-000000000175', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.14, 1050, 0, NULL, 147, 1),
    ('e1e11111-1111-4111-a111-000000000433', 'e1c11111-1111-4111-a111-000000000175', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.08, 185000, 0, NULL, 14800, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000434', 'e1c11111-1111-4111-a111-000000000176', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.74, 285, 0, NULL, 210.9, 0),
    ('e1e11111-1111-4111-a111-000000000435', 'e1c11111-1111-4111-a111-000000000176', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.37, 800, 0, NULL, 296, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000436', 'e1c11111-1111-4111-a111-000000000177', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.44, 1450, 0, NULL, 2088, 0),
    ('e1e11111-1111-4111-a111-000000000437', 'e1c11111-1111-4111-a111-000000000177', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.11, 650, 0, NULL, 71.5, 1),
    ('e1e11111-1111-4111-a111-000000000438', 'e1c11111-1111-4111-a111-000000000177', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000439', 'e1c11111-1111-4111-a111-000000000178', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 0.97, 1650, 0, NULL, 1600.5, 0),
    ('e1e11111-1111-4111-a111-000000000440', 'e1c11111-1111-4111-a111-000000000178', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.36, 1200, 0, NULL, 432, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000441', 'e1c11111-1111-4111-a111-000000000179', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.94, 42, 0, NULL, 39.48, 0),
    ('e1e11111-1111-4111-a111-000000000442', 'e1c11111-1111-4111-a111-000000000179', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.28, 1150, 0, NULL, 322, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000443', 'e1c11111-1111-4111-a111-000000000180', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 2.51, 68, 5, NULL, 179.21, 0),
    ('e1e11111-1111-4111-a111-000000000444', 'e1c11111-1111-4111-a111-000000000180', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.16, 850, 0, NULL, 136, 1),
    ('e1e11111-1111-4111-a111-000000000445', 'e1c11111-1111-4111-a111-000000000180', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.14, 1800, 0, NULL, 252, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000446', 'e1c11111-1111-4111-a111-000000000181', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.43, 320, 0, NULL, 457.6, 0),
    ('e1e11111-1111-4111-a111-000000000447', 'e1c11111-1111-4111-a111-000000000181', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.18, 900, 0, NULL, 162, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000448', 'e1c11111-1111-4111-a111-000000000182', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 0.92, 4200, 0, NULL, 3864, 0),
    ('e1e11111-1111-4111-a111-000000000449', 'e1c11111-1111-4111-a111-000000000182', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.36, 950, 0, NULL, 342, 1),
    ('e1e11111-1111-4111-a111-000000000450', 'e1c11111-1111-4111-a111-000000000182', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.1, 220000, 0, NULL, 22000, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000451', 'e1c11111-1111-4111-a111-000000000183', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 0.51, 520, 0, NULL, 265.2, 0),
    ('e1e11111-1111-4111-a111-000000000452', 'e1c11111-1111-4111-a111-000000000183', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.36, 1100, 0, NULL, 396, 1),
    ('e1e11111-1111-4111-a111-000000000453', 'e1c11111-1111-4111-a111-000000000183', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.03, 2200, 0, NULL, 66, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000454', 'e1c11111-1111-4111-a111-000000000184', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.37, 48, 0, NULL, 113.76, 0),
    ('e1e11111-1111-4111-a111-000000000455', 'e1c11111-1111-4111-a111-000000000184', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.14, 1050, 0, NULL, 147, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000456', 'e1c11111-1111-4111-a111-000000000185', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.18, 850, 5, NULL, 1053.15, 0),
    ('e1e11111-1111-4111-a111-000000000457', 'e1c11111-1111-4111-a111-000000000185', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.24, 800, 0, NULL, 192, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000458', 'e1c11111-1111-4111-a111-000000000186', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 0.81, 680, 0, NULL, 550.8, 0),
    ('e1e11111-1111-4111-a111-000000000459', 'e1c11111-1111-4111-a111-000000000186', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.42, 650, 0, NULL, 273, 1),
    ('e1e11111-1111-4111-a111-000000000460', 'e1c11111-1111-4111-a111-000000000186', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.11, 1800, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000461', 'e1c11111-1111-4111-a111-000000000187', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1, 72, 0, NULL, 72, 0),
    ('e1e11111-1111-4111-a111-000000000462', 'e1c11111-1111-4111-a111-000000000187', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.31, 1200, 0, NULL, 372, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000463', 'e1c11111-1111-4111-a111-000000000188', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 2.13, 1250, 0, NULL, 2662.5, 0),
    ('e1e11111-1111-4111-a111-000000000464', 'e1c11111-1111-4111-a111-000000000188', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.37, 1150, 0, NULL, 425.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000465', 'e1c11111-1111-4111-a111-000000000189', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 2.63, 4800, 0, NULL, 12624, 0),
    ('e1e11111-1111-4111-a111-000000000466', 'e1c11111-1111-4111-a111-000000000189', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.12, 850, 0, NULL, 102, 1),
    ('e1e11111-1111-4111-a111-000000000467', 'e1c11111-1111-4111-a111-000000000189', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.02, 2200, 0, NULL, 44, 2),
    ('e1e11111-1111-4111-a111-000000000468', 'e1c11111-1111-4111-a111-000000000189', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.02, 450000, 0, NULL, 9000, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000469', 'e1c11111-1111-4111-a111-000000000190', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.18, 485000, 5, NULL, 600915, 0),
    ('e1e11111-1111-4111-a111-000000000470', 'e1c11111-1111-4111-a111-000000000190', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.17, 900, 0, NULL, 153, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000471', 'e1c11111-1111-4111-a111-000000000191', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.76, 890, 0, NULL, 1566.4, 0),
    ('e1e11111-1111-4111-a111-000000000472', 'e1c11111-1111-4111-a111-000000000191', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.3, 950, 0, NULL, 285, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000473', 'e1c11111-1111-4111-a111-000000000192', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.74, 285, 0, NULL, 495.9, 0),
    ('e1e11111-1111-4111-a111-000000000474', 'e1c11111-1111-4111-a111-000000000192', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.38, 1100, 0, NULL, 418, 1),
    ('e1e11111-1111-4111-a111-000000000475', 'e1c11111-1111-4111-a111-000000000192', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.06, 1800, 0, NULL, 108, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000476', 'e1c11111-1111-4111-a111-000000000193', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.57, 1450, 0, NULL, 3726.5, 0),
    ('e1e11111-1111-4111-a111-000000000477', 'e1c11111-1111-4111-a111-000000000193', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.29, 1050, 0, NULL, 304.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000478', 'e1c11111-1111-4111-a111-000000000194', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.45, 1650, 0, NULL, 4042.5, 0),
    ('e1e11111-1111-4111-a111-000000000479', 'e1c11111-1111-4111-a111-000000000194', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.08, 800, 0, NULL, 64, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000480', 'e1c11111-1111-4111-a111-000000000195', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 2.3, 42, 5, NULL, 101.43, 0),
    ('e1e11111-1111-4111-a111-000000000481', 'e1c11111-1111-4111-a111-000000000195', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.21, 650, 0, NULL, 136.5, 1),
    ('e1e11111-1111-4111-a111-000000000482', 'e1c11111-1111-4111-a111-000000000195', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.12, 2200, 0, NULL, 264, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000483', 'e1c11111-1111-4111-a111-000000000196', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 2.2, 68, 0, NULL, 149.6, 0),
    ('e1e11111-1111-4111-a111-000000000484', 'e1c11111-1111-4111-a111-000000000196', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.24, 1200, 0, NULL, 288, 1),
    ('e1e11111-1111-4111-a111-000000000485', 'e1c11111-1111-4111-a111-000000000196', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.06, 165000, 0, NULL, 9900, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000486', 'e1c11111-1111-4111-a111-000000000197', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 0.68, 320, 0, NULL, 217.6, 0),
    ('e1e11111-1111-4111-a111-000000000487', 'e1c11111-1111-4111-a111-000000000197', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.33, 1150, 0, NULL, 379.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000488', 'e1c11111-1111-4111-a111-000000000198', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 2.69, 4200, 0, NULL, 11298, 0),
    ('e1e11111-1111-4111-a111-000000000489', 'e1c11111-1111-4111-a111-000000000198', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.26, 850, 0, NULL, 221, 1),
    ('e1e11111-1111-4111-a111-000000000490', 'e1c11111-1111-4111-a111-000000000198', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.02, 1800, 0, NULL, 36, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000491', 'e1c11111-1111-4111-a111-000000000199', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.4, 520, 0, NULL, 728, 0),
    ('e1e11111-1111-4111-a111-000000000492', 'e1c11111-1111-4111-a111-000000000199', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.34, 900, 0, NULL, 306, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000493', 'e1c11111-1111-4111-a111-000000000200', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 0.82, 48, 5, NULL, 41.33, 0),
    ('e1e11111-1111-4111-a111-000000000494', 'e1c11111-1111-4111-a111-000000000200', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.36, 950, 0, NULL, 342, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000495', 'e1c11111-1111-4111-a111-000000000201', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 2.04, 850, 0, NULL, 1734, 0),
    ('e1e11111-1111-4111-a111-000000000496', 'e1c11111-1111-4111-a111-000000000201', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.17, 1100, 0, NULL, 187, 1),
    ('e1e11111-1111-4111-a111-000000000497', 'e1c11111-1111-4111-a111-000000000201', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.04, 2200, 0, NULL, 88, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000498', 'e1c11111-1111-4111-a111-000000000202', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 0.92, 680, 0, NULL, 625.6, 0),
    ('e1e11111-1111-4111-a111-000000000499', 'e1c11111-1111-4111-a111-000000000202', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.32, 1050, 0, NULL, 336, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000500', 'e1c11111-1111-4111-a111-000000000203', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.53, 72, 0, NULL, 182.16, 0),
    ('e1e11111-1111-4111-a111-000000000501', 'e1c11111-1111-4111-a111-000000000203', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.29, 800, 0, NULL, 232, 1),
    ('e1e11111-1111-4111-a111-000000000502', 'e1c11111-1111-4111-a111-000000000203', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.09, 320000, 0, NULL, 28800, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000503', 'e1c11111-1111-4111-a111-000000000204', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 1.92, 1250, 0, NULL, 2400, 0),
    ('e1e11111-1111-4111-a111-000000000504', 'e1c11111-1111-4111-a111-000000000204', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.33, 650, 0, NULL, 214.5, 1),
    ('e1e11111-1111-4111-a111-000000000505', 'e1c11111-1111-4111-a111-000000000204', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.13, 1800, 0, NULL, 234, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000506', 'e1c11111-1111-4111-a111-000000000205', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 1.9, 4800, 5, NULL, 9576, 0),
    ('e1e11111-1111-4111-a111-000000000507', 'e1c11111-1111-4111-a111-000000000205', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.14, 1200, 0, NULL, 168, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000508', 'e1c11111-1111-4111-a111-000000000206', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.39, 485000, 0, NULL, 1159150, 0),
    ('e1e11111-1111-4111-a111-000000000509', 'e1c11111-1111-4111-a111-000000000206', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.16, 1150, 0, NULL, 184, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000510', 'e1c11111-1111-4111-a111-000000000207', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.47, 890, 0, NULL, 1308.3, 0),
    ('e1e11111-1111-4111-a111-000000000511', 'e1c11111-1111-4111-a111-000000000207', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.1, 850, 0, NULL, 85, 1),
    ('e1e11111-1111-4111-a111-000000000512', 'e1c11111-1111-4111-a111-000000000207', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000513', 'e1c11111-1111-4111-a111-000000000208', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.68, 285, 0, NULL, 763.8, 0),
    ('e1e11111-1111-4111-a111-000000000514', 'e1c11111-1111-4111-a111-000000000208', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.14, 900, 0, NULL, 126, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000515', 'e1c11111-1111-4111-a111-000000000209', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.36, 1450, 0, NULL, 1972, 0),
    ('e1e11111-1111-4111-a111-000000000516', 'e1c11111-1111-4111-a111-000000000209', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.17, 950, 0, NULL, 161.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000517', 'e1c11111-1111-4111-a111-000000000210', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.96, 1650, 5, NULL, 3395.7, 0),
    ('e1e11111-1111-4111-a111-000000000518', 'e1c11111-1111-4111-a111-000000000210', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.27, 1100, 0, NULL, 297, 1),
    ('e1e11111-1111-4111-a111-000000000519', 'e1c11111-1111-4111-a111-000000000210', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2),
    ('e1e11111-1111-4111-a111-000000000520', 'e1c11111-1111-4111-a111-000000000210', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.1, 185000, 0, NULL, 18500, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000521', 'e1c11111-1111-4111-a111-000000000211', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.93, 42, 0, NULL, 81.06, 0),
    ('e1e11111-1111-4111-a111-000000000522', 'e1c11111-1111-4111-a111-000000000211', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.25, 1050, 0, NULL, 262.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000523', 'e1c11111-1111-4111-a111-000000000212', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 0.63, 68, 0, NULL, 42.84, 0),
    ('e1e11111-1111-4111-a111-000000000524', 'e1c11111-1111-4111-a111-000000000212', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.19, 800, 0, NULL, 152, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000525', 'e1c11111-1111-4111-a111-000000000213', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.18, 320, 0, NULL, 697.6, 0),
    ('e1e11111-1111-4111-a111-000000000526', 'e1c11111-1111-4111-a111-000000000213', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.14, 650, 0, NULL, 91, 1),
    ('e1e11111-1111-4111-a111-000000000527', 'e1c11111-1111-4111-a111-000000000213', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.05, 2200, 0, NULL, 110, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000528', 'e1c11111-1111-4111-a111-000000000214', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.76, 4200, 0, NULL, 7392, 0),
    ('e1e11111-1111-4111-a111-000000000529', 'e1c11111-1111-4111-a111-000000000214', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.29, 1200, 0, NULL, 348, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000530', 'e1c11111-1111-4111-a111-000000000215', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.39, 520, 5, NULL, 758.94, 0),
    ('e1e11111-1111-4111-a111-000000000531', 'e1c11111-1111-4111-a111-000000000215', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.32, 1150, 0, NULL, 368, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000532', 'e1c11111-1111-4111-a111-000000000216', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.59, 48, 0, NULL, 124.32, 0),
    ('e1e11111-1111-4111-a111-000000000533', 'e1c11111-1111-4111-a111-000000000216', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.23, 850, 0, NULL, 195.5, 1),
    ('e1e11111-1111-4111-a111-000000000534', 'e1c11111-1111-4111-a111-000000000216', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.03, 1800, 0, NULL, 54, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000535', 'e1c11111-1111-4111-a111-000000000217', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.69, 850, 0, NULL, 586.5, 0),
    ('e1e11111-1111-4111-a111-000000000536', 'e1c11111-1111-4111-a111-000000000217', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.18, 900, 0, NULL, 162, 1),
    ('e1e11111-1111-4111-a111-000000000537', 'e1c11111-1111-4111-a111-000000000217', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.07, 220000, 0, NULL, 15400, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000538', 'e1c11111-1111-4111-a111-000000000218', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 0.54, 680, 0, NULL, 367.2, 0),
    ('e1e11111-1111-4111-a111-000000000539', 'e1c11111-1111-4111-a111-000000000218', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.25, 950, 0, NULL, 237.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000540', 'e1c11111-1111-4111-a111-000000000219', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.48, 72, 0, NULL, 106.56, 0),
    ('e1e11111-1111-4111-a111-000000000541', 'e1c11111-1111-4111-a111-000000000219', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.25, 1100, 0, NULL, 275, 1),
    ('e1e11111-1111-4111-a111-000000000542', 'e1c11111-1111-4111-a111-000000000219', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000543', 'e1c11111-1111-4111-a111-000000000220', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.89, 1250, 5, NULL, 1168.13, 0),
    ('e1e11111-1111-4111-a111-000000000544', 'e1c11111-1111-4111-a111-000000000220', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.35, 1050, 0, NULL, 367.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000545', 'e1c11111-1111-4111-a111-000000000221', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 2.46, 4800, 0, NULL, 11808, 0),
    ('e1e11111-1111-4111-a111-000000000546', 'e1c11111-1111-4111-a111-000000000221', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.2, 800, 0, NULL, 160, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000547', 'e1c11111-1111-4111-a111-000000000222', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.07, 485000, 0, NULL, 1003950, 0),
    ('e1e11111-1111-4111-a111-000000000548', 'e1c11111-1111-4111-a111-000000000222', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.42, 650, 0, NULL, 273, 1),
    ('e1e11111-1111-4111-a111-000000000549', 'e1c11111-1111-4111-a111-000000000222', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.08, 1800, 0, NULL, 144, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000550', 'e1c11111-1111-4111-a111-000000000223', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 0.55, 890, 0, NULL, 489.5, 0),
    ('e1e11111-1111-4111-a111-000000000551', 'e1c11111-1111-4111-a111-000000000223', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.16, 1200, 0, NULL, 192, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000552', 'e1c11111-1111-4111-a111-000000000224', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.87, 285, 0, NULL, 532.95, 0),
    ('e1e11111-1111-4111-a111-000000000553', 'e1c11111-1111-4111-a111-000000000224', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.17, 1150, 0, NULL, 195.5, 1),
    ('e1e11111-1111-4111-a111-000000000554', 'e1c11111-1111-4111-a111-000000000224', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.08, 450000, 0, NULL, 36000, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000555', 'e1c11111-1111-4111-a111-000000000225', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.87, 1450, 5, NULL, 2847.08, 0),
    ('e1e11111-1111-4111-a111-000000000556', 'e1c11111-1111-4111-a111-000000000225', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.33, 850, 0, NULL, 280.5, 1),
    ('e1e11111-1111-4111-a111-000000000557', 'e1c11111-1111-4111-a111-000000000225', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.07, 2200, 0, NULL, 154, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000558', 'e1c11111-1111-4111-a111-000000000226', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.31, 1650, 0, NULL, 2161.5, 0),
    ('e1e11111-1111-4111-a111-000000000559', 'e1c11111-1111-4111-a111-000000000226', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.32, 900, 0, NULL, 288, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000560', 'e1c11111-1111-4111-a111-000000000227', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.14, 42, 0, NULL, 47.88, 0),
    ('e1e11111-1111-4111-a111-000000000561', 'e1c11111-1111-4111-a111-000000000227', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.23, 950, 0, NULL, 218.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000562', 'e1c11111-1111-4111-a111-000000000228', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 2.3, 68, 0, NULL, 156.4, 0),
    ('e1e11111-1111-4111-a111-000000000563', 'e1c11111-1111-4111-a111-000000000228', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.29, 1100, 0, NULL, 319, 1),
    ('e1e11111-1111-4111-a111-000000000564', 'e1c11111-1111-4111-a111-000000000228', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000565', 'e1c11111-1111-4111-a111-000000000229', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.51, 320, 0, NULL, 803.2, 0),
    ('e1e11111-1111-4111-a111-000000000566', 'e1c11111-1111-4111-a111-000000000229', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.36, 1050, 0, NULL, 378, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000567', 'e1c11111-1111-4111-a111-000000000230', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.57, 4200, 5, NULL, 6923.7, 0),
    ('e1e11111-1111-4111-a111-000000000568', 'e1c11111-1111-4111-a111-000000000230', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.18, 800, 0, NULL, 144, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000569', 'e1c11111-1111-4111-a111-000000000231', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 2.54, 520, 0, NULL, 1320.8, 0),
    ('e1e11111-1111-4111-a111-000000000570', 'e1c11111-1111-4111-a111-000000000231', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.19, 650, 0, NULL, 123.5, 1),
    ('e1e11111-1111-4111-a111-000000000571', 'e1c11111-1111-4111-a111-000000000231', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2),
    ('e1e11111-1111-4111-a111-000000000572', 'e1c11111-1111-4111-a111-000000000231', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.11, 165000, 0, NULL, 18150, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000573', 'e1c11111-1111-4111-a111-000000000232', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.65, 48, 0, NULL, 79.2, 0),
    ('e1e11111-1111-4111-a111-000000000574', 'e1c11111-1111-4111-a111-000000000232', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.36, 1200, 0, NULL, 432, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000575', 'e1c11111-1111-4111-a111-000000000233', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 2.39, 850, 0, NULL, 2031.5, 0),
    ('e1e11111-1111-4111-a111-000000000576', 'e1c11111-1111-4111-a111-000000000233', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.18, 1150, 0, NULL, 207, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000577', 'e1c11111-1111-4111-a111-000000000234', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.21, 680, 0, NULL, 1502.8, 0),
    ('e1e11111-1111-4111-a111-000000000578', 'e1c11111-1111-4111-a111-000000000234', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.21, 850, 0, NULL, 178.5, 1),
    ('e1e11111-1111-4111-a111-000000000579', 'e1c11111-1111-4111-a111-000000000234', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.1, 1800, 0, NULL, 180, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000580', 'e1c11111-1111-4111-a111-000000000235', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.32, 72, 5, NULL, 175.39, 0),
    ('e1e11111-1111-4111-a111-000000000581', 'e1c11111-1111-4111-a111-000000000235', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.37, 900, 0, NULL, 333, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000582', 'e1c11111-1111-4111-a111-000000000236', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.85, 1250, 0, NULL, 1062.5, 0),
    ('e1e11111-1111-4111-a111-000000000583', 'e1c11111-1111-4111-a111-000000000236', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.26, 950, 0, NULL, 247, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000584', 'e1c11111-1111-4111-a111-000000000237', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.55, 4800, 0, NULL, 2640, 0),
    ('e1e11111-1111-4111-a111-000000000585', 'e1c11111-1111-4111-a111-000000000237', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.18, 1100, 0, NULL, 198, 1),
    ('e1e11111-1111-4111-a111-000000000586', 'e1c11111-1111-4111-a111-000000000237', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000587', 'e1c11111-1111-4111-a111-000000000238', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.29, 485000, 0, NULL, 625650, 0),
    ('e1e11111-1111-4111-a111-000000000588', 'e1c11111-1111-4111-a111-000000000238', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.3, 1050, 0, NULL, 315, 1),
    ('e1e11111-1111-4111-a111-000000000589', 'e1c11111-1111-4111-a111-000000000238', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.08, 320000, 0, NULL, 25600, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000590', 'e1c11111-1111-4111-a111-000000000239', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 0.54, 890, 0, NULL, 480.6, 0),
    ('e1e11111-1111-4111-a111-000000000591', 'e1c11111-1111-4111-a111-000000000239', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.11, 800, 0, NULL, 88, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000592', 'e1c11111-1111-4111-a111-000000000240', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.53, 285, 5, NULL, 757.1, 0),
    ('e1e11111-1111-4111-a111-000000000593', 'e1c11111-1111-4111-a111-000000000240', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.27, 650, 0, NULL, 175.5, 1),
    ('e1e11111-1111-4111-a111-000000000594', 'e1c11111-1111-4111-a111-000000000240', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.07, 1800, 0, NULL, 126, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000595', 'e1c11111-1111-4111-a111-000000000241', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.9, 1450, 0, NULL, 2755, 0),
    ('e1e11111-1111-4111-a111-000000000596', 'e1c11111-1111-4111-a111-000000000241', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.24, 1200, 0, NULL, 288, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000597', 'e1c11111-1111-4111-a111-000000000242', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.98, 1650, 0, NULL, 3267, 0),
    ('e1e11111-1111-4111-a111-000000000598', 'e1c11111-1111-4111-a111-000000000242', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.39, 1150, 0, NULL, 448.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000599', 'e1c11111-1111-4111-a111-000000000243', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.56, 42, 0, NULL, 23.52, 0),
    ('e1e11111-1111-4111-a111-000000000600', 'e1c11111-1111-4111-a111-000000000243', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.42, 850, 0, NULL, 357, 1),
    ('e1e11111-1111-4111-a111-000000000601', 'e1c11111-1111-4111-a111-000000000243', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.13, 2200, 0, NULL, 286, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000602', 'e1c11111-1111-4111-a111-000000000244', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 2.45, 68, 0, NULL, 166.6, 0),
    ('e1e11111-1111-4111-a111-000000000603', 'e1c11111-1111-4111-a111-000000000244', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.12, 900, 0, NULL, 108, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000604', 'e1c11111-1111-4111-a111-000000000245', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.73, 320, 5, NULL, 581.28, 0),
    ('e1e11111-1111-4111-a111-000000000605', 'e1c11111-1111-4111-a111-000000000245', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.33, 950, 0, NULL, 313.5, 1),
    ('e1e11111-1111-4111-a111-000000000606', 'e1c11111-1111-4111-a111-000000000245', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.03, 185000, 0, NULL, 5550, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000607', 'e1c11111-1111-4111-a111-000000000246', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 2.06, 4200, 0, NULL, 8652, 0),
    ('e1e11111-1111-4111-a111-000000000608', 'e1c11111-1111-4111-a111-000000000246', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.15, 1100, 0, NULL, 165, 1),
    ('e1e11111-1111-4111-a111-000000000609', 'e1c11111-1111-4111-a111-000000000246', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.09, 1800, 0, NULL, 162, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000610', 'e1c11111-1111-4111-a111-000000000247', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.81, 520, 0, NULL, 941.2, 0),
    ('e1e11111-1111-4111-a111-000000000611', 'e1c11111-1111-4111-a111-000000000247', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.11, 1050, 0, NULL, 115.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000612', 'e1c11111-1111-4111-a111-000000000248', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.63, 48, 0, NULL, 78.24, 0),
    ('e1e11111-1111-4111-a111-000000000613', 'e1c11111-1111-4111-a111-000000000248', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.25, 800, 0, NULL, 200, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000614', 'e1c11111-1111-4111-a111-000000000249', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.6, 850, 0, NULL, 510, 0),
    ('e1e11111-1111-4111-a111-000000000615', 'e1c11111-1111-4111-a111-000000000249', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.17, 650, 0, NULL, 110.5, 1),
    ('e1e11111-1111-4111-a111-000000000616', 'e1c11111-1111-4111-a111-000000000249', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000617', 'e1c11111-1111-4111-a111-000000000250', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.62, 680, 5, NULL, 1870.68, 0),
    ('e1e11111-1111-4111-a111-000000000618', 'e1c11111-1111-4111-a111-000000000250', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.33, 1200, 0, NULL, 396, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000619', 'e1c11111-1111-4111-a111-000000000251', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.03, 72, 0, NULL, 74.16, 0),
    ('e1e11111-1111-4111-a111-000000000620', 'e1c11111-1111-4111-a111-000000000251', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.22, 1150, 0, NULL, 253, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000621', 'e1c11111-1111-4111-a111-000000000252', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.53, 1250, 0, NULL, 662.5, 0),
    ('e1e11111-1111-4111-a111-000000000622', 'e1c11111-1111-4111-a111-000000000252', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.2, 850, 0, NULL, 170, 1),
    ('e1e11111-1111-4111-a111-000000000623', 'e1c11111-1111-4111-a111-000000000252', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.11, 1800, 0, NULL, 198, 2),
    ('e1e11111-1111-4111-a111-000000000624', 'e1c11111-1111-4111-a111-000000000252', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.04, 220000, 0, NULL, 8800, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000625', 'e1c11111-1111-4111-a111-000000000253', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 2.14, 4800, 0, NULL, 10272, 0),
    ('e1e11111-1111-4111-a111-000000000626', 'e1c11111-1111-4111-a111-000000000253', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.24, 900, 0, NULL, 216, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000627', 'e1c11111-1111-4111-a111-000000000254', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.59, 485000, 0, NULL, 771150, 0),
    ('e1e11111-1111-4111-a111-000000000628', 'e1c11111-1111-4111-a111-000000000254', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.11, 950, 0, NULL, 104.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000629', 'e1c11111-1111-4111-a111-000000000255', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.75, 890, 5, NULL, 1635.38, 0),
    ('e1e11111-1111-4111-a111-000000000630', 'e1c11111-1111-4111-a111-000000000255', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.26, 1100, 0, NULL, 286, 1),
    ('e1e11111-1111-4111-a111-000000000631', 'e1c11111-1111-4111-a111-000000000255', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.08, 2200, 0, NULL, 176, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000632', 'e1c11111-1111-4111-a111-000000000256', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.98, 285, 0, NULL, 564.3, 0),
    ('e1e11111-1111-4111-a111-000000000633', 'e1c11111-1111-4111-a111-000000000256', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.1, 1050, 0, NULL, 105, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000634', 'e1c11111-1111-4111-a111-000000000257', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.69, 1450, 0, NULL, 2450.5, 0),
    ('e1e11111-1111-4111-a111-000000000635', 'e1c11111-1111-4111-a111-000000000257', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.33, 800, 0, NULL, 264, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000636', 'e1c11111-1111-4111-a111-000000000258', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.34, 1650, 0, NULL, 2211, 0),
    ('e1e11111-1111-4111-a111-000000000637', 'e1c11111-1111-4111-a111-000000000258', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.24, 650, 0, NULL, 156, 1),
    ('e1e11111-1111-4111-a111-000000000638', 'e1c11111-1111-4111-a111-000000000258', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.09, 1800, 0, NULL, 162, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000639', 'e1c11111-1111-4111-a111-000000000259', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.88, 42, 0, NULL, 36.96, 0),
    ('e1e11111-1111-4111-a111-000000000640', 'e1c11111-1111-4111-a111-000000000259', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.26, 1200, 0, NULL, 312, 1),
    ('e1e11111-1111-4111-a111-000000000641', 'e1c11111-1111-4111-a111-000000000259', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.03, 450000, 0, NULL, 13500, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000642', 'e1c11111-1111-4111-a111-000000000260', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.82, 68, 5, NULL, 129.95, 0),
    ('e1e11111-1111-4111-a111-000000000643', 'e1c11111-1111-4111-a111-000000000260', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.4, 1150, 0, NULL, 460, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000644', 'e1c11111-1111-4111-a111-000000000261', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.64, 320, 0, NULL, 844.8, 0),
    ('e1e11111-1111-4111-a111-000000000645', 'e1c11111-1111-4111-a111-000000000261', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.43, 850, 0, NULL, 365.5, 1),
    ('e1e11111-1111-4111-a111-000000000646', 'e1c11111-1111-4111-a111-000000000261', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000647', 'e1c11111-1111-4111-a111-000000000262', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 2.54, 4200, 0, NULL, 10668, 0),
    ('e1e11111-1111-4111-a111-000000000648', 'e1c11111-1111-4111-a111-000000000262', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.26, 900, 0, NULL, 234, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000649', 'e1c11111-1111-4111-a111-000000000263', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 0.93, 520, 0, NULL, 483.6, 0),
    ('e1e11111-1111-4111-a111-000000000650', 'e1c11111-1111-4111-a111-000000000263', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.33, 950, 0, NULL, 313.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000651', 'e1c11111-1111-4111-a111-000000000264', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.82, 48, 0, NULL, 87.36, 0),
    ('e1e11111-1111-4111-a111-000000000652', 'e1c11111-1111-4111-a111-000000000264', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.22, 1100, 0, NULL, 242, 1),
    ('e1e11111-1111-4111-a111-000000000653', 'e1c11111-1111-4111-a111-000000000264', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.05, 1800, 0, NULL, 90, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000654', 'e1c11111-1111-4111-a111-000000000265', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.29, 850, 5, NULL, 1151.33, 0),
    ('e1e11111-1111-4111-a111-000000000655', 'e1c11111-1111-4111-a111-000000000265', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.27, 1050, 0, NULL, 283.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000656', 'e1c11111-1111-4111-a111-000000000266', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 0.85, 680, 0, NULL, 578, 0),
    ('e1e11111-1111-4111-a111-000000000657', 'e1c11111-1111-4111-a111-000000000266', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.1, 800, 0, NULL, 80, 1),
    ('e1e11111-1111-4111-a111-000000000658', 'e1c11111-1111-4111-a111-000000000266', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.03, 165000, 0, NULL, 4950, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000659', 'e1c11111-1111-4111-a111-000000000267', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.53, 72, 0, NULL, 182.16, 0),
    ('e1e11111-1111-4111-a111-000000000660', 'e1c11111-1111-4111-a111-000000000267', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.12, 650, 0, NULL, 78, 1),
    ('e1e11111-1111-4111-a111-000000000661', 'e1c11111-1111-4111-a111-000000000267', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.05, 2200, 0, NULL, 110, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000662', 'e1c11111-1111-4111-a111-000000000268', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 1.05, 1250, 0, NULL, 1312.5, 0),
    ('e1e11111-1111-4111-a111-000000000663', 'e1c11111-1111-4111-a111-000000000268', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.22, 1200, 0, NULL, 264, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000664', 'e1c11111-1111-4111-a111-000000000269', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.74, 4800, 0, NULL, 3552, 0),
    ('e1e11111-1111-4111-a111-000000000665', 'e1c11111-1111-4111-a111-000000000269', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.15, 1150, 0, NULL, 172.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000666', 'e1c11111-1111-4111-a111-000000000270', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 0.62, 485000, 5, NULL, 315735, 0),
    ('e1e11111-1111-4111-a111-000000000667', 'e1c11111-1111-4111-a111-000000000270', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.23, 850, 0, NULL, 195.5, 1),
    ('e1e11111-1111-4111-a111-000000000668', 'e1c11111-1111-4111-a111-000000000270', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.13, 1800, 0, NULL, 234, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000669', 'e1c11111-1111-4111-a111-000000000271', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.39, 890, 0, NULL, 1237.1, 0),
    ('e1e11111-1111-4111-a111-000000000670', 'e1c11111-1111-4111-a111-000000000271', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.42, 900, 0, NULL, 378, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000671', 'e1c11111-1111-4111-a111-000000000272', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.33, 285, 0, NULL, 664.05, 0),
    ('e1e11111-1111-4111-a111-000000000672', 'e1c11111-1111-4111-a111-000000000272', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.2, 950, 0, NULL, 190, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000673', 'e1c11111-1111-4111-a111-000000000273', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 0.83, 1450, 0, NULL, 1203.5, 0),
    ('e1e11111-1111-4111-a111-000000000674', 'e1c11111-1111-4111-a111-000000000273', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.27, 1100, 0, NULL, 297, 1),
    ('e1e11111-1111-4111-a111-000000000675', 'e1c11111-1111-4111-a111-000000000273', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.03, 2200, 0, NULL, 66, 2),
    ('e1e11111-1111-4111-a111-000000000676', 'e1c11111-1111-4111-a111-000000000273', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.05, 320000, 0, NULL, 16000, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000677', 'e1c11111-1111-4111-a111-000000000274', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.37, 1650, 0, NULL, 3910.5, 0),
    ('e1e11111-1111-4111-a111-000000000678', 'e1c11111-1111-4111-a111-000000000274', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.24, 1050, 0, NULL, 252, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000679', 'e1c11111-1111-4111-a111-000000000275', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.87, 42, 5, NULL, 82.47, 0),
    ('e1e11111-1111-4111-a111-000000000680', 'e1c11111-1111-4111-a111-000000000275', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.16, 800, 0, NULL, 128, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000681', 'e1c11111-1111-4111-a111-000000000276', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.93, 68, 0, NULL, 131.24, 0),
    ('e1e11111-1111-4111-a111-000000000682', 'e1c11111-1111-4111-a111-000000000276', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.19, 650, 0, NULL, 123.5, 1),
    ('e1e11111-1111-4111-a111-000000000683', 'e1c11111-1111-4111-a111-000000000276', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.09, 1800, 0, NULL, 162, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000684', 'e1c11111-1111-4111-a111-000000000277', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.19, 320, 0, NULL, 380.8, 0),
    ('e1e11111-1111-4111-a111-000000000685', 'e1c11111-1111-4111-a111-000000000277', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.12, 1200, 0, NULL, 144, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000686', 'e1c11111-1111-4111-a111-000000000278', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.19, 4200, 0, NULL, 4998, 0),
    ('e1e11111-1111-4111-a111-000000000687', 'e1c11111-1111-4111-a111-000000000278', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.38, 1150, 0, NULL, 437, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000688', 'e1c11111-1111-4111-a111-000000000279', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 2.28, 520, 0, NULL, 1185.6, 0),
    ('e1e11111-1111-4111-a111-000000000689', 'e1c11111-1111-4111-a111-000000000279', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.23, 850, 0, NULL, 195.5, 1),
    ('e1e11111-1111-4111-a111-000000000690', 'e1c11111-1111-4111-a111-000000000279', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.07, 2200, 0, NULL, 154, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000691', 'e1c11111-1111-4111-a111-000000000280', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.43, 48, 5, NULL, 122.47, 0),
    ('e1e11111-1111-4111-a111-000000000692', 'e1c11111-1111-4111-a111-000000000280', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.33, 900, 0, NULL, 297, 1),
    ('e1e11111-1111-4111-a111-000000000693', 'e1c11111-1111-4111-a111-000000000280', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.04, 185000, 0, NULL, 7400, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000694', 'e1c11111-1111-4111-a111-000000000281', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.23, 850, 0, NULL, 1045.5, 0),
    ('e1e11111-1111-4111-a111-000000000695', 'e1c11111-1111-4111-a111-000000000281', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.31, 950, 0, NULL, 294.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000696', 'e1c11111-1111-4111-a111-000000000282', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.41, 680, 0, NULL, 1638.8, 0),
    ('e1e11111-1111-4111-a111-000000000697', 'e1c11111-1111-4111-a111-000000000282', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.14, 1100, 0, NULL, 154, 1),
    ('e1e11111-1111-4111-a111-000000000698', 'e1c11111-1111-4111-a111-000000000282', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.07, 1800, 0, NULL, 126, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000699', 'e1c11111-1111-4111-a111-000000000283', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.51, 72, 0, NULL, 108.72, 0),
    ('e1e11111-1111-4111-a111-000000000700', 'e1c11111-1111-4111-a111-000000000283', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.19, 1050, 0, NULL, 199.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000701', 'e1c11111-1111-4111-a111-000000000284', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 2.37, 1250, 0, NULL, 2962.5, 0),
    ('e1e11111-1111-4111-a111-000000000702', 'e1c11111-1111-4111-a111-000000000284', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.42, 800, 0, NULL, 336, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000703', 'e1c11111-1111-4111-a111-000000000285', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 1.11, 4800, 5, NULL, 5594.4, 0),
    ('e1e11111-1111-4111-a111-000000000704', 'e1c11111-1111-4111-a111-000000000285', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.2, 650, 0, NULL, 130, 1),
    ('e1e11111-1111-4111-a111-000000000705', 'e1c11111-1111-4111-a111-000000000285', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.07, 2200, 0, NULL, 154, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000706', 'e1c11111-1111-4111-a111-000000000286', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.44, 485000, 0, NULL, 1183400, 0),
    ('e1e11111-1111-4111-a111-000000000707', 'e1c11111-1111-4111-a111-000000000286', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.13, 1200, 0, NULL, 156, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000708', 'e1c11111-1111-4111-a111-000000000287', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.15, 890, 0, NULL, 1023.5, 0),
    ('e1e11111-1111-4111-a111-000000000709', 'e1c11111-1111-4111-a111-000000000287', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.37, 1150, 0, NULL, 425.5, 1),
    ('e1e11111-1111-4111-a111-000000000710', 'e1c11111-1111-4111-a111-000000000287', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.12, 220000, 0, NULL, 26400, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000711', 'e1c11111-1111-4111-a111-000000000288', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.02, 285, 0, NULL, 575.7, 0),
    ('e1e11111-1111-4111-a111-000000000712', 'e1c11111-1111-4111-a111-000000000288', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.13, 850, 0, NULL, 110.5, 1),
    ('e1e11111-1111-4111-a111-000000000713', 'e1c11111-1111-4111-a111-000000000288', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.08, 1800, 0, NULL, 144, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000714', 'e1c11111-1111-4111-a111-000000000289', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.59, 1450, 0, NULL, 2305.5, 0),
    ('e1e11111-1111-4111-a111-000000000715', 'e1c11111-1111-4111-a111-000000000289', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.3, 900, 0, NULL, 270, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000716', 'e1c11111-1111-4111-a111-000000000290', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.6, 1650, 5, NULL, 2772, 0),
    ('e1e11111-1111-4111-a111-000000000717', 'e1c11111-1111-4111-a111-000000000290', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.19, 950, 0, NULL, 180.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000718', 'e1c11111-1111-4111-a111-000000000291', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 2.36, 42, 0, NULL, 99.12, 0),
    ('e1e11111-1111-4111-a111-000000000719', 'e1c11111-1111-4111-a111-000000000291', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.11, 1100, 0, NULL, 121, 1),
    ('e1e11111-1111-4111-a111-000000000720', 'e1c11111-1111-4111-a111-000000000291', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.02, 2200, 0, NULL, 44, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000721', 'e1c11111-1111-4111-a111-000000000292', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.15, 68, 0, NULL, 78.2, 0),
    ('e1e11111-1111-4111-a111-000000000722', 'e1c11111-1111-4111-a111-000000000292', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.38, 1050, 0, NULL, 399, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000723', 'e1c11111-1111-4111-a111-000000000293', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.68, 320, 0, NULL, 537.6, 0),
    ('e1e11111-1111-4111-a111-000000000724', 'e1c11111-1111-4111-a111-000000000293', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.15, 800, 0, NULL, 120, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000725', 'e1c11111-1111-4111-a111-000000000294', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 0.99, 4200, 0, NULL, 4158, 0),
    ('e1e11111-1111-4111-a111-000000000726', 'e1c11111-1111-4111-a111-000000000294', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.13, 650, 0, NULL, 84.5, 1),
    ('e1e11111-1111-4111-a111-000000000727', 'e1c11111-1111-4111-a111-000000000294', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.13, 1800, 0, NULL, 234, 2),
    ('e1e11111-1111-4111-a111-000000000728', 'e1c11111-1111-4111-a111-000000000294', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.08, 450000, 0, NULL, 36000, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000729', 'e1c11111-1111-4111-a111-000000000295', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 2.54, 520, 5, NULL, 1386.84, 0),
    ('e1e11111-1111-4111-a111-000000000730', 'e1c11111-1111-4111-a111-000000000295', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.25, 1200, 0, NULL, 300, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000731', 'e1c11111-1111-4111-a111-000000000296', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.07, 48, 0, NULL, 99.36, 0),
    ('e1e11111-1111-4111-a111-000000000732', 'e1c11111-1111-4111-a111-000000000296', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.11, 1150, 0, NULL, 126.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000733', 'e1c11111-1111-4111-a111-000000000297', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.65, 850, 0, NULL, 1402.5, 0),
    ('e1e11111-1111-4111-a111-000000000734', 'e1c11111-1111-4111-a111-000000000297', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.08, 850, 0, NULL, 68, 1),
    ('e1e11111-1111-4111-a111-000000000735', 'e1c11111-1111-4111-a111-000000000297', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.1, 2200, 0, NULL, 220, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000736', 'e1c11111-1111-4111-a111-000000000298', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.15, 680, 0, NULL, 1462, 0),
    ('e1e11111-1111-4111-a111-000000000737', 'e1c11111-1111-4111-a111-000000000298', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.3, 900, 0, NULL, 270, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000738', 'e1c11111-1111-4111-a111-000000000299', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.09, 72, 0, NULL, 150.48, 0),
    ('e1e11111-1111-4111-a111-000000000739', 'e1c11111-1111-4111-a111-000000000299', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.2, 950, 0, NULL, 190, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000740', 'e1c11111-1111-4111-a111-000000000300', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.59, 1250, 5, NULL, 774.38, 0),
    ('e1e11111-1111-4111-a111-000000000741', 'e1c11111-1111-4111-a111-000000000300', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.36, 1100, 0, NULL, 396, 1),
    ('e1e11111-1111-4111-a111-000000000742', 'e1c11111-1111-4111-a111-000000000300', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.1, 1800, 0, NULL, 180, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000743', 'e1c11111-1111-4111-a111-000000000301', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.64, 4800, 0, NULL, 3072, 0),
    ('e1e11111-1111-4111-a111-000000000744', 'e1c11111-1111-4111-a111-000000000301', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.23, 1050, 0, NULL, 241.5, 1),
    ('e1e11111-1111-4111-a111-000000000745', 'e1c11111-1111-4111-a111-000000000301', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.04, 165000, 0, NULL, 6600, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000746', 'e1c11111-1111-4111-a111-000000000302', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.55, 485000, 0, NULL, 1236750, 0),
    ('e1e11111-1111-4111-a111-000000000747', 'e1c11111-1111-4111-a111-000000000302', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.4, 800, 0, NULL, 320, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000748', 'e1c11111-1111-4111-a111-000000000303', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.92, 890, 0, NULL, 1708.8, 0),
    ('e1e11111-1111-4111-a111-000000000749', 'e1c11111-1111-4111-a111-000000000303', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.1, 650, 0, NULL, 65, 1),
    ('e1e11111-1111-4111-a111-000000000750', 'e1c11111-1111-4111-a111-000000000303', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.02, 2200, 0, NULL, 44, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000751', 'e1c11111-1111-4111-a111-000000000304', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.16, 285, 0, NULL, 615.6, 0),
    ('e1e11111-1111-4111-a111-000000000752', 'e1c11111-1111-4111-a111-000000000304', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.38, 1200, 0, NULL, 456, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000753', 'e1c11111-1111-4111-a111-000000000305', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.68, 1450, 5, NULL, 2557.8, 0),
    ('e1e11111-1111-4111-a111-000000000754', 'e1c11111-1111-4111-a111-000000000305', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.34, 1150, 0, NULL, 391, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000755', 'e1c11111-1111-4111-a111-000000000306', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.11, 1650, 0, NULL, 1831.5, 0),
    ('e1e11111-1111-4111-a111-000000000756', 'e1c11111-1111-4111-a111-000000000306', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.4, 850, 0, NULL, 340, 1),
    ('e1e11111-1111-4111-a111-000000000757', 'e1c11111-1111-4111-a111-000000000306', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.1, 1800, 0, NULL, 180, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000758', 'e1c11111-1111-4111-a111-000000000307', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.92, 42, 0, NULL, 80.64, 0),
    ('e1e11111-1111-4111-a111-000000000759', 'e1c11111-1111-4111-a111-000000000307', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.16, 900, 0, NULL, 144, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000760', 'e1c11111-1111-4111-a111-000000000308', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.94, 68, 0, NULL, 131.92, 0),
    ('e1e11111-1111-4111-a111-000000000761', 'e1c11111-1111-4111-a111-000000000308', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.13, 950, 0, NULL, 123.5, 1),
    ('e1e11111-1111-4111-a111-000000000762', 'e1c11111-1111-4111-a111-000000000308', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.11, 320000, 0, NULL, 35200, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000763', 'e1c11111-1111-4111-a111-000000000309', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.68, 320, 0, NULL, 857.6, 0),
    ('e1e11111-1111-4111-a111-000000000764', 'e1c11111-1111-4111-a111-000000000309', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.4, 1100, 0, NULL, 440, 1),
    ('e1e11111-1111-4111-a111-000000000765', 'e1c11111-1111-4111-a111-000000000309', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.12, 2200, 0, NULL, 264, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000766', 'e1c11111-1111-4111-a111-000000000310', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.52, 4200, 5, NULL, 6703.2, 0),
    ('e1e11111-1111-4111-a111-000000000767', 'e1c11111-1111-4111-a111-000000000310', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.2, 1050, 0, NULL, 210, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000768', 'e1c11111-1111-4111-a111-000000000311', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 2.65, 520, 0, NULL, 1378, 0),
    ('e1e11111-1111-4111-a111-000000000769', 'e1c11111-1111-4111-a111-000000000311', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.08, 800, 0, NULL, 64, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000770', 'e1c11111-1111-4111-a111-000000000312', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.56, 48, 0, NULL, 74.88, 0),
    ('e1e11111-1111-4111-a111-000000000771', 'e1c11111-1111-4111-a111-000000000312', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.26, 650, 0, NULL, 169, 1),
    ('e1e11111-1111-4111-a111-000000000772', 'e1c11111-1111-4111-a111-000000000312', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.05, 1800, 0, NULL, 90, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000773', 'e1c11111-1111-4111-a111-000000000313', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 2.29, 850, 0, NULL, 1946.5, 0),
    ('e1e11111-1111-4111-a111-000000000774', 'e1c11111-1111-4111-a111-000000000313', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.29, 1200, 0, NULL, 348, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000775', 'e1c11111-1111-4111-a111-000000000314', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.36, 680, 0, NULL, 1604.8, 0),
    ('e1e11111-1111-4111-a111-000000000776', 'e1c11111-1111-4111-a111-000000000314', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.26, 1150, 0, NULL, 299, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000777', 'e1c11111-1111-4111-a111-000000000315', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.91, 72, 5, NULL, 144.4, 0),
    ('e1e11111-1111-4111-a111-000000000778', 'e1c11111-1111-4111-a111-000000000315', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.31, 850, 0, NULL, 263.5, 1),
    ('e1e11111-1111-4111-a111-000000000779', 'e1c11111-1111-4111-a111-000000000315', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.05, 2200, 0, NULL, 110, 2),
    ('e1e11111-1111-4111-a111-000000000780', 'e1c11111-1111-4111-a111-000000000315', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.09, 185000, 0, NULL, 16650, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000781', 'e1c11111-1111-4111-a111-000000000316', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.94, 1250, 0, NULL, 1175, 0),
    ('e1e11111-1111-4111-a111-000000000782', 'e1c11111-1111-4111-a111-000000000316', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.4, 900, 0, NULL, 360, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000783', 'e1c11111-1111-4111-a111-000000000317', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 2.31, 4800, 0, NULL, 11088, 0),
    ('e1e11111-1111-4111-a111-000000000784', 'e1c11111-1111-4111-a111-000000000317', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.25, 950, 0, NULL, 237.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000785', 'e1c11111-1111-4111-a111-000000000318', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 0.91, 485000, 0, NULL, 441350, 0),
    ('e1e11111-1111-4111-a111-000000000786', 'e1c11111-1111-4111-a111-000000000318', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.2, 1100, 0, NULL, 220, 1),
    ('e1e11111-1111-4111-a111-000000000787', 'e1c11111-1111-4111-a111-000000000318', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.03, 1800, 0, NULL, 54, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000788', 'e1c11111-1111-4111-a111-000000000319', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 0.55, 890, 0, NULL, 489.5, 0),
    ('e1e11111-1111-4111-a111-000000000789', 'e1c11111-1111-4111-a111-000000000319', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.39, 1050, 0, NULL, 409.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000790', 'e1c11111-1111-4111-a111-000000000320', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.93, 285, 5, NULL, 577.55, 0),
    ('e1e11111-1111-4111-a111-000000000791', 'e1c11111-1111-4111-a111-000000000320', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.12, 800, 0, NULL, 96, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000792', 'e1c11111-1111-4111-a111-000000000321', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.23, 1450, 0, NULL, 1783.5, 0),
    ('e1e11111-1111-4111-a111-000000000793', 'e1c11111-1111-4111-a111-000000000321', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.24, 650, 0, NULL, 156, 1),
    ('e1e11111-1111-4111-a111-000000000794', 'e1c11111-1111-4111-a111-000000000321', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.12, 2200, 0, NULL, 264, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000795', 'e1c11111-1111-4111-a111-000000000322', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.46, 1650, 0, NULL, 2409, 0),
    ('e1e11111-1111-4111-a111-000000000796', 'e1c11111-1111-4111-a111-000000000322', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.33, 1200, 0, NULL, 396, 1),
    ('e1e11111-1111-4111-a111-000000000797', 'e1c11111-1111-4111-a111-000000000322', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.04, 220000, 0, NULL, 8800, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000798', 'e1c11111-1111-4111-a111-000000000323', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.59, 42, 0, NULL, 24.78, 0),
    ('e1e11111-1111-4111-a111-000000000799', 'e1c11111-1111-4111-a111-000000000323', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.24, 1150, 0, NULL, 276, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000800', 'e1c11111-1111-4111-a111-000000000324', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.91, 68, 0, NULL, 129.88, 0),
    ('e1e11111-1111-4111-a111-000000000801', 'e1c11111-1111-4111-a111-000000000324', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.1, 850, 0, NULL, 85, 1),
    ('e1e11111-1111-4111-a111-000000000802', 'e1c11111-1111-4111-a111-000000000324', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.11, 1800, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000803', 'e1c11111-1111-4111-a111-000000000325', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 0.74, 320, 5, NULL, 248.64, 0),
    ('e1e11111-1111-4111-a111-000000000804', 'e1c11111-1111-4111-a111-000000000325', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.21, 900, 0, NULL, 189, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000805', 'e1c11111-1111-4111-a111-000000000326', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.49, 4200, 0, NULL, 6258, 0),
    ('e1e11111-1111-4111-a111-000000000806', 'e1c11111-1111-4111-a111-000000000326', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.3, 950, 0, NULL, 285, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000807', 'e1c11111-1111-4111-a111-000000000327', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.88, 520, 0, NULL, 977.6, 0),
    ('e1e11111-1111-4111-a111-000000000808', 'e1c11111-1111-4111-a111-000000000327', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.4, 1100, 0, NULL, 440, 1),
    ('e1e11111-1111-4111-a111-000000000809', 'e1c11111-1111-4111-a111-000000000327', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000810', 'e1c11111-1111-4111-a111-000000000328', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.69, 48, 0, NULL, 129.12, 0),
    ('e1e11111-1111-4111-a111-000000000811', 'e1c11111-1111-4111-a111-000000000328', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.17, 1050, 0, NULL, 178.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000812', 'e1c11111-1111-4111-a111-000000000329', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.71, 850, 0, NULL, 603.5, 0),
    ('e1e11111-1111-4111-a111-000000000813', 'e1c11111-1111-4111-a111-000000000329', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.42, 800, 0, NULL, 336, 1),
    ('e1e11111-1111-4111-a111-000000000814', 'e1c11111-1111-4111-a111-000000000329', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.12, 450000, 0, NULL, 54000, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000815', 'e1c11111-1111-4111-a111-000000000330', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 1.1, 680, 5, NULL, 785.4, 0),
    ('e1e11111-1111-4111-a111-000000000816', 'e1c11111-1111-4111-a111-000000000330', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.43, 650, 0, NULL, 279.5, 1),
    ('e1e11111-1111-4111-a111-000000000817', 'e1c11111-1111-4111-a111-000000000330', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.12, 1800, 0, NULL, 216, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000818', 'e1c11111-1111-4111-a111-000000000331', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.19, 72, 0, NULL, 85.68, 0),
    ('e1e11111-1111-4111-a111-000000000819', 'e1c11111-1111-4111-a111-000000000331', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.26, 1200, 0, NULL, 312, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000820', 'e1c11111-1111-4111-a111-000000000332', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 1.83, 1250, 0, NULL, 2287.5, 0),
    ('e1e11111-1111-4111-a111-000000000821', 'e1c11111-1111-4111-a111-000000000332', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.41, 1150, 0, NULL, 471.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000822', 'e1c11111-1111-4111-a111-000000000333', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.83, 4800, 0, NULL, 3984, 0),
    ('e1e11111-1111-4111-a111-000000000823', 'e1c11111-1111-4111-a111-000000000333', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.19, 850, 0, NULL, 161.5, 1),
    ('e1e11111-1111-4111-a111-000000000824', 'e1c11111-1111-4111-a111-000000000333', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.09, 2200, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000825', 'e1c11111-1111-4111-a111-000000000334', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 0.64, 485000, 0, NULL, 310400, 0),
    ('e1e11111-1111-4111-a111-000000000826', 'e1c11111-1111-4111-a111-000000000334', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.21, 900, 0, NULL, 189, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000827', 'e1c11111-1111-4111-a111-000000000335', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.63, 890, 5, NULL, 1523.24, 0),
    ('e1e11111-1111-4111-a111-000000000828', 'e1c11111-1111-4111-a111-000000000335', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.17, 950, 0, NULL, 161.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000829', 'e1c11111-1111-4111-a111-000000000336', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.89, 285, 0, NULL, 253.65, 0),
    ('e1e11111-1111-4111-a111-000000000830', 'e1c11111-1111-4111-a111-000000000336', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.28, 1100, 0, NULL, 308, 1),
    ('e1e11111-1111-4111-a111-000000000831', 'e1c11111-1111-4111-a111-000000000336', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.08, 1800, 0, NULL, 144, 2),
    ('e1e11111-1111-4111-a111-000000000832', 'e1c11111-1111-4111-a111-000000000336', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.07, 165000, 0, NULL, 11550, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000833', 'e1c11111-1111-4111-a111-000000000337', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.61, 1450, 0, NULL, 2334.5, 0),
    ('e1e11111-1111-4111-a111-000000000834', 'e1c11111-1111-4111-a111-000000000337', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.09, 1050, 0, NULL, 94.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000835', 'e1c11111-1111-4111-a111-000000000338', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.51, 1650, 0, NULL, 4141.5, 0),
    ('e1e11111-1111-4111-a111-000000000836', 'e1c11111-1111-4111-a111-000000000338', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.1, 800, 0, NULL, 80, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000837', 'e1c11111-1111-4111-a111-000000000339', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 2.16, 42, 0, NULL, 90.72, 0),
    ('e1e11111-1111-4111-a111-000000000838', 'e1c11111-1111-4111-a111-000000000339', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.25, 650, 0, NULL, 162.5, 1),
    ('e1e11111-1111-4111-a111-000000000839', 'e1c11111-1111-4111-a111-000000000339', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.05, 2200, 0, NULL, 110, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000840', 'e1c11111-1111-4111-a111-000000000340', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.8, 68, 5, NULL, 128.52, 0),
    ('e1e11111-1111-4111-a111-000000000841', 'e1c11111-1111-4111-a111-000000000340', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.25, 1200, 0, NULL, 300, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000842', 'e1c11111-1111-4111-a111-000000000341', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.35, 320, 0, NULL, 752, 0),
    ('e1e11111-1111-4111-a111-000000000843', 'e1c11111-1111-4111-a111-000000000341', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.34, 1150, 0, NULL, 391, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000844', 'e1c11111-1111-4111-a111-000000000342', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.93, 4200, 0, NULL, 8106, 0),
    ('e1e11111-1111-4111-a111-000000000845', 'e1c11111-1111-4111-a111-000000000342', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.12, 850, 0, NULL, 102, 1),
    ('e1e11111-1111-4111-a111-000000000846', 'e1c11111-1111-4111-a111-000000000342', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.1, 1800, 0, NULL, 180, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000847', 'e1c11111-1111-4111-a111-000000000343', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.41, 520, 0, NULL, 733.2, 0),
    ('e1e11111-1111-4111-a111-000000000848', 'e1c11111-1111-4111-a111-000000000343', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.09, 900, 0, NULL, 81, 1),
    ('e1e11111-1111-4111-a111-000000000849', 'e1c11111-1111-4111-a111-000000000343', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.08, 320000, 0, NULL, 25600, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000850', 'e1c11111-1111-4111-a111-000000000344', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.51, 48, 0, NULL, 72.48, 0),
    ('e1e11111-1111-4111-a111-000000000851', 'e1c11111-1111-4111-a111-000000000344', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.14, 950, 0, NULL, 133, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000852', 'e1c11111-1111-4111-a111-000000000345', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 2.08, 850, 5, NULL, 1856.4, 0),
    ('e1e11111-1111-4111-a111-000000000853', 'e1c11111-1111-4111-a111-000000000345', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.15, 1100, 0, NULL, 165, 1),
    ('e1e11111-1111-4111-a111-000000000854', 'e1c11111-1111-4111-a111-000000000345', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.13, 2200, 0, NULL, 286, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000855', 'e1c11111-1111-4111-a111-000000000346', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.09, 680, 0, NULL, 1421.2, 0),
    ('e1e11111-1111-4111-a111-000000000856', 'e1c11111-1111-4111-a111-000000000346', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.32, 1050, 0, NULL, 336, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000857', 'e1c11111-1111-4111-a111-000000000347', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.47, 72, 0, NULL, 177.84, 0),
    ('e1e11111-1111-4111-a111-000000000858', 'e1c11111-1111-4111-a111-000000000347', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.29, 800, 0, NULL, 232, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000859', 'e1c11111-1111-4111-a111-000000000348', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 2.48, 1250, 0, NULL, 3100, 0),
    ('e1e11111-1111-4111-a111-000000000860', 'e1c11111-1111-4111-a111-000000000348', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.09, 650, 0, NULL, 58.5, 1),
    ('e1e11111-1111-4111-a111-000000000861', 'e1c11111-1111-4111-a111-000000000348', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.05, 1800, 0, NULL, 90, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000862', 'e1c11111-1111-4111-a111-000000000349', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.93, 4800, 0, NULL, 4464, 0),
    ('e1e11111-1111-4111-a111-000000000863', 'e1c11111-1111-4111-a111-000000000349', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.36, 1200, 0, NULL, 432, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000864', 'e1c11111-1111-4111-a111-000000000350', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.77, 485000, 5, NULL, 901372.5, 0),
    ('e1e11111-1111-4111-a111-000000000865', 'e1c11111-1111-4111-a111-000000000350', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.1, 1150, 0, NULL, 115, 1),
    ('e1e11111-1111-4111-a111-000000000866', 'e1c11111-1111-4111-a111-000000000350', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.08, 185000, 0, NULL, 14800, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000867', 'e1c11111-1111-4111-a111-000000000351', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 2.56, 890, 0, NULL, 2278.4, 0),
    ('e1e11111-1111-4111-a111-000000000868', 'e1c11111-1111-4111-a111-000000000351', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.09, 850, 0, NULL, 76.5, 1),
    ('e1e11111-1111-4111-a111-000000000869', 'e1c11111-1111-4111-a111-000000000351', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.07, 2200, 0, NULL, 154, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000870', 'e1c11111-1111-4111-a111-000000000352', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.64, 285, 0, NULL, 182.4, 0),
    ('e1e11111-1111-4111-a111-000000000871', 'e1c11111-1111-4111-a111-000000000352', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.16, 900, 0, NULL, 144, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000872', 'e1c11111-1111-4111-a111-000000000353', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.31, 1450, 0, NULL, 3349.5, 0),
    ('e1e11111-1111-4111-a111-000000000873', 'e1c11111-1111-4111-a111-000000000353', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.16, 950, 0, NULL, 152, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000874', 'e1c11111-1111-4111-a111-000000000354', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 0.78, 1650, 0, NULL, 1287, 0),
    ('e1e11111-1111-4111-a111-000000000875', 'e1c11111-1111-4111-a111-000000000354', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.35, 1100, 0, NULL, 385, 1),
    ('e1e11111-1111-4111-a111-000000000876', 'e1c11111-1111-4111-a111-000000000354', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.12, 1800, 0, NULL, 216, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000877', 'e1c11111-1111-4111-a111-000000000355', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.66, 42, 5, NULL, 73.21, 0),
    ('e1e11111-1111-4111-a111-000000000878', 'e1c11111-1111-4111-a111-000000000355', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.27, 1050, 0, NULL, 283.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000879', 'e1c11111-1111-4111-a111-000000000356', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 0.54, 68, 0, NULL, 36.72, 0),
    ('e1e11111-1111-4111-a111-000000000880', 'e1c11111-1111-4111-a111-000000000356', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.35, 800, 0, NULL, 280, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000881', 'e1c11111-1111-4111-a111-000000000357', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.52, 320, 0, NULL, 806.4, 0),
    ('e1e11111-1111-4111-a111-000000000882', 'e1c11111-1111-4111-a111-000000000357', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.15, 650, 0, NULL, 97.5, 1),
    ('e1e11111-1111-4111-a111-000000000883', 'e1c11111-1111-4111-a111-000000000357', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.09, 2200, 0, NULL, 198, 2),
    ('e1e11111-1111-4111-a111-000000000884', 'e1c11111-1111-4111-a111-000000000357', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.03, 220000, 0, NULL, 6600, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000885', 'e1c11111-1111-4111-a111-000000000358', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 0.95, 4200, 0, NULL, 3990, 0),
    ('e1e11111-1111-4111-a111-000000000886', 'e1c11111-1111-4111-a111-000000000358', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.29, 1200, 0, NULL, 348, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000887', 'e1c11111-1111-4111-a111-000000000359', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.44, 520, 0, NULL, 748.8, 0),
    ('e1e11111-1111-4111-a111-000000000888', 'e1c11111-1111-4111-a111-000000000359', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.42, 1150, 0, NULL, 483, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000889', 'e1c11111-1111-4111-a111-000000000360', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.28, 48, 5, NULL, 64.51, 0),
    ('e1e11111-1111-4111-a111-000000000890', 'e1c11111-1111-4111-a111-000000000360', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.12, 850, 0, NULL, 102, 1),
    ('e1e11111-1111-4111-a111-000000000891', 'e1c11111-1111-4111-a111-000000000360', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.1, 1800, 0, NULL, 180, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000892', 'e1c11111-1111-4111-a111-000000000361', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.36, 850, 0, NULL, 1156, 0),
    ('e1e11111-1111-4111-a111-000000000893', 'e1c11111-1111-4111-a111-000000000361', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.39, 900, 0, NULL, 351, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000894', 'e1c11111-1111-4111-a111-000000000362', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.39, 680, 0, NULL, 1625.2, 0),
    ('e1e11111-1111-4111-a111-000000000895', 'e1c11111-1111-4111-a111-000000000362', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.27, 950, 0, NULL, 256.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000896', 'e1c11111-1111-4111-a111-000000000363', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.54, 72, 0, NULL, 110.88, 0),
    ('e1e11111-1111-4111-a111-000000000897', 'e1c11111-1111-4111-a111-000000000363', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.31, 1100, 0, NULL, 341, 1),
    ('e1e11111-1111-4111-a111-000000000898', 'e1c11111-1111-4111-a111-000000000363', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000899', 'e1c11111-1111-4111-a111-000000000364', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.72, 1250, 0, NULL, 900, 0),
    ('e1e11111-1111-4111-a111-000000000900', 'e1c11111-1111-4111-a111-000000000364', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.33, 1050, 0, NULL, 346.5, 1),
    ('e1e11111-1111-4111-a111-000000000901', 'e1c11111-1111-4111-a111-000000000364', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.12, 450000, 0, NULL, 54000, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000902', 'e1c11111-1111-4111-a111-000000000365', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 1.49, 4800, 5, NULL, 7509.6, 0),
    ('e1e11111-1111-4111-a111-000000000903', 'e1c11111-1111-4111-a111-000000000365', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.11, 800, 0, NULL, 88, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000904', 'e1c11111-1111-4111-a111-000000000366', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 0.76, 485000, 0, NULL, 368600, 0),
    ('e1e11111-1111-4111-a111-000000000905', 'e1c11111-1111-4111-a111-000000000366', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.08, 650, 0, NULL, 52, 1),
    ('e1e11111-1111-4111-a111-000000000906', 'e1c11111-1111-4111-a111-000000000366', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.08, 1800, 0, NULL, 144, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000907', 'e1c11111-1111-4111-a111-000000000367', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 0.82, 890, 0, NULL, 729.8, 0),
    ('e1e11111-1111-4111-a111-000000000908', 'e1c11111-1111-4111-a111-000000000367', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.17, 1200, 0, NULL, 204, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000909', 'e1c11111-1111-4111-a111-000000000368', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.9, 285, 0, NULL, 256.5, 0),
    ('e1e11111-1111-4111-a111-000000000910', 'e1c11111-1111-4111-a111-000000000368', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.36, 1150, 0, NULL, 414, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000911', 'e1c11111-1111-4111-a111-000000000369', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.07, 1450, 0, NULL, 1551.5, 0),
    ('e1e11111-1111-4111-a111-000000000912', 'e1c11111-1111-4111-a111-000000000369', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.3, 850, 0, NULL, 255, 1),
    ('e1e11111-1111-4111-a111-000000000913', 'e1c11111-1111-4111-a111-000000000369', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.09, 2200, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000914', 'e1c11111-1111-4111-a111-000000000370', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.18, 1650, 5, NULL, 3776.85, 0),
    ('e1e11111-1111-4111-a111-000000000915', 'e1c11111-1111-4111-a111-000000000370', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.29, 900, 0, NULL, 261, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000916', 'e1c11111-1111-4111-a111-000000000371', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.04, 42, 0, NULL, 43.68, 0),
    ('e1e11111-1111-4111-a111-000000000917', 'e1c11111-1111-4111-a111-000000000371', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.1, 950, 0, NULL, 95, 1),
    ('e1e11111-1111-4111-a111-000000000918', 'e1c11111-1111-4111-a111-000000000371', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.12, 165000, 0, NULL, 19800, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000919', 'e1c11111-1111-4111-a111-000000000372', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.18, 68, 0, NULL, 80.24, 0),
    ('e1e11111-1111-4111-a111-000000000920', 'e1c11111-1111-4111-a111-000000000372', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.14, 1100, 0, NULL, 154, 1),
    ('e1e11111-1111-4111-a111-000000000921', 'e1c11111-1111-4111-a111-000000000372', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000922', 'e1c11111-1111-4111-a111-000000000373', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.78, 320, 0, NULL, 569.6, 0),
    ('e1e11111-1111-4111-a111-000000000923', 'e1c11111-1111-4111-a111-000000000373', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.43, 1050, 0, NULL, 451.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000924', 'e1c11111-1111-4111-a111-000000000374', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 0.94, 4200, 0, NULL, 3948, 0),
    ('e1e11111-1111-4111-a111-000000000925', 'e1c11111-1111-4111-a111-000000000374', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.22, 800, 0, NULL, 176, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000926', 'e1c11111-1111-4111-a111-000000000375', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.37, 520, 5, NULL, 748.02, 0),
    ('e1e11111-1111-4111-a111-000000000927', 'e1c11111-1111-4111-a111-000000000375', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.39, 650, 0, NULL, 253.5, 1),
    ('e1e11111-1111-4111-a111-000000000928', 'e1c11111-1111-4111-a111-000000000375', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.03, 2200, 0, NULL, 66, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000929', 'e1c11111-1111-4111-a111-000000000376', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.08, 48, 0, NULL, 99.84, 0),
    ('e1e11111-1111-4111-a111-000000000930', 'e1c11111-1111-4111-a111-000000000376', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.4, 1200, 0, NULL, 480, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000931', 'e1c11111-1111-4111-a111-000000000377', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.64, 850, 0, NULL, 1394, 0),
    ('e1e11111-1111-4111-a111-000000000932', 'e1c11111-1111-4111-a111-000000000377', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.13, 1150, 0, NULL, 149.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000933', 'e1c11111-1111-4111-a111-000000000378', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.36, 680, 0, NULL, 1604.8, 0),
    ('e1e11111-1111-4111-a111-000000000934', 'e1c11111-1111-4111-a111-000000000378', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.33, 850, 0, NULL, 280.5, 1),
    ('e1e11111-1111-4111-a111-000000000935', 'e1c11111-1111-4111-a111-000000000378', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.02, 1800, 0, NULL, 36, 2),
    ('e1e11111-1111-4111-a111-000000000936', 'e1c11111-1111-4111-a111-000000000378', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.04, 320000, 0, NULL, 12800, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000937', 'e1c11111-1111-4111-a111-000000000379', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.49, 72, 0, NULL, 179.28, 0),
    ('e1e11111-1111-4111-a111-000000000938', 'e1c11111-1111-4111-a111-000000000379', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.24, 900, 0, NULL, 216, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000939', 'e1c11111-1111-4111-a111-000000000380', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 2.66, 1250, 5, NULL, 3491.25, 0),
    ('e1e11111-1111-4111-a111-000000000940', 'e1c11111-1111-4111-a111-000000000380', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.26, 950, 0, NULL, 247, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000941', 'e1c11111-1111-4111-a111-000000000381', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.92, 4800, 0, NULL, 4416, 0),
    ('e1e11111-1111-4111-a111-000000000942', 'e1c11111-1111-4111-a111-000000000381', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.41, 1100, 0, NULL, 451, 1),
    ('e1e11111-1111-4111-a111-000000000943', 'e1c11111-1111-4111-a111-000000000381', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.03, 2200, 0, NULL, 66, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000944', 'e1c11111-1111-4111-a111-000000000382', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.15, 485000, 0, NULL, 557750, 0),
    ('e1e11111-1111-4111-a111-000000000945', 'e1c11111-1111-4111-a111-000000000382', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.13, 1050, 0, NULL, 136.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000946', 'e1c11111-1111-4111-a111-000000000383', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 2.24, 890, 0, NULL, 1993.6, 0),
    ('e1e11111-1111-4111-a111-000000000947', 'e1c11111-1111-4111-a111-000000000383', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.16, 800, 0, NULL, 128, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000948', 'e1c11111-1111-4111-a111-000000000384', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.46, 285, 0, NULL, 701.1, 0),
    ('e1e11111-1111-4111-a111-000000000949', 'e1c11111-1111-4111-a111-000000000384', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.27, 650, 0, NULL, 175.5, 1),
    ('e1e11111-1111-4111-a111-000000000950', 'e1c11111-1111-4111-a111-000000000384', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.09, 1800, 0, NULL, 162, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000951', 'e1c11111-1111-4111-a111-000000000385', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.31, 1450, 5, NULL, 3516.98, 0),
    ('e1e11111-1111-4111-a111-000000000952', 'e1c11111-1111-4111-a111-000000000385', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.36, 1200, 0, NULL, 432, 1),
    ('e1e11111-1111-4111-a111-000000000953', 'e1c11111-1111-4111-a111-000000000385', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.06, 185000, 0, NULL, 11100, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000954', 'e1c11111-1111-4111-a111-000000000386', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.84, 1650, 0, NULL, 3036, 0),
    ('e1e11111-1111-4111-a111-000000000955', 'e1c11111-1111-4111-a111-000000000386', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.31, 1150, 0, NULL, 356.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000956', 'e1c11111-1111-4111-a111-000000000387', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.27, 42, 0, NULL, 53.34, 0),
    ('e1e11111-1111-4111-a111-000000000957', 'e1c11111-1111-4111-a111-000000000387', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.3, 850, 0, NULL, 255, 1),
    ('e1e11111-1111-4111-a111-000000000958', 'e1c11111-1111-4111-a111-000000000387', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.12, 2200, 0, NULL, 264, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000959', 'e1c11111-1111-4111-a111-000000000388', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.18, 68, 0, NULL, 80.24, 0),
    ('e1e11111-1111-4111-a111-000000000960', 'e1c11111-1111-4111-a111-000000000388', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.32, 900, 0, NULL, 288, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000961', 'e1c11111-1111-4111-a111-000000000389', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.21, 320, 0, NULL, 387.2, 0),
    ('e1e11111-1111-4111-a111-000000000962', 'e1c11111-1111-4111-a111-000000000389', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.31, 950, 0, NULL, 294.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000963', 'e1c11111-1111-4111-a111-000000000390', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 2.25, 4200, 5, NULL, 9922.5, 0),
    ('e1e11111-1111-4111-a111-000000000964', 'e1c11111-1111-4111-a111-000000000390', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.43, 1100, 0, NULL, 473, 1),
    ('e1e11111-1111-4111-a111-000000000965', 'e1c11111-1111-4111-a111-000000000390', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.1, 1800, 0, NULL, 180, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000966', 'e1c11111-1111-4111-a111-000000000391', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 2.42, 520, 0, NULL, 1258.4, 0),
    ('e1e11111-1111-4111-a111-000000000967', 'e1c11111-1111-4111-a111-000000000391', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.32, 1050, 0, NULL, 336, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000968', 'e1c11111-1111-4111-a111-000000000392', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.13, 48, 0, NULL, 54.24, 0),
    ('e1e11111-1111-4111-a111-000000000969', 'e1c11111-1111-4111-a111-000000000392', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.08, 800, 0, NULL, 64, 1),
    ('e1e11111-1111-4111-a111-000000000970', 'e1c11111-1111-4111-a111-000000000392', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.07, 220000, 0, NULL, 15400, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000971', 'e1c11111-1111-4111-a111-000000000393', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 2.39, 850, 0, NULL, 2031.5, 0),
    ('e1e11111-1111-4111-a111-000000000972', 'e1c11111-1111-4111-a111-000000000393', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.28, 650, 0, NULL, 182, 1),
    ('e1e11111-1111-4111-a111-000000000973', 'e1c11111-1111-4111-a111-000000000393', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.14, 2200, 0, NULL, 308, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000974', 'e1c11111-1111-4111-a111-000000000394', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 0.55, 680, 0, NULL, 374, 0),
    ('e1e11111-1111-4111-a111-000000000975', 'e1c11111-1111-4111-a111-000000000394', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.28, 1200, 0, NULL, 336, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000976', 'e1c11111-1111-4111-a111-000000000395', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 0.56, 72, 5, NULL, 42.34, 0),
    ('e1e11111-1111-4111-a111-000000000977', 'e1c11111-1111-4111-a111-000000000395', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.17, 1150, 0, NULL, 195.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000978', 'e1c11111-1111-4111-a111-000000000396', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.56, 1250, 0, NULL, 700, 0),
    ('e1e11111-1111-4111-a111-000000000979', 'e1c11111-1111-4111-a111-000000000396', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.3, 850, 0, NULL, 255, 1),
    ('e1e11111-1111-4111-a111-000000000980', 'e1c11111-1111-4111-a111-000000000396', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.13, 1800, 0, NULL, 234, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000981', 'e1c11111-1111-4111-a111-000000000397', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.6, 4800, 0, NULL, 2880, 0),
    ('e1e11111-1111-4111-a111-000000000982', 'e1c11111-1111-4111-a111-000000000397', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.13, 900, 0, NULL, 117, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000983', 'e1c11111-1111-4111-a111-000000000398', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.55, 485000, 0, NULL, 1236750, 0),
    ('e1e11111-1111-4111-a111-000000000984', 'e1c11111-1111-4111-a111-000000000398', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.12, 950, 0, NULL, 114, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000985', 'e1c11111-1111-4111-a111-000000000399', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.56, 890, 0, NULL, 1388.4, 0),
    ('e1e11111-1111-4111-a111-000000000986', 'e1c11111-1111-4111-a111-000000000399', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.1, 1100, 0, NULL, 110, 1),
    ('e1e11111-1111-4111-a111-000000000987', 'e1c11111-1111-4111-a111-000000000399', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.08, 2200, 0, NULL, 176, 2),
    ('e1e11111-1111-4111-a111-000000000988', 'e1c11111-1111-4111-a111-000000000399', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.04, 450000, 0, NULL, 18000, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000989', 'e1c11111-1111-4111-a111-000000000400', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.43, 285, 5, NULL, 727.18, 0),
    ('e1e11111-1111-4111-a111-000000000990', 'e1c11111-1111-4111-a111-000000000400', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.37, 1050, 0, NULL, 388.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000991', 'e1c11111-1111-4111-a111-000000000401', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.68, 1450, 0, NULL, 2436, 0),
    ('e1e11111-1111-4111-a111-000000000992', 'e1c11111-1111-4111-a111-000000000401', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.31, 800, 0, NULL, 248, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000993', 'e1c11111-1111-4111-a111-000000000402', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.29, 1650, 0, NULL, 3778.5, 0),
    ('e1e11111-1111-4111-a111-000000000994', 'e1c11111-1111-4111-a111-000000000402', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.28, 650, 0, NULL, 182, 1),
    ('e1e11111-1111-4111-a111-000000000995', 'e1c11111-1111-4111-a111-000000000402', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.14, 1800, 0, NULL, 252, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000996', 'e1c11111-1111-4111-a111-000000000403', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 2.11, 42, 0, NULL, 88.62, 0),
    ('e1e11111-1111-4111-a111-000000000997', 'e1c11111-1111-4111-a111-000000000403', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.27, 1200, 0, NULL, 324, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000000998', 'e1c11111-1111-4111-a111-000000000404', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.04, 68, 0, NULL, 70.72, 0),
    ('e1e11111-1111-4111-a111-000000000999', 'e1c11111-1111-4111-a111-000000000404', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.25, 1150, 0, NULL, 287.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001000', 'e1c11111-1111-4111-a111-000000000405', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.44, 320, 5, NULL, 483.84, 0),
    ('e1e11111-1111-4111-a111-000000001001', 'e1c11111-1111-4111-a111-000000000405', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.15, 850, 0, NULL, 127.5, 1),
    ('e1e11111-1111-4111-a111-000000001002', 'e1c11111-1111-4111-a111-000000000405', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.09, 2200, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001003', 'e1c11111-1111-4111-a111-000000000406', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.52, 4200, 0, NULL, 6384, 0),
    ('e1e11111-1111-4111-a111-000000001004', 'e1c11111-1111-4111-a111-000000000406', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.12, 900, 0, NULL, 108, 1),
    ('e1e11111-1111-4111-a111-000000001005', 'e1c11111-1111-4111-a111-000000000406', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.03, 165000, 0, NULL, 4950, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001006', 'e1c11111-1111-4111-a111-000000000407', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 0.59, 520, 0, NULL, 306.8, 0),
    ('e1e11111-1111-4111-a111-000000001007', 'e1c11111-1111-4111-a111-000000000407', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.09, 950, 0, NULL, 85.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001008', 'e1c11111-1111-4111-a111-000000000408', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 0.99, 48, 0, NULL, 47.52, 0),
    ('e1e11111-1111-4111-a111-000000001009', 'e1c11111-1111-4111-a111-000000000408', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.42, 1100, 0, NULL, 462, 1),
    ('e1e11111-1111-4111-a111-000000001010', 'e1c11111-1111-4111-a111-000000000408', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.1, 1800, 0, NULL, 180, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001011', 'e1c11111-1111-4111-a111-000000000409', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.09, 850, 0, NULL, 926.5, 0),
    ('e1e11111-1111-4111-a111-000000001012', 'e1c11111-1111-4111-a111-000000000409', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.18, 1050, 0, NULL, 189, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001013', 'e1c11111-1111-4111-a111-000000000410', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 0.87, 680, 5, NULL, 621.18, 0),
    ('e1e11111-1111-4111-a111-000000001014', 'e1c11111-1111-4111-a111-000000000410', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.1, 800, 0, NULL, 80, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001015', 'e1c11111-1111-4111-a111-000000000411', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 0.76, 72, 0, NULL, 54.72, 0),
    ('e1e11111-1111-4111-a111-000000001016', 'e1c11111-1111-4111-a111-000000000411', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.23, 650, 0, NULL, 149.5, 1),
    ('e1e11111-1111-4111-a111-000000001017', 'e1c11111-1111-4111-a111-000000000411', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001018', 'e1c11111-1111-4111-a111-000000000412', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 2.42, 1250, 0, NULL, 3025, 0),
    ('e1e11111-1111-4111-a111-000000001019', 'e1c11111-1111-4111-a111-000000000412', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.12, 1200, 0, NULL, 144, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001020', 'e1c11111-1111-4111-a111-000000000413', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 1.89, 4800, 0, NULL, 9072, 0),
    ('e1e11111-1111-4111-a111-000000001021', 'e1c11111-1111-4111-a111-000000000413', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.21, 1150, 0, NULL, 241.5, 1),
    ('e1e11111-1111-4111-a111-000000001022', 'e1c11111-1111-4111-a111-000000000413', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.11, 320000, 0, NULL, 35200, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001023', 'e1c11111-1111-4111-a111-000000000414', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.9, 485000, 0, NULL, 921500, 0),
    ('e1e11111-1111-4111-a111-000000001024', 'e1c11111-1111-4111-a111-000000000414', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.14, 850, 0, NULL, 119, 1),
    ('e1e11111-1111-4111-a111-000000001025', 'e1c11111-1111-4111-a111-000000000414', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001026', 'e1c11111-1111-4111-a111-000000000415', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.53, 890, 5, NULL, 1429.79, 0),
    ('e1e11111-1111-4111-a111-000000001027', 'e1c11111-1111-4111-a111-000000000415', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.36, 900, 0, NULL, 324, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001028', 'e1c11111-1111-4111-a111-000000000416', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.33, 285, 0, NULL, 379.05, 0),
    ('e1e11111-1111-4111-a111-000000001029', 'e1c11111-1111-4111-a111-000000000416', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.2, 950, 0, NULL, 190, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001030', 'e1c11111-1111-4111-a111-000000000417', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.33, 1450, 0, NULL, 3378.5, 0),
    ('e1e11111-1111-4111-a111-000000001031', 'e1c11111-1111-4111-a111-000000000417', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.11, 1100, 0, NULL, 121, 1),
    ('e1e11111-1111-4111-a111-000000001032', 'e1c11111-1111-4111-a111-000000000417', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001033', 'e1c11111-1111-4111-a111-000000000418', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.7, 1650, 0, NULL, 4455, 0),
    ('e1e11111-1111-4111-a111-000000001034', 'e1c11111-1111-4111-a111-000000000418', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.38, 1050, 0, NULL, 399, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001035', 'e1c11111-1111-4111-a111-000000000419', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.8, 42, 0, NULL, 33.6, 0),
    ('e1e11111-1111-4111-a111-000000001036', 'e1c11111-1111-4111-a111-000000000419', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.2, 800, 0, NULL, 160, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001037', 'e1c11111-1111-4111-a111-000000000420', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 2.19, 68, 5, NULL, 156.37, 0),
    ('e1e11111-1111-4111-a111-000000001038', 'e1c11111-1111-4111-a111-000000000420', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.16, 650, 0, NULL, 104, 1),
    ('e1e11111-1111-4111-a111-000000001039', 'e1c11111-1111-4111-a111-000000000420', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.12, 1800, 0, NULL, 216, 2),
    ('e1e11111-1111-4111-a111-000000001040', 'e1c11111-1111-4111-a111-000000000420', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.12, 185000, 0, NULL, 22200, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001041', 'e1c11111-1111-4111-a111-000000000421', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.13, 320, 0, NULL, 361.6, 0),
    ('e1e11111-1111-4111-a111-000000001042', 'e1c11111-1111-4111-a111-000000000421', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.28, 1200, 0, NULL, 336, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001043', 'e1c11111-1111-4111-a111-000000000422', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 2, 4200, 0, NULL, 8400, 0),
    ('e1e11111-1111-4111-a111-000000001044', 'e1c11111-1111-4111-a111-000000000422', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.27, 1150, 0, NULL, 310.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001045', 'e1c11111-1111-4111-a111-000000000423', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.01, 520, 0, NULL, 525.2, 0),
    ('e1e11111-1111-4111-a111-000000001046', 'e1c11111-1111-4111-a111-000000000423', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.4, 850, 0, NULL, 340, 1),
    ('e1e11111-1111-4111-a111-000000001047', 'e1c11111-1111-4111-a111-000000000423', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.13, 2200, 0, NULL, 286, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001048', 'e1c11111-1111-4111-a111-000000000424', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.67, 48, 0, NULL, 80.16, 0),
    ('e1e11111-1111-4111-a111-000000001049', 'e1c11111-1111-4111-a111-000000000424', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.27, 900, 0, NULL, 243, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001050', 'e1c11111-1111-4111-a111-000000000425', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 2.14, 850, 5, NULL, 1909.95, 0),
    ('e1e11111-1111-4111-a111-000000001051', 'e1c11111-1111-4111-a111-000000000425', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.42, 950, 0, NULL, 399, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001052', 'e1c11111-1111-4111-a111-000000000426', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 1.57, 680, 0, NULL, 1067.6, 0),
    ('e1e11111-1111-4111-a111-000000001053', 'e1c11111-1111-4111-a111-000000000426', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.31, 1100, 0, NULL, 341, 1),
    ('e1e11111-1111-4111-a111-000000001054', 'e1c11111-1111-4111-a111-000000000426', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.11, 1800, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001055', 'e1c11111-1111-4111-a111-000000000427', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.24, 72, 0, NULL, 89.28, 0),
    ('e1e11111-1111-4111-a111-000000001056', 'e1c11111-1111-4111-a111-000000000427', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.26, 1050, 0, NULL, 273, 1),
    ('e1e11111-1111-4111-a111-000000001057', 'e1c11111-1111-4111-a111-000000000427', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.02, 220000, 0, NULL, 4400, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001058', 'e1c11111-1111-4111-a111-000000000428', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.51, 1250, 0, NULL, 637.5, 0),
    ('e1e11111-1111-4111-a111-000000001059', 'e1c11111-1111-4111-a111-000000000428', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.4, 800, 0, NULL, 320, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001060', 'e1c11111-1111-4111-a111-000000000429', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.62, 4800, 0, NULL, 2976, 0),
    ('e1e11111-1111-4111-a111-000000001061', 'e1c11111-1111-4111-a111-000000000429', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.37, 650, 0, NULL, 240.5, 1),
    ('e1e11111-1111-4111-a111-000000001062', 'e1c11111-1111-4111-a111-000000000429', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.09, 2200, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001063', 'e1c11111-1111-4111-a111-000000000430', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 0.52, 485000, 5, NULL, 264810, 0),
    ('e1e11111-1111-4111-a111-000000001064', 'e1c11111-1111-4111-a111-000000000430', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.3, 1200, 0, NULL, 360, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001065', 'e1c11111-1111-4111-a111-000000000431', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.63, 890, 0, NULL, 1450.7, 0),
    ('e1e11111-1111-4111-a111-000000001066', 'e1c11111-1111-4111-a111-000000000431', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.34, 1150, 0, NULL, 391, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001067', 'e1c11111-1111-4111-a111-000000000432', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.66, 285, 0, NULL, 473.1, 0),
    ('e1e11111-1111-4111-a111-000000001068', 'e1c11111-1111-4111-a111-000000000432', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.12, 850, 0, NULL, 102, 1),
    ('e1e11111-1111-4111-a111-000000001069', 'e1c11111-1111-4111-a111-000000000432', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.13, 1800, 0, NULL, 234, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001070', 'e1c11111-1111-4111-a111-000000000433', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.18, 1450, 0, NULL, 3161, 0),
    ('e1e11111-1111-4111-a111-000000001071', 'e1c11111-1111-4111-a111-000000000433', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.11, 900, 0, NULL, 99, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001072', 'e1c11111-1111-4111-a111-000000000434', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.02, 1650, 0, NULL, 1683, 0),
    ('e1e11111-1111-4111-a111-000000001073', 'e1c11111-1111-4111-a111-000000000434', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.24, 950, 0, NULL, 228, 1),
    ('e1e11111-1111-4111-a111-000000001074', 'e1c11111-1111-4111-a111-000000000434', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.03, 450000, 0, NULL, 13500, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001075', 'e1c11111-1111-4111-a111-000000000435', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.6, 42, 5, NULL, 26.46, 0),
    ('e1e11111-1111-4111-a111-000000001076', 'e1c11111-1111-4111-a111-000000000435', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.12, 1100, 0, NULL, 132, 1),
    ('e1e11111-1111-4111-a111-000000001077', 'e1c11111-1111-4111-a111-000000000435', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.09, 2200, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001078', 'e1c11111-1111-4111-a111-000000000436', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.41, 68, 0, NULL, 95.88, 0),
    ('e1e11111-1111-4111-a111-000000001079', 'e1c11111-1111-4111-a111-000000000436', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.15, 1050, 0, NULL, 157.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001080', 'e1c11111-1111-4111-a111-000000000437', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.18, 320, 0, NULL, 697.6, 0),
    ('e1e11111-1111-4111-a111-000000001081', 'e1c11111-1111-4111-a111-000000000437', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.39, 800, 0, NULL, 312, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001082', 'e1c11111-1111-4111-a111-000000000438', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.79, 4200, 0, NULL, 7518, 0),
    ('e1e11111-1111-4111-a111-000000001083', 'e1c11111-1111-4111-a111-000000000438', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.08, 650, 0, NULL, 52, 1),
    ('e1e11111-1111-4111-a111-000000001084', 'e1c11111-1111-4111-a111-000000000438', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.03, 1800, 0, NULL, 54, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001085', 'e1c11111-1111-4111-a111-000000000439', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.4, 520, 0, NULL, 728, 0),
    ('e1e11111-1111-4111-a111-000000001086', 'e1c11111-1111-4111-a111-000000000439', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.36, 1200, 0, NULL, 432, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001087', 'e1c11111-1111-4111-a111-000000000440', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.58, 48, 5, NULL, 130.03, 0),
    ('e1e11111-1111-4111-a111-000000001088', 'e1c11111-1111-4111-a111-000000000440', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.18, 1150, 0, NULL, 207, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001089', 'e1c11111-1111-4111-a111-000000000441', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 2.62, 850, 0, NULL, 2227, 0),
    ('e1e11111-1111-4111-a111-000000001090', 'e1c11111-1111-4111-a111-000000000441', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.22, 850, 0, NULL, 187, 1),
    ('e1e11111-1111-4111-a111-000000001091', 'e1c11111-1111-4111-a111-000000000441', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.12, 2200, 0, NULL, 264, 2),
    ('e1e11111-1111-4111-a111-000000001092', 'e1c11111-1111-4111-a111-000000000441', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.05, 165000, 0, NULL, 8250, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001093', 'e1c11111-1111-4111-a111-000000000442', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.35, 680, 0, NULL, 1598, 0),
    ('e1e11111-1111-4111-a111-000000001094', 'e1c11111-1111-4111-a111-000000000442', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.32, 900, 0, NULL, 288, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001095', 'e1c11111-1111-4111-a111-000000000443', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.02, 72, 0, NULL, 73.44, 0),
    ('e1e11111-1111-4111-a111-000000001096', 'e1c11111-1111-4111-a111-000000000443', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.27, 950, 0, NULL, 256.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001097', 'e1c11111-1111-4111-a111-000000000444', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 1.37, 1250, 0, NULL, 1712.5, 0),
    ('e1e11111-1111-4111-a111-000000001098', 'e1c11111-1111-4111-a111-000000000444', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.35, 1100, 0, NULL, 385, 1),
    ('e1e11111-1111-4111-a111-000000001099', 'e1c11111-1111-4111-a111-000000000444', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001100', 'e1c11111-1111-4111-a111-000000000445', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.95, 4800, 5, NULL, 4788, 0),
    ('e1e11111-1111-4111-a111-000000001101', 'e1c11111-1111-4111-a111-000000000445', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.14, 1050, 0, NULL, 147, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001102', 'e1c11111-1111-4111-a111-000000000446', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 0.85, 485000, 0, NULL, 412250, 0),
    ('e1e11111-1111-4111-a111-000000001103', 'e1c11111-1111-4111-a111-000000000446', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.1, 800, 0, NULL, 80, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001104', 'e1c11111-1111-4111-a111-000000000447', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.56, 890, 0, NULL, 1388.4, 0),
    ('e1e11111-1111-4111-a111-000000001105', 'e1c11111-1111-4111-a111-000000000447', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.18, 650, 0, NULL, 117, 1),
    ('e1e11111-1111-4111-a111-000000001106', 'e1c11111-1111-4111-a111-000000000447', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.12, 2200, 0, NULL, 264, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001107', 'e1c11111-1111-4111-a111-000000000448', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.27, 285, 0, NULL, 646.95, 0),
    ('e1e11111-1111-4111-a111-000000001108', 'e1c11111-1111-4111-a111-000000000448', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.18, 1200, 0, NULL, 216, 1),
    ('e1e11111-1111-4111-a111-000000001109', 'e1c11111-1111-4111-a111-000000000448', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.07, 320000, 0, NULL, 22400, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001110', 'e1c11111-1111-4111-a111-000000000449', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.58, 1450, 0, NULL, 3741, 0),
    ('e1e11111-1111-4111-a111-000000001111', 'e1c11111-1111-4111-a111-000000000449', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.29, 1150, 0, NULL, 333.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001112', 'e1c11111-1111-4111-a111-000000000450', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.33, 1650, 5, NULL, 2304.23, 0),
    ('e1e11111-1111-4111-a111-000000001113', 'e1c11111-1111-4111-a111-000000000450', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.17, 850, 0, NULL, 144.5, 1),
    ('e1e11111-1111-4111-a111-000000001114', 'e1c11111-1111-4111-a111-000000000450', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.07, 1800, 0, NULL, 126, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001115', 'e1c11111-1111-4111-a111-000000000451', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.19, 42, 0, NULL, 49.98, 0),
    ('e1e11111-1111-4111-a111-000000001116', 'e1c11111-1111-4111-a111-000000000451', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.34, 900, 0, NULL, 306, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001117', 'e1c11111-1111-4111-a111-000000000452', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 2.44, 68, 0, NULL, 165.92, 0),
    ('e1e11111-1111-4111-a111-000000001118', 'e1c11111-1111-4111-a111-000000000452', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.27, 950, 0, NULL, 256.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001119', 'e1c11111-1111-4111-a111-000000000453', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 0.54, 320, 0, NULL, 172.8, 0),
    ('e1e11111-1111-4111-a111-000000001120', 'e1c11111-1111-4111-a111-000000000453', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.31, 1100, 0, NULL, 341, 1),
    ('e1e11111-1111-4111-a111-000000001121', 'e1c11111-1111-4111-a111-000000000453', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001122', 'e1c11111-1111-4111-a111-000000000454', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.43, 4200, 0, NULL, 6006, 0),
    ('e1e11111-1111-4111-a111-000000001123', 'e1c11111-1111-4111-a111-000000000454', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.43, 1050, 0, NULL, 451.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001124', 'e1c11111-1111-4111-a111-000000000455', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.21, 520, 5, NULL, 660.66, 0),
    ('e1e11111-1111-4111-a111-000000001125', 'e1c11111-1111-4111-a111-000000000455', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.24, 800, 0, NULL, 192, 1),
    ('e1e11111-1111-4111-a111-000000001126', 'e1c11111-1111-4111-a111-000000000455', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.06, 185000, 0, NULL, 11100, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001127', 'e1c11111-1111-4111-a111-000000000456', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.21, 48, 0, NULL, 106.08, 0),
    ('e1e11111-1111-4111-a111-000000001128', 'e1c11111-1111-4111-a111-000000000456', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.2, 650, 0, NULL, 130, 1),
    ('e1e11111-1111-4111-a111-000000001129', 'e1c11111-1111-4111-a111-000000000456', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.07, 1800, 0, NULL, 126, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001130', 'e1c11111-1111-4111-a111-000000000457', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.86, 850, 0, NULL, 731, 0),
    ('e1e11111-1111-4111-a111-000000001131', 'e1c11111-1111-4111-a111-000000000457', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.38, 1200, 0, NULL, 456, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001132', 'e1c11111-1111-4111-a111-000000000458', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.59, 680, 0, NULL, 1761.2, 0),
    ('e1e11111-1111-4111-a111-000000001133', 'e1c11111-1111-4111-a111-000000000458', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.3, 1150, 0, NULL, 345, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001134', 'e1c11111-1111-4111-a111-000000000459', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.28, 72, 0, NULL, 92.16, 0),
    ('e1e11111-1111-4111-a111-000000001135', 'e1c11111-1111-4111-a111-000000000459', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.18, 850, 0, NULL, 153, 1),
    ('e1e11111-1111-4111-a111-000000001136', 'e1c11111-1111-4111-a111-000000000459', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.08, 2200, 0, NULL, 176, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001137', 'e1c11111-1111-4111-a111-000000000460', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 1.78, 1250, 5, NULL, 2336.25, 0),
    ('e1e11111-1111-4111-a111-000000001138', 'e1c11111-1111-4111-a111-000000000460', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.28, 900, 0, NULL, 252, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001139', 'e1c11111-1111-4111-a111-000000000461', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 2.5, 4800, 0, NULL, 12000, 0),
    ('e1e11111-1111-4111-a111-000000001140', 'e1c11111-1111-4111-a111-000000000461', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.29, 950, 0, NULL, 275.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001141', 'e1c11111-1111-4111-a111-000000000462', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.76, 485000, 0, NULL, 853600, 0),
    ('e1e11111-1111-4111-a111-000000001142', 'e1c11111-1111-4111-a111-000000000462', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.25, 1100, 0, NULL, 275, 1),
    ('e1e11111-1111-4111-a111-000000001143', 'e1c11111-1111-4111-a111-000000000462', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.1, 1800, 0, NULL, 180, 2),
    ('e1e11111-1111-4111-a111-000000001144', 'e1c11111-1111-4111-a111-000000000462', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.04, 220000, 0, NULL, 8800, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001145', 'e1c11111-1111-4111-a111-000000000463', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 2.42, 890, 0, NULL, 2153.8, 0),
    ('e1e11111-1111-4111-a111-000000001146', 'e1c11111-1111-4111-a111-000000000463', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.09, 1050, 0, NULL, 94.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001147', 'e1c11111-1111-4111-a111-000000000464', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.44, 285, 0, NULL, 695.4, 0),
    ('e1e11111-1111-4111-a111-000000001148', 'e1c11111-1111-4111-a111-000000000464', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.14, 800, 0, NULL, 112, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001149', 'e1c11111-1111-4111-a111-000000000465', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.84, 1450, 5, NULL, 2801.4, 0),
    ('e1e11111-1111-4111-a111-000000001150', 'e1c11111-1111-4111-a111-000000000465', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.32, 650, 0, NULL, 208, 1),
    ('e1e11111-1111-4111-a111-000000001151', 'e1c11111-1111-4111-a111-000000000465', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.13, 2200, 0, NULL, 286, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001152', 'e1c11111-1111-4111-a111-000000000466', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.6, 1650, 0, NULL, 2640, 0),
    ('e1e11111-1111-4111-a111-000000001153', 'e1c11111-1111-4111-a111-000000000466', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.11, 1200, 0, NULL, 132, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001154', 'e1c11111-1111-4111-a111-000000000467', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 2.47, 42, 0, NULL, 103.74, 0),
    ('e1e11111-1111-4111-a111-000000001155', 'e1c11111-1111-4111-a111-000000000467', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.26, 1150, 0, NULL, 299, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001156', 'e1c11111-1111-4111-a111-000000000468', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.71, 68, 0, NULL, 116.28, 0),
    ('e1e11111-1111-4111-a111-000000001157', 'e1c11111-1111-4111-a111-000000000468', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.1, 850, 0, NULL, 85, 1),
    ('e1e11111-1111-4111-a111-000000001158', 'e1c11111-1111-4111-a111-000000000468', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.08, 1800, 0, NULL, 144, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001159', 'e1c11111-1111-4111-a111-000000000469', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.69, 320, 0, NULL, 860.8, 0),
    ('e1e11111-1111-4111-a111-000000001160', 'e1c11111-1111-4111-a111-000000000469', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.38, 900, 0, NULL, 342, 1),
    ('e1e11111-1111-4111-a111-000000001161', 'e1c11111-1111-4111-a111-000000000469', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.08, 450000, 0, NULL, 36000, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001162', 'e1c11111-1111-4111-a111-000000000470', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 0.57, 4200, 5, NULL, 2513.7, 0),
    ('e1e11111-1111-4111-a111-000000001163', 'e1c11111-1111-4111-a111-000000000470', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.21, 950, 0, NULL, 199.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001164', 'e1c11111-1111-4111-a111-000000000471', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 0.93, 520, 0, NULL, 483.6, 0),
    ('e1e11111-1111-4111-a111-000000001165', 'e1c11111-1111-4111-a111-000000000471', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.4, 1100, 0, NULL, 440, 1),
    ('e1e11111-1111-4111-a111-000000001166', 'e1c11111-1111-4111-a111-000000000471', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001167', 'e1c11111-1111-4111-a111-000000000472', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.31, 48, 0, NULL, 62.88, 0),
    ('e1e11111-1111-4111-a111-000000001168', 'e1c11111-1111-4111-a111-000000000472', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.29, 1050, 0, NULL, 304.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001169', 'e1c11111-1111-4111-a111-000000000473', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.74, 850, 0, NULL, 1479, 0),
    ('e1e11111-1111-4111-a111-000000001170', 'e1c11111-1111-4111-a111-000000000473', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.41, 800, 0, NULL, 328, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001171', 'e1c11111-1111-4111-a111-000000000474', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.17, 680, 0, NULL, 1475.6, 0),
    ('e1e11111-1111-4111-a111-000000001172', 'e1c11111-1111-4111-a111-000000000474', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.36, 650, 0, NULL, 234, 1),
    ('e1e11111-1111-4111-a111-000000001173', 'e1c11111-1111-4111-a111-000000000474', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.03, 1800, 0, NULL, 54, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001174', 'e1c11111-1111-4111-a111-000000000475', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 1.15, 72, 5, NULL, 86.94, 0),
    ('e1e11111-1111-4111-a111-000000001175', 'e1c11111-1111-4111-a111-000000000475', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.4, 1200, 0, NULL, 480, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001176', 'e1c11111-1111-4111-a111-000000000476', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 1.08, 1250, 0, NULL, 1350, 0),
    ('e1e11111-1111-4111-a111-000000001177', 'e1c11111-1111-4111-a111-000000000476', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.24, 1150, 0, NULL, 276, 1),
    ('e1e11111-1111-4111-a111-000000001178', 'e1c11111-1111-4111-a111-000000000476', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.04, 165000, 0, NULL, 6600, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001179', 'e1c11111-1111-4111-a111-000000000477', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 0.62, 4800, 0, NULL, 2976, 0),
    ('e1e11111-1111-4111-a111-000000001180', 'e1c11111-1111-4111-a111-000000000477', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.26, 850, 0, NULL, 221, 1),
    ('e1e11111-1111-4111-a111-000000001181', 'e1c11111-1111-4111-a111-000000000477', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.09, 2200, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001182', 'e1c11111-1111-4111-a111-000000000478', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.47, 485000, 0, NULL, 712950, 0),
    ('e1e11111-1111-4111-a111-000000001183', 'e1c11111-1111-4111-a111-000000000478', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.09, 900, 0, NULL, 81, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001184', 'e1c11111-1111-4111-a111-000000000479', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.41, 890, 0, NULL, 1254.9, 0),
    ('e1e11111-1111-4111-a111-000000001185', 'e1c11111-1111-4111-a111-000000000479', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.27, 950, 0, NULL, 256.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001186', 'e1c11111-1111-4111-a111-000000000480', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.33, 285, 5, NULL, 697.25, 0),
    ('e1e11111-1111-4111-a111-000000001187', 'e1c11111-1111-4111-a111-000000000480', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.23, 1100, 0, NULL, 253, 1),
    ('e1e11111-1111-4111-a111-000000001188', 'e1c11111-1111-4111-a111-000000000480', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.11, 1800, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001189', 'e1c11111-1111-4111-a111-000000000481', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 0.89, 1450, 0, NULL, 1290.5, 0),
    ('e1e11111-1111-4111-a111-000000001190', 'e1c11111-1111-4111-a111-000000000481', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.36, 1050, 0, NULL, 378, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001191', 'e1c11111-1111-4111-a111-000000000482', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.23, 1650, 0, NULL, 3679.5, 0),
    ('e1e11111-1111-4111-a111-000000001192', 'e1c11111-1111-4111-a111-000000000482', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.3, 800, 0, NULL, 240, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001193', 'e1c11111-1111-4111-a111-000000000483', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 0.53, 42, 0, NULL, 22.26, 0),
    ('e1e11111-1111-4111-a111-000000001194', 'e1c11111-1111-4111-a111-000000000483', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.11, 650, 0, NULL, 71.5, 1),
    ('e1e11111-1111-4111-a111-000000001195', 'e1c11111-1111-4111-a111-000000000483', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.09, 2200, 0, NULL, 198, 2),
    ('e1e11111-1111-4111-a111-000000001196', 'e1c11111-1111-4111-a111-000000000483', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.11, 320000, 0, NULL, 35200, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001197', 'e1c11111-1111-4111-a111-000000000484', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.04, 68, 0, NULL, 70.72, 0),
    ('e1e11111-1111-4111-a111-000000001198', 'e1c11111-1111-4111-a111-000000000484', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.17, 1200, 0, NULL, 204, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001199', 'e1c11111-1111-4111-a111-000000000485', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.67, 320, 5, NULL, 561.12, 0),
    ('e1e11111-1111-4111-a111-000000001200', 'e1c11111-1111-4111-a111-000000000485', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.25, 1150, 0, NULL, 287.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001201', 'e1c11111-1111-4111-a111-000000000486', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 2.1, 4200, 0, NULL, 8820, 0),
    ('e1e11111-1111-4111-a111-000000001202', 'e1c11111-1111-4111-a111-000000000486', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.29, 850, 0, NULL, 246.5, 1),
    ('e1e11111-1111-4111-a111-000000001203', 'e1c11111-1111-4111-a111-000000000486', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001204', 'e1c11111-1111-4111-a111-000000000487', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.31, 520, 0, NULL, 681.2, 0),
    ('e1e11111-1111-4111-a111-000000001205', 'e1c11111-1111-4111-a111-000000000487', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.1, 900, 0, NULL, 90, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001206', 'e1c11111-1111-4111-a111-000000000488', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.38, 48, 0, NULL, 66.24, 0),
    ('e1e11111-1111-4111-a111-000000001207', 'e1c11111-1111-4111-a111-000000000488', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.19, 950, 0, NULL, 180.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001208', 'e1c11111-1111-4111-a111-000000000489', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.86, 850, 0, NULL, 1581, 0),
    ('e1e11111-1111-4111-a111-000000001209', 'e1c11111-1111-4111-a111-000000000489', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.41, 1100, 0, NULL, 451, 1),
    ('e1e11111-1111-4111-a111-000000001210', 'e1c11111-1111-4111-a111-000000000489', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.05, 2200, 0, NULL, 110, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001211', 'e1c11111-1111-4111-a111-000000000490', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.61, 680, 5, NULL, 1863.54, 0),
    ('e1e11111-1111-4111-a111-000000001212', 'e1c11111-1111-4111-a111-000000000490', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.26, 1050, 0, NULL, 273, 1),
    ('e1e11111-1111-4111-a111-000000001213', 'e1c11111-1111-4111-a111-000000000490', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.12, 185000, 0, NULL, 22200, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001214', 'e1c11111-1111-4111-a111-000000000491', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.08, 72, 0, NULL, 149.76, 0),
    ('e1e11111-1111-4111-a111-000000001215', 'e1c11111-1111-4111-a111-000000000491', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.35, 800, 0, NULL, 280, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001216', 'e1c11111-1111-4111-a111-000000000492', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 0.63, 1250, 0, NULL, 787.5, 0),
    ('e1e11111-1111-4111-a111-000000001217', 'e1c11111-1111-4111-a111-000000000492', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.26, 650, 0, NULL, 169, 1),
    ('e1e11111-1111-4111-a111-000000001218', 'e1c11111-1111-4111-a111-000000000492', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.13, 1800, 0, NULL, 234, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001219', 'e1c11111-1111-4111-a111-000000000493', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 1.88, 4800, 0, NULL, 9024, 0),
    ('e1e11111-1111-4111-a111-000000001220', 'e1c11111-1111-4111-a111-000000000493', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.37, 1200, 0, NULL, 444, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001221', 'e1c11111-1111-4111-a111-000000000494', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 2.16, 485000, 0, NULL, 1047600, 0),
    ('e1e11111-1111-4111-a111-000000001222', 'e1c11111-1111-4111-a111-000000000494', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.1, 1150, 0, NULL, 115, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001223', 'e1c11111-1111-4111-a111-000000000495', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 2.5, 890, 5, NULL, 2336.25, 0),
    ('e1e11111-1111-4111-a111-000000001224', 'e1c11111-1111-4111-a111-000000000495', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.26, 850, 0, NULL, 221, 1),
    ('e1e11111-1111-4111-a111-000000001225', 'e1c11111-1111-4111-a111-000000000495', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001226', 'e1c11111-1111-4111-a111-000000000496', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.25, 285, 0, NULL, 356.25, 0),
    ('e1e11111-1111-4111-a111-000000001227', 'e1c11111-1111-4111-a111-000000000496', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.3, 900, 0, NULL, 270, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001228', 'e1c11111-1111-4111-a111-000000000497', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.29, 1450, 0, NULL, 1870.5, 0),
    ('e1e11111-1111-4111-a111-000000001229', 'e1c11111-1111-4111-a111-000000000497', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.43, 950, 0, NULL, 408.5, 1),
    ('e1e11111-1111-4111-a111-000000001230', 'e1c11111-1111-4111-a111-000000000497', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.05, 220000, 0, NULL, 11000, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001231', 'e1c11111-1111-4111-a111-000000000498', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.62, 1650, 0, NULL, 4323, 0),
    ('e1e11111-1111-4111-a111-000000001232', 'e1c11111-1111-4111-a111-000000000498', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.39, 1100, 0, NULL, 429, 1),
    ('e1e11111-1111-4111-a111-000000001233', 'e1c11111-1111-4111-a111-000000000498', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.11, 1800, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001234', 'e1c11111-1111-4111-a111-000000000499', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 2.32, 42, 0, NULL, 97.44, 0),
    ('e1e11111-1111-4111-a111-000000001235', 'e1c11111-1111-4111-a111-000000000499', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.24, 1050, 0, NULL, 252, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001236', 'e1c11111-1111-4111-a111-000000000500', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 0.79, 68, 5, NULL, 56.41, 0),
    ('e1e11111-1111-4111-a111-000000001237', 'e1c11111-1111-4111-a111-000000000500', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.26, 800, 0, NULL, 208, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001238', 'e1c11111-1111-4111-a111-000000000501', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1, 320, 0, NULL, 320, 0),
    ('e1e11111-1111-4111-a111-000000001239', 'e1c11111-1111-4111-a111-000000000501', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.33, 650, 0, NULL, 214.5, 1),
    ('e1e11111-1111-4111-a111-000000001240', 'e1c11111-1111-4111-a111-000000000501', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001241', 'e1c11111-1111-4111-a111-000000000502', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 2.38, 4200, 0, NULL, 9996, 0),
    ('e1e11111-1111-4111-a111-000000001242', 'e1c11111-1111-4111-a111-000000000502', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.4, 1200, 0, NULL, 480, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001243', 'e1c11111-1111-4111-a111-000000000503', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.18, 520, 0, NULL, 613.6, 0),
    ('e1e11111-1111-4111-a111-000000001244', 'e1c11111-1111-4111-a111-000000000503', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.13, 1150, 0, NULL, 149.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001245', 'e1c11111-1111-4111-a111-000000000504', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.1, 48, 0, NULL, 52.8, 0),
    ('e1e11111-1111-4111-a111-000000001246', 'e1c11111-1111-4111-a111-000000000504', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.39, 850, 0, NULL, 331.5, 1),
    ('e1e11111-1111-4111-a111-000000001247', 'e1c11111-1111-4111-a111-000000000504', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.07, 1800, 0, NULL, 126, 2),
    ('e1e11111-1111-4111-a111-000000001248', 'e1c11111-1111-4111-a111-000000000504', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.03, 450000, 0, NULL, 13500, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001249', 'e1c11111-1111-4111-a111-000000000505', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.37, 850, 5, NULL, 1222.73, 0),
    ('e1e11111-1111-4111-a111-000000001250', 'e1c11111-1111-4111-a111-000000000505', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.25, 900, 0, NULL, 225, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001251', 'e1c11111-1111-4111-a111-000000000506', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 1.29, 680, 0, NULL, 877.2, 0),
    ('e1e11111-1111-4111-a111-000000001252', 'e1c11111-1111-4111-a111-000000000506', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.31, 950, 0, NULL, 294.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001253', 'e1c11111-1111-4111-a111-000000000507', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 0.87, 72, 0, NULL, 62.64, 0),
    ('e1e11111-1111-4111-a111-000000001254', 'e1c11111-1111-4111-a111-000000000507', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.25, 1100, 0, NULL, 275, 1),
    ('e1e11111-1111-4111-a111-000000001255', 'e1c11111-1111-4111-a111-000000000507', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.04, 2200, 0, NULL, 88, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001256', 'e1c11111-1111-4111-a111-000000000508', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 2.39, 1250, 0, NULL, 2987.5, 0),
    ('e1e11111-1111-4111-a111-000000001257', 'e1c11111-1111-4111-a111-000000000508', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.33, 1050, 0, NULL, 346.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001258', 'e1c11111-1111-4111-a111-000000000509', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 1.45, 4800, 0, NULL, 6960, 0),
    ('e1e11111-1111-4111-a111-000000001259', 'e1c11111-1111-4111-a111-000000000509', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.31, 800, 0, NULL, 248, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001260', 'e1c11111-1111-4111-a111-000000000510', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.5, 485000, 5, NULL, 763875, 0),
    ('e1e11111-1111-4111-a111-000000001261', 'e1c11111-1111-4111-a111-000000000510', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.32, 650, 0, NULL, 208, 1),
    ('e1e11111-1111-4111-a111-000000001262', 'e1c11111-1111-4111-a111-000000000510', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.12, 1800, 0, NULL, 216, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001263', 'e1c11111-1111-4111-a111-000000000511', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 2.03, 890, 0, NULL, 1806.7, 0),
    ('e1e11111-1111-4111-a111-000000001264', 'e1c11111-1111-4111-a111-000000000511', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.22, 1200, 0, NULL, 264, 1),
    ('e1e11111-1111-4111-a111-000000001265', 'e1c11111-1111-4111-a111-000000000511', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.06, 165000, 0, NULL, 9900, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001266', 'e1c11111-1111-4111-a111-000000000512', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 0.56, 285, 0, NULL, 159.6, 0),
    ('e1e11111-1111-4111-a111-000000001267', 'e1c11111-1111-4111-a111-000000000512', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.2, 1150, 0, NULL, 230, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001268', 'e1c11111-1111-4111-a111-000000000513', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 0.71, 1450, 0, NULL, 1029.5, 0),
    ('e1e11111-1111-4111-a111-000000001269', 'e1c11111-1111-4111-a111-000000000513', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.25, 850, 0, NULL, 212.5, 1),
    ('e1e11111-1111-4111-a111-000000001270', 'e1c11111-1111-4111-a111-000000000513', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.06, 2200, 0, NULL, 132, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001271', 'e1c11111-1111-4111-a111-000000000514', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.66, 1650, 0, NULL, 4389, 0),
    ('e1e11111-1111-4111-a111-000000001272', 'e1c11111-1111-4111-a111-000000000514', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.17, 900, 0, NULL, 153, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001273', 'e1c11111-1111-4111-a111-000000000515', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.04, 42, 5, NULL, 45.86, 0),
    ('e1e11111-1111-4111-a111-000000001274', 'e1c11111-1111-4111-a111-000000000515', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.12, 950, 0, NULL, 114, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001275', 'e1c11111-1111-4111-a111-000000000516', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.92, 68, 0, NULL, 130.56, 0),
    ('e1e11111-1111-4111-a111-000000001276', 'e1c11111-1111-4111-a111-000000000516', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.14, 1100, 0, NULL, 154, 1),
    ('e1e11111-1111-4111-a111-000000001277', 'e1c11111-1111-4111-a111-000000000516', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.05, 1800, 0, NULL, 90, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001278', 'e1c11111-1111-4111-a111-000000000517', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 0.77, 320, 0, NULL, 246.4, 0),
    ('e1e11111-1111-4111-a111-000000001279', 'e1c11111-1111-4111-a111-000000000517', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.23, 1050, 0, NULL, 241.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001280', 'e1c11111-1111-4111-a111-000000000518', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.48, 4200, 0, NULL, 6216, 0),
    ('e1e11111-1111-4111-a111-000000001281', 'e1c11111-1111-4111-a111-000000000518', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.41, 800, 0, NULL, 328, 1),
    ('e1e11111-1111-4111-a111-000000001282', 'e1c11111-1111-4111-a111-000000000518', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.04, 320000, 0, NULL, 12800, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001283', 'e1c11111-1111-4111-a111-000000000519', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 0.73, 520, 0, NULL, 379.6, 0),
    ('e1e11111-1111-4111-a111-000000001284', 'e1c11111-1111-4111-a111-000000000519', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.36, 650, 0, NULL, 234, 1),
    ('e1e11111-1111-4111-a111-000000001285', 'e1c11111-1111-4111-a111-000000000519', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.05, 2200, 0, NULL, 110, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001286', 'e1c11111-1111-4111-a111-000000000520', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.18, 48, 5, NULL, 59.47, 0),
    ('e1e11111-1111-4111-a111-000000001287', 'e1c11111-1111-4111-a111-000000000520', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.36, 1200, 0, NULL, 432, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001288', 'e1c11111-1111-4111-a111-000000000521', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.73, 850, 0, NULL, 1470.5, 0),
    ('e1e11111-1111-4111-a111-000000001289', 'e1c11111-1111-4111-a111-000000000521', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.31, 1150, 0, NULL, 356.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001290', 'e1c11111-1111-4111-a111-000000000522', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.29, 680, 0, NULL, 1557.2, 0),
    ('e1e11111-1111-4111-a111-000000001291', 'e1c11111-1111-4111-a111-000000000522', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.21, 850, 0, NULL, 178.5, 1),
    ('e1e11111-1111-4111-a111-000000001292', 'e1c11111-1111-4111-a111-000000000522', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.12, 1800, 0, NULL, 216, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001293', 'e1c11111-1111-4111-a111-000000000523', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 0.58, 72, 0, NULL, 41.76, 0),
    ('e1e11111-1111-4111-a111-000000001294', 'e1c11111-1111-4111-a111-000000000523', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.25, 900, 0, NULL, 225, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001295', 'e1c11111-1111-4111-a111-000000000524', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 2.01, 1250, 0, NULL, 2512.5, 0),
    ('e1e11111-1111-4111-a111-000000001296', 'e1c11111-1111-4111-a111-000000000524', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.24, 950, 0, NULL, 228, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001297', 'e1c11111-1111-4111-a111-000000000525', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 1.68, 4800, 5, NULL, 8467.2, 0),
    ('e1e11111-1111-4111-a111-000000001298', 'e1c11111-1111-4111-a111-000000000525', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.26, 1100, 0, NULL, 286, 1),
    ('e1e11111-1111-4111-a111-000000001299', 'e1c11111-1111-4111-a111-000000000525', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.08, 2200, 0, NULL, 176, 2),
    ('e1e11111-1111-4111-a111-000000001300', 'e1c11111-1111-4111-a111-000000000525', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.03, 185000, 0, NULL, 5550, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001301', 'e1c11111-1111-4111-a111-000000000526', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.49, 485000, 0, NULL, 722650, 0),
    ('e1e11111-1111-4111-a111-000000001302', 'e1c11111-1111-4111-a111-000000000526', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.34, 1050, 0, NULL, 357, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001303', 'e1c11111-1111-4111-a111-000000000527', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 2.49, 890, 0, NULL, 2216.1, 0),
    ('e1e11111-1111-4111-a111-000000001304', 'e1c11111-1111-4111-a111-000000000527', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.33, 800, 0, NULL, 264, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001305', 'e1c11111-1111-4111-a111-000000000528', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.01, 285, 0, NULL, 572.85, 0),
    ('e1e11111-1111-4111-a111-000000001306', 'e1c11111-1111-4111-a111-000000000528', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.24, 650, 0, NULL, 156, 1),
    ('e1e11111-1111-4111-a111-000000001307', 'e1c11111-1111-4111-a111-000000000528', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001308', 'e1c11111-1111-4111-a111-000000000529', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.27, 1450, 0, NULL, 3291.5, 0),
    ('e1e11111-1111-4111-a111-000000001309', 'e1c11111-1111-4111-a111-000000000529', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.17, 1200, 0, NULL, 204, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001310', 'e1c11111-1111-4111-a111-000000000530', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 0.84, 1650, 5, NULL, 1455.3, 0),
    ('e1e11111-1111-4111-a111-000000001311', 'e1c11111-1111-4111-a111-000000000530', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.38, 1150, 0, NULL, 437, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001312', 'e1c11111-1111-4111-a111-000000000531', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 2.36, 42, 0, NULL, 99.12, 0),
    ('e1e11111-1111-4111-a111-000000001313', 'e1c11111-1111-4111-a111-000000000531', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.39, 850, 0, NULL, 331.5, 1),
    ('e1e11111-1111-4111-a111-000000001314', 'e1c11111-1111-4111-a111-000000000531', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.09, 2200, 0, NULL, 198, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001315', 'e1c11111-1111-4111-a111-000000000532', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 2.69, 68, 0, NULL, 182.92, 0),
    ('e1e11111-1111-4111-a111-000000001316', 'e1c11111-1111-4111-a111-000000000532', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.17, 900, 0, NULL, 153, 1),
    ('e1e11111-1111-4111-a111-000000001317', 'e1c11111-1111-4111-a111-000000000532', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.06, 220000, 0, NULL, 13200, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001318', 'e1c11111-1111-4111-a111-000000000533', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.45, 320, 0, NULL, 464, 0),
    ('e1e11111-1111-4111-a111-000000001319', 'e1c11111-1111-4111-a111-000000000533', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.12, 950, 0, NULL, 114, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001320', 'e1c11111-1111-4111-a111-000000000534', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 0.85, 4200, 0, NULL, 3570, 0),
    ('e1e11111-1111-4111-a111-000000001321', 'e1c11111-1111-4111-a111-000000000534', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.28, 1100, 0, NULL, 308, 1),
    ('e1e11111-1111-4111-a111-000000001322', 'e1c11111-1111-4111-a111-000000000534', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.03, 1800, 0, NULL, 54, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001323', 'e1c11111-1111-4111-a111-000000000535', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.7, 520, 5, NULL, 928.2, 0),
    ('e1e11111-1111-4111-a111-000000001324', 'e1c11111-1111-4111-a111-000000000535', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.12, 1050, 0, NULL, 126, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001325', 'e1c11111-1111-4111-a111-000000000536', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.34, 48, 0, NULL, 112.32, 0),
    ('e1e11111-1111-4111-a111-000000001326', 'e1c11111-1111-4111-a111-000000000536', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.43, 800, 0, NULL, 344, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001327', 'e1c11111-1111-4111-a111-000000000537', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 2.09, 850, 0, NULL, 1776.5, 0),
    ('e1e11111-1111-4111-a111-000000001328', 'e1c11111-1111-4111-a111-000000000537', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.33, 650, 0, NULL, 214.5, 1),
    ('e1e11111-1111-4111-a111-000000001329', 'e1c11111-1111-4111-a111-000000000537', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.12, 2200, 0, NULL, 264, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001330', 'e1c11111-1111-4111-a111-000000000538', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 0.54, 680, 0, NULL, 367.2, 0),
    ('e1e11111-1111-4111-a111-000000001331', 'e1c11111-1111-4111-a111-000000000538', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.38, 1200, 0, NULL, 456, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001332', 'e1c11111-1111-4111-a111-000000000539', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 0.57, 72, 0, NULL, 41.04, 0),
    ('e1e11111-1111-4111-a111-000000001333', 'e1c11111-1111-4111-a111-000000000539', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.38, 1150, 0, NULL, 437, 1),
    ('e1e11111-1111-4111-a111-000000001334', 'e1c11111-1111-4111-a111-000000000539', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.07, 450000, 0, NULL, 31500, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001335', 'e1c11111-1111-4111-a111-000000000540', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 2.17, 1250, 5, NULL, 2848.13, 0),
    ('e1e11111-1111-4111-a111-000000001336', 'e1c11111-1111-4111-a111-000000000540', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.23, 850, 0, NULL, 195.5, 1),
    ('e1e11111-1111-4111-a111-000000001337', 'e1c11111-1111-4111-a111-000000000540', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.04, 1800, 0, NULL, 72, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001338', 'e1c11111-1111-4111-a111-000000000541', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 2.56, 4800, 0, NULL, 12288, 0),
    ('e1e11111-1111-4111-a111-000000001339', 'e1c11111-1111-4111-a111-000000000541', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.1, 900, 0, NULL, 90, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001340', 'e1c11111-1111-4111-a111-000000000542', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.78, 485000, 0, NULL, 863300, 0),
    ('e1e11111-1111-4111-a111-000000001341', 'e1c11111-1111-4111-a111-000000000542', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.29, 950, 0, NULL, 275.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001342', 'e1c11111-1111-4111-a111-000000000543', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.6, 890, 0, NULL, 1424, 0),
    ('e1e11111-1111-4111-a111-000000001343', 'e1c11111-1111-4111-a111-000000000543', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.37, 1100, 0, NULL, 407, 1),
    ('e1e11111-1111-4111-a111-000000001344', 'e1c11111-1111-4111-a111-000000000543', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.13, 2200, 0, NULL, 286, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001345', 'e1c11111-1111-4111-a111-000000000544', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.99, 285, 0, NULL, 567.15, 0),
    ('e1e11111-1111-4111-a111-000000001346', 'e1c11111-1111-4111-a111-000000000544', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.3, 1050, 0, NULL, 315, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001347', 'e1c11111-1111-4111-a111-000000000545', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.61, 1450, 5, NULL, 3973.73, 0),
    ('e1e11111-1111-4111-a111-000000001348', 'e1c11111-1111-4111-a111-000000000545', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.4, 800, 0, NULL, 320, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001349', 'e1c11111-1111-4111-a111-000000000546', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.57, 1650, 0, NULL, 2590.5, 0),
    ('e1e11111-1111-4111-a111-000000001350', 'e1c11111-1111-4111-a111-000000000546', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.31, 650, 0, NULL, 201.5, 1),
    ('e1e11111-1111-4111-a111-000000001351', 'e1c11111-1111-4111-a111-000000000546', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.09, 1800, 0, NULL, 162, 2),
    ('e1e11111-1111-4111-a111-000000001352', 'e1c11111-1111-4111-a111-000000000546', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.07, 165000, 0, NULL, 11550, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001353', 'e1c11111-1111-4111-a111-000000000547', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.33, 42, 0, NULL, 55.86, 0),
    ('e1e11111-1111-4111-a111-000000001354', 'e1c11111-1111-4111-a111-000000000547', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.26, 1200, 0, NULL, 312, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001355', 'e1c11111-1111-4111-a111-000000000548', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 2.16, 68, 0, NULL, 146.88, 0),
    ('e1e11111-1111-4111-a111-000000001356', 'e1c11111-1111-4111-a111-000000000548', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.29, 1150, 0, NULL, 333.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001357', 'e1c11111-1111-4111-a111-000000000549', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 2.24, 320, 0, NULL, 716.8, 0),
    ('e1e11111-1111-4111-a111-000000001358', 'e1c11111-1111-4111-a111-000000000549', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.11, 850, 0, NULL, 93.5, 1),
    ('e1e11111-1111-4111-a111-000000001359', 'e1c11111-1111-4111-a111-000000000549', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.12, 2200, 0, NULL, 264, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001360', 'e1c11111-1111-4111-a111-000000000550', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 2.55, 4200, 5, NULL, 11245.5, 0),
    ('e1e11111-1111-4111-a111-000000001361', 'e1c11111-1111-4111-a111-000000000550', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.11, 900, 0, NULL, 99, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001362', 'e1c11111-1111-4111-a111-000000000551', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.32, 520, 0, NULL, 686.4, 0),
    ('e1e11111-1111-4111-a111-000000001363', 'e1c11111-1111-4111-a111-000000000551', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.33, 950, 0, NULL, 313.5, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001364', 'e1c11111-1111-4111-a111-000000000552', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 2.2, 48, 0, NULL, 105.6, 0),
    ('e1e11111-1111-4111-a111-000000001365', 'e1c11111-1111-4111-a111-000000000552', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.33, 1100, 0, NULL, 363, 1),
    ('e1e11111-1111-4111-a111-000000001366', 'e1c11111-1111-4111-a111-000000000552', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.03, 1800, 0, NULL, 54, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001367', 'e1c11111-1111-4111-a111-000000000553', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 1.52, 850, 0, NULL, 1292, 0),
    ('e1e11111-1111-4111-a111-000000001368', 'e1c11111-1111-4111-a111-000000000553', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.12, 1050, 0, NULL, 126, 1),
    ('e1e11111-1111-4111-a111-000000001369', 'e1c11111-1111-4111-a111-000000000553', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.12, 320000, 0, NULL, 38400, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001370', 'e1c11111-1111-4111-a111-000000000554', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 2.48, 680, 0, NULL, 1686.4, 0),
    ('e1e11111-1111-4111-a111-000000001371', 'e1c11111-1111-4111-a111-000000000554', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.16, 800, 0, NULL, 128, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001372', 'e1c11111-1111-4111-a111-000000000555', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.62, 72, 5, NULL, 198.07, 0),
    ('e1e11111-1111-4111-a111-000000001373', 'e1c11111-1111-4111-a111-000000000555', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.13, 650, 0, NULL, 84.5, 1),
    ('e1e11111-1111-4111-a111-000000001374', 'e1c11111-1111-4111-a111-000000000555', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.02, 2200, 0, NULL, 44, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001375', 'e1c11111-1111-4111-a111-000000000556', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 1.97, 1250, 0, NULL, 2462.5, 0),
    ('e1e11111-1111-4111-a111-000000001376', 'e1c11111-1111-4111-a111-000000000556', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.22, 1200, 0, NULL, 264, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001377', 'e1c11111-1111-4111-a111-000000000557', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 2.29, 4800, 0, NULL, 10992, 0),
    ('e1e11111-1111-4111-a111-000000001378', 'e1c11111-1111-4111-a111-000000000557', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.34, 1150, 0, NULL, 391, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001379', 'e1c11111-1111-4111-a111-000000000558', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.73, 485000, 0, NULL, 839050, 0),
    ('e1e11111-1111-4111-a111-000000001380', 'e1c11111-1111-4111-a111-000000000558', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.16, 850, 0, NULL, 136, 1),
    ('e1e11111-1111-4111-a111-000000001381', 'e1c11111-1111-4111-a111-000000000558', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.08, 1800, 0, NULL, 144, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001382', 'e1c11111-1111-4111-a111-000000000559', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 1.03, 890, 0, NULL, 916.7, 0),
    ('e1e11111-1111-4111-a111-000000001383', 'e1c11111-1111-4111-a111-000000000559', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.25, 900, 0, NULL, 225, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001384', 'e1c11111-1111-4111-a111-000000000560', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 1.04, 285, 5, NULL, 311.22, 0),
    ('e1e11111-1111-4111-a111-000000001385', 'e1c11111-1111-4111-a111-000000000560', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.3, 950, 0, NULL, 285, 1),
    ('e1e11111-1111-4111-a111-000000001386', 'e1c11111-1111-4111-a111-000000000560', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.08, 185000, 0, NULL, 14800, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001387', 'e1c11111-1111-4111-a111-000000000561', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 1.09, 1450, 0, NULL, 1580.5, 0),
    ('e1e11111-1111-4111-a111-000000001388', 'e1c11111-1111-4111-a111-000000000561', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.09, 1100, 0, 1.15, 86.09, 1),
    ('e1e11111-1111-4111-a111-000000001389', 'e1c11111-1111-4111-a111-000000000561', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.1, 2200, 0, NULL, 220, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001390', 'e1c11111-1111-4111-a111-000000000562', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 0.57, 1650, 0, NULL, 940.5, 0),
    ('e1e11111-1111-4111-a111-000000001391', 'e1c11111-1111-4111-a111-000000000562', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.26, 1050, 0, 1.15, 237.39, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001392', 'e1c11111-1111-4111-a111-000000000563', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.4, 42, 0, NULL, 58.8, 0),
    ('e1e11111-1111-4111-a111-000000001393', 'e1c11111-1111-4111-a111-000000000563', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.25, 800, 0, 1.15, 173.91, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001394', 'e1c11111-1111-4111-a111-000000000564', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 1.25, 68, 0, NULL, 85, 0),
    ('e1e11111-1111-4111-a111-000000001395', 'e1c11111-1111-4111-a111-000000000564', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.18, 650, 0, 1.15, 101.74, 1),
    ('e1e11111-1111-4111-a111-000000001396', 'e1c11111-1111-4111-a111-000000000564', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.09, 1800, 0, NULL, 162, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001397', 'e1c11111-1111-4111-a111-000000000565', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.1, 320, 5, NULL, 369.6, 0),
    ('e1e11111-1111-4111-a111-000000001398', 'e1c11111-1111-4111-a111-000000000565', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.15, 1200, 0, 1.15, 156.52, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001399', 'e1c11111-1111-4111-a111-000000000566', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 2.24, 4200, 0, NULL, 9408, 0),
    ('e1e11111-1111-4111-a111-000000001400', 'e1c11111-1111-4111-a111-000000000566', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.41, 1150, 0, 1.15, 410, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001401', 'e1c11111-1111-4111-a111-000000000567', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.16, 520, 0, NULL, 603.2, 0),
    ('e1e11111-1111-4111-a111-000000001402', 'e1c11111-1111-4111-a111-000000000567', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.18, 850, 0, 1.15, 133.04, 1),
    ('e1e11111-1111-4111-a111-000000001403', 'e1c11111-1111-4111-a111-000000000567', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.11, 2200, 0, NULL, 242, 2),
    ('e1e11111-1111-4111-a111-000000001404', 'e1c11111-1111-4111-a111-000000000567', 'e1de4111-1111-4111-a111-000000000034', 'subcontract', 'Fire protection specialist', 'lot', 0.1, 220000, 0, NULL, 22000, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001405', 'e1c11111-1111-4111-a111-000000000568', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.87, 48, 0, NULL, 89.76, 0),
    ('e1e11111-1111-4111-a111-000000001406', 'e1c11111-1111-4111-a111-000000000568', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.3, 900, 0, 1.15, 234.78, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001407', 'e1c11111-1111-4111-a111-000000000569', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 2.39, 850, 0, NULL, 2031.5, 0),
    ('e1e11111-1111-4111-a111-000000001408', 'e1c11111-1111-4111-a111-000000000569', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.35, 950, 0, 1.15, 289.13, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001409', 'e1c11111-1111-4111-a111-000000000570', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 1.85, 680, 5, NULL, 1320.9, 0),
    ('e1e11111-1111-4111-a111-000000001410', 'e1c11111-1111-4111-a111-000000000570', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.27, 1100, 0, 1.15, 258.26, 1),
    ('e1e11111-1111-4111-a111-000000001411', 'e1c11111-1111-4111-a111-000000000570', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.12, 1800, 0, NULL, 216, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001412', 'e1c11111-1111-4111-a111-000000000571', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 2.44, 72, 0, NULL, 175.68, 0),
    ('e1e11111-1111-4111-a111-000000001413', 'e1c11111-1111-4111-a111-000000000571', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.23, 1050, 0, 1.15, 210, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001414', 'e1c11111-1111-4111-a111-000000000572', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 2.45, 1250, 0, NULL, 3062.5, 0),
    ('e1e11111-1111-4111-a111-000000001415', 'e1c11111-1111-4111-a111-000000000572', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.15, 800, 0, 1.15, 104.35, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001416', 'e1c11111-1111-4111-a111-000000000573', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 2.13, 4800, 0, NULL, 10224, 0),
    ('e1e11111-1111-4111-a111-000000001417', 'e1c11111-1111-4111-a111-000000000573', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.35, 650, 0, 1.15, 197.83, 1),
    ('e1e11111-1111-4111-a111-000000001418', 'e1c11111-1111-4111-a111-000000000573', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.12, 2200, 0, NULL, 264, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001419', 'e1c11111-1111-4111-a111-000000000574', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.34, 485000, 0, NULL, 649900, 0),
    ('e1e11111-1111-4111-a111-000000001420', 'e1c11111-1111-4111-a111-000000000574', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.14, 1200, 0, 1.15, 146.09, 1),
    ('e1e11111-1111-4111-a111-000000001421', 'e1c11111-1111-4111-a111-000000000574', 'e1de4111-1111-4111-a111-000000000036', 'subcontract', 'Curtain wall specialist', 'lot', 0.04, 450000, 0, NULL, 18000, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001422', 'e1c11111-1111-4111-a111-000000000575', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 2.3, 890, 5, NULL, 2149.35, 0),
    ('e1e11111-1111-4111-a111-000000001423', 'e1c11111-1111-4111-a111-000000000575', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.14, 1150, 0, 1.15, 140, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001424', 'e1c11111-1111-4111-a111-000000000576', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.46, 285, 0, NULL, 701.1, 0),
    ('e1e11111-1111-4111-a111-000000001425', 'e1c11111-1111-4111-a111-000000000576', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.18, 850, 0, 1.15, 133.04, 1),
    ('e1e11111-1111-4111-a111-000000001426', 'e1c11111-1111-4111-a111-000000000576', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.12, 1800, 0, NULL, 216, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001427', 'e1c11111-1111-4111-a111-000000000577', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 2.03, 1450, 0, NULL, 2943.5, 0),
    ('e1e11111-1111-4111-a111-000000001428', 'e1c11111-1111-4111-a111-000000000577', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.42, 900, 0, 1.15, 328.7, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001429', 'e1c11111-1111-4111-a111-000000000578', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 2.67, 1650, 0, NULL, 4405.5, 0),
    ('e1e11111-1111-4111-a111-000000001430', 'e1c11111-1111-4111-a111-000000000578', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.42, 950, 0, 1.15, 346.96, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001431', 'e1c11111-1111-4111-a111-000000000579', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 1.07, 42, 0, NULL, 44.94, 0),
    ('e1e11111-1111-4111-a111-000000001432', 'e1c11111-1111-4111-a111-000000000579', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.21, 1100, 0, 1.15, 200.87, 1),
    ('e1e11111-1111-4111-a111-000000001433', 'e1c11111-1111-4111-a111-000000000579', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.02, 2200, 0, NULL, 44, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001434', 'e1c11111-1111-4111-a111-000000000580', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 0.76, 68, 5, NULL, 54.26, 0),
    ('e1e11111-1111-4111-a111-000000001435', 'e1c11111-1111-4111-a111-000000000580', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.29, 1050, 0, 1.15, 264.78, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001436', 'e1c11111-1111-4111-a111-000000000581', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 0.51, 320, 0, NULL, 163.2, 0),
    ('e1e11111-1111-4111-a111-000000001437', 'e1c11111-1111-4111-a111-000000000581', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.16, 800, 0, 1.15, 111.3, 1),
    ('e1e11111-1111-4111-a111-000000001438', 'e1c11111-1111-4111-a111-000000000581', 'e1de4111-1111-4111-a111-000000000033', 'subcontract', 'Plumbing subcontract package', 'lot', 0.06, 165000, 0, NULL, 9900, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001439', 'e1c11111-1111-4111-a111-000000000582', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 1.34, 4200, 0, NULL, 5628, 0),
    ('e1e11111-1111-4111-a111-000000001440', 'e1c11111-1111-4111-a111-000000000582', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.2, 650, 0, 1.15, 113.04, 1),
    ('e1e11111-1111-4111-a111-000000001441', 'e1c11111-1111-4111-a111-000000000582', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.02, 1800, 0, NULL, 36, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001442', 'e1c11111-1111-4111-a111-000000000583', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 1.65, 520, 0, NULL, 858, 0),
    ('e1e11111-1111-4111-a111-000000001443', 'e1c11111-1111-4111-a111-000000000583', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.11, 1200, 0, 1.15, 114.78, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001444', 'e1c11111-1111-4111-a111-000000000584', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 0.8, 48, 0, NULL, 38.4, 0),
    ('e1e11111-1111-4111-a111-000000001445', 'e1c11111-1111-4111-a111-000000000584', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.33, 1150, 0, 1.15, 330, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001446', 'e1c11111-1111-4111-a111-000000000585', 'e1de4111-1111-4111-a111-000000000010', 'material', 'Sprinkler head upright', 'pc', 0.59, 850, 5, NULL, 526.58, 0),
    ('e1e11111-1111-4111-a111-000000001447', 'e1c11111-1111-4111-a111-000000000585', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.22, 850, 0, 1.15, 162.61, 1),
    ('e1e11111-1111-4111-a111-000000001448', 'e1c11111-1111-4111-a111-000000000585', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.05, 2200, 0, NULL, 110, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001449', 'e1c11111-1111-4111-a111-000000000586', 'e1de4111-1111-4111-a111-000000000011', 'material', 'Marine plywood 18mm', 'm2', 0.89, 680, 0, NULL, 605.2, 0),
    ('e1e11111-1111-4111-a111-000000001450', 'e1c11111-1111-4111-a111-000000000586', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.22, 900, 0, 1.15, 172.17, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001451', 'e1c11111-1111-4111-a111-000000000587', 'e1de4111-1111-4111-a111-000000000012', 'material', 'Wide flange W14 section', 'kg', 0.77, 72, 0, NULL, 55.44, 0),
    ('e1e11111-1111-4111-a111-000000001452', 'e1c11111-1111-4111-a111-000000000587', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.34, 950, 0, 1.15, 280.87, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001453', 'e1c11111-1111-4111-a111-000000000588', 'e1de4111-1111-4111-a111-000000000013', 'material', 'Standing seam metal sheet', 'm2', 1.92, 1250, 0, NULL, 2400, 0),
    ('e1e11111-1111-4111-a111-000000001454', 'e1c11111-1111-4111-a111-000000000588', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.32, 1100, 0, 1.15, 306.09, 1),
    ('e1e11111-1111-4111-a111-000000001455', 'e1c11111-1111-4111-a111-000000000588', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.06, 1800, 0, NULL, 108, 2),
    ('e1e11111-1111-4111-a111-000000001456', 'e1c11111-1111-4111-a111-000000000588', 'e1de4111-1111-4111-a111-000000000035', 'subcontract', 'HVAC specialist package', 'lot', 0.07, 320000, 0, NULL, 22400, 3);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001457', 'e1c11111-1111-4111-a111-000000000589', 'e1de4111-1111-4111-a111-000000000014', 'material', 'Aluminum window frame', 'm2', 1.62, 4800, 0, NULL, 7776, 0),
    ('e1e11111-1111-4111-a111-000000001458', 'e1c11111-1111-4111-a111-000000000589', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.42, 1050, 0, 1.15, 383.48, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001459', 'e1c11111-1111-4111-a111-000000000590', 'e1de4111-1111-4111-a111-000000000015', 'material', 'VRF outdoor unit 16HP', 'pc', 1.42, 485000, 5, NULL, 723135, 0),
    ('e1e11111-1111-4111-a111-000000001460', 'e1c11111-1111-4111-a111-000000000590', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.11, 800, 0, 1.15, 76.52, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001461', 'e1c11111-1111-4111-a111-000000000591', 'e1de4111-1111-4111-a111-000000000016', 'material', 'Asphalt premix', 'm2', 2.22, 890, 0, NULL, 1975.8, 0),
    ('e1e11111-1111-4111-a111-000000001462', 'e1c11111-1111-4111-a111-000000000591', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.26, 650, 0, 1.15, 146.96, 1),
    ('e1e11111-1111-4111-a111-000000001463', 'e1c11111-1111-4111-a111-000000000591', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.12, 2200, 0, NULL, 264, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001464', 'e1c11111-1111-4111-a111-000000000592', 'e1de4111-1111-4111-a111-000000000001', 'material', 'Portland Cement Type I 40kg bag', 'bag', 2.04, 285, 0, NULL, 581.4, 0),
    ('e1e11111-1111-4111-a111-000000001465', 'e1c11111-1111-4111-a111-000000000592', 'e1de4111-1111-4111-a111-000000000024', 'labor', 'Steel rigger', 'day', 0.33, 1200, 0, 1.15, 344.35, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001466', 'e1c11111-1111-4111-a111-000000000593', 'e1de4111-1111-4111-a111-000000000002', 'material', 'Washed sand', 'm3', 0.67, 1450, 0, NULL, 971.5, 0),
    ('e1e11111-1111-4111-a111-000000001467', 'e1c11111-1111-4111-a111-000000000593', 'e1de4111-1111-4111-a111-000000000025', 'labor', 'HVAC technician', 'day', 0.16, 1150, 0, 1.15, 160, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001468', 'e1c11111-1111-4111-a111-000000000594', 'e1de4111-1111-4111-a111-000000000003', 'material', 'Gravel 3/4"', 'm3', 1.2, 1650, 0, NULL, 1980, 0),
    ('e1e11111-1111-4111-a111-000000001469', 'e1c11111-1111-4111-a111-000000000594', 'e1de4111-1111-4111-a111-000000000017', 'labor', 'Mason', 'day', 0.19, 850, 0, 1.15, 140.43, 1),
    ('e1e11111-1111-4111-a111-000000001470', 'e1c11111-1111-4111-a111-000000000594', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.07, 1800, 0, NULL, 126, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001471', 'e1c11111-1111-4111-a111-000000000595', 'e1de4111-1111-4111-a111-000000000004', 'material', 'CHB 150mm', 'pc', 2.34, 42, 5, NULL, 103.19, 0),
    ('e1e11111-1111-4111-a111-000000001472', 'e1c11111-1111-4111-a111-000000000595', 'e1de4111-1111-4111-a111-000000000018', 'labor', 'Carpenter', 'day', 0.08, 900, 0, 1.15, 62.61, 1),
    ('e1e11111-1111-4111-a111-000000001473', 'e1c11111-1111-4111-a111-000000000595', 'e1de4111-1111-4111-a111-000000000032', 'subcontract', 'Electrical subcontract package', 'lot', 0.02, 185000, 0, NULL, 3700, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001474', 'e1c11111-1111-4111-a111-000000000596', 'e1de4111-1111-4111-a111-000000000005', 'material', 'Deformed bar #16', 'kg', 0.98, 68, 0, NULL, 66.64, 0),
    ('e1e11111-1111-4111-a111-000000001475', 'e1c11111-1111-4111-a111-000000000596', 'e1de4111-1111-4111-a111-000000000019', 'labor', 'Steel fixer', 'day', 0.15, 950, 0, 1.15, 123.91, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001476', 'e1c11111-1111-4111-a111-000000000597', 'e1de4111-1111-4111-a111-000000000006', 'material', 'Gypsum board 12.5mm', 'm2', 1.74, 320, 0, NULL, 556.8, 0),
    ('e1e11111-1111-4111-a111-000000001477', 'e1c11111-1111-4111-a111-000000000597', 'e1de4111-1111-4111-a111-000000000020', 'labor', 'Electrician', 'day', 0.22, 1100, 0, 1.15, 210.43, 1),
    ('e1e11111-1111-4111-a111-000000001478', 'e1c11111-1111-4111-a111-000000000597', 'e1de4111-1111-4111-a111-000000000029', 'equipment', 'Scaffolding rental', 'day', 0.14, 2200, 0, NULL, 308, 2);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001479', 'e1c11111-1111-4111-a111-000000000598', 'e1de4111-1111-4111-a111-000000000007', 'material', 'Latex paint 20L pail', 'lot', 0.91, 4200, 0, NULL, 3822, 0),
    ('e1e11111-1111-4111-a111-000000001480', 'e1c11111-1111-4111-a111-000000000598', 'e1de4111-1111-4111-a111-000000000021', 'labor', 'Plumber', 'day', 0.32, 1050, 0, 1.15, 292.17, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001481', 'e1c11111-1111-4111-a111-000000000599', 'e1de4111-1111-4111-a111-000000000008', 'material', 'PVC pipe 4" SDR', 'm', 2.05, 520, 0, NULL, 1066, 0),
    ('e1e11111-1111-4111-a111-000000001482', 'e1c11111-1111-4111-a111-000000000599', 'e1de4111-1111-4111-a111-000000000022', 'labor', 'Painter', 'day', 0.18, 800, 0, 1.15, 125.22, 1);

  INSERT INTO public.boq_rate_analysis_lines (
    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,
    unit_cost, waste_percent, productivity, amount, sort_order
  ) VALUES
    ('e1e11111-1111-4111-a111-000000001483', 'e1c11111-1111-4111-a111-000000000600', 'e1de4111-1111-4111-a111-000000000009', 'material', 'THHN wire 3.5mm2', 'm', 1.41, 48, 5, NULL, 71.06, 0),
    ('e1e11111-1111-4111-a111-000000001484', 'e1c11111-1111-4111-a111-000000000600', 'e1de4111-1111-4111-a111-000000000023', 'labor', 'Laborer/helper', 'day', 0.12, 650, 0, 1.15, 67.83, 1),
    ('e1e11111-1111-4111-a111-000000001485', 'e1c11111-1111-4111-a111-000000000600', 'e1de4111-1111-4111-a111-000000000026', 'equipment', 'Concrete mixer 1 bagger', 'day', 0.07, 1800, 0, NULL, 126, 2);

  INSERT INTO public.project_benchmark_actuals (
    project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity,
    estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost
  ) VALUES
    (v_project_id, 'e1c11111-1111-4111-a111-000000000001', 'MWB-0001', 'Portland cement concrete footing 4000 psi', 18.61, 18.23, 2017, 2057.12, 37536.37, 37501.3, 37501.3),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000002', 'MWB-0002', 'Reinforced concrete column 400mm', 18.71, 19.24, 2561, 2596.61, 47916.31, 49958.78, 49958.78),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000003', 'MWB-0003', 'Reinforced concrete beam 300x600', 11.95, 11.83, 604.1, 605.42, 7219, 7162.12, 7162.12),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000004', 'MWB-0004', 'Reinforced concrete slab on grade 150mm', 6.81, 6.97, 309.36, 314.51, 2106.74, 2192.13, 2192.13),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000005', 'MWB-0005', 'Reinforced concrete suspended slab 200mm', 25.45, 24.85, 900.48, 913.49, 22917.22, 22700.23, 22700.23),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000006', 'MWB-0006', 'Post-tensioned slab band', 3.41, 3.43, 4597, 4635.53, 15675.77, 15899.87, 15899.87),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000007', 'MWB-0007', 'Concrete core wall 300mm', 10.09, 10.28, 27209.2, 26887, 274540.83, 276398.36, 276398.36),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000008', 'MWB-0008', 'Concrete stairs and landings', 3.15, 3.06, 226.76, 227.91, 714.29, 697.4, 697.4),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000009', 'MWB-0009', 'Lean concrete blinding 50mm', 26.23, 26.54, 1588.5, 1559.54, 41666.36, 41390.19, 41390.19),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000010', 'MWB-0010', 'Concrete pump allowance', 14.97, 15.23, 1510.5, 1480.41, 22612.19, 22546.64, 22546.64),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000011', 'MWB-0011', 'Concrete curing compound', 9.67, 9.87, 411.53, 414.7, 3979.5, 4093.09, 4093.09),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000012', 'MWB-0012', 'Waterstop installation', 8.61, 8.58, 2440, 2485.34, 21008.4, 21324.22, 21324.22),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000013', 'MWB-0013', 'Expansion joint filler', 23.18, 23.12, 5914.5, 5900.74, 137098.11, 136425.11, 136425.11),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000014', 'MWB-0014', 'Concrete testing cubes', 4.12, 4.19, 1017292, 1025815.93, 4191243.04, 4298168.75, 4298168.75),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000015', 'MWB-0015', 'Night pour premium allowance', 5.11, 5.17, 977, 991.2, 4992.47, 5124.5, 5124.5),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000016', 'MWB-0016', 'Concrete vibration and finishing', 6.8, 6.96, 982.8, 1002.22, 6683.04, 6975.45, 6975.45),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000017', 'MWB-0017', 'Grouting under base plates', 21.03, 20.64, 2939.5, 2905.96, 61817.69, 59979.01, 59979.01),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000018', 'MWB-0018', 'RC retaining wall 250mm', 3.45, 3.4, 2981.5, 3034.72, 10286.18, 10318.05, 10318.05),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000019', 'MWB-0019', 'Concrete pile cap', 3.42, 3.32, 240.84, 237.63, 823.67, 788.93, 788.93),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000020', 'MWB-0020', 'Concrete grade beam', 16.98, 16.85, 170.68, 170.75, 2898.15, 2877.14, 2877.14),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000021', 'MWB-0021', 'Concrete topping 75mm', 16.41, 16.3, 4112.2, 4079.23, 67481.2, 66491.45, 66491.45),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000022', 'MWB-0022', 'Fiber mesh reinforcement', 17.08, 17.54, 5898.52, 5805.71, 100746.72, 101832.15, 101832.15),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000023', 'MWB-0023', 'Chemical admixture allowance', 16.66, 16.98, 1677.6, 1649.07, 27948.82, 28001.21, 28001.21),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000024', 'MWB-0024', 'Concrete washout facility', 4.12, 4.18, 331.68, 329.57, 1366.52, 1377.6, 1377.6),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000025', 'MWB-0025', 'Mass concrete pour monitoring', 16.15, 15.86, 1007.55, 996.71, 16271.93, 15807.82, 15807.82),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000026', 'MWB-0026', 'Concrete cold joint treatment', 5.44, 5.4, 1741.7, 1764.55, 9474.85, 9528.57, 9528.57),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000027', 'MWB-0027', 'RC shear wall coupling beam', 8.69, 8.44, 494.9, 501.08, 4300.68, 4229.12, 4229.12),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000028', 'MWB-0028', 'Concrete sump pit', 7.3, 7.09, 25760, 25729.61, 188048, 182422.93, 182422.93),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000029', 'MWB-0029', 'Concrete equipment pad', 21.8, 21.15, 7295, 7229.79, 159031, 152910.06, 152910.06),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000030', 'MWB-0030', 'Concrete pavement 200mm', 5.67, 5.66, 1181679, 1194242.21, 6700119.93, 6759410.91, 6759410.91),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000031', 'MWB-0031', 'Concrete curb and gutter', 19.31, 19.29, 2506.7, 2496.13, 48404.38, 48150.35, 48150.35),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000032', 'MWB-0032', 'Concrete bollard', 11.85, 11.52, 459, 467.58, 5439.15, 5386.52, 5386.52),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000033', 'MWB-0033', 'Concrete planter wall', 10.63, 10.65, 4299.83, 4365.75, 45707.19, 46495.24, 46495.24),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000034', 'MWB-0034', 'Concrete ramp 1:12', 16.11, 16.14, 3916.5, 3866.7, 63094.81, 62408.54, 62408.54),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000035', 'MWB-0035', 'Concrete lift pit', 11.89, 12, 6028.49, 6145.31, 71678.75, 73743.72, 73743.72),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000036', 'MWB-0036', 'Concrete tank slab', 9.35, 9.62, 549.26, 554.32, 5135.58, 5332.56, 5332.56),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000037', 'MWB-0037', 'Concrete isolation joint', 22.98, 22.96, 886.4, 884.22, 20369.47, 20301.69, 20301.69),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000038', 'MWB-0038', 'Concrete anchor bolt setting', 8.24, 8.01, 10182, 10119.08, 83899.68, 81053.83, 81053.83),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000039', 'MWB-0039', 'Concrete surface hardener', 14.88, 15.15, 974.2, 976.37, 14496.1, 14792.01, 14792.01),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000040', 'MWB-0040', 'Concrete repair mortar', 3.37, 3.28, 348.94, 342.58, 1175.93, 1123.66, 1123.66),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000041', 'MWB-0041', 'Supply and install rebar #16', 12.29, 12.55, 644, 639.9, 7914.76, 8030.75, 8030.75),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000042', 'MWB-0042', 'Supply and install rebar #20', 18.22, 18.29, 8555, 8638.53, 155872.1, 157998.71, 157998.71),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000043', 'MWB-0043', 'Supply and install rebar #25', 13.96, 14.19, 487.68, 494.94, 6808.01, 7023.2, 7023.2),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000044', 'MWB-0044', 'Supply and install rebar #32', 14.25, 14.02, 2501.01, 2546.18, 35639.39, 35697.44, 35697.44),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000045', 'MWB-0045', 'Cutting and bending rebar', 17.36, 17.48, 5022.4, 4999.71, 87188.86, 87394.93, 87394.93),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000046', 'MWB-0046', 'Welded wire mesh 6x6', 4.43, 4.52, 582225, 573164.13, 2579256.75, 2590701.87, 2590701.87),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000047', 'MWB-0047', 'Rebar chairs and spacers', 21.26, 20.99, 1218.2, 1231.85, 25898.93, 25856.53, 25856.53),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000048', 'MWB-0048', 'Epoxy coated rebar', 7.67, 7.88, 416.1, 414.92, 3191.49, 3269.57, 3269.57),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000049', 'MWB-0049', 'Rebar splicing couplers', 25.1, 24.67, 53238, 53166.56, 1336273.8, 1311619.04, 1311619.04),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000050', 'MWB-0050', 'Stirrups and ties', 14.94, 15.19, 4799.13, 4753.42, 71699, 72204.45, 72204.45);

  INSERT INTO public.project_benchmark_actuals (
    project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity,
    estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost
  ) VALUES
    (v_project_id, 'e1c11111-1111-4111-a111-000000000051', 'MWB-0051', 'Post-tensioning strand', 14.63, 14.98, 421.54, 426.76, 6167.13, 6392.86, 6392.86),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000052', 'MWB-0052', 'PT anchorage heads', 20.07, 19.56, 415.8, 413.93, 8345.11, 8096.47, 8096.47),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000053', 'MWB-0053', 'Rebar testing allowance', 14.58, 14.47, 766.7, 768.94, 11178.49, 11126.56, 11126.56),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000054', 'MWB-0054', 'Rebar welding', 18.33, 18.46, 7724, 7800.03, 141580.92, 143988.55, 143988.55),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000055', 'MWB-0055', 'Rebar threading', 1.95, 1.94, 1070.52, 1053.06, 2087.51, 2042.94, 2042.94),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000056', 'MWB-0056', 'Galvanized rebar', 13.13, 13.32, 20158.34, 20137.43, 264679, 268230.57, 268230.57),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000057', 'MWB-0057', 'Rebar cage prefabrication', 6.61, 6.67, 2077, 2045.98, 13728.97, 13646.69, 13646.69),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000058', 'MWB-0058', 'Rebar dowels', 11.61, 11.32, 1881, 1866.61, 21838.41, 21130.03, 21130.03),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000059', 'MWB-0059', 'Rebar lap splice', 2.01, 2.04, 414.88, 416.35, 833.91, 849.35, 849.35),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000060', 'MWB-0060', 'Rebar corrosion inhibitor', 7.21, 7.13, 1178.88, 1188.04, 8499.72, 8470.73, 8470.73),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000061', 'MWB-0061', 'Rebar protective caps', 16.16, 16.13, 3900, 3916.84, 63024, 63178.63, 63178.63),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000062', 'MWB-0062', 'Rebar inventory wastage', 5.63, 5.69, 291092, 287207.95, 1638847.96, 1634213.24, 1634213.24),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000063', 'MWB-0063', 'Rebar transport and handling', 14.41, 14, 25047.4, 25177.82, 360933.03, 352489.48, 352489.48),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000064', 'MWB-0064', 'Rebar fixing labor', 20.62, 20.59, 993.45, 1007.05, 20484.94, 20735.16, 20735.16),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000065', 'MWB-0065', 'Rebar inspection hold points', 13.66, 13.83, 4037.9, 4038.86, 55157.71, 55857.43, 55857.43),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000066', 'MWB-0066', 'Rebar bending schedule prep', 5.8, 5.97, 3033.03, 2983.94, 17591.57, 17814.12, 17814.12),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000067', 'MWB-0067', 'Rebar mesh sheets', 1.66, 1.71, 521.22, 526.89, 865.23, 900.98, 900.98),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000068', 'MWB-0068', 'Rebar U-bars', 4.71, 4.64, 505.16, 510.1, 2379.3, 2366.86, 2366.86),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000069', 'MWB-0069', 'Rebar cranking', 17.82, 18.27, 1041.7, 1044.92, 18563.09, 19090.69, 19090.69),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000070', 'MWB-0070', 'Rebar seismic detailing', 9.98, 9.68, 28786.2, 28592.07, 287286.28, 276771.24, 276771.24),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000071', 'MWB-0071', 'Rebar column cage', 15.59, 15.37, 1779.4, 1812.06, 27740.85, 27851.36, 27851.36),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000072', 'MWB-0072', 'Rebar beam cage', 21.25, 20.94, 480.38, 476.89, 10208.08, 9986.08, 9986.08),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000073', 'MWB-0073', 'Rebar slab mesh top', 14.05, 13.64, 1134.5, 1130.81, 15939.73, 15424.25, 15424.25),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000074', 'MWB-0074', 'Rebar slab mesh bottom', 6.94, 7.01, 1862.5, 1846.34, 12925.75, 12942.84, 12942.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000075', 'MWB-0075', 'Rebar chair plastic', 18.5, 18.39, 655.24, 642.26, 12121.94, 11811.16, 11811.16),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000076', 'MWB-0076', 'Rebar tying wire', 5.66, 5.76, 1194, 1191.07, 6758.04, 6860.56, 6860.56),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000077', 'MWB-0077', 'Rebar cutting disc', 25.53, 25.7, 19733.05, 19616.27, 503784.77, 504138.14, 504138.14),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000078', 'MWB-0078', 'Rebar bending machine', 15.56, 15.36, 1043205, 1024714.53, 16232269.8, 15739615.18, 15739615.18),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000079', 'MWB-0079', 'Rebar storage racks', 10.15, 10.3, 1402.8, 1396.21, 14238.42, 14380.96, 14380.96),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000080', 'MWB-0080', 'Rebar mill certificate', 15.65, 15.43, 400.1, 402.05, 6261.57, 6203.63, 6203.63),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000081', 'MWB-0081', 'Plywood formwork slab soffit', 14.64, 14.95, 1275, 1281.19, 18666, 19153.79, 19153.79),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000082', 'MWB-0082', 'Plywood formwork beam sides', 13.74, 13.42, 1621.5, 1640.66, 22279.41, 22017.66, 22017.66),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000083', 'MWB-0083', 'Plywood formwork column', 4.73, 4.83, 236.52, 234.9, 1118.74, 1134.57, 1134.57),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000084', 'MWB-0084', 'Phenolic formwork wall', 7.45, 7.42, 50007.32, 50043.84, 372554.53, 371325.29, 371325.29),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000085', 'MWB-0085', 'Timber formwork footing', 14.69, 15.01, 1253.7, 1273.89, 18416.85, 19121.09, 19121.09),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000086', 'MWB-0086', 'Formwork oil application', 3.82, 3.71, 7486, 7584.12, 28596.52, 28137.09, 28137.09),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000087', 'MWB-0087', 'Formwork ties and walers', 7.36, 7.29, 1646, 1630.04, 12114.56, 11882.99, 11882.99),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000088', 'MWB-0088', 'Formwork stripping and cleaning', 8.85, 9.05, 539.55, 533.5, 4775.02, 4828.18, 4828.18),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000089', 'MWB-0089', 'Aluminum formwork panel', 18.73, 18.97, 1075.5, 1059.4, 20144.12, 20096.82, 20096.82),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000090', 'MWB-0090', 'Formwork bracing and shoring', 9.97, 9.72, 1882.36, 1892.27, 18767.13, 18392.86, 18392.86),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000091', 'MWB-0091', 'Formwork chamfer strips', 4.58, 4.61, 3750, 3748.84, 17175, 17282.15, 17282.15),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000092', 'MWB-0092', 'Formwork release agent', 4.11, 4.09, 3365, 3348.56, 13830.15, 13695.61, 13695.61),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000093', 'MWB-0093', 'Formwork repair plywood', 12.92, 13.3, 12670, 12725.8, 163696.4, 169253.14, 169253.14),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000094', 'MWB-0094', 'Formwork leveling wedges', 1.85, 1.85, 1149544.5, 1154605.93, 2126657.33, 2136020.97, 2136020.97),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000095', 'MWB-0095', 'Formwork soldier piles', 3.23, 3.26, 763.46, 757.47, 2465.98, 2469.35, 2469.35),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000096', 'MWB-0096', 'Formwork jump system', 7.14, 7.23, 795.25, 783.71, 5678.09, 5666.22, 5666.22),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000097', 'MWB-0097', 'Formwork climbing platform', 24.52, 25.07, 3165, 3166.37, 77605.8, 79380.9, 79380.9),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000098', 'MWB-0098', 'Formwork tie rod', 20.44, 20.08, 24995, 25173.19, 510897.8, 505477.66, 505477.66),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000099', 'MWB-0099', 'Formwork cone plug', 11.34, 11, 324.01, 320.97, 3674.27, 3530.67, 3530.67),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000100', 'MWB-0100', 'Formwork beam clamp', 11.49, 11.67, 219.95, 223.28, 2527.23, 2605.68, 2605.68);

  INSERT INTO public.project_benchmark_actuals (
    project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity,
    estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost
  ) VALUES
    (v_project_id, 'e1c11111-1111-4111-a111-000000000101', 'MWB-0101', 'Formwork prop steel', 9.51, 9.71, 465.7, 467.18, 4428.81, 4536.32, 4536.32),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000102', 'MWB-0102', 'Formwork H-beam waler', 8.88, 9.12, 9099, 9158.78, 80799.12, 83528.07, 83528.07),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000103', 'MWB-0103', 'Formwork plywood 18mm', 9.97, 10.06, 1672.3, 1700.3, 16672.83, 17105.02, 17105.02),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000104', 'MWB-0104', 'Formwork edge protection', 13.93, 14.05, 156.64, 158.35, 2182, 2224.82, 2224.82),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000105', 'MWB-0105', 'Formwork inspection', 16.22, 16.64, 14017.38, 13868.89, 227361.9, 230778.33, 230778.33),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000106', 'MWB-0106', 'Formwork design allowance', 15.77, 15.37, 1682.4, 1683.89, 26531.45, 25881.39, 25881.39),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000107', 'MWB-0107', 'Formwork rental extension', 17.64, 18.16, 512.56, 517.71, 9041.56, 9401.61, 9401.61),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000108', 'MWB-0108', 'Formwork transport', 19.11, 18.82, 3638, 3588.18, 69522.18, 67529.55, 67529.55),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000109', 'MWB-0109', 'Formwork storage yard', 20.43, 20.35, 10488, 10677.25, 214269.84, 217282.04, 217282.04),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000110', 'MWB-0110', 'Formwork carpenter labor', 8.19, 8.24, 1049494.98, 1043486.91, 8595363.89, 8598332.14, 8598332.14),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000111', 'MWB-0111', 'Formwork helper labor', 9.5, 9.28, 895.9, 895.47, 8511.05, 8309.96, 8309.96),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000112', 'MWB-0112', 'Formwork nails and screws', 6.33, 6.51, 18567.35, 18723.33, 117531.33, 121888.88, 121888.88),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000113', 'MWB-0113', 'Formwork timber batten', 24.83, 24.67, 2539.5, 2585.22, 63055.79, 63777.38, 63777.38),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000114', 'MWB-0114', 'Formwork circular column', 8.13, 8.02, 1339.5, 1326.79, 10890.14, 10640.86, 10640.86),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000115', 'MWB-0115', 'Formwork curved slab', 16.88, 17.05, 525.24, 529.37, 8866.05, 9025.76, 9025.76),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000116', 'MWB-0116', 'Formwork stair soffit', 12.41, 12.5, 282.78, 282.17, 3509.3, 3527.13, 3527.13),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000117', 'MWB-0117', 'Formwork core wall', 19.01, 18.91, 1301.2, 1286.38, 24735.81, 24325.45, 24325.45),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000118', 'MWB-0118', 'Formwork lift shaft', 13.83, 13.98, 5697, 5804.91, 78789.51, 81152.64, 81152.64),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000119', 'MWB-0119', 'Formwork curing blanket', 19.28, 19.08, 28691.3, 28921.36, 553168.26, 551819.55, 551819.55),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000120', 'MWB-0120', 'Formwork night shift premium', 21.27, 21.08, 435.44, 435.92, 9261.81, 9189.19, 9189.19),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000121', 'MWB-0121', 'Structural steel column W14', 24.39, 23.99, 2334.33, 2363.43, 56934.31, 56698.69, 56698.69),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000122', 'MWB-0122', 'Structural steel beam W18', 13.52, 13.47, 2015.2, 2001.1, 27245.5, 26954.82, 26954.82),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000123', 'MWB-0123', 'Steel bracing member', 16.56, 16.9, 267.18, 270.48, 4424.5, 4571.11, 4571.11),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000124', 'MWB-0124', 'Steel base plate 400x400', 2.91, 2.92, 1359.5, 1380.03, 3956.15, 4029.69, 4029.69),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000125', 'MWB-0125', 'Steel anchor bolts M24', 15.91, 16.09, 3962.3, 3965.81, 63040.19, 63809.88, 63809.88),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000126', 'MWB-0126', 'Steel connection plates', 18.92, 18.91, 1006186.5, 1007446.81, 19037048.58, 19050819.18, 19050819.18),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000127', 'MWB-0127', 'Steel stair stringer', 14.45, 14.51, 1106.3, 1122.14, 15986.03, 16282.25, 16282.25),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000128', 'MWB-0128', 'Steel handrail', 4.17, 4.29, 881.6, 885.67, 3676.27, 3799.52, 3799.52),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000129', 'MWB-0129', 'Steel decking composite', 17.52, 17.44, 2924.5, 2958.82, 51237.24, 51601.82, 51601.82),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000130', 'MWB-0130', 'Steel shear studs', 1.82, 1.8, 4846.28, 4801.99, 8820.23, 8643.58, 8643.58),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000131', 'MWB-0131', 'Steel fireproofing intumescent', 15.76, 15.89, 249.56, 245.21, 3933.07, 3896.39, 3896.39),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000132', 'MWB-0132', 'Steel primer and paint', 13.23, 13.42, 196.05, 194.48, 2593.74, 2609.92, 2609.92),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000133', 'MWB-0133', 'Steel erection labor', 22.93, 23.59, 29413.6, 29997.69, 674453.85, 707645.51, 707645.51),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000134', 'MWB-0134', 'Steel welding SMAW', 14.42, 14.45, 6026, 6047.97, 86894.92, 87393.17, 87393.17),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000135', 'MWB-0135', 'Steel bolted connection', 4.97, 5.02, 1551.26, 1532, 7709.76, 7690.64, 7690.64),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000136', 'MWB-0136', 'Steel grating floor', 16.55, 16.61, 287.52, 293.09, 4758.46, 4868.22, 4868.22),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000137', 'MWB-0137', 'Steel lintel angle', 12.53, 12.58, 2229, 2273.46, 27929.37, 28600.13, 28600.13),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000138', 'MWB-0138', 'Steel embed plates', 15.22, 15.65, 2109.4, 2119.07, 32105.07, 33163.45, 33163.45),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000139', 'MWB-0139', 'Steel crane lift allowance', 19.58, 19.04, 495.3, 485.83, 9697.97, 9250.2, 9250.2),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000140', 'MWB-0140', 'Steel shop drawing', 3.6, 3.69, 12939.63, 12727.26, 46582.67, 46963.59, 46963.59),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000141', 'MWB-0141', 'Steel fabrication', 16.93, 16.79, 4549.5, 4467.33, 77023.04, 75006.47, 75006.47),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000142', 'MWB-0142', 'Steel galvanizing', 16.4, 16.42, 1154552, 1134717, 18934652.8, 18632053.14, 18632053.14),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000143', 'MWB-0143', 'Steel moment connection', 21.04, 21.23, 1436.04, 1416.74, 30214.28, 30077.39, 30077.39),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000144', 'MWB-0144', 'Steel purlin C-channel', 3.22, 3.21, 1196, 1175.96, 3851.12, 3774.83, 3774.83),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000145', 'MWB-0145', 'Steel roof truss', 26.04, 25.84, 3437.48, 3502.52, 89511.98, 90505.12, 90505.12),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000146', 'MWB-0146', 'Steel mezzanine framing', 18.2, 18.21, 2048.5, 2059.13, 37282.7, 37496.76, 37496.76),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000147', 'MWB-0147', 'Steel equipment support', 8.58, 8.53, 26971.94, 26581.17, 231419.25, 226737.38, 226737.38),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000148', 'MWB-0148', 'Steel platform', 10.38, 10.09, 337.22, 343.51, 3500.34, 3466.02, 3466.02),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000149', 'MWB-0149', 'Steel cat ladder', 7.72, 7.88, 1052.8, 1060.69, 8127.62, 8358.24, 8358.24),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000150', 'MWB-0150', 'Steel blast cleaning', 7.21, 7.17, 11834.6, 11624.3, 85327.47, 83346.23, 83346.23);

  INSERT INTO public.project_benchmark_actuals (
    project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity,
    estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost
  ) VALUES
    (v_project_id, 'e1c11111-1111-4111-a111-000000000151', 'MWB-0151', 'Steel touch-up paint', 9.96, 9.75, 847.2, 857.4, 8438.11, 8359.65, 8359.65),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000152', 'MWB-0152', 'Steel survey and layout', 14.68, 14.76, 247.3, 248.27, 3630.36, 3664.47, 3664.47),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000153', 'MWB-0153', 'Steel temporary bracing', 12.77, 12.61, 1019.5, 999.81, 13019.02, 12607.6, 12607.6),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000154', 'MWB-0154', 'Steel shims and grouting', 8.84, 8.84, 24555.96, 24229.34, 217074.69, 214187.37, 214187.37),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000155', 'MWB-0155', 'Steel inspection', 18.3, 17.89, 534.55, 525.45, 9782.27, 9400.3, 9400.3),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000156', 'MWB-0156', 'Steel transport', 1.84, 1.81, 1366, 1382.38, 2513.44, 2502.11, 2502.11),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000157', 'MWB-0157', 'Steel unloading', 18.88, 19.4, 11160, 11308.84, 210700.8, 219391.5, 219391.5),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000158', 'MWB-0158', 'Steel storage', 3.95, 3.96, 1266114, 1271923.55, 5001150.3, 5036817.26, 5036817.26),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000159', 'MWB-0159', 'Steel trial assembly', 2.03, 1.98, 1076.4, 1097.28, 2185.09, 2172.61, 2172.61),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000160', 'MWB-0160', 'Steel warranty documentation', 19.66, 19.99, 559.93, 555.2, 11008.22, 11098.45, 11098.45),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000161', 'MWB-0161', '150mm CHB wall reinforced', 13.23, 12.86, 21746, 21745.37, 287699.58, 279645.46, 279645.46),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000162', 'MWB-0162', '100mm CHB partition', 2.9, 2.96, 3658.5, 3653.53, 10609.65, 10814.45, 10814.45),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000163', 'MWB-0163', '4" CHB infill', 9.39, 9.15, 242.88, 238.18, 2280.64, 2179.35, 2179.35),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000164', 'MWB-0164', 'Brick veneer wall', 16.56, 16.81, 134.46, 134.07, 2226.66, 2253.72, 2253.72),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000165', 'MWB-0165', 'Glass block wall', 12.77, 12.58, 857.43, 861.9, 10949.38, 10842.7, 10842.7),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000166', 'MWB-0166', 'Masonry grout filling', 4.11, 4.16, 2940, 2952.84, 12083.4, 12283.81, 12283.81),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000167', 'MWB-0167', 'Wall chipping and prep', 7.8, 7.71, 886.8, 896.63, 6917.04, 6913.02, 6913.02),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000168', 'MWB-0168', 'Masonry lintel', 3.41, 3.42, 29082.14, 29404.93, 99170.1, 100564.86, 100564.86),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000169', 'MWB-0169', 'Control joint sealant', 10.27, 10.05, 1879, 1853.97, 19297.33, 18632.4, 18632.4),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000170', 'MWB-0170', 'Masonry cleaning', 8.42, 8.58, 1423.9, 1450.32, 11989.24, 12443.75, 12443.75),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000171', 'MWB-0171', 'CHB pilaster', 13.69, 13.51, 529, 539.14, 7242.01, 7283.78, 7283.78),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000172', 'MWB-0172', 'CHB stiffener column', 15.34, 15.28, 2302.5, 2299.39, 35320.35, 35134.68, 35134.68),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000173', 'MWB-0173', 'Masonry bond beam', 7.06, 7.23, 6372.5, 6438.37, 44989.85, 46549.42, 46549.42),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000174', 'MWB-0174', 'Masonry wall tie', 8.64, 8.39, 1179148, 1179493.31, 10187838.72, 9895948.87, 9895948.87),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000175', 'MWB-0175', 'Masonry damp proof course', 9.46, 9.67, 17339.32, 17497.18, 164029.97, 169197.73, 169197.73),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000176', 'MWB-0176', 'Masonry acoustic wall', 7.89, 7.78, 573.59, 570.68, 4525.63, 4439.89, 4439.89),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000177', 'MWB-0177', 'Masonry fire rating wall', 11.01, 11.07, 2291.5, 2287.9, 25229.42, 25327.05, 25327.05),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000178', 'MWB-0178', 'Masonry core filling grout', 2.99, 2.96, 2032.5, 2000.96, 6077.18, 5922.84, 5922.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000179', 'MWB-0179', 'Masonry tooling joints', 6.71, 6.67, 361.48, 356.06, 2425.53, 2374.92, 2374.92),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000180', 'MWB-0180', 'Masonry scaffolding', 11.02, 10.91, 567.21, 558.61, 6250.65, 6094.44, 6094.44),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000181', 'MWB-0181', 'Masonry mortar mix', 24.68, 24.31, 619.6, 625.7, 15291.73, 15210.77, 15210.77),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000182', 'MWB-0182', 'Masonry sample panel', 16.44, 16.22, 26206, 25887.7, 430826.64, 419898.49, 419898.49),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000183', 'MWB-0183', 'Masonry testing', 3.23, 3.31, 727.2, 718.15, 2348.86, 2377.08, 2377.08),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000184', 'MWB-0184', 'Masonry night work', 6.33, 6.25, 260.76, 264.75, 1650.61, 1654.69, 1654.69),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000185', 'MWB-0185', 'Masonry waste allowance', 17.23, 16.99, 1245.15, 1261.36, 21453.93, 21430.51, 21430.51),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000186', 'MWB-0186', 'Masonry cutting disc', 1.64, 1.67, 1021.8, 1009.01, 1675.75, 1685.05, 1685.05),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000187', 'MWB-0187', 'Masonry joint raking', 10.66, 10.54, 546.01, 536.74, 5820.47, 5657.24, 5657.24),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000188', 'MWB-0188', 'Masonry waterproof additive', 16.8, 16.32, 3088, 3026.37, 51878.4, 49390.36, 49390.36),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000189', 'MWB-0189', 'Masonry expansion joint', 26.05, 25.95, 21770, 21581.14, 567108.5, 560030.58, 560030.58),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000190', 'MWB-0190', 'Masonry corner reinforcement', 7.47, 7.61, 601068, 608156.75, 4489977.96, 4628072.87, 4628072.87),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000191', 'MWB-0191', 'Masonry opening reinforcement', 17.17, 17.66, 1851.4, 1860.81, 31788.54, 32861.9, 32861.9),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000192', 'MWB-0192', 'Masonry shelf angle', 3.14, 3.21, 1021.9, 1018.68, 3208.77, 3269.96, 3269.96),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000193', 'MWB-0193', 'Masonry veneer ties', 8.97, 9.03, 4031, 3954.23, 36158.07, 35706.7, 35706.7),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000194', 'MWB-0194', 'Masonry weep holes', 14.39, 14.16, 4106.5, 4041.23, 59092.54, 57223.82, 57223.82),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000195', 'MWB-0195', 'Masonry cleaning acid', 14.13, 14.33, 501.93, 496.32, 7092.27, 7112.27, 7112.27),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000196', 'MWB-0196', 'Masonry protection board', 19.4, 19.47, 10337.6, 10516.45, 200549.44, 204755.28, 204755.28),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000197', 'MWB-0197', 'Masonry curing', 8.58, 8.76, 597.1, 597.89, 5123.12, 5237.52, 5237.52),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000198', 'MWB-0198', 'Masonry inspection', 11.63, 11.69, 11623.13, 11607.03, 135177, 135686.18, 135686.18),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000199', 'MWB-0199', 'Masonry as-built survey', 18.09, 18.38, 1034, 1052.01, 18705.06, 19335.94, 19335.94),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000200', 'MWB-0200', 'Masonry touch-up', 2.65, 2.64, 383.33, 379.15, 1015.82, 1000.96, 1000.96);

  INSERT INTO public.project_benchmark_actuals (
    project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity,
    estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost
  ) VALUES
    (v_project_id, 'e1c11111-1111-4111-a111-000000000201', 'MWB-0201', 'Standing seam metal roof', 25.79, 25.27, 2009, 2004.85, 51812.11, 50662.56, 50662.56),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000202', 'MWB-0202', 'Roof insulation 50mm', 5.44, 5.38, 961.6, 950.95, 5231.1, 5116.11, 5116.11),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000203', 'MWB-0203', 'Roof vapor barrier', 8.95, 9.06, 29214.16, 28668.67, 261466.73, 259738.15, 259738.15),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000204', 'MWB-0204', 'Roof flashing galvanized', 4.1, 4.12, 2848.5, 2879.14, 11678.85, 11862.06, 11862.06),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000205', 'MWB-0205', 'Roof gutter and downpipe', 12.62, 12.84, 9744, 9722.64, 122969.28, 124838.7, 124838.7),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000206', 'MWB-0206', 'Roof skylight curb', 2.92, 2.89, 1159334, 1146669.54, 3385255.28, 3313874.97, 3313874.97),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000207', 'MWB-0207', 'Roof walkway pads', 3.31, 3.33, 1525.3, 1540.33, 5048.74, 5129.3, 5129.3),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000208', 'MWB-0208', 'Roof safety anchor', 10.51, 10.43, 889.8, 888.86, 9351.8, 9270.81, 9270.81),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000209', 'MWB-0209', 'Roof waterproof membrane', 15.1, 14.72, 2212.78, 2206.9, 33412.98, 32485.57, 32485.57),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000210', 'MWB-0210', 'Roof drain stainless', 16.56, 16.63, 22264.7, 21975.82, 368703.43, 365457.89, 365457.89),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000211', 'MWB-0211', 'Roof parapet coping', 16.09, 15.76, 343.56, 341.96, 5527.88, 5389.29, 5389.29),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000212', 'MWB-0212', 'Roof expansion joint cover', 15.36, 15.3, 194.84, 192.54, 2992.74, 2945.86, 2945.86),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000213', 'MWB-0213', 'Roof sealant lap', 9.01, 9.24, 898.6, 883.07, 8096.39, 8159.57, 8159.57),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000214', 'MWB-0214', 'Roof ridge cap', 4.99, 5.01, 7740, 7822.79, 38622.6, 39192.18, 39192.18),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000215', 'MWB-0215', 'Roof eave trim', 1.81, 1.86, 1126.94, 1137.94, 2039.76, 2116.57, 2116.57),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000216', 'MWB-0216', 'Roof underlayment', 4.74, 4.7, 373.82, 367.53, 1771.91, 1727.39, 1727.39),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000217', 'MWB-0217', 'Roof cricket saddle', 20.31, 20.62, 16148.5, 16193.31, 327976.03, 333906.05, 333906.05),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000218', 'MWB-0218', 'Roof equipment curb', 13.96, 13.74, 604.7, 608.62, 8441.61, 8362.44, 8362.44),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000219', 'MWB-0219', 'Roof lightning clip', 9.03, 9.05, 623.56, 632.25, 5630.75, 5721.86, 5721.86),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000220', 'MWB-0220', 'Roof maintenance hatch', 12.76, 12.41, 1567.89, 1573.4, 20006.28, 19525.89, 19525.89),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000221', 'MWB-0221', 'Roof fall protection', 7.61, 7.38, 11968, 12140.59, 91076.48, 89597.55, 89597.55),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000222', 'MWB-0222', 'Roof insulation taper', 19.26, 19.35, 1004367, 994575.1, 19344108.42, 19245028.19, 19245028.19),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000223', 'MWB-0223', 'Roof deck metal', 19.44, 18.89, 681.5, 694.5, 13248.36, 13119.11, 13119.11),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000224', 'MWB-0224', 'Roof fastener concealed', 17.7, 17.45, 36728.45, 36764.09, 650093.56, 641533.37, 641533.37),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000225', 'MWB-0225', 'Roof testing flood', 22.25, 22.03, 3281.58, 3217.62, 73015.16, 70884.17, 70884.17),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000226', 'MWB-0226', 'Roof warranty inspection', 9.7, 9.7, 2449.5, 2427.17, 23760.15, 23543.55, 23543.55),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000227', 'MWB-0227', 'Roof night seal', 7.07, 6.99, 266.38, 261.32, 1883.31, 1826.63, 1826.63),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000228', 'MWB-0228', 'Roof transport hoist', 8.61, 8.46, 547.4, 552.48, 4713.11, 4673.98, 4673.98),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000229', 'MWB-0229', 'Roof debris netting', 6.38, 6.28, 1181.2, 1157.85, 7536.06, 7271.3, 7271.3),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000230', 'MWB-0230', 'Roof bird screen', 8.87, 8.95, 7067.7, 6970.68, 62690.5, 62387.59, 62387.59),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000231', 'MWB-0231', 'Roof overflow scupper', 15.31, 15.3, 19922.57, 19659.53, 305014.55, 300790.81, 300790.81),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000232', 'MWB-0232', 'Roof snow guard N/A', 8.89, 8.76, 511.2, 514.46, 4544.57, 4506.67, 4506.67),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000233', 'MWB-0233', 'Roof solar mounting prep', 8.85, 8.76, 2238.5, 2265.41, 19810.72, 19844.99, 19844.99),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000234', 'MWB-0234', 'Roof acoustic layer', 17.38, 17.31, 1861.3, 1846.11, 32349.39, 31956.16, 31956.16),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000235', 'MWB-0235', 'Roof fire barrier', 8.27, 8.3, 508.39, 515.42, 4204.39, 4277.99, 4277.99),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000236', 'MWB-0236', 'Roof shop drawing', 11.16, 11.18, 1309.5, 1321.49, 14614.02, 14774.26, 14774.26),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000237', 'MWB-0237', 'Roof mock-up panel', 18.58, 18.08, 3080, 3107.48, 57226.4, 56183.24, 56183.24),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000238', 'MWB-0238', 'Roof cleaning', 3.58, 3.68, 651565, 639545.4, 2332602.7, 2353527.07, 2353527.07),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000239', 'MWB-0239', 'Roof touch-up paint', 4.86, 4.94, 568.6, 558.09, 2763.4, 2756.96, 2756.96),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000240', 'MWB-0240', 'Roof as-built', 19.84, 20.26, 1058.6, 1059.45, 21002.62, 21464.46, 21464.46),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000241', 'MWB-0241', 'Gypsum board ceiling 12.5mm', 8.39, 8.21, 3043, 3001.89, 25530.77, 24645.52, 24645.52),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000242', 'MWB-0242', 'Mineral fiber acoustic tile', 14.83, 14.53, 3760.23, 3765.68, 55764.21, 54715.33, 54715.33),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000243', 'MWB-0243', 'Metal furring channel', 5.95, 5.96, 666.52, 676.79, 3965.79, 4033.67, 4033.67),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000244', 'MWB-0244', 'Suspended ceiling T-bar', 20.69, 20.65, 274.6, 277.48, 5681.47, 5729.96, 5729.96),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000245', 'MWB-0245', 'Ceiling insulation', 10.25, 10.23, 6444.78, 6465.35, 66059, 66140.53, 66140.53),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000246', 'MWB-0246', 'Access panel 600x600', 1.47, 1.5, 8979, 8939.86, 13199.13, 13409.79, 13409.79),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000247', 'MWB-0247', 'Cornice moulding', 4.7, 4.78, 1056.7, 1060.78, 4966.49, 5070.53, 5070.53),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000248', 'MWB-0248', 'Ceiling painting', 13.89, 13.49, 278.24, 274.23, 3864.75, 3699.36, 3699.36),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000249', 'MWB-0249', 'Moisture resistant gypsum', 12.95, 13.03, 752.5, 762.49, 9744.88, 9935.24, 9935.24),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000250', 'MWB-0250', 'Linear LED cove', 20.98, 21.4, 2266.68, 2232.3, 47554.95, 47771.22, 47771.22);

  INSERT INTO public.project_benchmark_actuals (
    project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity,
    estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost
  ) VALUES
    (v_project_id, 'e1c11111-1111-4111-a111-000000000251', 'MWB-0251', 'Ceiling seismic clip', 5.07, 4.97, 327.16, 329.49, 1658.7, 1637.57, 1637.57),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000252', 'MWB-0252', 'Ceiling hanger wire', 9.02, 9.01, 9830.5, 9994.29, 88671.11, 90048.55, 90048.55),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000253', 'MWB-0253', 'Ceiling shadow gap', 13.86, 14.1, 10524.5, 10652.85, 145869.57, 150205.19, 150205.19),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000254', 'MWB-0254', 'Ceiling bulkhead', 16.66, 16.66, 771254.5, 769204.94, 12849099.97, 12814954.3, 12814954.3),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000255', 'MWB-0255', 'Ceiling soffit feature', 8.67, 8.64, 2097.38, 2095.42, 18184.28, 18104.43, 18104.43),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000256', 'MWB-0256', 'Ceiling acoustic baffle', 16.89, 16.58, 669.3, 665.58, 11304.48, 11035.32, 11035.32),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000257', 'MWB-0257', 'Ceiling fire rated board', 7.23, 7.28, 2714.5, 2699.44, 19625.84, 19651.92, 19651.92),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000258', 'MWB-0258', 'Ceiling level survey', 10.19, 10.34, 2529, 2510.32, 25770.51, 25956.71, 25956.71),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000259', 'MWB-0259', 'Ceiling joint compound', 20.58, 20.86, 13848.96, 13588.5, 285011.6, 283456.11, 283456.11),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000260', 'MWB-0260', 'Ceiling mesh tape', 13.41, 13.81, 589.95, 601.63, 7911.23, 8308.51, 8308.51),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000261', 'MWB-0261', 'Ceiling primer', 12.77, 12.48, 1452.3, 1458.16, 18545.87, 18197.84, 18197.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000262', 'MWB-0262', 'Ceiling access ladder', 3.93, 3.94, 10902, 11089.77, 42844.86, 43693.69, 43693.69),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000263', 'MWB-0263', 'Ceiling MEP coordination', 6.79, 6.67, 797.1, 788.66, 5412.31, 5260.36, 5260.36),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000264', 'MWB-0264', 'Ceiling night work', 20.44, 20.26, 501.27, 504.24, 10245.96, 10215.9, 10215.9),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000265', 'MWB-0265', 'Ceiling protection', 20.16, 20.32, 1434.83, 1430.92, 28926.17, 29076.29, 29076.29),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000266', 'MWB-0266', 'Ceiling repair patch', 6.9, 6.84, 5608, 5571.08, 38695.2, 38106.19, 38106.19),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000267', 'MWB-0267', 'Ceiling corner bead', 8.45, 8.37, 370.16, 367.6, 3127.85, 3076.81, 3076.81),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000268', 'MWB-0268', 'Ceiling control joint', 13.71, 13.77, 1576.5, 1565.65, 21613.82, 21559, 21559),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000269', 'MWB-0269', 'Ceiling inspection', 9.52, 9.78, 3724.5, 3717.98, 35457.24, 36361.84, 36361.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000270', 'MWB-0270', 'Ceiling warranty', 15.65, 15.79, 316164.5, 309874.58, 4947974.43, 4892919.62, 4892919.62),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000271', 'MWB-0271', 'Ceiling mock-up room', 18.46, 18.73, 1615.1, 1626.02, 29814.75, 30455.35, 30455.35),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000272', 'MWB-0272', 'Ceiling cleaning', 8.33, 8.13, 854.05, 867.73, 7114.24, 7054.64, 7054.64),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000273', 'MWB-0273', 'Ceiling touch-up', 23.59, 23.29, 17566.5, 17332.65, 414393.74, 403677.42, 403677.42),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000274', 'MWB-0274', 'Ceiling as-built', 7.89, 7.85, 4162.5, 4105.84, 32842.13, 32230.84, 32230.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000275', 'MWB-0275', 'Ceiling debris removal', 3.21, 3.22, 290.25, 294.37, 931.7, 947.87, 947.87),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000276', 'MWB-0276', 'Ceiling scaffolding', 11.08, 11.32, 416.74, 418.17, 4617.48, 4733.68, 4733.68),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000277', 'MWB-0277', 'Ceiling transport', 23.5, 23.74, 524.8, 523.93, 12332.8, 12438.1, 12438.1),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000278', 'MWB-0278', 'Ceiling storage', 14.95, 15.24, 5435, 5530.49, 81253.25, 84284.67, 84284.67),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000279', 'MWB-0279', 'Ceiling layout marking', 16.57, 16.41, 1535.1, 1512.13, 25436.61, 24814.05, 24814.05),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000280', 'MWB-0280', 'Ceiling final acceptance', 3.82, 3.87, 7819.47, 7745.66, 29870.38, 29975.7, 29975.7),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000281', 'MWB-0281', 'Solid core wood door 900x2100', 16.56, 16.97, 1340, 1337.12, 22190.4, 22690.93, 22690.93),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000282', 'MWB-0282', 'Hollow metal door fire rated', 1.41, 1.45, 1918.8, 1906.66, 2705.51, 2764.66, 2764.66),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000283', 'MWB-0283', 'Aluminum glazed door', 4.86, 4.95, 308.22, 303.31, 1497.95, 1501.38, 1501.38),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000284', 'MWB-0284', 'Door frame steel', 3.89, 3.95, 3298.5, 3310.85, 12831.17, 13077.86, 13077.86),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000285', 'MWB-0285', 'Door hardware set passage', 15.97, 15.66, 5878.4, 5903.2, 93878.05, 92444.11, 92444.11),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000286', 'MWB-0286', 'Door closer hydraulic', 7.7, 7.67, 1183602.69, 1160465.69, 9113740.71, 8900771.84, 8900771.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000287', 'MWB-0287', 'Door vision panel', 11.17, 11.23, 27849, 28204.02, 311073.33, 316731.14, 316731.14),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000288', 'MWB-0288', 'Door access control prep', 20.14, 19.73, 830.2, 844.96, 16720.23, 16671.06, 16671.06),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000289', 'MWB-0289', 'Door weather stripping', 8.84, 8.63, 2575.5, 2546.16, 22767.42, 21973.36, 21973.36),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000290', 'MWB-0290', 'Door threshold', 4.9, 4.86, 2952.5, 2990.65, 14467.25, 14534.56, 14534.56),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000291', 'MWB-0291', 'Door kick plate', 12.88, 12.62, 264.12, 259.71, 3401.87, 3277.54, 3277.54),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000292', 'MWB-0292', 'Door stop floor mount', 21, 20.91, 477.2, 470.35, 10021.2, 9835.02, 9835.02),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000293', 'MWB-0293', 'Door coordinator', 18.81, 18.73, 657.6, 647.6, 12369.46, 12129.55, 12129.55),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000294', 'MWB-0294', 'Door panic hardware', 7.02, 6.89, 40476.5, 40126.39, 284145.03, 276470.83, 276470.83),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000295', 'MWB-0295', 'Door smoke seal', 9.23, 9.44, 1686.84, 1662.31, 15569.53, 15692.21, 15692.21),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000296', 'MWB-0296', 'Door acoustic seal', 19.31, 19.06, 225.86, 221.52, 4361.36, 4222.17, 4222.17),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000297', 'MWB-0297', 'Door vision lite kit', 25.27, 24.96, 1794.52, 1816.05, 45347.52, 45328.61, 45328.61),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000298', 'MWB-0298', 'Door installation labor', 10.3, 10.33, 1732, 1748.97, 17839.6, 18066.86, 18066.86),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000299', 'MWB-0299', 'Door protection film', 13.86, 14.11, 340.48, 342.38, 4719.05, 4830.98, 4830.98),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000300', 'MWB-0300', 'Door adjustment', 19.76, 19.53, 1350.38, 1366.44, 26683.51, 26686.57, 26686.57);

  INSERT INTO public.project_benchmark_actuals (
    project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity,
    estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost
  ) VALUES
    (v_project_id, 'e1c11111-1111-4111-a111-000000000301', 'MWB-0301', 'Door testing', 17.85, 18.38, 9913.5, 10016.22, 176955.98, 184098.12, 184098.12),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000302', 'MWB-0302', 'Door warranty', 13.15, 13.03, 1237070, 1233504.03, 16267470.5, 16072557.51, 16072557.51),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000303', 'MWB-0303', 'Door shop drawing', 17.65, 17.12, 1817.8, 1851.07, 32084.17, 31690.32, 31690.32),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000304', 'MWB-0304', 'Door mock-up', 10.92, 11.07, 1071.6, 1060.99, 11701.87, 11745.16, 11745.16),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000305', 'MWB-0305', 'Door transport', 22.64, 22.42, 2948.8, 2915.64, 66760.83, 65368.65, 65368.65),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000306', 'MWB-0306', 'Door storage', 5.63, 5.74, 2351.5, 2329.1, 13238.95, 13369.03, 13369.03),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000307', 'MWB-0307', 'Door frame grouting', 15.92, 15.92, 224.64, 227.02, 3576.27, 3614.16, 3614.16),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000308', 'MWB-0308', 'Door hinge heavy duty', 17.56, 17.33, 35520.67, 35834.87, 623742.97, 621018.3, 621018.3),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000309', 'MWB-0309', 'Door lockset cylindrical', 14.51, 14.61, 1561.6, 1538.51, 22658.82, 22477.63, 22477.63),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000310', 'MWB-0310', 'Door master keying', 13.54, 13.67, 6913.2, 6922.64, 93604.73, 94632.49, 94632.49),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000311', 'MWB-0311', 'Door signage prep', 17.05, 17.23, 1442, 1468.67, 24586.1, 25305.18, 25305.18),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000312', 'MWB-0312', 'Door astragal', 11.61, 11.32, 333.88, 339.25, 3876.35, 3840.31, 3840.31),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000313', 'MWB-0313', 'Door astragal meeting', 17.65, 17.16, 2294.5, 2294.07, 40497.92, 39366.24, 39366.24),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000314', 'MWB-0314', 'Door louvers', 14.87, 14.55, 1903.8, 1892.62, 28309.51, 27537.62, 27537.62),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000315', 'MWB-0315', 'Door vision frame', 5.72, 5.65, 17167.9, 17446.56, 98200.39, 98573.06, 98573.06),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000316', 'MWB-0316', 'Door silencer', 17.04, 17.21, 1535, 1533.5, 26156.4, 26391.54, 26391.54),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000317', 'MWB-0317', 'Door bumper', 14.56, 14.83, 11325.5, 11099.68, 164899.28, 164608.25, 164608.25),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000318', 'MWB-0318', 'Door coordinator overhead', 11.04, 11.02, 441624, 449114.81, 4875528.96, 4949245.21, 4949245.21),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000319', 'MWB-0319', 'Door hold open', 11.19, 10.95, 968.49, 985.75, 10837.4, 10793.96, 10793.96),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000320', 'MWB-0320', 'Door final QC', 5.59, 5.73, 673.55, 674.55, 3765.14, 3865.17, 3865.17),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000321', 'MWB-0321', 'Aluminum window fixed 1200x1500', 23.26, 23.57, 2203.5, 2244.91, 51253.41, 52912.53, 52912.53),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000322', 'MWB-0322', 'Aluminum window sliding', 8.48, 8.24, 11605, 11668.16, 98410.4, 96145.64, 96145.64),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000323', 'MWB-0323', 'Curtain wall mullion', 18.24, 17.75, 300.78, 298.15, 5486.23, 5292.16, 5292.16),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000324', 'MWB-0324', 'Glazing tempered 12mm', 10.86, 10.73, 412.88, 418.48, 4483.88, 4490.29, 4490.29),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000325', 'MWB-0325', 'Window sealant structural', 19.46, 19.29, 437.64, 439.64, 8516.47, 8480.66, 8480.66),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000326', 'MWB-0326', 'Window flashing membrane', 2.32, 2.36, 6543, 6664.28, 15179.76, 15727.7, 15727.7),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000327', 'MWB-0327', 'Window sill stone', 5.45, 5.52, 1549.6, 1526.55, 8445.32, 8426.56, 8426.56),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000328', 'MWB-0328', 'Window insect screen', 2.46, 2.51, 307.62, 311.92, 756.75, 782.92, 782.92),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000329', 'MWB-0329', 'Window safety restrictor', 25, 25.44, 54939.5, 55188.01, 1373487.5, 1403982.97, 1403982.97),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000330', 'MWB-0330', 'Window testing water', 12.48, 12.63, 1322.45, 1305.41, 16504.18, 16487.33, 16487.33),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000331', 'MWB-0331', 'Window testing air', 7.38, 7.56, 397.68, 392.81, 2934.88, 2969.64, 2969.64),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000332', 'MWB-0332', 'Window thermal break', 3.62, 3.64, 2759, 2772.06, 9987.58, 10090.3, 10090.3),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000333', 'MWB-0333', 'Window powder coat finish', 9.88, 10.14, 4343.5, 4429.62, 42913.78, 44916.35, 44916.35),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000334', 'MWB-0334', 'Window installation labor', 10.87, 10.75, 310589, 315238.85, 3376102.43, 3388817.64, 3388817.64),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000335', 'MWB-0335', 'Window protection board', 8.91, 8.82, 1684.74, 1682.77, 15011.03, 14842.03, 14842.03),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000336', 'MWB-0336', 'Window cleaning access', 14.57, 14.68, 12255.65, 12237.85, 178564.82, 179651.64, 179651.64),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000337', 'MWB-0337', 'Window shop drawing', 6.59, 6.52, 2429, 2413.25, 16007.11, 15734.39, 15734.39),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000338', 'MWB-0338', 'Window mock-up', 17.02, 16.7, 4221.5, 4189.17, 71849.93, 69959.14, 69959.14),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000339', 'MWB-0339', 'Window transport', 20.74, 21.34, 363.22, 360.89, 7533.18, 7701.39, 7701.39),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000340', 'MWB-0340', 'Window storage', 19.37, 19.5, 428.52, 427.86, 8300.43, 8343.27, 8343.27),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000341', 'MWB-0341', 'Window anchor bracket', 13.38, 13.49, 1238.97, 1227.7, 16577.42, 16561.67, 16561.67),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000342', 'MWB-0342', 'Window setting blocks', 19.11, 19.22, 8388, 8404.03, 160294.68, 161525.46, 161525.46),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000343', 'MWB-0343', 'Window backer rod', 10.04, 9.82, 26414.2, 26927.45, 265198.57, 264427.56, 264427.56),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000344', 'MWB-0344', 'Window cap flashing', 18.82, 18.39, 205.48, 207.57, 3867.13, 3817.21, 3817.21),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000345', 'MWB-0345', 'Window head flashing', 20.65, 20.76, 2307.4, 2290.05, 47647.81, 47541.44, 47541.44),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000346', 'MWB-0346', 'Window jamb flashing', 1.95, 1.92, 1757.2, 1752.52, 3426.54, 3364.84, 3364.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000347', 'MWB-0347', 'Window sill flashing', 13.16, 13.42, 409.84, 403.7, 5393.49, 5417.65, 5417.65),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000348', 'MWB-0348', 'Window acoustic laminate', 6.98, 6.82, 3248.5, 3270.43, 22674.53, 22304.33, 22304.33),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000349', 'MWB-0349', 'Window low-E coating', 15.79, 15.85, 4896, 4990.46, 77307.84, 79098.79, 79098.79),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000350', 'MWB-0350', 'Window warranty', 8.55, 8.79, 916287.5, 911023.53, 7834258.13, 8007896.83, 8007896.83);

  INSERT INTO public.project_benchmark_actuals (
    project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity,
    estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost
  ) VALUES
    (v_project_id, 'e1c11111-1111-4111-a111-000000000351', 'MWB-0351', 'Window night seal', 5.21, 5.05, 2508.9, 2463.7, 13071.37, 12441.69, 12441.69),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000352', 'MWB-0352', 'Window debris removal', 15.63, 15.61, 400.63, 403.06, 6261.85, 6291.77, 6291.77),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000353', 'MWB-0353', 'Window inspection', 25.4, 25.61, 3501.5, 3469.4, 88938.1, 88851.33, 88851.33),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000354', 'MWB-0354', 'Window touch-up', 2.12, 2.13, 1888, 1914.08, 4002.56, 4076.99, 4076.99),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000355', 'MWB-0355', 'Window as-built', 5.95, 5.8, 356.71, 363.5, 2122.42, 2108.3, 2108.3),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000356', 'MWB-0356', 'Window spare glass', 3.82, 3.85, 316.72, 310.48, 1209.87, 1195.35, 1195.35),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000357', 'MWB-0357', 'Window crane lift', 11.57, 11.47, 7701.9, 7666.74, 89110.98, 87937.51, 87937.51),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000358', 'MWB-0358', 'Window scaffold access', 21.13, 21.39, 4338, 4418.96, 91661.94, 94521.55, 94521.55),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000359', 'MWB-0359', 'Window final acceptance', 14.82, 14.53, 1231.8, 1242.42, 18255.28, 18052.36, 18052.36),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000360', 'MWB-0360', 'Window O&M manual', 2.89, 2.83, 346.51, 345.97, 1001.41, 979.1, 979.1),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000361', 'MWB-0361', 'Interior latex paint 2 coats', 25.72, 26.27, 1507, 1526.84, 38760.04, 40110.09, 40110.09),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000362', 'MWB-0362', 'Exterior elastomeric paint', 1.63, 1.66, 1881.7, 1884.52, 3067.17, 3128.3, 3128.3),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000363', 'MWB-0363', 'Epoxy floor paint', 18.16, 18.63, 673.07, 677.12, 12222.95, 12614.75, 12614.75),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000364', 'MWB-0364', 'Enamel paint on steel', 20.79, 20.81, 55246.5, 55296.75, 1148574.73, 1150725.37, 1150725.37),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000365', 'MWB-0365', 'Primer coat masonry', 12.49, 12.7, 7597.6, 7682.83, 94894.02, 97571.94, 97571.94),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000366', 'MWB-0366', 'Wood stain and varnish', 6.28, 6.1, 368796, 363651.08, 2316038.88, 2218271.59, 2218271.59),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000367', 'MWB-0367', 'Traffic marking paint', 17.13, 17.39, 933.8, 916.1, 15995.99, 15930.98, 15930.98),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000368', 'MWB-0368', 'Anti-mould paint bathroom', 10.17, 10.42, 670.5, 675.11, 6818.99, 7034.65, 7034.65),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000369', 'MWB-0369', 'Paint surface preparation', 19.25, 19.29, 2004.5, 2028.13, 38586.63, 39122.63, 39122.63),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000370', 'MWB-0370', 'Signage painting', 3.57, 3.57, 4037.85, 3959.6, 14415.12, 14135.77, 14135.77),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000371', 'MWB-0371', 'Fire retardant paint', 18.67, 18.98, 19938.68, 19981.32, 372255.16, 379245.45, 379245.45),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000372', 'MWB-0372', 'Intumescent paint steel', 13.54, 13.15, 306.24, 304.41, 4146.49, 4002.99, 4002.99),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000373', 'MWB-0373', 'PU floor coating', 9.99, 9.86, 1021.1, 1033.84, 10200.79, 10193.66, 10193.66),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000374', 'MWB-0374', 'Anti-carbonation coating', 13.62, 13.37, 4213.39, 4230.62, 57386.37, 56563.39, 56563.39),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000375', 'MWB-0375', 'Paint roller and brush', 1.59, 1.57, 1067.52, 1060.08, 1697.36, 1664.33, 1664.33),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000376', 'MWB-0376', 'Paint masking protection', 19.97, 20.56, 579.84, 586.09, 11579.4, 12050.01, 12050.01),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000377', 'MWB-0377', 'Paint scaffolding', 6.41, 6.38, 1543.5, 1542.24, 9893.84, 9839.49, 9839.49),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000378', 'MWB-0378', 'Paint night premium', 11.88, 11.78, 14721.3, 14492.04, 174889.04, 170716.23, 170716.23),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000379', 'MWB-0379', 'Paint touch-up kit', 12.95, 13.12, 395.28, 388.12, 5118.88, 5092.13, 5092.13),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000380', 'MWB-0380', 'Paint color sample', 17.29, 17.13, 3738.25, 3742.68, 64634.34, 64112.11, 64112.11),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000381', 'MWB-0381', 'Paint warranty', 23.62, 23.71, 4933, 4989.66, 116517.46, 118304.84, 118304.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000382', 'MWB-0382', 'Paint inspection', 16.96, 17.03, 557886.5, 563305.98, 9461755.04, 9593100.84, 9593100.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000383', 'MWB-0383', 'Paint cleaning solvent', 12.46, 12.32, 2121.6, 2127.8, 26435.14, 26214.5, 26214.5),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000384', 'MWB-0384', 'Paint thinning allowance', 12.49, 12.18, 1038.6, 1019.91, 12972.11, 12422.5, 12422.5),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000385', 'MWB-0385', 'Paint spray machine', 10.36, 10.22, 15078.68, 14785.27, 156215.12, 151105.46, 151105.46),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000386', 'MWB-0386', 'Paint compressor', 14.38, 14.12, 3392.5, 3432.06, 48784.15, 48460.69, 48460.69),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000387', 'MWB-0387', 'Paint waste disposal', 16.69, 16.35, 572.34, 578.39, 9552.35, 9456.68, 9456.68),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000388', 'MWB-0388', 'Paint safety PPE', 21.17, 21.45, 368.24, 372.89, 7795.64, 7998.49, 7998.49),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000389', 'MWB-0389', 'Paint humidity control', 20.21, 19.74, 681.7, 694.97, 13777.16, 13718.71, 13718.71),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000390', 'MWB-0390', 'Paint curing time', 6.77, 6.84, 10575.5, 10592.57, 71596.13, 72453.18, 72453.18),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000391', 'MWB-0391', 'Paint stripe marking', 7.6, 7.82, 1594.4, 1604.17, 12117.44, 12544.61, 12544.61),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000392', 'MWB-0392', 'Paint stencil numbering', 20.61, 20.56, 15518.24, 15475.47, 319830.93, 318175.66, 318175.66),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000393', 'MWB-0393', 'Paint final QC', 18.64, 18.6, 2521.5, 2537.26, 47000.76, 47193.04, 47193.04),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000394', 'MWB-0394', 'Paint as-built', 14.69, 15.13, 710, 723.55, 10429.9, 10947.31, 10947.31),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000395', 'MWB-0395', 'Paint debris removal', 4.35, 4.31, 237.84, 241.85, 1034.6, 1042.37, 1042.37),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000396', 'MWB-0396', 'Paint transport', 18.64, 18.56, 1223.15, 1222.75, 22799.52, 22694.24, 22694.24),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000397', 'MWB-0397', 'Paint storage', 9.09, 9.25, 2997, 3054.25, 27242.73, 28251.81, 28251.81),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000398', 'MWB-0398', 'Paint mock-up panel', 2.95, 2.9, 1236864, 1227878.4, 3648748.8, 3560847.36, 3560847.36),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000399', 'MWB-0399', 'Paint adhesion test', 2.7, 2.71, 19674.4, 19824.66, 53120.88, 53724.83, 53724.83),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000400', 'MWB-0400', 'Paint dry film gauge', 18.91, 19.43, 1115.68, 1105.17, 21097.51, 21473.45, 21473.45);

  INSERT INTO public.project_benchmark_actuals (
    project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity,
    estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost
  ) VALUES
    (v_project_id, 'e1c11111-1111-4111-a111-000000000401', 'MWB-0401', 'PVC pipe 4" SDR series', 21.68, 21.69, 2684, 2642.1, 58189.12, 57307.15, 57307.15),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000402', 'MWB-0402', 'PVC pipe 2" water line', 18.42, 17.88, 4212.5, 4187, 77594.25, 74863.56, 74863.56),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000403', 'MWB-0403', 'Copper pipe 3/4" hot water', 20.47, 21.01, 412.62, 414.75, 8446.33, 8713.9, 8713.9),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000404', 'MWB-0404', 'Floor drain stainless 4"', 17.75, 18.2, 358.22, 353.67, 6358.41, 6436.79, 6436.79),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000405', 'MWB-0405', 'Water closet complete set', 16.62, 16.52, 809.34, 823.09, 13451.23, 13597.45, 13597.45),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000406', 'MWB-0406', 'Lavatory with faucet', 7.03, 6.93, 11442, 11473.85, 80437.26, 79513.78, 79513.78),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000407', 'MWB-0407', 'Shower set thermostatic', 5.62, 5.78, 426.37, 424.02, 2396.2, 2450.84, 2450.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000408', 'MWB-0408', 'Gate valve bronze 2"', 8.32, 8.13, 689.52, 679.87, 5736.81, 5527.34, 5527.34),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000409', 'MWB-0409', 'Water heater 50L', 23.23, 23.39, 1115.5, 1130.26, 25913.07, 26436.78, 26436.78),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000410', 'MWB-0410', 'Septic tank connection', 19.64, 19.97, 701.18, 691.74, 13771.18, 13814.05, 13814.05),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000411', 'MWB-0411', 'Grease interceptor', 13.59, 13.67, 446.22, 440.99, 6064.13, 6028.33, 6028.33),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000412', 'MWB-0412', 'Water meter assembly', 3.07, 3.13, 3169, 3189.88, 9728.83, 9984.32, 9984.32),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000413', 'MWB-0413', 'PRV station', 11.98, 11.78, 44513.5, 45234.92, 533271.73, 532867.36, 532867.36),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000414', 'MWB-0414', 'Pipe insulation 25mm', 10.62, 10.37, 921691, 931573.7, 9788358.42, 9660419.27, 9660419.27),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000415', 'MWB-0415', 'Pipe hanger support', 11.04, 11.02, 1753.79, 1733.34, 19361.84, 19101.41, 19101.41),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000416', 'MWB-0416', 'Pipe pressure testing', 8.86, 8.72, 569.05, 574.66, 5041.78, 5011.04, 5011.04),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000417', 'MWB-0417', 'Pipe disinfection', 25.49, 25.16, 3741.5, 3718.09, 95370.84, 93547.14, 93547.14),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000418', 'MWB-0418', 'Pipe trenching allowance', 18.29, 18.02, 4918.34, 4832.87, 89956.44, 87088.32, 87088.32),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000419', 'MWB-0419', 'Pipe core drilling', 11.86, 11.85, 193.6, 193.56, 2296.1, 2293.69, 2293.69),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000420', 'MWB-0420', 'Pipe sleeve fire stop', 4.27, 4.16, 22676.37, 22841.77, 96828.1, 95021.76, 95021.76),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000421', 'MWB-0421', 'Pipe identification label', 25.34, 25.48, 697.6, 689.75, 17677.18, 17574.83, 17574.83),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000422', 'MWB-0422', 'Pipe access panel', 19.02, 19.11, 8710.5, 8599.63, 165673.71, 164338.93, 164338.93),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000423', 'MWB-0423', 'Pipe cleanout', 3.2, 3.12, 1151.2, 1171.75, 3683.84, 3655.86, 3655.86),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000424', 'MWB-0424', 'Pipe vent stack', 11.26, 11.16, 323.16, 324.25, 3638.78, 3618.63, 3618.63),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000425', 'MWB-0425', 'Pipe storm drain', 20.38, 20.8, 2308.95, 2313.78, 47056.4, 48126.62, 48126.62),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000426', 'MWB-0426', 'Pipe sump pump', 2.62, 2.67, 1606.6, 1632.3, 4209.29, 4358.24, 4358.24),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000427', 'MWB-0427', 'Pipe backflow preventer', 10.92, 11.18, 4762.28, 4698.85, 52004.1, 52533.14, 52533.14),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000428', 'MWB-0428', 'Pipe expansion loop', 19.02, 19.5, 957.5, 967.34, 18211.65, 18863.13, 18863.13),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000429', 'MWB-0429', 'Pipe seismic brace', 11.98, 11.97, 3495.36, 3523.51, 41874.41, 42176.41, 42176.41),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000430', 'MWB-0430', 'Pipe commissioning', 2.07, 2.12, 265170, 267135.23, 548901.9, 566326.69, 566326.69),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000431', 'MWB-0431', 'Pipe O&M manual', 6.93, 6.81, 1841.7, 1862.52, 12762.98, 12683.76, 12683.76),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000432', 'MWB-0432', 'Pipe warranty', 19.73, 19.61, 809.1, 821.39, 15963.54, 16107.46, 16107.46),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000433', 'MWB-0433', 'Pipe night work', 8.01, 7.79, 3260, 3201.79, 26112.6, 24941.94, 24941.94),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000434', 'MWB-0434', 'Pipe protection', 14.11, 13.91, 15411, 15425.66, 217449.21, 214570.93, 214570.93),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000435', 'MWB-0435', 'Pipe touch-up', 2.09, 2.13, 356.46, 349.9, 745, 745.29, 745.29),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000436', 'MWB-0436', 'Pipe inspection', 3.44, 3.53, 253.38, 248.32, 871.63, 876.57, 876.57),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000437', 'MWB-0437', 'Pipe as-built', 10.53, 10.24, 1009.6, 990.96, 10631.09, 10147.43, 10147.43),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000438', 'MWB-0438', 'Pipe debris removal', 12.27, 12.5, 7624, 7645.93, 93546.48, 95574.13, 95574.13),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000439', 'MWB-0439', 'Pipe transport', 15.84, 15.63, 1160, 1170.47, 18374.4, 18294.45, 18294.45),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000440', 'MWB-0440', 'Pipe storage', 1.57, 1.54, 370.16, 367.86, 581.15, 566.5, 566.5),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000441', 'MWB-0441', 'Sprinkler head upright', 13.01, 13.04, 10928, 10905.57, 142173.28, 142208.63, 142208.63),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000442', 'MWB-0442', 'Fire hose cabinet', 9.84, 9.61, 1886, 1895.04, 18558.24, 18211.33, 18211.33),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000443', 'MWB-0443', 'Wet riser pipe 65mm', 15.9, 15.74, 329.94, 328.51, 5246.05, 5170.75, 5170.75),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000444', 'MWB-0444', 'Fire pump electric 750GPM', 11.65, 11.5, 2169.5, 2206.85, 25274.68, 25378.78, 25378.78),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000445', 'MWB-0445', 'Fire alarm smoke detector', 12.63, 12.36, 4935, 4851.25, 62329.05, 59961.45, 59961.45),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000446', 'MWB-0446', 'Fire alarm manual pull', 12.04, 12.19, 412330, 410129.01, 4964453.2, 4999472.63, 4999472.63),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000447', 'MWB-0447', 'Fire extinguisher 10lbs ABC', 2.18, 2.13, 1769.4, 1797.58, 3857.29, 3828.85, 3828.85),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000448', 'MWB-0448', 'Fire door 90min rated', 7.26, 7.34, 23262.95, 22799.85, 168889.02, 167350.9, 167350.9),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000449', 'MWB-0449', 'FM200 suppression head', 20.6, 20.71, 4074.5, 4099.99, 83934.7, 84910.79, 84910.79),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000450', 'MWB-0450', 'Fire protection testing', 14.84, 14.75, 2574.73, 2575.57, 38208.99, 37989.66, 37989.66);

  INSERT INTO public.project_benchmark_actuals (
    project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity,
    estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost
  ) VALUES
    (v_project_id, 'e1c11111-1111-4111-a111-000000000451', 'MWB-0451', 'Fire jockey pump', 3.03, 3.03, 416.91, 413.04, 1263.24, 1251.51, 1251.51),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000452', 'MWB-0452', 'Fire control panel', 15.42, 15.44, 422.42, 418.65, 6513.72, 6463.96, 6463.96),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000453', 'MWB-0453', 'Fire strobe horn', 12.42, 12.77, 645.8, 636.32, 8020.84, 8125.81, 8125.81),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000454', 'MWB-0454', 'Fire damper', 17.8, 17.92, 6457.5, 6493.15, 114943.5, 116357.25, 116357.25),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000455', 'MWB-0455', 'Fire stopping penetration', 14.83, 14.99, 11952.66, 12119.77, 177257.95, 181675.35, 181675.35),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000456', 'MWB-0456', 'Fire hydrant valve', 6.54, 6.6, 362.08, 369.26, 2368, 2437.12, 2437.12),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000457', 'MWB-0457', 'Fire department connection', 19.68, 19.65, 1187, 1173.96, 23360.16, 23068.31, 23068.31),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000458', 'MWB-0458', 'Fire flow test', 16.56, 16.93, 2106.2, 2144.91, 34878.67, 36313.33, 36313.33),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000459', 'MWB-0459', 'Fire commissioning', 5.58, 5.61, 421.16, 426.2, 2350.07, 2390.98, 2390.98),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000460', 'MWB-0460', 'Fire O&M manual', 4.07, 4.15, 2588.25, 2619.28, 10534.18, 10870.01, 10870.01),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000461', 'MWB-0461', 'Fire warranty', 14.5, 14.59, 12275.5, 12185.16, 177994.75, 177781.48, 177781.48),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000462', 'MWB-0462', 'Fire night work', 8.05, 7.93, 862919.79, 873672.05, 6946504.31, 6928219.36, 6928219.36),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000463', 'MWB-0463', 'Fire protection shop drawing', 8.98, 9.02, 2248.3, 2281.43, 20189.73, 20578.5, 20578.5),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000464', 'MWB-0464', 'Fire mock-up test', 18.14, 17.71, 807.4, 804.33, 14646.24, 14244.68, 14244.68),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000465', 'MWB-0465', 'Fire pipe hanger seismic', 21.8, 21.35, 3295.4, 3314.75, 71839.72, 70769.91, 70769.91),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000466', 'MWB-0466', 'Fire valve supervisory switch', 15.86, 15.41, 2772, 2717.3, 43963.92, 41873.59, 41873.59),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000467', 'MWB-0467', 'Fire flow switch', 13.83, 14.13, 402.74, 402.91, 5569.89, 5693.12, 5693.12),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000468', 'MWB-0468', 'Fire tamper switch', 3.96, 3.85, 345.28, 339.76, 1367.31, 1308.08, 1308.08),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000469', 'MWB-0469', 'Fire inspection', 10.58, 10.6, 37202.8, 37692.64, 393605.62, 399541.98, 399541.98),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000470', 'MWB-0470', 'Fire as-built', 16.04, 15.73, 2713.2, 2765.43, 43519.73, 43500.21, 43500.21),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000471', 'MWB-0471', 'Fire debris removal', 9.2, 9.23, 1165.6, 1156.05, 10723.52, 10670.34, 10670.34),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000472', 'MWB-0472', 'Fire transport', 8.46, 8.32, 367.38, 360.84, 3108.03, 3002.19, 3002.19),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000473', 'MWB-0473', 'Fire storage', 17.8, 18.12, 1868.66, 1881.1, 33262.15, 34085.53, 34085.53),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000474', 'MWB-0474', 'Fire touch-up paint', 7.69, 7.54, 1763.6, 1781.82, 13562.08, 13434.92, 13434.92),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000475', 'MWB-0475', 'Fire identification', 18.12, 17.61, 566.94, 570.03, 10272.95, 10038.23, 10038.23),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000476', 'MWB-0476', 'Fire training handover', 15.39, 15.56, 8226, 8203.97, 126598.14, 127653.77, 127653.77),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000477', 'MWB-0477', 'Fire spare heads', 8.23, 8.09, 3395, 3366.22, 27940.85, 27232.72, 27232.72),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000478', 'MWB-0478', 'Fire spare fuses', 6.59, 6.68, 713031, 719388.59, 4698874.29, 4805515.78, 4805515.78),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000479', 'MWB-0479', 'Fire final acceptance', 2.75, 2.69, 1511.4, 1531.62, 4156.35, 4120.06, 4120.06),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000480', 'MWB-0480', 'Fire authority witness', 10.01, 9.97, 1148.25, 1140.49, 11493.98, 11370.69, 11370.69),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000481', 'MWB-0481', 'THHN wire 3.5mm2', 17.64, 17.48, 1668.5, 1675.01, 29432.34, 29279.17, 29279.17),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000482', 'MWB-0482', 'THHN wire 5.5mm2', 12.38, 12.4, 3919.5, 3874.08, 48523.41, 48038.59, 48038.59),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000483', 'MWB-0483', 'PVC conduit 25mm', 6.12, 6.25, 35491.76, 35392.12, 217209.57, 221200.75, 221200.75),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000484', 'MWB-0484', 'Panel board 42 circuits', 16.74, 16.29, 327.17, 327.4, 5476.83, 5333.35, 5333.35),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000485', 'MWB-0485', 'Circuit breaker 20A', 19.39, 19.64, 848.62, 832.73, 16454.74, 16354.82, 16354.82),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000486', 'MWB-0486', 'LED downlight 12W', 5.22, 5.12, 9138.5, 9286.92, 47702.97, 47549.03, 47549.03),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000487', 'MWB-0487', 'Convenience outlet duplex', 15.41, 15.2, 771.2, 782.55, 11884.19, 11894.76, 11894.76),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000488', 'MWB-0488', 'Grounding rod copper', 20.43, 20.31, 246.74, 251.59, 5040.9, 5109.79, 5109.79),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000489', 'MWB-0489', 'Cable tray 300mm', 6.84, 6.66, 2142, 2153.44, 14651.28, 14341.91, 14341.91),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000490', 'MWB-0490', 'Lightning protection system', 5.44, 5.34, 24336.54, 23907.2, 132390.78, 127664.45, 127664.45),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000491', 'MWB-0491', 'Busbar riser', 13.08, 13.2, 429.76, 429.39, 5621.26, 5667.95, 5667.95),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000492', 'MWB-0492', 'Generator ATS panel', 18.52, 18.26, 1190.5, 1183.43, 22048.06, 21609.43, 21609.43),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000493', 'MWB-0493', 'Emergency lighting', 18.38, 18.02, 9468, 9443.69, 174021.84, 170175.29, 170175.29),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000494', 'MWB-0494', 'UPS distribution', 7.63, 7.78, 1047715, 1047992.98, 7994065.45, 8153385.38, 8153385.38),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000495', 'MWB-0495', 'Motor control center', 5.96, 6, 2849.36, 2879.66, 16982.19, 17277.96, 17277.96),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000496', 'MWB-0496', 'VFD panel', 14.39, 14.13, 626.25, 638.22, 9011.74, 9018.05, 9018.05),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000497', 'MWB-0497', 'Lighting control relay', 23.44, 22.96, 13279, 13098.28, 311259.76, 300736.51, 300736.51),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000498', 'MWB-0498', 'Cable pulling lubricant', 18.3, 18.08, 4950, 4952.61, 90585, 89543.19, 89543.19),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000499', 'MWB-0499', 'Cable megger testing', 5.51, 5.67, 349.44, 342.65, 1925.41, 1942.83, 1942.83),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000500', 'MWB-0500', 'Electrical commissioning', 20.66, 20.46, 264.41, 259.38, 5462.71, 5306.91, 5306.91);

  INSERT INTO public.project_benchmark_actuals (
    project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity,
    estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost
  ) VALUES
    (v_project_id, 'e1c11111-1111-4111-a111-000000000501', 'MWB-0501', 'Electrical O&M manual', 12.45, 12.41, 666.5, 659.14, 8297.92, 8179.93, 8179.93),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000502', 'MWB-0502', 'Electrical warranty', 6.41, 6.56, 10476, 10442.36, 67151.16, 68501.88, 68501.88),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000503', 'MWB-0503', 'Electrical night work', 5.21, 5.17, 763.1, 753.97, 3975.75, 3898.02, 3898.02),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000504', 'MWB-0504', 'Electrical shop drawing', 7.55, 7.47, 14010.3, 13858.6, 105777.76, 103523.74, 103523.74),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000505', 'MWB-0505', 'Electrical mock-up', 15.28, 15.04, 1447.73, 1422.65, 22121.31, 21396.66, 21396.66),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000506', 'MWB-0506', 'Electrical seismic bracing', 10.29, 10.02, 1252.45, 1232.77, 12887.71, 12352.36, 12352.36),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000507', 'MWB-0507', 'Electrical fire stopping', 8.24, 8.03, 425.64, 421.01, 3507.27, 3380.71, 3380.71),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000508', 'MWB-0508', 'Electrical labeling', 2.53, 2.49, 3334, 3337.9, 8435.02, 8311.37, 8311.37),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000509', 'MWB-0509', 'Electrical inspection', 19.53, 19.64, 7208, 7289.13, 140772.24, 143158.51, 143158.51),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000510', 'MWB-0510', 'Electrical as-built', 5.4, 5.49, 764299, 757319.26, 4127214.6, 4157682.74, 4157682.74),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000511', 'MWB-0511', 'Electrical debris removal', 7.27, 7.38, 11970.7, 11951.5, 87026.99, 88202.07, 88202.07),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000512', 'MWB-0512', 'Electrical transport', 18.46, 18.71, 389.6, 389.52, 7192.02, 7287.92, 7287.92),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000513', 'MWB-0513', 'Electrical storage', 8.5, 8.74, 1374, 1349.96, 11679, 11798.65, 11798.65),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000514', 'MWB-0514', 'Electrical touch-up', 19.59, 19.91, 4542, 4544.3, 88977.78, 90477.01, 90477.01),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000515', 'MWB-0515', 'Electrical spare breakers', 3.36, 3.36, 159.86, 160.37, 537.13, 538.84, 538.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000516', 'MWB-0516', 'Electrical load bank test', 3.21, 3.3, 374.56, 375.66, 1202.34, 1239.68, 1239.68),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000517', 'MWB-0517', 'Electrical thermographic scan', 21.96, 21.97, 554.17, 553.43, 12169.57, 12158.86, 12158.86),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000518', 'MWB-0518', 'Electrical authority witness', 7.2, 7.41, 19344, 19137.35, 139276.8, 141807.76, 141807.76),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000519', 'MWB-0519', 'Electrical final acceptance', 10.86, 10.88, 723.6, 731.01, 7858.3, 7953.39, 7953.39),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000520', 'MWB-0520', 'Electrical training', 17.64, 18.1, 491.47, 484.5, 8669.53, 8769.45, 8769.45),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000521', 'MWB-0521', 'VRF outdoor unit 16HP', 19.8, 19.95, 1827, 1862.41, 36174.6, 37155.08, 37155.08),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000522', 'MWB-0522', 'VRF indoor cassette', 6.13, 6.3, 1951.7, 1940.13, 11963.92, 12222.82, 12222.82),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000523', 'MWB-0523', 'Ductwork galvanized 24ga', 20.52, 20.63, 266.76, 262.66, 5473.92, 5418.68, 5418.68),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000524', 'MWB-0524', 'Chilled water pipe 65mm', 4.57, 4.59, 2740.5, 2728.85, 12524.09, 12525.42, 12525.42),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000525', 'MWB-0525', 'AHU 10000 CFM', 16.69, 16.64, 14479.2, 14725.35, 241657.85, 245029.82, 245029.82),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000526', 'MWB-0526', 'Exhaust fan toilet', 20.79, 20.55, 723007, 732557.22, 15031315.53, 15054050.87, 15054050.87),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000527', 'MWB-0527', 'Fresh air louver', 4.52, 4.55, 2480.1, 2484.29, 11210.05, 11303.52, 11303.52),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000528', 'MWB-0528', 'Volume control damper', 14.42, 14.05, 865.78, 882.61, 12484.55, 12400.67, 12400.67),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000529', 'MWB-0529', 'Duct insulation 25mm', 21.03, 21.14, 3495.5, 3441.4, 73510.37, 72751.2, 72751.2),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000530', 'MWB-0530', 'Refrigerant piping copper', 10.77, 10.68, 1892.3, 1855.15, 20380.07, 19813, 19813),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000531', 'MWB-0531', 'BMS control panel', 14.21, 13.95, 628.62, 635.51, 8932.69, 8865.36, 8865.36),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000532', 'MWB-0532', 'Thermostat digital', 1.39, 1.37, 13535.92, 13572.47, 18814.93, 18594.28, 18594.28),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000533', 'MWB-0533', 'Duct smoke detector', 25.76, 25.91, 578, 575.68, 14889.28, 14915.87, 14915.87),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000534', 'MWB-0534', 'Fire damper HVAC', 9.76, 9.91, 3932, 3972.79, 38376.32, 39370.35, 39370.35),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000535', 'MWB-0535', 'Duct access door', 17.08, 17.16, 1054.2, 1067.82, 18005.74, 18323.79, 18323.79),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000536', 'MWB-0536', 'Duct testing leakage', 14.22, 14.59, 456.32, 448.45, 6488.87, 6542.89, 6542.89),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000537', 'MWB-0537', 'Air balancing', 12.8, 13.16, 2255, 2253.47, 28864, 29655.67, 29655.67),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000538', 'MWB-0538', 'HVAC commissioning', 13.44, 13.1, 823.2, 821.38, 11063.81, 10760.08, 10760.08),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000539', 'MWB-0539', 'HVAC O&M manual', 12.03, 11.74, 32080.38, 32339.62, 385926.97, 379667.14, 379667.14),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000540', 'MWB-0540', 'HVAC warranty', 3, 2.99, 3115.63, 3156.18, 9346.89, 9436.98, 9436.98),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000541', 'MWB-0541', 'HVAC night work', 23.3, 23.49, 12378, 12152.73, 288407.4, 285467.63, 285467.63),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000542', 'MWB-0542', 'HVAC shop drawing', 9.95, 10.07, 863575.5, 870397.23, 8592576.23, 8764900.11, 8764900.11),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000543', 'MWB-0543', 'HVAC mock-up', 18.81, 18.58, 2117, 2114.18, 39820.77, 39281.46, 39281.46),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000544', 'MWB-0544', 'HVAC seismic bracing', 9.76, 9.51, 882.15, 882.39, 8609.78, 8391.53, 8391.53),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000545', 'MWB-0545', 'HVAC vibration isolator', 20.91, 20.47, 4293.73, 4241.66, 89781.89, 86826.78, 86826.78),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000546', 'MWB-0546', 'HVAC condensate drain', 6.53, 6.54, 14504, 14217.48, 94711.12, 92982.32, 92982.32),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000547', 'MWB-0547', 'HVAC refrigerant charge', 5.32, 5.35, 367.86, 368.86, 1957.02, 1973.4, 1973.4),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000548', 'MWB-0548', 'HVAC insulation jacket', 21.24, 21.61, 480.38, 487.37, 10203.27, 10532.07, 10532.07),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000549', 'MWB-0549', 'HVAC inspection', 13.79, 13.62, 1074.3, 1063.11, 14814.6, 14479.56, 14479.56),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000550', 'MWB-0550', 'HVAC as-built', 13.39, 13.74, 11438.42, 11262.63, 153160.44, 154748.54, 154748.54);

  INSERT INTO public.project_benchmark_actuals (
    project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity,
    estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost
  ) VALUES
    (v_project_id, 'e1c11111-1111-4111-a111-000000000551', 'MWB-0551', 'HVAC debris removal', 3.83, 3.82, 999.9, 1000.67, 3829.62, 3822.56, 3822.56),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000552', 'MWB-0552', 'HVAC transport', 10.79, 10.99, 522.6, 518.07, 5638.85, 5693.59, 5693.59),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000553', 'MWB-0553', 'HVAC storage', 10.6, 10.51, 39818, 40194.98, 422070.8, 422449.24, 422449.24),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000554', 'MWB-0554', 'HVAC touch-up', 19.67, 19.81, 1814.4, 1795.61, 35689.25, 35571.03, 35571.03),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000555', 'MWB-0555', 'HVAC spare filters', 8.02, 7.85, 326.57, 331.45, 2619.09, 2601.88, 2601.88),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000556', 'MWB-0556', 'HVAC TAB report', 1.65, 1.63, 2726.5, 2689.19, 4498.72, 4383.38, 4383.38),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000557', 'MWB-0557', 'HVAC authority witness', 22.03, 22.6, 11383, 11564.16, 250767.49, 261350.02, 261350.02),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000558', 'MWB-0558', 'HVAC final acceptance', 12.89, 13.05, 839330, 825627.31, 10818963.7, 10774436.4, 10774436.4),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000559', 'MWB-0559', 'HVAC training', 15.03, 14.67, 1141.7, 1142.39, 17159.75, 16758.86, 16758.86),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000560', 'MWB-0560', 'HVAC maintenance contract prep', 7.97, 7.89, 15396.22, 15129.73, 122707.87, 119373.57, 119373.57),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000561', 'MWB-0561', 'Site excavation bulk', 11.75, 11.56, 1967.5, 1949.97, 23118.13, 22541.65, 22541.65),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000562', 'MWB-0562', 'Site grading and compaction', 18.37, 18.62, 1177.89, 1187.8, 21637.84, 22116.84, 22116.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000563', 'MWB-0563', 'Asphalt road 50mm', 19.9, 20.27, 232.71, 230.51, 4630.93, 4672.44, 4672.44),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000564', 'MWB-0564', 'Concrete sidewalk 150mm', 2.88, 2.87, 348.74, 352.55, 1004.37, 1011.82, 1011.82),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000565', 'MWB-0565', 'Interlocking pavers driveway', 20.28, 19.76, 526.12, 532.07, 10669.71, 10513.7, 10513.7),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000566', 'MWB-0566', 'Landscape topsoil', 19.87, 20.24, 9818, 9669.64, 195083.66, 195713.51, 195713.51),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000567', 'MWB-0567', 'Sodding lawn', 6.91, 6.81, 22978.24, 23245.59, 158779.64, 158302.47, 158302.47),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000568', 'MWB-0568', 'Tree planting 3m height', 5.98, 6.08, 324.54, 318.36, 1940.75, 1935.63, 1935.63),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000569', 'MWB-0569', 'Perimeter fence RC posts', 24.1, 23.85, 2320.63, 2366.86, 55927.18, 56449.61, 56449.61),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000570', 'MWB-0570', 'Gate house structure', 3.17, 3.23, 1795.16, 1816.65, 5690.66, 5867.78, 5867.78),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000571', 'MWB-0571', 'Storm drain RC pipe 600mm', 6.09, 6.25, 385.68, 391.01, 2348.79, 2443.81, 2443.81),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000572', 'MWB-0572', 'Manhole RC 1200', 10.69, 10.99, 3271.09, 3228.95, 34967.95, 35486.16, 35486.16),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000573', 'MWB-0573', 'Catch basin', 13.8, 14.21, 10685.83, 10821.83, 147464.45, 153778.2, 153778.2),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000574', 'MWB-0574', 'Site lighting pole', 17.4, 17.53, 668046.09, 679666.04, 11624001.97, 11914545.68, 11914545.68),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000575', 'MWB-0575', 'Bollard RC protective', 8.68, 8.65, 2289.35, 2316.58, 19871.56, 20038.42, 20038.42),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000576', 'MWB-0576', 'Car park marking', 2.18, 2.14, 1050.14, 1055.58, 2289.31, 2258.94, 2258.94),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000577', 'MWB-0577', 'Wheel stop concrete', 12.71, 12.92, 3272.2, 3258.58, 41589.66, 42100.85, 42100.85),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000578', 'MWB-0578', 'Retaining wall segmental', 8.87, 8.84, 4752.46, 4758.45, 42154.32, 42064.7, 42064.7),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000579', 'MWB-0579', 'Riprap slope protection', 15.46, 15.56, 289.81, 289.71, 4480.46, 4507.89, 4507.89),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000580', 'MWB-0580', 'Silt fence sediment', 18.6, 18.38, 319.04, 313.4, 5934.14, 5760.29, 5760.29),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000581', 'MWB-0581', 'Erosion control mat', 18.85, 18.6, 10174.5, 10134.7, 191789.33, 188505.42, 188505.42),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000582', 'MWB-0582', 'Demolition allowance', 19.39, 19.02, 5777.04, 5731.21, 112016.81, 109007.61, 109007.61),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000583', 'MWB-0583', 'Hauling offsite', 18.75, 18.44, 1028.18, 1024.56, 19278.38, 18892.89, 18892.89),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000584', 'MWB-0584', 'Site signage', 13.02, 13.28, 368.4, 368.12, 4796.57, 4888.63, 4888.63),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000585', 'MWB-0585', 'Temporary road', 16.27, 16.52, 799.19, 802.32, 13002.82, 13254.33, 13254.33),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000586', 'MWB-0586', 'Construction water supply', 5.55, 5.68, 777.37, 773.65, 4314.4, 4394.33, 4394.33),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000587', 'MWB-0587', 'Site power temporary', 4.54, 4.49, 336.31, 331.75, 1526.85, 1489.56, 1489.56),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000588', 'MWB-0588', 'Site toilet portable', 3.02, 3, 25214.09, 24836.28, 76146.55, 74508.84, 74508.84),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000589', 'MWB-0589', 'Site waste segregation', 22.87, 22.71, 8159.48, 8230.85, 186607.31, 186922.6, 186922.6),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000590', 'MWB-0590', 'Landscaping irrigation', 3, 2.95, 723211.52, 733368.15, 2169634.56, 2163436.04, 2163436.04),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000591', 'MWB-0591', 'Fountain water feature', 20.21, 20.64, 2386.76, 2363.05, 48236.42, 48773.35, 48773.35),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000592', 'MWB-0592', 'Outdoor furniture allowance', 18.61, 19.02, 925.75, 911.29, 17228.21, 17332.74, 17332.74),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000593', 'MWB-0593', 'Bike rack stainless', 15.83, 15.47, 1131.5, 1139.32, 17911.65, 17625.28, 17625.28),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000594', 'MWB-0594', 'EV charging rough-in', 21.21, 20.78, 2334.99, 2296, 49525.14, 47710.88, 47710.88),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000595', 'MWB-0595', 'Guard house fit-out', 20.73, 20.59, 3865.8, 3820.66, 80138.03, 78667.39, 78667.39),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000596', 'MWB-0596', 'CCTV pole foundation', 18.76, 19.09, 190.55, 193.86, 3574.72, 3700.79, 3700.79),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000597', 'MWB-0597', 'Flagpole foundation', 16.08, 15.77, 1075.23, 1055.88, 17289.7, 16651.23, 16651.23),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000598', 'MWB-0598', 'External painting', 12.26, 12.16, 4114.17, 4176.77, 50439.72, 50789.52, 50789.52),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000599', 'MWB-0599', 'External cleaning', 15.3, 15.53, 1191.22, 1214.32, 18225.67, 18858.39, 18858.39),
    (v_project_id, 'e1c11111-1111-4111-a111-000000000600', 'MWB-0600', 'External final acceptance', 16.44, 16.69, 264.89, 268.01, 4354.79, 4473.09, 4473.09);

  INSERT INTO public.audit_log (project_id, entity_type, entity_id, action, actor_id, payload)
  VALUES (
    v_project_id, 'project', v_project_id, 'project.created', v_owner,
    jsonb_build_object('module', 'pilot_demo', 'remarks', 'Megawide Office Building pilot seed')
  );
END $$;

COMMIT;
