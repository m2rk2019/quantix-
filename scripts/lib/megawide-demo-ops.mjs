/**
 * Apply / reset Megawide Office Building pilot demo via Supabase service role.
 */

import { createClient } from '@supabase/supabase-js';

import { createSupabaseAdmin, loadEnvLocal } from './load-env-local.mjs';
import {
  MEGAWIDE_PERCENTAGES,
  MEGAWIDE_PROJECT_CODE,
  MEGAWIDE_PROJECT_ID,
  MEGAWIDE_PROJECT_META,
  TARGET_GRAND_MAX,
  TARGET_GRAND_MIN,
  buildFullMegawideSnapshot,
} from './megawide-office-demo-data.mjs';

const BATCH_SIZE = 50;

function chunk(array, size) {
  const batches = [];
  for (let index = 0; index < array.length; index += size) {
    batches.push(array.slice(index, index + size));
  }
  return batches;
}

export function createAdminClient() {
  const { supabaseUrl, serviceRoleKey } = createSupabaseAdmin();
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function resolveOwnerId(admin) {
  const { data, error } = await admin
    .from('users')
    .select('id, email')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) {
    throw new Error(
      error?.message ?? 'No active users found. Run npm run deploy:provision-user first.'
    );
  }

  return data;
}

async function createAuthenticatedClient(admin, owner) {
  const { supabaseUrl, serviceRoleKey } = createSupabaseAdmin();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: owner.email,
  });

  if (linkError || !linkData.properties?.email_otp) {
    throw new Error(
      linkError?.message ?? `Could not generate auth session for ${owner.email}`
    );
  }

  const client = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: sessionData, error: verifyError } = await client.auth.verifyOtp({
    email: owner.email,
    token: linkData.properties.email_otp,
    type: 'email',
  });

  if (verifyError || !sessionData.user) {
    throw new Error(
      verifyError?.message ?? `Could not authenticate seed user ${owner.email}`
    );
  }

  return client;
}

async function deleteDemoRows(admin, table) {
  const { data, error: selectError } = await admin.from(table).select('id');
  if (selectError) {
    throw new Error(`Failed to read ${table}: ${selectError.message}`);
  }

  const demoIds = (data ?? [])
    .map((row) => row.id)
    .filter((id) => String(id).startsWith('e1d'));

  if (demoIds.length === 0) {
    return;
  }

  for (const batch of chunk(demoIds, BATCH_SIZE)) {
    const { error } = await admin.from(table).delete().in('id', batch);
    if (error) {
      throw new Error(`Failed to delete ${table}: ${error.message}`);
    }
  }
}

async function clearMegawideProjectData(admin) {
  const { error: auditError } = await admin
    .from('audit_log')
    .delete()
    .or(`project_id.eq.${MEGAWIDE_PROJECT_ID},entity_id.eq.${MEGAWIDE_PROJECT_ID}`);

  if (auditError) {
    throw new Error(`Failed to delete audit_log for pilot project: ${auditError.message}`);
  }

  const { error: projectError } = await admin
    .from('projects')
    .delete()
    .eq('id', MEGAWIDE_PROJECT_ID);

  if (projectError) {
    throw new Error(`Failed to delete pilot project: ${projectError.message}`);
  }
}

async function assertDemoLoadedInDatabase(admin, snapshot) {
  const { breakdown, items, wbsNodes } = snapshot;

  const [wbsResult, boqResult, benchmarkResult, summaryResult] = await Promise.all([
    admin
      .from('wbs')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', MEGAWIDE_PROJECT_ID)
      .is('deleted_at', null),
    admin
      .from('boq_items')
      .select('total_amount', { count: 'exact' })
      .eq('project_id', MEGAWIDE_PROJECT_ID)
      .is('deleted_at', null),
    admin
      .from('project_benchmark_actuals')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', MEGAWIDE_PROJECT_ID),
    admin
      .from('estimate_summary')
      .select('direct_cost, grand_total')
      .eq('project_id', MEGAWIDE_PROJECT_ID)
      .maybeSingle(),
  ]);

  if (wbsResult.error) {
    throw new Error(`Post-load WBS verification failed: ${wbsResult.error.message}`);
  }
  if (boqResult.error) {
    throw new Error(`Post-load BOQ verification failed: ${boqResult.error.message}`);
  }
  if (benchmarkResult.error) {
    throw new Error(`Post-load benchmark verification failed: ${benchmarkResult.error.message}`);
  }
  if (summaryResult.error) {
    throw new Error(`Post-load estimate summary verification failed: ${summaryResult.error.message}`);
  }

  if ((wbsResult.count ?? 0) !== wbsNodes.length) {
    throw new Error(
      `Post-load WBS count mismatch: expected ${wbsNodes.length}, got ${wbsResult.count ?? 0}`
    );
  }

  if ((boqResult.count ?? 0) !== items.length) {
    throw new Error(
      `Post-load BOQ count mismatch: expected ${items.length}, got ${boqResult.count ?? 0}`
    );
  }

  if ((benchmarkResult.count ?? 0) !== items.length) {
    throw new Error(
      `Post-load benchmark count mismatch: expected ${items.length}, got ${benchmarkResult.count ?? 0}`
    );
  }

  if (!summaryResult.data) {
    throw new Error('Post-load estimate summary missing for pilot project.');
  }

  const dbBoqTotal = (boqResult.data ?? []).reduce(
    (sum, row) => sum + Number(row.total_amount),
    0
  );

  if (Math.abs(dbBoqTotal - breakdown.direct_cost) > 0.01) {
    throw new Error(
      `Post-load BOQ total mismatch: expected ${breakdown.direct_cost}, got ${dbBoqTotal}`
    );
  }

  if (Math.abs(Number(summaryResult.data.grand_total) - breakdown.grand_total) > 0.01) {
    throw new Error(
      `Post-load grand total mismatch: expected ${breakdown.grand_total}, got ${summaryResult.data.grand_total}`
    );
  }
}

export async function resetMegawideDemo(admin = createAdminClient()) {
  await clearMegawideProjectData(admin);

  await deleteDemoRows(admin, 'rate_library_items');
  await deleteDemoRows(admin, 'company_resource_categories');
  await deleteDemoRows(admin, 'company_suppliers');

  return { project_id: MEGAWIDE_PROJECT_ID, cleared: true };
}

export async function applyMegawideDemo(admin = createAdminClient()) {
  await resetMegawideDemo(admin);

  const snapshot = buildFullMegawideSnapshot();
  const owner = await resolveOwnerId(admin);
  const ownerId = owner.id;
  const db = await createAuthenticatedClient(admin, owner);
  const { wbsNodes, items, breakdown, resourceLibrary, benchmarkActuals } = snapshot;

  if (snapshot.validationFailures.length > 0) {
    throw new Error(
      `Demo snapshot has ${snapshot.validationFailures.length} validation failure(s) before seed.`
    );
  }

  if (
    breakdown.grand_total < TARGET_GRAND_MIN ||
    breakdown.grand_total > TARGET_GRAND_MAX
  ) {
    throw new Error(
      `Grand total PHP ${breakdown.grand_total} outside pilot range PHP ${TARGET_GRAND_MIN}–${TARGET_GRAND_MAX}.`
    );
  }

  const { error: projectError } = await db.from('projects').insert({
    id: MEGAWIDE_PROJECT_ID,
    project_code: MEGAWIDE_PROJECT_CODE,
    project_name: MEGAWIDE_PROJECT_META.project_name,
    client_name: MEGAWIDE_PROJECT_META.client_name,
    location: MEGAWIDE_PROJECT_META.location,
    status: 'in_progress',
    created_by: ownerId,
    updated_by: ownerId,
  });

  if (projectError) {
    throw new Error(`Project insert failed: ${projectError.message}`);
  }

  const { error: detailsError } = await db.from('project_details').insert({
    project_id: MEGAWIDE_PROJECT_ID,
    description: MEGAWIDE_PROJECT_META.description,
    currency: 'PHP',
    project_type: MEGAWIDE_PROJECT_META.project_type,
    indirect_cost_percent: MEGAWIDE_PERCENTAGES.indirect_cost_percent,
    contingency_percent: MEGAWIDE_PERCENTAGES.contingency_percent,
    markup_percent: MEGAWIDE_PERCENTAGES.markup_percent,
    vat_percent: MEGAWIDE_PERCENTAGES.vat_percent,
    measurement_system: 'metric',
    default_unit_system: 'metric_si',
    rounding_rule: 'half_up',
    is_benchmark: true,
    created_by: ownerId,
    updated_by: ownerId,
  });

  if (detailsError) {
    throw new Error(`Project details insert failed: ${detailsError.message}`);
  }

  const { error: summaryError } = await db.from('estimate_summary').insert({
    project_id: MEGAWIDE_PROJECT_ID,
    direct_cost: breakdown.direct_cost,
    indirect_cost: breakdown.indirect_cost,
    contingency: breakdown.contingency,
    markup: breakdown.markup,
    vat: breakdown.vat,
    grand_total: breakdown.grand_total,
    created_by: ownerId,
    updated_by: ownerId,
  });

  if (summaryError) {
    throw new Error(`Estimate summary insert failed: ${summaryError.message}`);
  }

  const libraryTables = [
    {
      table: 'company_suppliers',
      rows: resourceLibrary.suppliers.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        created_by: ownerId,
        updated_by: ownerId,
      })),
    },
    {
      table: 'company_resource_categories',
      rows: resourceLibrary.categories.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        resource_type: row.resource_type,
        created_by: ownerId,
        updated_by: ownerId,
      })),
    },
    {
      table: 'rate_library_items',
      rows: resourceLibrary.items.map((row) => ({
        id: row.id,
        code: row.code,
        description: row.description,
        unit: row.unit,
        unit_cost: row.unit_cost,
        category: row.category,
        is_active: true,
        created_by: ownerId,
        updated_by: ownerId,
      })),
    },
  ];

  for (const { table, rows } of libraryTables) {
    if (rows.length === 0) continue;
    const { error } = await db.from(table).insert(rows);
    if (error) {
      throw new Error(`${table} insert failed: ${error.message}`);
    }
  }

  const wbsRows = wbsNodes.map((node) => ({
    id: node.id,
    project_id: MEGAWIDE_PROJECT_ID,
    parent_id: node.parent_id,
    level: node.level,
    wbs_code: node.wbs_code,
    description: node.description,
    sort_order: node.sort_order,
    created_by: ownerId,
    updated_by: ownerId,
  }));

  const { error: wbsError } = await db.from('wbs').insert(wbsRows);
  if (wbsError) {
    throw new Error(`WBS insert failed: ${wbsError.message}`);
  }

  const boqRows = items.map((item) => ({
    id: item.id,
    project_id: MEGAWIDE_PROJECT_ID,
    wbs_id: item.wbs_id,
    item_code: item.item_code,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    material_rate: item.material_rate,
    labor_rate: item.labor_rate,
    equipment_rate: item.equipment_rate,
    subcontract_rate: item.subcontract_rate,
    other_cost_rate: item.other_cost_rate,
    total_rate: item.total_rate,
    total_amount: item.total_amount,
    created_by: ownerId,
    updated_by: ownerId,
  }));

  for (const batch of chunk(boqRows, BATCH_SIZE)) {
    const { error } = await db.from('boq_items').insert(batch);
    if (error) {
      throw new Error(`BOQ insert failed: ${error.message}`);
    }
  }

  let lineIndex = 1;
  const rateRows = [];
  for (const item of items) {
    for (const [sortOrder, line] of (item.rate_analysis_lines ?? []).entries()) {
      rateRows.push({
        id: `e1e11111-1111-4111-a111-${String(lineIndex).padStart(12, '0')}`,
        boq_item_id: item.id,
        library_item_id: line.library_item_id,
        category: line.category,
        resource_name: line.resource_name,
        unit: line.unit,
        consumption: line.consumption,
        unit_cost: line.unit_cost,
        waste_percent: line.waste_percent ?? 0,
        productivity: line.productivity ?? null,
        amount: line.amount,
        sort_order: sortOrder,
      });
      lineIndex += 1;
    }
  }

  for (const batch of chunk(rateRows, BATCH_SIZE)) {
    const { error } = await db.from('boq_rate_analysis_lines').insert(batch);
    if (error) {
      throw new Error(`Rate analysis insert failed: ${error.message}`);
    }
  }

  const actualRows = benchmarkActuals.map((row) => ({
    project_id: MEGAWIDE_PROJECT_ID,
    boq_item_id: row.boq_item_id,
    item_code: row.item_code,
    description: row.description,
    estimated_quantity: row.estimated_quantity,
    actual_quantity: row.actual_quantity,
    estimated_unit_rate: row.estimated_unit_rate,
    actual_unit_rate: row.actual_unit_rate,
    estimated_cost: row.estimated_cost,
    actual_cost: row.actual_cost,
    awarded_cost: row.awarded_cost,
  }));

  for (const batch of chunk(actualRows, BATCH_SIZE)) {
    const { error } = await db.from('project_benchmark_actuals').insert(batch);
    if (error) {
      throw new Error(`Benchmark actuals insert failed: ${error.message}`);
    }
  }

  await db.from('audit_log').insert({
    project_id: MEGAWIDE_PROJECT_ID,
    entity_type: 'project',
    entity_id: MEGAWIDE_PROJECT_ID,
    action: 'project.created',
    actor_id: ownerId,
    payload: {
      module: 'pilot_demo',
      remarks: 'Megawide Office Building pilot seed',
    },
  });

  await assertDemoLoadedInDatabase(admin, snapshot);

  return {
    project_id: MEGAWIDE_PROJECT_ID,
    project_code: MEGAWIDE_PROJECT_CODE,
    project_name: MEGAWIDE_PROJECT_META.project_name,
    boq_item_count: items.length,
    wbs_node_count: wbsNodes.length,
    library_item_count: resourceLibrary.items.length,
    rate_line_count: rateRows.length,
    direct_cost: breakdown.direct_cost,
    grand_total: breakdown.grand_total,
  };
}

loadEnvLocal();
