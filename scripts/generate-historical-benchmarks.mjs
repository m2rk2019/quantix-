/**
 * Sprint 14 — Generate historical benchmark seed SQL.
 *   npm run demo:historical-benchmarks
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  calculateEstimateBreakdown,
} from './lib/estimating-formulas.mjs';
import { buildAllBenchmarkSnapshots } from './lib/historical-benchmark/archetypes.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const SQL_PATH = resolve(ROOT, 'supabase/seed-historical-benchmarks.sql');

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildSql() {
  const snapshots = buildAllBenchmarkSnapshots();
  const lines = [];

  lines.push('-- Quantix Sprint 14 — Historical Estimate Benchmark Projects (5 archetypes)');
  lines.push('-- Prerequisites: migrations through 20260711120000_benchmark_sprint14.sql');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');
  lines.push('DO $$');
  lines.push('DECLARE');
  lines.push('  v_owner UUID;');
  lines.push('BEGIN');
  lines.push('  SELECT id INTO v_owner FROM public.users WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1;');
  lines.push('  IF v_owner IS NULL THEN');
  lines.push("    RAISE EXCEPTION 'No active users found.';");
  lines.push('  END IF;');
  lines.push('');

  for (const snapshot of snapshots) {
    const { archetype, wbsNodes, items, actuals, directCost, percentages } = snapshot;
    const breakdown = calculateEstimateBreakdown(directCost, percentages);

    lines.push(`  -- ${archetype.name}`);
    lines.push(`  DELETE FROM public.projects WHERE id = '${archetype.id}';`);
    lines.push('');
    lines.push(`  INSERT INTO public.projects (id, project_code, project_name, client_name, location, status, created_by, updated_by)`);
    lines.push(`  VALUES ('${archetype.id}', ${sqlString(archetype.code)}, ${sqlString(archetype.name)}, ${sqlString(archetype.client)}, ${sqlString(archetype.location)}, 'archived', v_owner, v_owner);`);
    lines.push('');
    lines.push(`  INSERT INTO public.project_details (project_id, project_type, currency, indirect_cost_percent, contingency_percent, markup_percent, vat_percent, is_benchmark, created_by, updated_by)`);
    lines.push(`  VALUES ('${archetype.id}', ${sqlString(archetype.project_type)}, 'USD', ${percentages.indirect_cost_percent}, ${percentages.contingency_percent}, ${percentages.markup_percent}, ${percentages.vat_percent}, true, v_owner, v_owner);`);
    lines.push('');
    lines.push(`  INSERT INTO public.estimate_summary (project_id, direct_cost, indirect_cost, contingency, markup, vat, grand_total, created_by, updated_by)`);
    lines.push(`  VALUES ('${archetype.id}', ${breakdown.direct_cost}, ${breakdown.indirect_cost}, ${breakdown.contingency}, ${breakdown.markup}, ${breakdown.vat}, ${breakdown.grand_total}, v_owner, v_owner);`);
    lines.push('');

    for (const node of wbsNodes) {
      lines.push(`  INSERT INTO public.wbs (id, project_id, parent_id, wbs_code, description, level, sort_order, created_by, updated_by)`);
      lines.push(`  VALUES ('${node.id}', '${archetype.id}', ${node.parent_id ? `'${node.parent_id}'` : 'NULL'}, ${sqlString(node.wbs_code)}, ${sqlString(node.description)}, ${node.level}, ${node.sort_order}, v_owner, v_owner);`);
    }
    lines.push('');

    for (const item of items) {
      lines.push(`  INSERT INTO public.boq_items (id, project_id, wbs_id, item_code, description, unit, quantity, material_rate, labor_rate, equipment_rate, subcontract_rate, other_cost_rate, total_rate, total_amount, created_by, updated_by)`);
      lines.push(`  VALUES ('${item.id}', '${archetype.id}', '${item.wbs_id}', ${sqlString(item.item_code)}, ${sqlString(item.description)}, ${sqlString(item.unit)}, ${item.quantity}, ${item.material_rate}, ${item.labor_rate}, ${item.equipment_rate}, ${item.subcontract_rate}, 0, ${item.total_rate}, ${item.total_amount}, v_owner, v_owner);`);
    }
    lines.push('');

    for (const actual of actuals) {
      const item = items.find((row) => row.item_code === actual.item_code);
      lines.push(`  INSERT INTO public.project_benchmark_actuals (project_id, boq_item_id, item_code, description, estimated_quantity, actual_quantity, estimated_unit_rate, actual_unit_rate, estimated_cost, actual_cost, awarded_cost)`);
      lines.push(`  VALUES ('${archetype.id}', '${item.id}', ${sqlString(actual.item_code)}, ${sqlString(actual.description)}, ${actual.estimated_quantity}, ${actual.actual_quantity}, ${actual.estimated_unit_rate}, ${actual.actual_unit_rate}, ${actual.estimated_cost}, ${actual.actual_cost}, ${actual.awarded_cost});`);
    }
    lines.push('');
  }

  lines.push('END $$;');
  lines.push('');
  lines.push('COMMIT;');
  return lines.join('\n');
}

const sql = buildSql();
writeFileSync(SQL_PATH, sql, 'utf8');
console.log(`Wrote ${SQL_PATH}`);
console.log(`Projects: ${buildAllBenchmarkSnapshots().length}`);
