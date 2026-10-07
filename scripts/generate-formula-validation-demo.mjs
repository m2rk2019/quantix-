/**
 * Generates Sprint 8 formula validation demo seed SQL.
 * Run: npm run demo:formula-validation
 *
 * Output: supabase/seed-formula-validation-demo.sql
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  DEMO_PERCENTAGES,
  DEMO_PROJECT_CODE,
  DEMO_PROJECT_ID,
  DEMO_PROJECT_META,
  buildFullDemoSnapshot,
} from './lib/formula-validation-demo-data.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const SQL_PATH = resolve(ROOT, 'supabase/seed-formula-validation-demo.sql');

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildSql(snapshot) {
  const { wbsNodes, items, breakdown, resourceLibrary } = snapshot;
  const lines = [];

  lines.push('-- Quantix Sprint 8 — Formula Validation Demo Project');
  lines.push('-- Prerequisites: migrations applied; at least one public.users row');
  lines.push('-- Run after: supabase/seed.sql instructions');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');
  lines.push('DO $$');
  lines.push('DECLARE');
  lines.push('  v_owner UUID;');
  lines.push(`  v_project_id UUID := '${DEMO_PROJECT_ID}';`);
  lines.push('BEGIN');
  lines.push('  SELECT id INTO v_owner FROM public.users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1;');
  lines.push('  IF v_owner IS NULL THEN');
  lines.push("    RAISE EXCEPTION 'No active users found. Provision a user before running this seed.';");
  lines.push('  END IF;');
  lines.push('');
  lines.push('  DELETE FROM public.projects WHERE id = v_project_id;');
  lines.push('');
  lines.push("  DELETE FROM public.rate_library_items WHERE id::text LIKE 'f8d%';");
  lines.push("  DELETE FROM public.company_resource_categories WHERE id::text LIKE 'f8e3%';");
  lines.push("  DELETE FROM public.company_units WHERE id::text LIKE 'f8e2%';");
  lines.push("  DELETE FROM public.company_suppliers WHERE id::text LIKE 'f8e1%';");
  lines.push('');
  lines.push('  INSERT INTO public.projects (');
  lines.push('    id, project_code, project_name, client_name, location, status, created_by, updated_by');
  lines.push('  ) VALUES (');
  lines.push(`    v_project_id, ${sqlString(DEMO_PROJECT_CODE)}, ${sqlString(DEMO_PROJECT_META.project_name)},`);
  lines.push(`    ${sqlString(DEMO_PROJECT_META.client_name)}, ${sqlString(DEMO_PROJECT_META.location)},`);
  lines.push("    'draft', v_owner, v_owner");
  lines.push('  );');
  lines.push('');
  lines.push('  INSERT INTO public.project_details (');
  lines.push('    project_id, description, currency, indirect_cost_percent, contingency_percent,');
  lines.push('    markup_percent, vat_percent, measurement_system, default_unit_system, rounding_rule,');
  lines.push('    created_by, updated_by');
  lines.push('  ) VALUES (');
  lines.push(`    v_project_id, ${sqlString('Sprint 8 automated formula validation demo for Philippine construction estimating.')},`);
  lines.push(`    'USD', ${DEMO_PERCENTAGES.indirect_cost_percent}, ${DEMO_PERCENTAGES.contingency_percent},`);
  lines.push(`    ${DEMO_PERCENTAGES.markup_percent}, ${DEMO_PERCENTAGES.vat_percent},`);
  lines.push("    'metric', 'metric_si', 'half_up', v_owner, v_owner");
  lines.push('  );');
  lines.push('');
  lines.push('  INSERT INTO public.estimate_summary (');
  lines.push('    project_id, direct_cost, indirect_cost, contingency, markup, vat, grand_total,');
  lines.push('    created_by, updated_by');
  lines.push('  ) VALUES (');
  lines.push(`    v_project_id, ${breakdown.direct_cost}, ${breakdown.indirect_cost},`);
  lines.push(`    ${breakdown.contingency}, ${breakdown.markup}, ${breakdown.vat},`);
  lines.push(`    ${breakdown.grand_total}, v_owner, v_owner`);
  lines.push('  );');
  lines.push('');

  for (const table of ['company_suppliers', 'company_units', 'company_resource_categories']) {
    lines.push(`  -- Upsert ${table} (skip conflicts on re-run)`);
  }

  lines.push('  INSERT INTO public.company_suppliers (id, code, name, created_by, updated_by)');
  lines.push('  VALUES');
  const supplierValues = resourceLibrary.suppliers.map((row, index) => {
    const suffix = index < resourceLibrary.suppliers.length - 1 ? ',' : ';';
    return `    ('${row.id}', ${sqlString(row.code)}, ${sqlString(row.name)}, v_owner, v_owner)${suffix}`;
  });
  lines.push(...supplierValues);
  lines.push('');

  lines.push('  INSERT INTO public.company_units (id, code, symbol, name, created_by, updated_by)');
  lines.push('  VALUES');
  const unitValues = resourceLibrary.units.map((row, index) => {
    const suffix = index < resourceLibrary.units.length - 1 ? ',' : ';';
    return `    ('${row.id}', ${sqlString(row.code)}, ${sqlString(row.symbol)}, ${sqlString(row.name)}, v_owner, v_owner)${suffix}`;
  });
  lines.push(...unitValues);
  lines.push('');

  lines.push('  INSERT INTO public.company_resource_categories (id, code, name, resource_type, created_by, updated_by)');
  lines.push('  VALUES');
  const categoryValues = resourceLibrary.categories.map((row, index) => {
    const suffix = index < resourceLibrary.categories.length - 1 ? ',' : ';';
    return `    ('${row.id}', ${sqlString(row.code)}, ${sqlString(row.name)}, '${row.resource_type}', v_owner, v_owner)${suffix}`;
  });
  lines.push(...categoryValues);
  lines.push('');

  lines.push('  INSERT INTO public.rate_library_items (');
  lines.push('    id, code, description, unit, unit_cost, category, is_active, created_by, updated_by');
  lines.push('  ) VALUES');
  const libraryValues = resourceLibrary.items.map((row, index) => {
    const suffix = index < resourceLibrary.items.length - 1 ? ',' : ';';
    return `    ('${row.id}', ${sqlString(row.code)}, ${sqlString(row.description)}, ${sqlString(row.unit)}, ${row.unit_cost}, '${row.category}', true, v_owner, v_owner)${suffix}`;
  });
  lines.push(...libraryValues);
  lines.push('');

  lines.push('  INSERT INTO public.wbs (');
  lines.push('    id, project_id, parent_id, level, wbs_code, description, sort_order, created_by, updated_by');
  lines.push('  ) VALUES');
  const wbsValues = wbsNodes.map((node, index) => {
    const parent = node.parent_id ? `'${node.parent_id}'` : 'NULL';
    const suffix = index < wbsNodes.length - 1 ? ',' : ';';
    return `    ('${node.id}', v_project_id, ${parent}, ${node.level}, ${sqlString(node.wbs_code)}, ${sqlString(node.description)}, ${node.sort_order}, v_owner, v_owner)${suffix}`;
  });
  lines.push(...wbsValues);
  lines.push('');

  const batchSize = 50;
  for (let offset = 0; offset < items.length; offset += batchSize) {
    const batch = items.slice(offset, offset + batchSize);
    lines.push('  INSERT INTO public.boq_items (');
    lines.push('    id, project_id, wbs_id, item_code, description, unit, quantity,');
    lines.push('    material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate,');
    lines.push('    total_rate, total_amount, created_by, updated_by');
    lines.push('  ) VALUES');
    const boqValues = batch.map((item, index) => {
      const suffix = index < batch.length - 1 ? ',' : ';';
      return `    ('${item.id}', v_project_id, '${item.wbs_id}', ${sqlString(item.item_code)}, ${sqlString(item.description)}, ${sqlString(item.unit)}, ${item.quantity}, ${item.material_rate}, ${item.labor_rate}, ${item.equipment_rate}, ${item.subcontract_rate}, ${item.other_cost_rate}, ${item.total_rate}, ${item.total_amount}, v_owner, v_owner)${suffix}`;
    });
    lines.push(...boqValues);
    lines.push('');
  }

  let lineIndex = 1;
  for (const item of items) {
    if (!item.rate_analysis_lines?.length) {
      continue;
    }

    lines.push('  INSERT INTO public.boq_rate_analysis_lines (');
    lines.push('    id, boq_item_id, library_item_id, category, resource_name, unit, consumption,');
    lines.push('    unit_cost, waste_percent, productivity, amount, sort_order, created_by, updated_by');
    lines.push('  ) VALUES');

    const rateValues = item.rate_analysis_lines.map((line, index) => {
      const lineId = `f8e11111-1111-4111-a111-${String(lineIndex).padStart(12, '0')}`;
      lineIndex += 1;
      const productivity =
        line.productivity === null || line.productivity === undefined
          ? 'NULL'
          : line.productivity;
      const suffix = index < item.rate_analysis_lines.length - 1 ? ',' : ';';
      return `    ('${lineId}', '${item.id}', '${line.library_item_id}', '${line.category}', ${sqlString(line.resource_name)}, ${sqlString(line.unit)}, ${line.consumption}, ${line.unit_cost}, ${line.waste_percent ?? 0}, ${productivity}, ${line.amount}, ${index}, v_owner, v_owner)${suffix}`;
    });
    lines.push(...rateValues);
    lines.push('');
  }

  lines.push('  INSERT INTO public.audit_log (project_id, entity_type, entity_id, action, actor_id, payload)');
  lines.push('  VALUES (');
  lines.push("    v_project_id, 'project', v_project_id, 'project.created', v_owner,");
  lines.push(`    jsonb_build_object('module', 'formula_validation', 'remarks', ${sqlString('Sprint 8 demo seed')})`);
  lines.push('  );');
  lines.push('END $$;');
  lines.push('');
  lines.push('COMMIT;');
  lines.push('');

  return lines.join('\n');
}

const snapshot = buildFullDemoSnapshot(100);
const sql = buildSql(snapshot);
writeFileSync(SQL_PATH, sql, 'utf8');

console.log(`Wrote ${SQL_PATH}`);
console.log(`Project : ${DEMO_PROJECT_META.project_name}`);
console.log(`BOQ rows: ${snapshot.items.length}`);
console.log(`Direct  : ${snapshot.breakdown.direct_cost}`);
console.log(`Grand   : ${snapshot.breakdown.grand_total}`);
