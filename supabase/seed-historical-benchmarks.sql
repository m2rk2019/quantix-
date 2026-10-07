-- Quantix Sprint 14 — Historical Estimate Benchmark Projects (5 archetypes)
-- Prerequisites: migrations through 20260711120000_benchmark_sprint14.sql

BEGIN;

DO $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT id INTO v_owner FROM public.users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'No active users found.';
  END IF;

  -- Historical Office Building — Makati
  DELETE FROM public.projects WHERE id = 'b2011111-1111-4111-a111-111111111101';

  INSERT INTO public.projects (id, project_code, project_name, client_name, location, status, created_by, updated_by)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'QTX-BENCH-OFF-001', 'Historical Office Building — Makati', 'Ayala Land Benchmark Archive', 'Makati City', 'archived', v_owner, v_owner);

  INSERT INTO public.project_details (project_id, project_type, currency, indirect_cost_percent, contingency_percent, markup_percent, vat_percent, is_benchmark, created_by, updated_by)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'commercial', 'USD', 10, 5, 8, 12, true, v_owner, v_owner);

  INSERT INTO public.estimate_summary (project_id, direct_cost, indirect_cost, contingency, markup, vat, grand_total, created_by, updated_by)
  VALUES ('b2011111-1111-4111-a111-111111111101', 2524079.01, 252407.9, 138824.35, 233224.9, 377824.34, 3526360.5, v_owner, v_owner);

  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b2011111-wbs-1', 'b2011111-1111-4111-a111-111111111101', NULL, '1', 'Structural', 0, 0, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b2011111-wbs-1-Earthw', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1', '1.1', 'Earthworks', 1, 1, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b2011111-wbs-1-Concre', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1', '1.2', 'Concrete', 1, 2, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b2011111-wbs-1-Steel', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1', '1.3', 'Steel', 1, 3, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b2011111-wbs-2', 'b2011111-1111-4111-a111-111111111101', NULL, '2', 'Architectural', 0, 4, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b2011111-wbs-2-Masonr', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-2', '2.1', 'Masonry', 1, 5, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b2011111-wbs-2-Finish', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-2', '2.2', 'Finishes', 1, 6, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b2011111-wbs-3', 'b2011111-1111-4111-a111-111111111101', NULL, '3', 'MEPF', 0, 7, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b2011111-wbs-3-Plumbi', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-3', '3.1', 'Plumbing', 1, 8, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b2011111-wbs-3-Electr', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-3', '3.2', 'Electrical', 1, 9, v_owner, v_owner);

  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-001', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Earthw', 'OFF001-001', 'Earthworks — benchmark item 1', 'lot', 132.9, 367.85, 83.14, 0, 0, 0, 450.99, 59936.57, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-002', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Concre', 'OFF001-002', 'Concrete — benchmark item 2', 'lot', 193.06, 65.94, 90.94, 0, 0, 0, 156.88, 30287.25, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-003', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Steel', 'OFF001-003', 'Steel — benchmark item 3', 'm3', 152.35, 126.49, 248.99, 57.44, 0, 0, 432.92, 65955.36, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-004', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-2-Masonr', 'OFF001-004', 'Masonry — benchmark item 4', 'm2', 151.48, 214.92, 102.84, 0, 0, 0, 317.76, 48134.28, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-005', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-2-Finish', 'OFF001-005', 'Finishes — benchmark item 5', 'lot', 122.29, 201.15, 140.68, 0, 0, 0, 341.83, 41802.39, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-006', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-3-Plumbi', 'OFF001-006', 'Plumbing — benchmark item 6', 'm3', 109.66, 839.04, 132.54, 124.97, 0, 0, 1096.55, 120247.67, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-007', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-3-Electr', 'OFF001-007', 'Electrical — benchmark item 7', 'lot', 76.16, 418.73, 115.77, 0, 136.69, 0, 671.19, 51117.83, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-008', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Earthw', 'OFF001-008', 'Earthworks — benchmark item 8', 'm2', 11.8, 690.47, 279.9, 0, 0, 0, 970.37, 11450.37, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-009', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Concre', 'OFF001-009', 'Concrete — benchmark item 9', 'm3', 23.08, 405.6, 191.38, 144.11, 0, 0, 741.09, 17104.36, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-010', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Steel', 'OFF001-010', 'Steel — benchmark item 10', 'lot', 161.74, 188.27, 271.22, 0, 0, 0, 459.49, 74317.91, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-011', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-2-Masonr', 'OFF001-011', 'Masonry — benchmark item 11', 'lot', 69.39, 328.16, 230.13, 0, 0, 0, 558.29, 38739.74, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-012', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-2-Finish', 'OFF001-012', 'Finishes — benchmark item 12', 'm2', 171.05, 489.86, 146.86, 26.43, 0, 0, 663.15, 113431.81, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-013', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-3-Plumbi', 'OFF001-013', 'Plumbing — benchmark item 13', 'lot', 21.05, 61.95, 104.82, 0, 0, 0, 166.77, 3510.51, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-014', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-3-Electr', 'OFF001-014', 'Electrical — benchmark item 14', 'lot', 123.12, 268.73, 258.77, 0, 360.3, 0, 887.8, 109305.94, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-015', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Earthw', 'OFF001-015', 'Earthworks — benchmark item 15', 'm3', 95.01, 256.79, 20.74, 77.64, 0, 0, 355.17, 33744.7, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-016', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Concre', 'OFF001-016', 'Concrete — benchmark item 16', 'm2', 89.47, 67.75, 137.01, 0, 0, 0, 204.76, 18319.88, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-017', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Steel', 'OFF001-017', 'Steel — benchmark item 17', 'lot', 64.7, 138.09, 267.14, 0, 0, 0, 405.23, 26218.38, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-018', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-2-Masonr', 'OFF001-018', 'Masonry — benchmark item 18', 'm3', 71.57, 811.89, 268.03, 139.96, 0, 0, 1219.88, 87306.81, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-019', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-2-Finish', 'OFF001-019', 'Finishes — benchmark item 19', 'lot', 119.49, 352.81, 150.26, 0, 0, 0, 503.07, 60111.83, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-020', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-3-Plumbi', 'OFF001-020', 'Plumbing — benchmark item 20', 'm2', 191.33, 796.17, 111.09, 0, 0, 0, 907.26, 173586.06, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-021', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-3-Electr', 'OFF001-021', 'Electrical — benchmark item 21', 'm3', 182.91, 746.9, 272.87, 9.72, 9.47, 0, 1038.96, 190036.17, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-022', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Earthw', 'OFF001-022', 'Earthworks — benchmark item 22', 'lot', 174.42, 535.88, 155.27, 0, 0, 0, 691.15, 120550.38, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-023', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Concre', 'OFF001-023', 'Concrete — benchmark item 23', 'lot', 142.8, 794.86, 143.28, 0, 0, 0, 938.14, 133966.39, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-024', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Steel', 'OFF001-024', 'Steel — benchmark item 24', 'm2', 143.67, 336.47, 37.67, 129.6, 0, 0, 503.74, 72372.33, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-025', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-2-Masonr', 'OFF001-025', 'Masonry — benchmark item 25', 'lot', 168.97, 525.79, 239.61, 0, 0, 0, 765.4, 129329.64, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-026', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-2-Finish', 'OFF001-026', 'Finishes — benchmark item 26', 'lot', 79.45, 488.37, 263.3, 0, 0, 0, 751.67, 59720.18, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-027', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-3-Plumbi', 'OFF001-027', 'Plumbing — benchmark item 27', 'm3', 205.94, 100.26, 262.35, 80.8, 0, 0, 443.41, 91315.86, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-028', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-3-Electr', 'OFF001-028', 'Electrical — benchmark item 28', 'm2', 200.98, 454.3, 301.81, 0, 84.04, 0, 840.15, 168853.35, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-029', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Earthw', 'OFF001-029', 'Earthworks — benchmark item 29', 'lot', 78.45, 138.62, 187.65, 0, 0, 0, 326.27, 25595.88, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-030', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Concre', 'OFF001-030', 'Concrete — benchmark item 30', 'm3', 68.03, 535.62, 55.4, 81.12, 0, 0, 672.14, 45725.68, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-031', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-1-Steel', 'OFF001-031', 'Steel — benchmark item 31', 'lot', 208.42, 105.88, 73.38, 0, 0, 0, 179.26, 37361.37, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-032', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-2-Masonr', 'OFF001-032', 'Masonry — benchmark item 32', 'm2', 176.1, 118.49, 199.46, 0, 0, 0, 317.95, 55991, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-033', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-2-Finish', 'OFF001-033', 'Finishes — benchmark item 33', 'm3', 208.35, 154.51, 157.01, 40.55, 0, 0, 352.07, 73353.78, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-034', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-3-Plumbi', 'OFF001-034', 'Plumbing — benchmark item 34', 'lot', 108.61, 141.46, 31.12, 0, 0, 0, 172.58, 18743.91, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b2011111-boq-035', 'b2011111-1111-4111-a111-111111111101', 'b2011111-wbs-3-Electr', 'OFF001-035', 'Electrical — benchmark item 35', 'lot', 100.35, 761.06, 192.97, 0, 207.24, 0, 1161.27, 116533.44, v_owner, v_owner);

  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-001', 'OFF001-001', 'Earthworks — benchmark item 1', 132.9, 131.28, 450.99, 456.67, 59936.57, 59951.64, 59951.64);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-002', 'OFF001-002', 'Concrete — benchmark item 2', 193.06, 189.52, 156.88, 158.6, 30287.25, 30057.87, 30057.87);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-003', 'OFF001-003', 'Steel — benchmark item 3', 152.35, 149.13, 432.92, 427.71, 65955.36, 63784.39, 63784.39);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-004', 'OFF001-004', 'Masonry — benchmark item 4', 151.48, 148, 317.76, 323.6, 48134.28, 47892.8, 47892.8);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-005', 'OFF001-005', 'Finishes — benchmark item 5', 122.29, 122.52, 341.83, 338.03, 41802.39, 41415.44, 41415.44);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-006', 'OFF001-006', 'Plumbing — benchmark item 6', 109.66, 112.04, 1096.55, 1087.34, 120247.67, 121825.57, 121825.57);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-007', 'OFF001-007', 'Electrical — benchmark item 7', 76.16, 74.1, 671.19, 659.01, 51117.83, 48832.64, 48832.64);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-008', 'OFF001-008', 'Earthworks — benchmark item 8', 11.8, 12.13, 970.37, 977.84, 11450.37, 11861.2, 11861.2);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-009', 'OFF001-009', 'Concrete — benchmark item 9', 23.08, 23.17, 741.09, 736.37, 17104.36, 17061.69, 17061.69);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-010', 'OFF001-010', 'Steel — benchmark item 10', 161.74, 158.99, 459.49, 457.49, 74317.91, 72736.34, 72736.34);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-011', 'OFF001-011', 'Masonry — benchmark item 11', 69.39, 69.57, 558.29, 550.7, 38739.74, 38312.2, 38312.2);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-012', 'OFF001-012', 'Finishes — benchmark item 12', 171.05, 166.84, 663.15, 670.76, 113431.81, 111909.6, 111909.6);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-013', 'OFF001-013', 'Plumbing — benchmark item 13', 21.05, 20.5, 166.77, 166.99, 3510.51, 3423.3, 3423.3);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-014', 'OFF001-014', 'Electrical — benchmark item 14', 123.12, 121.24, 887.8, 882.32, 109305.94, 106972.48, 106972.48);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-015', 'OFF001-015', 'Earthworks — benchmark item 15', 95.01, 92.39, 355.17, 361.01, 33744.7, 33353.71, 33353.71);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-016', 'OFF001-016', 'Concrete — benchmark item 16', 89.47, 88.73, 204.76, 207.09, 18319.88, 18375.1, 18375.1);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-017', 'OFF001-017', 'Steel — benchmark item 17', 64.7, 65.75, 405.23, 411.39, 26218.38, 27048.89, 27048.89);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-018', 'OFF001-018', 'Masonry — benchmark item 18', 71.57, 69.8, 1219.88, 1225.94, 87306.81, 85570.61, 85570.61);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-019', 'OFF001-019', 'Finishes — benchmark item 19', 119.49, 115.97, 503.07, 507.54, 60111.83, 58859.41, 58859.41);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-020', 'OFF001-020', 'Plumbing — benchmark item 20', 191.33, 192.75, 907.26, 918.7, 173586.06, 177079.43, 177079.43);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-021', 'OFF001-021', 'Electrical — benchmark item 21', 182.91, 182.92, 1038.96, 1038.3, 190036.17, 189925.84, 189925.84);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-022', 'OFF001-022', 'Earthworks — benchmark item 22', 174.42, 178.19, 691.15, 703.93, 120550.38, 125433.29, 125433.29);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-023', 'OFF001-023', 'Concrete — benchmark item 23', 142.8, 146.67, 938.14, 942.77, 133966.39, 138276.08, 138276.08);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-024', 'OFF001-024', 'Steel — benchmark item 24', 143.67, 146.69, 503.74, 512.15, 72372.33, 75127.28, 75127.28);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-025', 'OFF001-025', 'Masonry — benchmark item 25', 168.97, 166.55, 765.4, 778.98, 129329.64, 129739.12, 129739.12);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-026', 'OFF001-026', 'Finishes — benchmark item 26', 79.45, 78.69, 751.67, 757.08, 59720.18, 59574.63, 59574.63);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-027', 'OFF001-027', 'Plumbing — benchmark item 27', 205.94, 207.72, 443.41, 444.22, 91315.86, 92273.38, 92273.38);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-028', 'OFF001-028', 'Electrical — benchmark item 28', 200.98, 197.36, 840.15, 850.02, 168853.35, 167759.95, 167759.95);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-029', 'OFF001-029', 'Earthworks — benchmark item 29', 78.45, 79.69, 326.27, 328.33, 25595.88, 26164.62, 26164.62);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-030', 'OFF001-030', 'Concrete — benchmark item 30', 68.03, 68.4, 672.14, 663.24, 45725.68, 45365.62, 45365.62);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-031', 'OFF001-031', 'Steel — benchmark item 31', 208.42, 213.65, 179.26, 177.57, 37361.37, 37937.83, 37937.83);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-032', 'OFF001-032', 'Masonry — benchmark item 32', 176.1, 179.48, 317.95, 316.7, 55991, 56841.32, 56841.32);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-033', 'OFF001-033', 'Finishes — benchmark item 33', 208.35, 203.56, 352.07, 352.24, 73353.78, 71701.97, 71701.97);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-034', 'OFF001-034', 'Plumbing — benchmark item 34', 108.61, 110.84, 172.58, 170.16, 18743.91, 18860.53, 18860.53);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b2011111-1111-4111-a111-111111111101', 'b2011111-boq-035', 'OFF001-035', 'Electrical — benchmark item 35', 100.35, 100.4, 1161.27, 1148.06, 116533.44, 115265.22, 115265.22);

  -- Historical Condominium — BGC
  DELETE FROM public.projects WHERE id = 'b3011111-1111-4111-a111-111111111101';

  INSERT INTO public.projects (id, project_code, project_name, client_name, location, status, created_by, updated_by)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'QTX-BENCH-CON-001', 'Historical Condominium — BGC', 'Megawide Residential Benchmark', 'Taguig City', 'archived', v_owner, v_owner);

  INSERT INTO public.project_details (project_id, project_type, currency, indirect_cost_percent, contingency_percent, markup_percent, vat_percent, is_benchmark, created_by, updated_by)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'residential', 'USD', 10, 5, 8, 12, true, v_owner, v_owner);

  INSERT INTO public.estimate_summary (project_id, direct_cost, indirect_cost, contingency, markup, vat, grand_total, created_by, updated_by)
  VALUES ('b3011111-1111-4111-a111-111111111101', 3165635.96, 316563.6, 174109.98, 292504.76, 473857.72, 4422672.02, v_owner, v_owner);

  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b3011111-wbs-1', 'b3011111-1111-4111-a111-111111111101', NULL, '1', 'Structural', 0, 0, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b3011111-wbs-1-Founda', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1', '1.1', 'Foundation', 1, 1, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b3011111-wbs-1-TowerC', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1', '1.2', 'Tower Concrete', 1, 2, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b3011111-wbs-2', 'b3011111-1111-4111-a111-111111111101', NULL, '2', 'Architectural', 0, 3, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b3011111-wbs-2-Partit', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2', '2.1', 'Partitions', 1, 4, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b3011111-wbs-2-Finish', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2', '2.2', 'Finishes', 1, 5, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b3011111-wbs-3', 'b3011111-1111-4111-a111-111111111101', NULL, '3', 'MEPF', 0, 6, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b3011111-wbs-3-Plumbi', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3', '3.1', 'Plumbing', 1, 7, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b3011111-wbs-3-HVAC', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3', '3.2', 'HVAC', 1, 8, v_owner, v_owner);

  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-001', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1-Founda', 'CON001-001', 'Foundation — benchmark item 1', 'lot', 35.67, 784.32, 29.96, 0, 0, 0, 814.28, 29045.37, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-002', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1-TowerC', 'CON001-002', 'Tower Concrete — benchmark item 2', 'lot', 176.37, 528.1, 187.75, 0, 0, 0, 715.85, 126254.46, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-003', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2-Partit', 'CON001-003', 'Partitions — benchmark item 3', 'm3', 56.66, 755.46, 257.11, 108.41, 0, 0, 1120.98, 63514.73, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-004', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2-Finish', 'CON001-004', 'Finishes — benchmark item 4', 'm2', 174.43, 669.77, 36.42, 0, 0, 0, 706.19, 123180.72, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-005', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3-Plumbi', 'CON001-005', 'Plumbing — benchmark item 5', 'lot', 39.27, 112.36, 279.58, 0, 0, 0, 391.94, 15391.48, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-006', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3-HVAC', 'CON001-006', 'HVAC — benchmark item 6', 'm3', 14.21, 424.7, 285.95, 60.52, 0, 0, 771.17, 10958.33, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-007', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1-Founda', 'CON001-007', 'Foundation — benchmark item 7', 'lot', 143.36, 525.4, 286.06, 0, 394.44, 0, 1205.9, 172877.82, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-008', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1-TowerC', 'CON001-008', 'Tower Concrete — benchmark item 8', 'm2', 141.6, 752.92, 134.34, 0, 0, 0, 887.26, 125636.02, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-009', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2-Partit', 'CON001-009', 'Partitions — benchmark item 9', 'm3', 171.59, 774.09, 307.44, 87.81, 0, 0, 1169.34, 200647.05, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-010', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2-Finish', 'CON001-010', 'Finishes — benchmark item 10', 'lot', 147.48, 421.43, 292.88, 0, 0, 0, 714.31, 105346.44, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-011', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3-Plumbi', 'CON001-011', 'Plumbing — benchmark item 11', 'lot', 140.77, 181.17, 178, 0, 0, 0, 359.17, 50560.36, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-012', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3-HVAC', 'CON001-012', 'HVAC — benchmark item 12', 'm2', 119.43, 581.97, 292.47, 61.17, 0, 0, 935.61, 111739.9, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-013', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1-Founda', 'CON001-013', 'Foundation — benchmark item 13', 'lot', 152.48, 376.81, 62.35, 0, 0, 0, 439.16, 66963.12, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-014', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1-TowerC', 'CON001-014', 'Tower Concrete — benchmark item 14', 'lot', 84.03, 808.92, 80.33, 0, 350.39, 0, 1239.64, 104166.95, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-015', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2-Partit', 'CON001-015', 'Partitions — benchmark item 15', 'm3', 165.56, 676.35, 301.04, 132.84, 0, 0, 1110.23, 183809.68, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-016', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2-Finish', 'CON001-016', 'Finishes — benchmark item 16', 'm2', 148.73, 81.82, 64.7, 0, 0, 0, 146.52, 21791.92, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-017', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3-Plumbi', 'CON001-017', 'Plumbing — benchmark item 17', 'lot', 121.17, 305.76, 180.26, 0, 0, 0, 486.02, 58891.04, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-018', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3-HVAC', 'CON001-018', 'HVAC — benchmark item 18', 'm3', 91.77, 529.92, 204.26, 138.06, 0, 0, 872.24, 80045.46, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-019', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1-Founda', 'CON001-019', 'Foundation — benchmark item 19', 'lot', 171.31, 408.93, 203.99, 0, 0, 0, 612.92, 104999.33, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-020', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1-TowerC', 'CON001-020', 'Tower Concrete — benchmark item 20', 'm2', 86.53, 491.47, 80.2, 0, 0, 0, 571.67, 49466.61, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-021', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2-Partit', 'CON001-021', 'Partitions — benchmark item 21', 'm3', 186.48, 456.22, 47.9, 71.09, 390.56, 0, 965.77, 180096.79, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-022', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2-Finish', 'CON001-022', 'Finishes — benchmark item 22', 'lot', 65.62, 786.54, 273.39, 0, 0, 0, 1059.93, 69552.61, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-023', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3-Plumbi', 'CON001-023', 'Plumbing — benchmark item 23', 'lot', 128.32, 273.14, 246.02, 0, 0, 0, 519.16, 66618.61, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-024', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3-HVAC', 'CON001-024', 'HVAC — benchmark item 24', 'm2', 203.05, 668.49, 302.76, 10.44, 0, 0, 981.69, 199332.15, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-025', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1-Founda', 'CON001-025', 'Foundation — benchmark item 25', 'lot', 24.46, 678.22, 220.53, 0, 0, 0, 898.75, 21983.43, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-026', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1-TowerC', 'CON001-026', 'Tower Concrete — benchmark item 26', 'lot', 33.14, 171.66, 313.54, 0, 0, 0, 485.2, 16079.53, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-027', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2-Partit', 'CON001-027', 'Partitions — benchmark item 27', 'm3', 18.28, 418.96, 264.66, 83.63, 0, 0, 767.25, 14025.33, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-028', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2-Finish', 'CON001-028', 'Finishes — benchmark item 28', 'm2', 99.14, 586.43, 157.39, 0, 128.55, 0, 872.37, 86486.76, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-029', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3-Plumbi', 'CON001-029', 'Plumbing — benchmark item 29', 'lot', 74.3, 674.13, 277.41, 0, 0, 0, 951.54, 70699.42, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-030', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3-HVAC', 'CON001-030', 'HVAC — benchmark item 30', 'm3', 163.16, 257.27, 178.02, 103.77, 0, 0, 539.06, 87953.03, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-031', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1-Founda', 'CON001-031', 'Foundation — benchmark item 31', 'lot', 117.48, 329.21, 266.66, 0, 0, 0, 595.87, 70002.81, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-032', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-1-TowerC', 'CON001-032', 'Tower Concrete — benchmark item 32', 'm2', 153.06, 623.43, 237.79, 0, 0, 0, 861.22, 131818.33, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-033', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2-Partit', 'CON001-033', 'Partitions — benchmark item 33', 'm3', 126.04, 730.82, 201.61, 144.72, 0, 0, 1077.15, 135763.99, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-034', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-2-Finish', 'CON001-034', 'Finishes — benchmark item 34', 'lot', 89.49, 125.18, 83.03, 0, 0, 0, 208.21, 18632.71, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b3011111-boq-035', 'b3011111-1111-4111-a111-111111111101', 'b3011111-wbs-3-Plumbi', 'CON001-035', 'Plumbing — benchmark item 35', 'lot', 166.92, 819.75, 274.5, 0, 51.83, 0, 1146.08, 191303.67, v_owner, v_owner);

  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-001', 'CON001-001', 'Foundation — benchmark item 1', 35.67, 36.53, 814.28, 810.35, 29045.37, 29602.09, 29602.09);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-002', 'CON001-002', 'Tower Concrete — benchmark item 2', 176.37, 174.18, 715.85, 715.69, 126254.46, 124658.88, 124658.88);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-003', 'CON001-003', 'Partitions — benchmark item 3', 56.66, 57.26, 1120.98, 1108.29, 63514.73, 63460.69, 63460.69);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-004', 'CON001-004', 'Finishes — benchmark item 4', 174.43, 175.91, 706.19, 713.22, 123180.72, 125462.53, 125462.53);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-005', 'CON001-005', 'Plumbing — benchmark item 5', 39.27, 38.67, 391.94, 391.77, 15391.48, 15149.75, 15149.75);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-006', 'CON001-006', 'HVAC — benchmark item 6', 14.21, 13.95, 771.17, 757.83, 10958.33, 10571.73, 10571.73);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-007', 'CON001-007', 'Foundation — benchmark item 7', 143.36, 143.79, 1205.9, 1225.47, 172877.82, 176210.33, 176210.33);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-008', 'CON001-008', 'Tower Concrete — benchmark item 8', 141.6, 143.48, 887.26, 891.13, 125636.02, 127859.33, 127859.33);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-009', 'CON001-009', 'Partitions — benchmark item 9', 171.59, 176.28, 1169.34, 1189.01, 200647.05, 209598.68, 209598.68);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-010', 'CON001-010', 'Finishes — benchmark item 10', 147.48, 147.54, 714.31, 718.25, 105346.44, 105970.61, 105970.61);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-011', 'CON001-011', 'Plumbing — benchmark item 11', 140.77, 141.46, 359.17, 352.33, 50560.36, 49840.6, 49840.6);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-012', 'CON001-012', 'HVAC — benchmark item 12', 119.43, 116.17, 935.61, 917.48, 111739.9, 106583.65, 106583.65);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-013', 'CON001-013', 'Foundation — benchmark item 13', 152.48, 151.32, 439.16, 432.68, 66963.12, 65473.14, 65473.14);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-014', 'CON001-014', 'Tower Concrete — benchmark item 14', 84.03, 82.9, 1239.64, 1225.88, 104166.95, 101625.45, 101625.45);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-015', 'CON001-015', 'Partitions — benchmark item 15', 165.56, 162.46, 1110.23, 1092.14, 183809.68, 177429.06, 177429.06);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-016', 'CON001-016', 'Finishes — benchmark item 16', 148.73, 147.89, 146.52, 144.09, 21791.92, 21309.47, 21309.47);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-017', 'CON001-017', 'Plumbing — benchmark item 17', 121.17, 124.44, 486.02, 484.38, 58891.04, 60276.25, 60276.25);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-018', 'CON001-018', 'HVAC — benchmark item 18', 91.77, 91.99, 872.24, 875.06, 80045.46, 80496.77, 80496.77);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-019', 'CON001-019', 'Foundation — benchmark item 19', 171.31, 174.56, 612.92, 619.46, 104999.33, 108132.94, 108132.94);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-020', 'CON001-020', 'Tower Concrete — benchmark item 20', 86.53, 84.95, 571.67, 565.59, 49466.61, 48046.87, 48046.87);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-021', 'CON001-021', 'Partitions — benchmark item 21', 186.48, 189.92, 965.77, 964.93, 180096.79, 183259.51, 183259.51);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-022', 'CON001-022', 'Finishes — benchmark item 22', 65.62, 65.89, 1059.93, 1040.74, 69552.61, 68574.36, 68574.36);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-023', 'CON001-023', 'Plumbing — benchmark item 23', 128.32, 129.24, 519.16, 519.22, 66618.61, 67103.99, 67103.99);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-024', 'CON001-024', 'HVAC — benchmark item 24', 203.05, 201.42, 981.69, 986.91, 199332.15, 198783.41, 198783.41);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-025', 'CON001-025', 'Foundation — benchmark item 25', 24.46, 24.05, 898.75, 896.82, 21983.43, 21568.52, 21568.52);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-026', 'CON001-026', 'Tower Concrete — benchmark item 26', 33.14, 33.56, 485.2, 494.61, 16079.53, 16599.11, 16599.11);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-027', 'CON001-027', 'Partitions — benchmark item 27', 18.28, 18.5, 767.25, 753.63, 14025.33, 13942.16, 13942.16);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-028', 'CON001-028', 'Finishes — benchmark item 28', 99.14, 100.08, 872.37, 870.74, 86486.76, 87143.66, 87143.66);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-029', 'CON001-029', 'Plumbing — benchmark item 29', 74.3, 72.55, 951.54, 958.52, 70699.42, 69540.63, 69540.63);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-030', 'CON001-030', 'HVAC — benchmark item 30', 163.16, 167.39, 539.06, 542.86, 87953.03, 90869.34, 90869.34);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-031', 'CON001-031', 'Foundation — benchmark item 31', 117.48, 120.69, 595.87, 588.07, 70002.81, 70974.17, 70974.17);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-032', 'CON001-032', 'Tower Concrete — benchmark item 32', 153.06, 152.92, 861.22, 857.07, 131818.33, 131063.14, 131063.14);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-033', 'CON001-033', 'Partitions — benchmark item 33', 126.04, 128.69, 1077.15, 1059.45, 135763.99, 136340.62, 136340.62);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-034', 'CON001-034', 'Finishes — benchmark item 34', 89.49, 87.41, 208.21, 209.76, 18632.71, 18335.12, 18335.12);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b3011111-1111-4111-a111-111111111101', 'b3011111-boq-035', 'CON001-035', 'Plumbing — benchmark item 35', 166.92, 165.54, 1146.08, 1142.95, 191303.67, 189203.94, 189203.94);

  -- Historical Warehouse — Laguna
  DELETE FROM public.projects WHERE id = 'b4011111-1111-4111-a111-111111111101';

  INSERT INTO public.projects (id, project_code, project_name, client_name, location, status, created_by, updated_by)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'QTX-BENCH-WHS-001', 'Historical Warehouse — Laguna', 'Industrial Park Authority', 'Laguna', 'archived', v_owner, v_owner);

  INSERT INTO public.project_details (project_id, project_type, currency, indirect_cost_percent, contingency_percent, markup_percent, vat_percent, is_benchmark, created_by, updated_by)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'industrial', 'USD', 10, 5, 8, 12, true, v_owner, v_owner);

  INSERT INTO public.estimate_summary (project_id, direct_cost, indirect_cost, contingency, markup, vat, grand_total, created_by, updated_by)
  VALUES ('b4011111-1111-4111-a111-111111111101', 2146109.87, 214610.99, 118036.04, 198300.55, 321246.89, 2998304.34, v_owner, v_owner);

  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b4011111-wbs-1', 'b4011111-1111-4111-a111-111111111101', NULL, '1', 'Civil', 0, 0, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b4011111-wbs-1-Earthw', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1', '1.1', 'Earthworks', 1, 1, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b4011111-wbs-1-Paveme', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1', '1.2', 'Pavement', 1, 2, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b4011111-wbs-2', 'b4011111-1111-4111-a111-111111111101', NULL, '2', 'Structural', 0, 3, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b4011111-wbs-2-SteelF', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2', '2.1', 'Steel Frame', 1, 4, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b4011111-wbs-2-Roofin', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2', '2.2', 'Roofing', 1, 5, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b4011111-wbs-3', 'b4011111-1111-4111-a111-111111111101', NULL, '3', 'MEPF', 0, 6, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b4011111-wbs-3-Electr', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3', '3.1', 'Electrical', 1, 7, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b4011111-wbs-3-Fire', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3', '3.2', 'Fire', 1, 8, v_owner, v_owner);

  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-001', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1-Earthw', 'WHS001-001', 'Earthworks — benchmark item 1', 'lot', 138.44, 400.79, 276.77, 0, 0, 0, 677.56, 93801.41, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-002', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1-Paveme', 'WHS001-002', 'Pavement — benchmark item 2', 'lot', 77.15, 207.27, 276.42, 0, 0, 0, 483.69, 37316.68, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-003', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2-SteelF', 'WHS001-003', 'Steel Frame — benchmark item 3', 'm3', 50.27, 747.79, 276.44, 70.66, 0, 0, 1094.89, 55040.12, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-004', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2-Roofin', 'WHS001-004', 'Roofing — benchmark item 4', 'm2', 143.56, 724.9, 23.19, 0, 0, 0, 748.09, 107395.8, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-005', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3-Electr', 'WHS001-005', 'Electrical — benchmark item 5', 'lot', 26.08, 672.78, 63.59, 0, 0, 0, 736.37, 19204.53, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-006', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3-Fire', 'WHS001-006', 'Fire — benchmark item 6', 'm3', 125.7, 81.42, 56.99, 67.33, 0, 0, 205.74, 25861.52, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-007', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1-Earthw', 'WHS001-007', 'Earthworks — benchmark item 7', 'lot', 178.16, 738.5, 207.45, 0, 65.57, 0, 1011.52, 180212.4, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-008', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1-Paveme', 'WHS001-008', 'Pavement — benchmark item 8', 'm2', 60.7, 364.08, 276.63, 0, 0, 0, 640.71, 38891.1, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-009', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2-SteelF', 'WHS001-009', 'Steel Frame — benchmark item 9', 'm3', 98.35, 802.64, 182.51, 86.11, 0, 0, 1071.26, 105358.42, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-010', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2-Roofin', 'WHS001-010', 'Roofing — benchmark item 10', 'lot', 71.52, 360.65, 251.56, 0, 0, 0, 612.21, 43785.26, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-011', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3-Electr', 'WHS001-011', 'Electrical — benchmark item 11', 'lot', 115.92, 212.11, 184.73, 0, 0, 0, 396.84, 46001.69, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-012', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3-Fire', 'WHS001-012', 'Fire — benchmark item 12', 'm2', 45.66, 676.9, 156.58, 137.23, 0, 0, 970.71, 44322.62, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-013', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1-Earthw', 'WHS001-013', 'Earthworks — benchmark item 13', 'lot', 59.79, 525, 235.63, 0, 0, 0, 760.63, 45478.07, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-014', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1-Paveme', 'WHS001-014', 'Pavement — benchmark item 14', 'lot', 127.25, 167.91, 95.96, 0, 357.75, 0, 621.62, 79101.15, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-015', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2-SteelF', 'WHS001-015', 'Steel Frame — benchmark item 15', 'm3', 11.4, 328.91, 187.51, 31.13, 0, 0, 547.55, 6242.07, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-016', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2-Roofin', 'WHS001-016', 'Roofing — benchmark item 16', 'm2', 114.14, 142.39, 81.97, 0, 0, 0, 224.36, 25608.45, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-017', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3-Electr', 'WHS001-017', 'Electrical — benchmark item 17', 'lot', 27.63, 152.04, 60.89, 0, 0, 0, 212.93, 5883.26, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-018', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3-Fire', 'WHS001-018', 'Fire — benchmark item 18', 'm3', 111.86, 105.63, 319.47, 134.99, 0, 0, 560.09, 62651.67, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-019', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1-Earthw', 'WHS001-019', 'Earthworks — benchmark item 19', 'lot', 134.14, 600.61, 113.49, 0, 0, 0, 714.1, 95789.37, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-020', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1-Paveme', 'WHS001-020', 'Pavement — benchmark item 20', 'm2', 118.18, 558.01, 105.86, 0, 0, 0, 663.87, 78456.16, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-021', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2-SteelF', 'WHS001-021', 'Steel Frame — benchmark item 21', 'm3', 116.32, 582.4, 191.6, 21.84, 172.26, 0, 968.1, 112609.39, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-022', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2-Roofin', 'WHS001-022', 'Roofing — benchmark item 22', 'lot', 206.96, 466.45, 205.35, 0, 0, 0, 671.8, 139035.73, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-023', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3-Electr', 'WHS001-023', 'Electrical — benchmark item 23', 'lot', 33.57, 471.6, 246.76, 0, 0, 0, 718.36, 24115.35, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-024', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3-Fire', 'WHS001-024', 'Fire — benchmark item 24', 'm2', 85.22, 608.09, 106.7, 46.75, 0, 0, 761.54, 64898.44, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-025', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1-Earthw', 'WHS001-025', 'Earthworks — benchmark item 25', 'lot', 88.21, 75.63, 66.22, 0, 0, 0, 141.85, 12512.59, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-026', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1-Paveme', 'WHS001-026', 'Pavement — benchmark item 26', 'lot', 45.84, 290.62, 48.77, 0, 0, 0, 339.39, 15557.64, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-027', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2-SteelF', 'WHS001-027', 'Steel Frame — benchmark item 27', 'm3', 45.81, 508.7, 111.63, 3.76, 0, 0, 624.09, 28589.56, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-028', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2-Roofin', 'WHS001-028', 'Roofing — benchmark item 28', 'm2', 109.59, 321.79, 175.7, 0, 102.75, 0, 600.24, 65780.3, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-029', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3-Electr', 'WHS001-029', 'Electrical — benchmark item 29', 'lot', 68.14, 734.11, 239.23, 0, 0, 0, 973.34, 66323.39, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-030', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3-Fire', 'WHS001-030', 'Fire — benchmark item 30', 'm3', 188.41, 53.88, 53.37, 80.77, 0, 0, 188.02, 35424.85, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-031', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1-Earthw', 'WHS001-031', 'Earthworks — benchmark item 31', 'lot', 55.98, 779.58, 36.64, 0, 0, 0, 816.22, 45692, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-032', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-1-Paveme', 'WHS001-032', 'Pavement — benchmark item 32', 'm2', 74.89, 545.22, 266.56, 0, 0, 0, 811.78, 60794.2, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-033', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2-SteelF', 'WHS001-033', 'Steel Frame — benchmark item 33', 'm3', 179.97, 442.41, 25.74, 7.59, 0, 0, 475.74, 85618.93, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-034', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-2-Roofin', 'WHS001-034', 'Roofing — benchmark item 34', 'lot', 27.28, 843.49, 230.28, 0, 0, 0, 1073.77, 29292.45, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b4011111-boq-035', 'b4011111-1111-4111-a111-111111111101', 'b4011111-wbs-3-Electr', 'WHS001-035', 'Electrical — benchmark item 35', 'lot', 167.44, 769.5, 39.76, 0, 166.99, 0, 976.25, 163463.3, v_owner, v_owner);

  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-001', 'WHS001-001', 'Earthworks — benchmark item 1', 138.44, 142.28, 677.56, 685.31, 93801.41, 97505.91, 97505.91);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-002', 'WHS001-002', 'Pavement — benchmark item 2', 77.15, 77.29, 483.69, 489.89, 37316.68, 37863.6, 37863.6);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-003', 'WHS001-003', 'Steel Frame — benchmark item 3', 50.27, 48.85, 1094.89, 1110.35, 55040.12, 54240.6, 54240.6);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-004', 'WHS001-004', 'Roofing — benchmark item 4', 143.56, 146.46, 748.09, 755.94, 107395.8, 110714.97, 110714.97);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-005', 'WHS001-005', 'Electrical — benchmark item 5', 26.08, 26.44, 736.37, 732.79, 19204.53, 19374.97, 19374.97);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-006', 'WHS001-006', 'Fire — benchmark item 6', 125.7, 124.72, 205.74, 204.03, 25861.52, 25446.62, 25446.62);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-007', 'WHS001-007', 'Earthworks — benchmark item 7', 178.16, 174, 1011.52, 1009.78, 180212.4, 175701.72, 175701.72);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-008', 'WHS001-008', 'Pavement — benchmark item 8', 60.7, 60.43, 640.71, 648.19, 38891.1, 39170.12, 39170.12);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-009', 'WHS001-009', 'Steel Frame — benchmark item 9', 98.35, 100.27, 1071.26, 1086.7, 105358.42, 108963.41, 108963.41);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-010', 'WHS001-010', 'Roofing — benchmark item 10', 71.52, 72.97, 612.21, 600.2, 43785.26, 43796.59, 43796.59);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-011', 'WHS001-011', 'Electrical — benchmark item 11', 115.92, 119.08, 396.84, 392.58, 46001.69, 46748.43, 46748.43);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-012', 'WHS001-012', 'Fire — benchmark item 12', 45.66, 45.41, 970.71, 967, 44322.62, 43911.47, 43911.47);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-013', 'WHS001-013', 'Earthworks — benchmark item 13', 59.79, 60.54, 760.63, 770.06, 45478.07, 46619.43, 46619.43);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-014', 'WHS001-014', 'Pavement — benchmark item 14', 127.25, 123.88, 621.62, 631.16, 79101.15, 78188.1, 78188.1);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-015', 'WHS001-015', 'Steel Frame — benchmark item 15', 11.4, 11.07, 547.55, 551.18, 6242.07, 6101.56, 6101.56);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-016', 'WHS001-016', 'Roofing — benchmark item 16', 114.14, 114.47, 224.36, 227.54, 25608.45, 26046.5, 26046.5);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-017', 'WHS001-017', 'Electrical — benchmark item 17', 27.63, 28.36, 212.93, 214.08, 5883.26, 6071.31, 6071.31);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-018', 'WHS001-018', 'Fire — benchmark item 18', 111.86, 109.16, 560.09, 565.55, 62651.67, 61735.44, 61735.44);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-019', 'WHS001-019', 'Earthworks — benchmark item 19', 134.14, 132.35, 714.1, 722.51, 95789.37, 95624.2, 95624.2);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-020', 'WHS001-020', 'Pavement — benchmark item 20', 118.18, 121.31, 663.87, 669.23, 78456.16, 81184.29, 81184.29);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-021', 'WHS001-021', 'Steel Frame — benchmark item 21', 116.32, 115.17, 968.1, 984.87, 112609.39, 113427.48, 113427.48);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-022', 'WHS001-022', 'Roofing — benchmark item 22', 206.96, 211.24, 671.8, 682.02, 139035.73, 144069.9, 144069.9);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-023', 'WHS001-023', 'Electrical — benchmark item 23', 33.57, 33.82, 718.36, 708.97, 24115.35, 23977.37, 23977.37);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-024', 'WHS001-024', 'Fire — benchmark item 24', 85.22, 85.17, 761.54, 759.1, 64898.44, 64652.55, 64652.55);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-025', 'WHS001-025', 'Earthworks — benchmark item 25', 88.21, 87.73, 141.85, 144.45, 12512.59, 12672.6, 12672.6);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-026', 'WHS001-026', 'Pavement — benchmark item 26', 45.84, 46.46, 339.39, 334.82, 15557.64, 15555.74, 15555.74);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-027', 'WHS001-027', 'Steel Frame — benchmark item 27', 45.81, 46.72, 624.09, 623, 28589.56, 29106.56, 29106.56);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-028', 'WHS001-028', 'Roofing — benchmark item 28', 109.59, 107.54, 600.24, 597.22, 65780.3, 64225.04, 64225.04);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-029', 'WHS001-029', 'Electrical — benchmark item 29', 68.14, 67.65, 973.34, 967.31, 66323.39, 65438.52, 65438.52);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-030', 'WHS001-030', 'Fire — benchmark item 30', 188.41, 193.04, 188.02, 187.78, 35424.85, 36249.05, 36249.05);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-031', 'WHS001-031', 'Earthworks — benchmark item 31', 55.98, 56.41, 816.22, 817.38, 45692, 46108.41, 46108.41);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-032', 'WHS001-032', 'Pavement — benchmark item 32', 74.89, 72.95, 811.78, 827.05, 60794.2, 60333.3, 60333.3);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-033', 'WHS001-033', 'Steel Frame — benchmark item 33', 179.97, 178.63, 475.74, 476.57, 85618.93, 85129.7, 85129.7);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-034', 'WHS001-034', 'Roofing — benchmark item 34', 27.28, 27.11, 1073.77, 1078.5, 29292.45, 29238.14, 29238.14);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b4011111-1111-4111-a111-111111111101', 'b4011111-boq-035', 'WHS001-035', 'Electrical — benchmark item 35', 167.44, 168.18, 976.25, 957.76, 163463.3, 161076.08, 161076.08);

  -- Historical Commercial Building — Cebu
  DELETE FROM public.projects WHERE id = 'b5011111-1111-4111-a111-111111111101';

  INSERT INTO public.projects (id, project_code, project_name, client_name, location, status, created_by, updated_by)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'QTX-BENCH-COM-001', 'Historical Commercial Building — Cebu', 'SM Development Benchmark', 'Cebu City', 'archived', v_owner, v_owner);

  INSERT INTO public.project_details (project_id, project_type, currency, indirect_cost_percent, contingency_percent, markup_percent, vat_percent, is_benchmark, created_by, updated_by)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'commercial', 'USD', 10, 5, 8, 12, true, v_owner, v_owner);

  INSERT INTO public.estimate_summary (project_id, direct_cost, indirect_cost, contingency, markup, vat, grand_total, created_by, updated_by)
  VALUES ('b5011111-1111-4111-a111-111111111101', 2610196.57, 261019.66, 143560.81, 241182.16, 390715.1, 3646674.3, v_owner, v_owner);

  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b5011111-wbs-1', 'b5011111-1111-4111-a111-111111111101', NULL, '1', 'Structural', 0, 0, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b5011111-wbs-1-Concre', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1', '1.1', 'Concrete', 1, 1, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b5011111-wbs-1-Steel', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1', '1.2', 'Steel', 1, 2, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b5011111-wbs-2', 'b5011111-1111-4111-a111-111111111101', NULL, '2', 'Architectural', 0, 3, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b5011111-wbs-2-Curtai', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2', '2.1', 'Curtain Wall', 1, 4, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b5011111-wbs-2-Interi', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2', '2.2', 'Interior', 1, 5, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b5011111-wbs-3', 'b5011111-1111-4111-a111-111111111101', NULL, '3', 'MEPF', 0, 6, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b5011111-wbs-3-Electr', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3', '3.1', 'Electrical', 1, 7, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b5011111-wbs-3-Mechan', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3', '3.2', 'Mechanical', 1, 8, v_owner, v_owner);

  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-001', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1-Concre', 'COM001-001', 'Concrete — benchmark item 1', 'lot', 41.22, 817.26, 257.39, 0, 0, 0, 1074.65, 44297.07, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-002', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1-Steel', 'COM001-002', 'Steel — benchmark item 2', 'lot', 110.56, 696.84, 89.69, 0, 0, 0, 786.53, 86958.76, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-003', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2-Curtai', 'COM001-003', 'Curtain Wall — benchmark item 3', 'm3', 197.88, 485.01, 74.93, 14.3, 0, 0, 574.24, 113630.61, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-004', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2-Interi', 'COM001-004', 'Interior — benchmark item 4', 'm2', 28.86, 243.23, 137.51, 0, 0, 0, 380.74, 10988.16, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-005', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3-Electr', 'COM001-005', 'Electrical — benchmark item 5', 'lot', 99.56, 544.11, 218.6, 0, 0, 0, 762.71, 75935.41, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-006', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3-Mechan', 'COM001-006', 'Mechanical — benchmark item 6', 'm3', 167.08, 311.26, 182.97, 130.44, 0, 0, 624.67, 104369.86, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-007', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1-Concre', 'COM001-007', 'Concrete — benchmark item 7', 'lot', 146.71, 567.85, 48.09, 0, 305.62, 0, 921.56, 135202.07, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-008', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1-Steel', 'COM001-008', 'Steel — benchmark item 8', 'm2', 60.06, 113.57, 95.03, 0, 0, 0, 208.6, 12528.52, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-009', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2-Curtai', 'COM001-009', 'Curtain Wall — benchmark item 9', 'm3', 117.73, 548.36, 194.98, 40.28, 0, 0, 783.62, 92255.58, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-010', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2-Interi', 'COM001-010', 'Interior — benchmark item 10', 'lot', 23.47, 834.26, 253.64, 0, 0, 0, 1087.9, 25533.01, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-011', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3-Electr', 'COM001-011', 'Electrical — benchmark item 11', 'lot', 200.05, 785.3, 105.4, 0, 0, 0, 890.7, 178184.54, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-012', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3-Mechan', 'COM001-012', 'Mechanical — benchmark item 12', 'm2', 20.8, 384.46, 175.75, 111.57, 0, 0, 671.78, 13973.02, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-013', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1-Concre', 'COM001-013', 'Concrete — benchmark item 13', 'lot', 158.56, 790.91, 65.99, 0, 0, 0, 856.9, 135870.06, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-014', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1-Steel', 'COM001-014', 'Steel — benchmark item 14', 'lot', 66.04, 737.61, 165.69, 0, 237.88, 0, 1141.18, 75363.53, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-015', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2-Curtai', 'COM001-015', 'Curtain Wall — benchmark item 15', 'm3', 120, 754.82, 300.42, 84.95, 0, 0, 1140.19, 136822.8, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-016', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2-Interi', 'COM001-016', 'Interior — benchmark item 16', 'm2', 100.23, 812.68, 102.84, 0, 0, 0, 915.52, 91762.57, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-017', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3-Electr', 'COM001-017', 'Electrical — benchmark item 17', 'lot', 79.9, 50.83, 83.99, 0, 0, 0, 134.82, 10772.12, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-018', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3-Mechan', 'COM001-018', 'Mechanical — benchmark item 18', 'm3', 186.57, 340.53, 308.74, 58.49, 0, 0, 707.76, 132046.78, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-019', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1-Concre', 'COM001-019', 'Concrete — benchmark item 19', 'lot', 20.43, 779.67, 33.58, 0, 0, 0, 813.25, 16614.7, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-020', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1-Steel', 'COM001-020', 'Steel — benchmark item 20', 'm2', 11.55, 479.14, 75.01, 0, 0, 0, 554.15, 6400.43, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-021', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2-Curtai', 'COM001-021', 'Curtain Wall — benchmark item 21', 'm3', 96.84, 696.76, 299.53, 6.53, 316.89, 0, 1319.71, 127800.72, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-022', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2-Interi', 'COM001-022', 'Interior — benchmark item 22', 'lot', 78.63, 54.36, 28.31, 0, 0, 0, 82.67, 6500.34, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-023', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3-Electr', 'COM001-023', 'Electrical — benchmark item 23', 'lot', 102.9, 87.81, 156.79, 0, 0, 0, 244.6, 25169.34, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-024', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3-Mechan', 'COM001-024', 'Mechanical — benchmark item 24', 'm2', 175.5, 782.79, 60.34, 119.93, 0, 0, 963.06, 169017.03, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-025', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1-Concre', 'COM001-025', 'Concrete — benchmark item 25', 'lot', 139.84, 557.43, 151.68, 0, 0, 0, 709.11, 99161.94, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-026', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1-Steel', 'COM001-026', 'Steel — benchmark item 26', 'lot', 140.07, 211.45, 296.1, 0, 0, 0, 507.55, 71092.53, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-027', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2-Curtai', 'COM001-027', 'Curtain Wall — benchmark item 27', 'm3', 182.42, 369.5, 33.18, 4.14, 0, 0, 406.82, 74212.1, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-028', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2-Interi', 'COM001-028', 'Interior — benchmark item 28', 'm2', 112.75, 417.66, 119.34, 0, 30.69, 0, 567.69, 64007.05, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-029', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3-Electr', 'COM001-029', 'Electrical — benchmark item 29', 'lot', 34.15, 162.38, 112.12, 0, 0, 0, 274.5, 9374.17, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-030', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3-Mechan', 'COM001-030', 'Mechanical — benchmark item 30', 'm3', 174.52, 513.87, 286.66, 102, 0, 0, 902.53, 157509.54, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-031', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1-Concre', 'COM001-031', 'Concrete — benchmark item 31', 'lot', 73.88, 342.17, 293.89, 0, 0, 0, 636.06, 46992.11, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-032', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-1-Steel', 'COM001-032', 'Steel — benchmark item 32', 'm2', 29.22, 694.44, 241.78, 0, 0, 0, 936.22, 27356.35, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-033', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2-Curtai', 'COM001-033', 'Curtain Wall — benchmark item 33', 'm3', 160.03, 705.48, 189.41, 34.2, 0, 0, 929.09, 148682.27, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-034', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-2-Interi', 'COM001-034', 'Interior — benchmark item 34', 'lot', 82.11, 50.56, 250.18, 0, 0, 0, 300.74, 24693.76, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b5011111-boq-035', 'b5011111-1111-4111-a111-111111111101', 'b5011111-wbs-3-Electr', 'COM001-035', 'Electrical — benchmark item 35', 'lot', 79.71, 434.35, 129.28, 0, 178.03, 0, 741.66, 59117.72, v_owner, v_owner);

  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-001', 'COM001-001', 'Concrete — benchmark item 1', 41.22, 41.44, 1074.65, 1059.69, 44297.07, 43913.55, 43913.55);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-002', 'COM001-002', 'Steel — benchmark item 2', 110.56, 107.58, 786.53, 793.64, 86958.76, 85379.79, 85379.79);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-003', 'COM001-003', 'Curtain Wall — benchmark item 3', 197.88, 193.06, 574.24, 582.74, 113630.61, 112503.78, 112503.78);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-004', 'COM001-004', 'Interior — benchmark item 4', 28.86, 28.49, 380.74, 378.13, 10988.16, 10772.92, 10772.92);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-005', 'COM001-005', 'Electrical — benchmark item 5', 99.56, 99.41, 762.71, 765.39, 75935.41, 76087.42, 76087.42);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-006', 'COM001-006', 'Mechanical — benchmark item 6', 167.08, 169.49, 624.67, 627.65, 104369.86, 106380.4, 106380.4);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-007', 'COM001-007', 'Concrete — benchmark item 7', 146.71, 148.11, 921.56, 915.39, 135202.07, 135578.41, 135578.41);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-008', 'COM001-008', 'Steel — benchmark item 8', 60.06, 58.52, 208.6, 207.76, 12528.52, 12158.12, 12158.12);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-009', 'COM001-009', 'Curtain Wall — benchmark item 9', 117.73, 115.06, 783.62, 783.47, 92255.58, 90146.06, 90146.06);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-010', 'COM001-010', 'Interior — benchmark item 10', 23.47, 23.06, 1087.9, 1076.76, 25533.01, 24830.09, 24830.09);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-011', 'COM001-011', 'Electrical — benchmark item 11', 200.05, 194.35, 890.7, 885.59, 178184.54, 172114.42, 172114.42);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-012', 'COM001-012', 'Mechanical — benchmark item 12', 20.8, 20.89, 671.78, 666.71, 13973.02, 13927.57, 13927.57);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-013', 'COM001-013', 'Concrete — benchmark item 13', 158.56, 158.81, 856.9, 863.01, 135870.06, 137054.62, 137054.62);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-014', 'COM001-014', 'Steel — benchmark item 14', 66.04, 66.76, 1141.18, 1123.48, 75363.53, 75003.52, 75003.52);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-015', 'COM001-015', 'Curtain Wall — benchmark item 15', 120, 117.28, 1140.19, 1157.26, 136822.8, 135723.45, 135723.45);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-016', 'COM001-016', 'Interior — benchmark item 16', 100.23, 100.96, 915.52, 929.66, 91762.57, 93858.47, 93858.47);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-017', 'COM001-017', 'Electrical — benchmark item 17', 79.9, 77.72, 134.82, 133.3, 10772.12, 10360.08, 10360.08);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-018', 'COM001-018', 'Mechanical — benchmark item 18', 186.57, 185.08, 707.76, 695.95, 132046.78, 128806.43, 128806.43);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-019', 'COM001-019', 'Concrete — benchmark item 19', 20.43, 20.19, 813.25, 823.59, 16614.7, 16628.28, 16628.28);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-020', 'COM001-020', 'Steel — benchmark item 20', 11.55, 11.3, 554.15, 548.82, 6400.43, 6201.67, 6201.67);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-021', 'COM001-021', 'Curtain Wall — benchmark item 21', 96.84, 98.66, 1319.71, 1303.15, 127800.72, 128568.78, 128568.78);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-022', 'COM001-022', 'Interior — benchmark item 22', 78.63, 76.6, 82.67, 82.58, 6500.34, 6325.63, 6325.63);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-023', 'COM001-023', 'Electrical — benchmark item 23', 102.9, 101.24, 244.6, 241.48, 25169.34, 24447.44, 24447.44);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-024', 'COM001-024', 'Mechanical — benchmark item 24', 175.5, 176.43, 963.06, 978.5, 169017.03, 172636.76, 172636.76);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-025', 'COM001-025', 'Concrete — benchmark item 25', 139.84, 141.26, 709.11, 703.27, 99161.94, 99343.92, 99343.92);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-026', 'COM001-026', 'Steel — benchmark item 26', 140.07, 141.16, 507.55, 508.76, 71092.53, 71816.56, 71816.56);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-027', 'COM001-027', 'Curtain Wall — benchmark item 27', 182.42, 182.89, 406.82, 410.28, 74212.1, 75036.11, 75036.11);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-028', 'COM001-028', 'Interior — benchmark item 28', 112.75, 112.57, 567.69, 562.8, 64007.05, 63354.4, 63354.4);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-029', 'COM001-029', 'Electrical — benchmark item 29', 34.15, 33.97, 274.5, 270.22, 9374.17, 9179.37, 9179.37);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-030', 'COM001-030', 'Mechanical — benchmark item 30', 174.52, 175.79, 902.53, 904.38, 157509.54, 158980.96, 158980.96);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-031', 'COM001-031', 'Concrete — benchmark item 31', 73.88, 75.51, 636.06, 646.83, 46992.11, 48842.13, 48842.13);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-032', 'COM001-032', 'Steel — benchmark item 32', 29.22, 29.17, 936.22, 949.09, 27356.35, 27684.96, 27684.96);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-033', 'COM001-033', 'Curtain Wall — benchmark item 33', 160.03, 159.03, 929.09, 910.66, 148682.27, 144822.26, 144822.26);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-034', 'COM001-034', 'Interior — benchmark item 34', 82.11, 82.56, 300.74, 305.13, 24693.76, 25191.53, 25191.53);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b5011111-1111-4111-a111-111111111101', 'b5011111-boq-035', 'COM001-035', 'Electrical — benchmark item 35', 79.71, 81.97, 741.66, 734.59, 59117.72, 60214.34, 60214.34);

  -- Historical Infrastructure — Road Package
  DELETE FROM public.projects WHERE id = 'b6011111-1111-4111-a111-111111111101';

  INSERT INTO public.projects (id, project_code, project_name, client_name, location, status, created_by, updated_by)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'QTX-BENCH-INF-001', 'Historical Infrastructure — Road Package', 'DPWH Benchmark Archive', 'Bulacan', 'archived', v_owner, v_owner);

  INSERT INTO public.project_details (project_id, project_type, currency, indirect_cost_percent, contingency_percent, markup_percent, vat_percent, is_benchmark, created_by, updated_by)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'infrastructure', 'USD', 10, 5, 8, 12, true, v_owner, v_owner);

  INSERT INTO public.estimate_summary (project_id, direct_cost, indirect_cost, contingency, markup, vat, grand_total, created_by, updated_by)
  VALUES ('b6011111-1111-4111-a111-111111111101', 2764273.52, 276427.35, 152035.04, 255418.87, 413778.57, 3861933.35, v_owner, v_owner);

  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b6011111-wbs-1', 'b6011111-1111-4111-a111-111111111101', NULL, '1', 'Earthworks', 0, 0, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b6011111-wbs-1-Excava', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1', '1.1', 'Excavation', 1, 1, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b6011111-wbs-1-Embank', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1', '1.2', 'Embankment', 1, 2, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b6011111-wbs-2', 'b6011111-1111-4111-a111-111111111101', NULL, '2', 'Pavement', 0, 3, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b6011111-wbs-2-Sub-ba', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2', '2.1', 'Sub-base', 1, 4, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b6011111-wbs-2-Asphal', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2', '2.2', 'Asphalt', 1, 5, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b6011111-wbs-3', 'b6011111-1111-4111-a111-111111111101', NULL, '3', 'Drainage', 0, 6, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b6011111-wbs-3-RCBC', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3', '3.1', 'RCBC', 1, 7, v_owner, v_owner);
  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)
  VALUES ('b6011111-wbs-3-Manhol', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3', '3.2', 'Manholes', 1, 8, v_owner, v_owner);

  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-001', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1-Excava', 'INF001-001', 'Excavation — benchmark item 1', 'lot', 143.99, 433.73, 170.4, 0, 0, 0, 604.13, 86988.68, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-002', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1-Embank', 'INF001-002', 'Embankment — benchmark item 2', 'lot', 47.29, 291, 58.22, 0, 0, 0, 349.22, 16514.61, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-003', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2-Sub-ba', 'INF001-003', 'Sub-base — benchmark item 3', 'm3', 91.29, 293.06, 28.98, 0.82, 0, 0, 322.86, 29473.89, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-004', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2-Asphal', 'INF001-004', 'Asphalt — benchmark item 4', 'm2', 54.79, 678.36, 81.25, 0, 0, 0, 759.61, 41619.03, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-005', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3-RCBC', 'INF001-005', 'RCBC — benchmark item 5', 'lot', 201.03, 574.6, 222.6, 0, 0, 0, 797.2, 160261.12, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-006', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3-Manhol', 'INF001-006', 'Manholes — benchmark item 6', 'm3', 168.35, 94.23, 292, 106.76, 0, 0, 492.99, 82994.87, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-007', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1-Excava', 'INF001-007', 'Excavation — benchmark item 7', 'lot', 87.05, 756.54, 194.28, 0, 136.88, 0, 1087.7, 94684.29, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-008', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1-Embank', 'INF001-008', 'Embankment — benchmark item 8', 'm2', 205.73, 598.48, 195.54, 0, 0, 0, 794.02, 163353.73, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-009', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2-Sub-ba', 'INF001-009', 'Sub-base — benchmark item 9', 'm3', 49.22, 275.77, 188.37, 124.47, 0, 0, 588.61, 28971.38, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-010', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2-Asphal', 'INF001-010', 'Asphalt — benchmark item 10', 'lot', 10.78, 414.04, 241.39, 0, 0, 0, 655.43, 7065.54, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-011', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3-RCBC', 'INF001-011', 'RCBC — benchmark item 11', 'lot', 21.16, 846.62, 201.43, 0, 0, 0, 1048.05, 22176.74, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-012', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3-Manhol', 'INF001-012', 'Manholes — benchmark item 12', 'm2', 85.24, 800.54, 224.47, 140.23, 0, 0, 1165.24, 99325.06, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-013', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1-Excava', 'INF001-013', 'Excavation — benchmark item 13', 'lot', 76.35, 480.85, 218.86, 0, 0, 0, 699.71, 53422.86, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-014', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1-Embank', 'INF001-014', 'Embankment — benchmark item 14', 'lot', 62.37, 289.31, 280.13, 0, 279.99, 0, 849.43, 52978.95, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-015', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2-Sub-ba', 'INF001-015', 'Sub-base — benchmark item 15', 'm3', 58.3, 706.77, 36.05, 65.15, 0, 0, 807.97, 47104.65, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-016', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2-Asphal', 'INF001-016', 'Asphalt — benchmark item 16', 'm2', 182.78, 513.98, 82.98, 0, 0, 0, 596.96, 109112.35, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-017', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3-RCBC', 'INF001-017', 'RCBC — benchmark item 17', 'lot', 106.89, 727.35, 175.36, 0, 0, 0, 902.71, 96490.67, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-018', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3-Manhol', 'INF001-018', 'Manholes — benchmark item 18', 'm3', 11.66, 480.18, 175.05, 33.36, 0, 0, 688.59, 8028.96, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-019', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1-Excava', 'INF001-019', 'Excavation — benchmark item 19', 'lot', 146.45, 249.16, 269.25, 0, 0, 0, 518.41, 75921.14, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-020', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1-Embank', 'INF001-020', 'Embankment — benchmark item 20', 'm2', 44.91, 718.03, 138.7, 0, 0, 0, 856.73, 38475.74, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-021', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2-Sub-ba', 'INF001-021', 'Sub-base — benchmark item 21', 'm3', 201.16, 679.5, 211.31, 135.95, 268.04, 0, 1294.8, 260461.97, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-022', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2-Asphal', 'INF001-022', 'Asphalt — benchmark item 22', 'lot', 56.09, 717.01, 171.54, 0, 0, 0, 888.55, 49838.77, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-023', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3-RCBC', 'INF001-023', 'RCBC — benchmark item 23', 'lot', 54.17, 342.01, 299.27, 0, 0, 0, 641.28, 34738.14, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-024', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3-Manhol', 'INF001-024', 'Manholes — benchmark item 24', 'm2', 109.41, 257.36, 174.24, 0.04, 0, 0, 431.64, 47225.73, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-025', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1-Excava', 'INF001-025', 'Excavation — benchmark item 25', 'lot', 12.17, 309.7, 48.22, 0, 0, 0, 357.92, 4355.89, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-026', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1-Embank', 'INF001-026', 'Embankment — benchmark item 26', 'lot', 53.53, 521.93, 68.98, 0, 0, 0, 590.91, 31631.41, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-027', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2-Sub-ba', 'INF001-027', 'Sub-base — benchmark item 27', 'm3', 206.82, 730.3, 313.88, 73.95, 0, 0, 1118.13, 231251.65, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-028', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2-Asphal', 'INF001-028', 'Asphalt — benchmark item 28', 'm2', 206.98, 348.64, 269.02, 0, 248.38, 0, 866.04, 179252.96, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-029', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3-RCBC', 'INF001-029', 'RCBC — benchmark item 29', 'lot', 42.03, 435.93, 212.9, 0, 0, 0, 648.83, 27270.32, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-030', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3-Manhol', 'INF001-030', 'Manholes — benchmark item 30', 'm3', 207.4, 591.61, 289.39, 79.12, 0, 0, 960.12, 199128.89, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-031', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1-Excava', 'INF001-031', 'Excavation — benchmark item 31', 'lot', 147.48, 392.54, 126.21, 0, 0, 0, 518.75, 76505.25, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-032', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-1-Embank', 'INF001-032', 'Embankment — benchmark item 32', 'm2', 92.01, 500.07, 82.74, 0, 0, 0, 582.81, 53624.35, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-033', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2-Sub-ba', 'INF001-033', 'Sub-base — benchmark item 33', 'm3', 90.63, 98.68, 195.84, 23.78, 0, 0, 318.3, 28847.53, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-034', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-2-Asphal', 'INF001-034', 'Asphalt — benchmark item 34', 'lot', 26.55, 127.97, 319.57, 0, 0, 0, 447.54, 11882.19, v_owner, v_owner);
  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)
  VALUES ('b6011111-boq-035', 'b6011111-1111-4111-a111-111111111101', 'b6011111-wbs-3-RCBC', 'INF001-035', 'RCBC — benchmark item 35', 'lot', 195.55, 461.04, 287.53, 0, 342.17, 0, 1090.74, 213294.21, v_owner, v_owner);

  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-001', 'INF001-001', 'Excavation — benchmark item 1', 143.99, 145.1, 604.13, 607.62, 86988.68, 88165.66, 88165.66);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-002', 'INF001-002', 'Embankment — benchmark item 2', 47.29, 46.16, 349.22, 351.22, 16514.61, 16212.32, 16212.32);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-003', 'INF001-003', 'Sub-base — benchmark item 3', 91.29, 92.88, 322.86, 324.52, 29473.89, 30141.42, 30141.42);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-004', 'INF001-004', 'Asphalt — benchmark item 4', 54.79, 56.25, 759.61, 756.85, 41619.03, 42572.81, 42572.81);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-005', 'INF001-005', 'RCBC — benchmark item 5', 201.03, 195.18, 797.2, 809.48, 160261.12, 157994.31, 157994.31);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-006', 'INF001-006', 'Manholes — benchmark item 6', 168.35, 164.95, 492.99, 489.27, 82994.87, 80705.09, 80705.09);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-007', 'INF001-007', 'Excavation — benchmark item 7', 87.05, 84.84, 1087.7, 1101.16, 94684.29, 93422.41, 93422.41);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-008', 'INF001-008', 'Embankment — benchmark item 8', 205.73, 209.23, 794.02, 785.2, 163353.73, 164287.4, 164287.4);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-009', 'INF001-009', 'Sub-base — benchmark item 9', 49.22, 49.15, 588.61, 590.37, 28971.38, 29016.69, 29016.69);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-010', 'INF001-010', 'Asphalt — benchmark item 10', 10.78, 10.76, 655.43, 657.19, 7065.54, 7071.36, 7071.36);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-011', 'INF001-011', 'RCBC — benchmark item 11', 21.16, 21.69, 1048.05, 1060.07, 22176.74, 22992.92, 22992.92);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-012', 'INF001-012', 'Manholes — benchmark item 12', 85.24, 86.86, 1165.24, 1153.8, 99325.06, 100219.07, 100219.07);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-013', 'INF001-013', 'Excavation — benchmark item 13', 76.35, 77.06, 699.71, 712.01, 53422.86, 54867.49, 54867.49);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-014', 'INF001-014', 'Embankment — benchmark item 14', 62.37, 61.97, 849.43, 840.35, 52978.95, 52076.49, 52076.49);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-015', 'INF001-015', 'Sub-base — benchmark item 15', 58.3, 58.43, 807.97, 818.79, 47104.65, 47841.9, 47841.9);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-016', 'INF001-016', 'Asphalt — benchmark item 16', 182.78, 187.96, 596.96, 596.46, 109112.35, 112110.62, 112110.62);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-017', 'INF001-017', 'RCBC — benchmark item 17', 106.89, 108.29, 902.71, 916.9, 96490.67, 99291.1, 99291.1);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-018', 'INF001-018', 'Manholes — benchmark item 18', 11.66, 11.78, 688.59, 680.73, 8028.96, 8019, 8019);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-019', 'INF001-019', 'Excavation — benchmark item 19', 146.45, 150.56, 518.41, 511.95, 75921.14, 77079.19, 77079.19);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-020', 'INF001-020', 'Embankment — benchmark item 20', 44.91, 44.69, 856.73, 872.85, 38475.74, 39007.67, 39007.67);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-021', 'INF001-021', 'Sub-base — benchmark item 21', 201.16, 198.61, 1294.8, 1278.68, 260461.97, 253958.63, 253958.63);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-022', 'INF001-022', 'Asphalt — benchmark item 22', 56.09, 57.23, 888.55, 894.67, 49838.77, 51201.96, 51201.96);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-023', 'INF001-023', 'RCBC — benchmark item 23', 54.17, 54.46, 641.28, 643.51, 34738.14, 35045.55, 35045.55);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-024', 'INF001-024', 'Manholes — benchmark item 24', 109.41, 110.81, 431.64, 429.91, 47225.73, 47638.33, 47638.33);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-025', 'INF001-025', 'Excavation — benchmark item 25', 12.17, 12.23, 357.92, 353.83, 4355.89, 4327.34, 4327.34);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-026', 'INF001-026', 'Embankment — benchmark item 26', 53.53, 53.81, 590.91, 582.35, 31631.41, 31336.25, 31336.25);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-027', 'INF001-027', 'Sub-base — benchmark item 27', 206.82, 211.55, 1118.13, 1113.67, 231251.65, 235596.89, 235596.89);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-028', 'INF001-028', 'Asphalt — benchmark item 28', 206.98, 211.25, 866.04, 869.87, 179252.96, 183760.04, 183760.04);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-029', 'INF001-029', 'RCBC — benchmark item 29', 42.03, 43.18, 648.83, 644.16, 27270.32, 27814.83, 27814.83);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-030', 'INF001-030', 'Manholes — benchmark item 30', 207.4, 212.77, 960.12, 962.47, 199128.89, 204784.74, 204784.74);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-031', 'INF001-031', 'Excavation — benchmark item 31', 147.48, 147.19, 518.75, 513.96, 76505.25, 75649.77, 75649.77);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-032', 'INF001-032', 'Embankment — benchmark item 32', 92.01, 91.57, 582.81, 591.62, 53624.35, 54174.64, 54174.64);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-033', 'INF001-033', 'Sub-base — benchmark item 33', 90.63, 91.73, 318.3, 313.26, 28847.53, 28735.34, 28735.34);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-034', 'INF001-034', 'Asphalt — benchmark item 34', 26.55, 26.32, 447.54, 442.36, 11882.19, 11642.92, 11642.92);
  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)
  VALUES ('b6011111-1111-4111-a111-111111111101', 'b6011111-boq-035', 'INF001-035', 'RCBC — benchmark item 35', 195.55, 192.39, 1090.74, 1097.07, 213294.21, 211065.3, 211065.3);

END $$;

COMMIT;