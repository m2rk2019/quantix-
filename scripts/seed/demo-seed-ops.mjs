/**
 * Quantix V1 Demo Seed — apply / reset via Supabase service role.
 * Uses frozen Import Engine analyze (read-only). Does not modify importer source.
 */

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

import { createSupabaseAdmin, loadEnvLocal } from '../lib/load-env-local.mjs';
import {
  applyMegawideDemo,
  resetMegawideDemo,
  createAdminClient,
} from '../lib/megawide-demo-ops.mjs';
import { buildAndCacheImportSnapshots } from './analyze-fixtures.mjs';
import {
  DEMO_SEED_VERSION,
  DEMO_PASSWORD,
  DEMO_USERS,
  NIA_PROJECT,
  STREVI_PROJECT,
  COMMERCIAL_PROJECT_ID,
  COMPANY_TEMPLATE_ID,
  NIA_TENDER_ID,
  DEMO_MARKUPS,
  TRADE_CATEGORIES,
  UNITS_OF_MEASURE,
} from './demo-constants.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BATCH_SIZE = 40;

function chunk(array, size) {
  const batches = [];
  for (let i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

function roundCurrency(value) {
  return Math.round(Number(value) * 100) / 100;
}

function applyPercent(base, percent) {
  return roundCurrency(base * (percent / 100));
}

function calculateEstimateBreakdown(directCost, percentages) {
  const direct_cost = roundCurrency(directCost);
  const indirect_cost = applyPercent(
    direct_cost,
    percentages.indirect_cost_percent
  );
  const contingency = applyPercent(
    direct_cost + indirect_cost,
    percentages.contingency_percent
  );
  const markup = applyPercent(
    direct_cost + indirect_cost + contingency,
    percentages.markup_percent
  );
  const vat = applyPercent(
    direct_cost + indirect_cost + contingency + markup,
    percentages.vat_percent
  );
  return {
    direct_cost,
    indirect_cost,
    contingency,
    markup,
    vat,
    grand_total: roundCurrency(
      direct_cost + indirect_cost + contingency + markup + vat
    ),
  };
}

/** Deterministic UUID from namespace + index (version-4 shaped, hex only). */
export function demoId(namespaceHex8, seriesHex4, index) {
  const n = String(Math.max(0, Number(index))).padStart(12, '0');
  return `${namespaceHex8}-${seriesHex4}-4111-a111-${n}`;
}

function normalizeCategory(raw) {
  const c = String(raw || 'material').toLowerCase();
  if (
    c === 'material' ||
    c === 'labor' ||
    c === 'equipment' ||
    c === 'subcontract' ||
    c === 'service' ||
    c === 'productivity'
  ) {
    return c;
  }
  if (c.includes('lab')) return 'labor';
  if (c.includes('eq')) return 'equipment';
  if (c.includes('sub')) return 'subcontract';
  return 'material';
}

async function ensurePlanBoqResourceLinks() {
  const out = resolve(ROOT, 'scripts/_demo-seed-link-bundle.mjs');
  const build = spawnSync(
    'npx',
    [
      '--yes',
      'esbuild',
      'lib/smart-import/link-boq-resources.ts',
      '--bundle',
      '--platform=node',
      '--format=esm',
      `--outfile=${out}`,
      '--packages=external',
      '--alias:@=./',
    ],
    { cwd: ROOT, encoding: 'utf8', shell: true }
  );
  if (build.status !== 0) {
    throw new Error(`esbuild link failed: ${build.stderr || build.stdout}`);
  }
  const mod = await import(pathToFileURL(out).href + `?t=${Date.now()}`);
  return mod.planBoqResourceLinks;
}

async function createAuthenticatedClient(admin, owner) {
  const { supabaseUrl } = createSupabaseAdmin();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: owner.email,
  });

  if (linkError || !linkData.properties?.hashed_token) {
    throw new Error(
      linkError?.message ?? `Could not generate auth session for ${owner.email}`
    );
  }

  const bootstrap = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: sessionData, error: verifyError } = await bootstrap.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  });

  if (verifyError || !sessionData.session?.access_token) {
    throw new Error(
      verifyError?.message ?? `Could not authenticate seed user ${owner.email}`
    );
  }

  const client = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${sessionData.session.access_token}`,
      },
    },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await client.auth.setSession({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  });

  return client;
}

async function ensureDemoUsers(admin) {
  const usersByKey = {};

  for (const spec of DEMO_USERS) {
    const { data: listed, error: listError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listError) {
      throw new Error(`listUsers failed: ${listError.message}`);
    }

    let authUser = (listed?.users ?? []).find(
      (u) => u.email?.toLowerCase() === spec.email.toLowerCase()
    );

    if (!authUser) {
      const { data: created, error: createError } =
        await admin.auth.admin.createUser({
          email: spec.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: spec.full_name, demo_seed: true },
        });
      if (createError || !created?.user) {
        throw new Error(
          `Create demo user ${spec.email}: ${createError?.message ?? 'unknown'}`
        );
      }
      authUser = created.user;
    } else {
      const { error: updateError } = await admin.auth.admin.updateUserById(
        authUser.id,
        {
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: {
            ...(authUser.user_metadata ?? {}),
            full_name: spec.full_name,
            demo_seed: true,
          },
        }
      );
      if (updateError) {
        throw new Error(`Update demo user ${spec.email}: ${updateError.message}`);
      }
    }

    const profile = {
      id: authUser.id,
      email: spec.email,
      full_name: spec.full_name,
      role: spec.role,
    };

    const { data: existingProfile } = await admin
      .from('users')
      .select('id')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existingProfile) {
      const { error } = await admin
        .from('users')
        .update({
          email: spec.email,
          full_name: spec.full_name,
          role: spec.role,
          deleted_at: null,
        })
        .eq('id', authUser.id);
      if (error) {
        throw new Error(`Update profile ${spec.email}: ${error.message}`);
      }
    } else {
      const { error } = await admin.from('users').insert(profile);
      if (error) {
        throw new Error(`Insert profile ${spec.email}: ${error.message}`);
      }
    }

    usersByKey[spec.key] = { ...profile, label: spec.label };
  }

  return usersByKey;
}

async function deleteByIdPrefix(admin, table, prefixes) {
  const { data, error } = await admin.from(table).select('id');
  if (error) {
    // Table may not exist in older DBs — skip softly for optional tables
    if (/relation|does not exist|Could not find/i.test(error.message)) {
      return;
    }
    throw new Error(`Read ${table}: ${error.message}`);
  }

  const ids = (data ?? [])
    .map((r) => r.id)
    .filter((id) => prefixes.some((p) => String(id).startsWith(p)));

  for (const batch of chunk(ids, BATCH_SIZE)) {
    const { error: delError } = await admin.from(table).delete().in('id', batch);
    if (delError) {
      throw new Error(`Delete ${table}: ${delError.message}`);
    }
  }
}

async function hardDeleteProject(admin, projectId) {
  await admin
    .from('audit_log')
    .delete()
    .or(`project_id.eq.${projectId},entity_id.eq.${projectId}`);

  const { error } = await admin.from('projects').delete().eq('id', projectId);
  if (error && !/No rows|0 rows/i.test(error.message)) {
    // CASCADE should handle children; ignore missing project
    const { data } = await admin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .maybeSingle();
    if (data) {
      throw new Error(`Delete project ${projectId}: ${error.message}`);
    }
  }
}

export async function resetDemoSeed(admin = createAdminClient()) {
  loadEnvLocal();

  await hardDeleteProject(admin, NIA_PROJECT.id);
  await hardDeleteProject(admin, STREVI_PROJECT.id);
  await resetMegawideDemo(admin);

  await deleteByIdPrefix(admin, 'tender_submissions', ['d0e']);
  await deleteByIdPrefix(admin, 'master_templates', ['d0e']);
  await deleteByIdPrefix(admin, 'rate_library_items', ['d0e', 'e1d']);
  await deleteByIdPrefix(admin, 'company_resource_categories', ['d0e', 'e1d']);
  await deleteByIdPrefix(admin, 'company_units', ['d0e']);
  await deleteByIdPrefix(admin, 'company_suppliers', ['e1d']);

  return {
    cleared_projects: [NIA_PROJECT.id, STREVI_PROJECT.id, COMMERCIAL_PROJECT_ID],
    seed_version: DEMO_SEED_VERSION,
  };
}

async function seedCompanyDefaults(admin, db, ownerId) {
  const categoryRows = TRADE_CATEGORIES.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    resource_type: c.resource_type,
    description: `Demo seed trade category: ${c.name}`,
    is_active: true,
    created_by: ownerId,
    updated_by: ownerId,
  }));

  const { error: catError } = await db
    .from('company_resource_categories')
    .insert(categoryRows);
  if (catError) {
    throw new Error(`Trade categories: ${catError.message}`);
  }

  const { data: existingUnits, error: unitsReadError } = await admin
    .from('company_units')
    .select('id, code, symbol')
    .is('deleted_at', null);
  if (unitsReadError) {
    throw new Error(`Read company_units: ${unitsReadError.message}`);
  }

  const existingSymbols = new Set(
    (existingUnits ?? []).map((u) => String(u.symbol).toLowerCase())
  );
  const existingCodes = new Set(
    (existingUnits ?? []).map((u) => String(u.code).toUpperCase())
  );

  const unitRows = [];
  for (const [i, u] of UNITS_OF_MEASURE.entries()) {
    if (
      existingSymbols.has(u.symbol.toLowerCase()) ||
      existingCodes.has(u.code.toUpperCase())
    ) {
      continue;
    }
    unitRows.push({
      id: demoId('d0e90003', '0001', i + 1),
      code: u.code,
      symbol: u.symbol,
      name: u.name,
      description: `Demo seed unit of measure: ${u.name}`,
      is_active: true,
      created_by: ownerId,
      updated_by: ownerId,
    });
  }

  if (unitRows.length > 0) {
    const { error: unitError } = await admin.from('company_units').insert(unitRows);
    if (unitError) {
      throw new Error(`Units of measure: ${unitError.message}`);
    }
  }

  return {
    categories: categoryRows.length,
    units: UNITS_OF_MEASURE.length,
    units_inserted: unitRows.length,
  };
}

async function seedCompanyLibraryFromResources(db, ownerId, snapshots) {
  const seen = new Map();
  let index = 1;

  for (const snap of [snapshots.nia, snapshots.strevi]) {
    for (const row of snap.resource_rows ?? []) {
      const raw = String(row.code || row.resource_code || `RES-${index}`);
      const code = `DEMO-${raw}`.slice(0, 50);
      const key = code.toUpperCase();
      if (seen.has(key)) continue;

      const id = demoId('d0e90002', '0001', index);
      index += 1;
      seen.set(key, {
        id,
        code,
        description: String(row.description || code).slice(0, 500),
        unit: String(row.unit || 'item').slice(0, 20),
        unit_cost: Number(row.unit_cost ?? row.rate ?? 0),
        category: normalizeCategory(row.category || row.resource_type),
        is_active: true,
        created_by: ownerId,
        updated_by: ownerId,
      });
    }
  }

  // Guaranteed baseline unit-rate rows (one per trade category)
  for (const [i, cat] of TRADE_CATEGORIES.entries()) {
    const code = `DEMO-UR-${cat.code}`;
    if (seen.has(code)) continue;
    const id = demoId('d0e90002', '0002', i + 1);
    seen.set(code, {
      id,
      code,
      description: `Demo unit rate — ${cat.name}`,
      unit: 'lot',
      unit_cost: 1000 * (i + 1),
      category: cat.resource_type,
      is_active: true,
      created_by: ownerId,
      updated_by: ownerId,
    });
  }

  const rows = [...seen.values()];
  for (const batch of chunk(rows, BATCH_SIZE)) {
    const { error } = await db.from('rate_library_items').insert(batch);
    if (error) {
      throw new Error(`Company rate_library_items: ${error.message}`);
    }
  }

  return { items: rows.length, byCode: seen };
}

async function insertImportedProject({
  admin,
  db,
  ownerId,
  projectMeta,
  snapshot,
  planBoqResourceLinks,
  companyByCode,
}) {
  const projectId = projectMeta.id;
  const percentages = { ...DEMO_MARKUPS };

  const { error: projectError } = await db.from('projects').insert({
    id: projectId,
    project_code: projectMeta.code,
    project_name: projectMeta.name,
    client_name: projectMeta.client,
    location: projectMeta.location,
    status: projectMeta.status === 'approved' ? 'in_progress' : 'draft',
    created_by: ownerId,
    updated_by: ownerId,
  });
  if (projectError) {
    throw new Error(`${projectMeta.code} project: ${projectError.message}`);
  }

  const { error: detailsError } = await db.from('project_details').insert({
    project_id: projectId,
    description: `${projectMeta.name} — Quantix V1 demo seed (Import Engine v1.0 validated).`,
    currency: 'PHP',
    project_type: 'residential',
    indirect_cost_percent: percentages.indirect_cost_percent,
    contingency_percent: percentages.contingency_percent,
    markup_percent: percentages.markup_percent,
    vat_percent: percentages.vat_percent,
    measurement_system: 'metric',
    default_unit_system: 'metric_si',
    rounding_rule: 'half_up',
    is_benchmark: projectMeta.status === 'approved',
    created_by: ownerId,
    updated_by: ownerId,
  });
  if (detailsError) {
    throw new Error(`${projectMeta.code} details: ${detailsError.message}`);
  }

  const companyLibrary = [...companyByCode.values()].map((row) => ({
    id: row.id,
    code: row.code,
    description: row.description,
    category: row.category,
    unit_cost: Number(row.unit_cost),
  }));

  const linkPlan = planBoqResourceLinks({
    boqRows: snapshot.boq_rows.map((r) => ({
      ...r,
      // planBoqResourceLinks expects original shape fields
    })),
    resourceRows: snapshot.resource_rows ?? [],
    companyLibrary,
  });

  const ns = projectId.slice(0, 8);
  const tempToId = new Map();
  const sortedWbs = [...snapshot.wbs_nodes].sort(
    (a, b) => a.level - b.level || a.sort_order - b.sort_order
  );

  let wbsIndex = 1;
  const levels = [...new Set(sortedWbs.map((n) => n.level))].sort(
    (a, b) => a - b
  );
  for (const level of levels) {
    const levelNodes = sortedWbs.filter((n) => n.level === level);
    const rows = levelNodes.map((node) => {
      const id = demoId(ns, 'a101', wbsIndex);
      wbsIndex += 1;
      tempToId.set(node.temp_id, id);
      return {
        id,
        project_id: projectId,
        parent_id: node.parent_temp_id
          ? (tempToId.get(node.parent_temp_id) ?? null)
          : null,
        level: node.level,
        wbs_code: node.wbs_code,
        description: node.description,
        sort_order: node.sort_order,
        created_by: ownerId,
        updated_by: ownerId,
      };
    });
    for (const batch of chunk(rows, BATCH_SIZE)) {
      const { error } = await admin.from('wbs').insert(batch);
      if (error) {
        throw new Error(`${projectMeta.code} WBS: ${error.message}`);
      }
    }
  }

  const resourceCodeToId = new Map();
  let rateIndex = 1;
  const rateRows = [];
  for (const item of linkPlan.resources ?? []) {
    const code = String(item.code).slice(0, 50);
    const id = demoId(ns, 'a301', rateIndex);
    rateIndex += 1;
    resourceCodeToId.set(code, id);
    rateRows.push({
      id,
      project_id: projectId,
      code,
      description: String(item.description).slice(0, 500),
      unit: item.unit || 'item',
      unit_cost: Number(item.unit_cost ?? 0),
      category: normalizeCategory(item.category),
      source_company_item_id: item.source_company_item_id ?? null,
      source_unit_cost: item.source_company_item_id
        ? Number(item.unit_cost ?? 0)
        : null,
      is_active: true,
      created_by: ownerId,
      updated_by: ownerId,
    });
  }
  for (const batch of chunk(rateRows, BATCH_SIZE)) {
    const { error } = await admin.from('project_rate_library_items').insert(batch);
    if (error) {
      throw new Error(`${projectMeta.code} project rates: ${error.message}`);
    }
  }

  const linksByItem = new Map(
    (linkPlan.links ?? []).map((entry) => [entry.boq_item_number, entry])
  );

  let boqIndex = 1;
  let lineIndex = 1;
  const boqRows = [];
  const analysisRows = [];

  for (const row of snapshot.boq_rows) {
    const wbsId = tempToId.get(row.wbs_temp_id);
    if (!wbsId) continue;

    const quantity = Number(row.quantity) || 0;
    const rawAmount = Number(row.amount);
    const rawRate = Number(row.unit_rate);
    const amount = roundCurrency(
      Number.isFinite(rawAmount)
        ? rawAmount
        : quantity * (Number.isFinite(rawRate) ? rawRate : 0)
    );
    const unitRate = roundCurrency(
      Number.isFinite(rawRate) && rawRate !== 0
        ? rawRate
        : quantity > 0
          ? amount / quantity
          : 0
    );
    const boqId = demoId(ns, 'a201', boqIndex);
    boqIndex += 1;

    const itemCode = String(row.item_number || `ITEM-${boqIndex}`).slice(0, 50);
    boqRows.push({
      id: boqId,
      project_id: projectId,
      wbs_id: wbsId,
      item_code: itemCode,
      description: String(row.description).slice(0, 1000),
      unit: row.unit || 'item',
      quantity,
      material_rate: unitRate,
      labor_rate: 0,
      equipment_rate: 0,
      subcontract_rate: 0,
      other_cost_rate: 0,
      total_rate: unitRate,
      total_amount: amount,
      created_by: ownerId,
      updated_by: ownerId,
    });

    const link = linksByItem.get(row.item_number);
    const projectLibraryItemId = link
      ? resourceCodeToId.get(link.resource_code) ?? null
      : null;

    if (projectLibraryItemId && link) {
      const lineId = demoId(ns, 'a401', lineIndex);
      lineIndex += 1;
      analysisRows.push({
        id: lineId,
        boq_item_id: boqId,
        project_library_item_id: projectLibraryItemId,
        category: normalizeCategory(link.category),
        resource_name: String(row.description).slice(0, 200),
        unit: row.unit || 'item',
        consumption: link.consumption,
        unit_cost: link.unit_cost,
        waste_percent: 0,
        productivity: link.productivity ?? null,
        amount: link.amount,
        sort_order: 0,
      });
    }
  }

  for (const batch of chunk(boqRows, BATCH_SIZE)) {
    const { error } = await admin.from('boq_items').insert(batch);
    if (error) {
      throw new Error(`${projectMeta.code} BOQ: ${error.message}`);
    }
  }

  for (const batch of chunk(analysisRows, BATCH_SIZE)) {
    const { error: lineError } = await admin
      .from('boq_rate_analysis_lines')
      .insert(batch);
    if (lineError) {
      throw new Error(`${projectMeta.code} rate line: ${lineError.message}`);
    }
  }

  const insertedDirect = roundCurrency(
    boqRows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0)
  );
  // Prefer engine golden when within 1 PHP (per-line float noise).
  const directForEstimate =
    Math.abs(insertedDirect - snapshot.leaf_sum_rounded) <= 1
      ? snapshot.leaf_sum_rounded
      : insertedDirect;
  const breakdown = calculateEstimateBreakdown(directForEstimate, percentages);

  const { error: summaryError } = await db.from('estimate_summary').insert({
    project_id: projectId,
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
    throw new Error(`${projectMeta.code} estimate: ${summaryError.message}`);
  }

  if (projectMeta.status === 'approved') {
    // Status transitions must run as authenticated user (DB triggers use auth.uid()).
    const { error: statusError } = await db
      .from('projects')
      .update({ status: 'approved', updated_by: ownerId })
      .eq('id', projectId);
    if (statusError) {
      throw new Error(`${projectMeta.code} approve: ${statusError.message}`);
    }
  }

  return {
    project_id: projectId,
    boq_count: boqIndex - 1,
    wbs_count: wbsIndex - 1,
    rate_count: rateIndex - 1,
    breakdown,
    fingerprint: snapshot.fingerprint,
  };
}

async function seedNiaTender(db, ownerId, niaResult, usersByKey) {
  const snapshot = {
    version: 1,
    demo_seed: DEMO_SEED_VERSION,
    project: {
      id: NIA_PROJECT.id,
      code: NIA_PROJECT.code,
      name: NIA_PROJECT.name,
    },
    estimate: niaResult.breakdown,
    boq_count: niaResult.boq_count,
    wbs_count: niaResult.wbs_count,
    prepared_by: usersByKey.estimator?.full_name ?? 'Demo Estimator',
    checked_by: usersByKey.reviewer?.full_name ?? 'Demo Reviewer',
    approved_by: usersByKey.approver?.full_name ?? 'Demo Approver',
  };

  const { error } = await db.from('tender_submissions').insert({
    id: NIA_TENDER_ID,
    project_id: NIA_PROJECT.id,
    version: 1,
    title: `${NIA_PROJECT.name} — Tender Package`,
    status: 'generated',
    enabled_sections: [
      'cover_page',
      'executive_summary',
      'estimate_summary',
      'boq',
      'wbs',
    ],
    branding: { company_name: 'Quantix Demo', currency: 'PHP' },
    package_snapshot: snapshot,
    prepared_by_name: snapshot.prepared_by,
    checked_by_name: snapshot.checked_by,
    approved_by_name: snapshot.approved_by,
    generated_by: ownerId,
    notes: 'Demo seed tender package (NIA approved estimate).',
  });

  if (error) {
    throw new Error(`NIA tender: ${error.message}`);
  }
}

async function seedMasterTemplate(db, ownerId, niaResult, niaSnapshot) {
  const templateSnapshot = {
    demo_seed: DEMO_SEED_VERSION,
    source: NIA_PROJECT.code,
    markups: DEMO_MARKUPS,
    wbs: (niaSnapshot.wbs_nodes ?? []).map((n) => ({
      wbs_code: n.wbs_code,
      description: n.description,
      level: n.level,
      sort_order: n.sort_order,
    })),
    boq_sample: (niaSnapshot.boq_rows ?? []).slice(0, 25).map((r) => ({
      item_number: r.item_number,
      description: r.description,
      unit: r.unit,
      quantity: r.quantity,
    })),
    fingerprint: niaSnapshot.fingerprint,
  };

  const templateRow = {
    id: COMPANY_TEMPLATE_ID,
    template_key: 'demo-nia-rental-housing',
    template_version: '1.0.0',
    display_name: 'Demo — NIA 4PH Rental Housing',
    description:
      'Company master template captured from NIA demo seed (Import Engine v1.0).',
    source_project_id: NIA_PROJECT.id,
    snapshot: templateSnapshot,
    wbs_count: niaResult.wbs_count,
    boq_count: niaResult.boq_count,
    resource_count: niaResult.rate_count,
    is_active: true,
    created_by: ownerId,
  };

  let { error } = await db.from('master_templates').insert(templateRow);
  // Older DBs may lack template_version / created_from_project_id — retry minimal row.
  if (error && /column|schema cache/i.test(error.message)) {
    ({ error } = await db.from('master_templates').insert({
      id: COMPANY_TEMPLATE_ID,
      template_key: 'demo-nia-rental-housing',
      display_name: 'Demo — NIA 4PH Rental Housing',
      description: templateRow.description,
      source_project_id: NIA_PROJECT.id,
      snapshot: templateSnapshot,
      wbs_count: niaResult.wbs_count,
      boq_count: niaResult.boq_count,
      resource_count: niaResult.rate_count,
      is_active: true,
      created_by: ownerId,
    }));
  }

  if (error) {
    throw new Error(`Master template: ${error.message}`);
  }
}

async function assertProjectCounts(admin, projectId, expectedBoq, expectedWbs, expectedDirect) {
  const [wbs, boq, summary] = await Promise.all([
    admin
      .from('wbs')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .is('deleted_at', null),
    admin
      .from('boq_items')
      .select('total_amount', { count: 'exact' })
      .eq('project_id', projectId)
      .is('deleted_at', null),
    admin
      .from('estimate_summary')
      .select('direct_cost, grand_total')
      .eq('project_id', projectId)
      .maybeSingle(),
  ]);

  if (wbs.error) throw new Error(wbs.error.message);
  if (boq.error) throw new Error(boq.error.message);
  if (summary.error) throw new Error(summary.error.message);

  if ((wbs.count ?? 0) !== expectedWbs) {
    throw new Error(
      `WBS count for ${projectId}: expected ${expectedWbs}, got ${wbs.count}`
    );
  }
  if ((boq.count ?? 0) !== expectedBoq) {
    throw new Error(
      `BOQ count for ${projectId}: expected ${expectedBoq}, got ${boq.count}`
    );
  }

  const sum = (boq.data ?? []).reduce(
    (s, r) => s + Number(r.total_amount || 0),
    0
  );
  if (Math.abs(roundCurrency(sum) - expectedDirect) > 1) {
    throw new Error(
      `Direct cost for ${projectId}: expected ${expectedDirect}, got ${roundCurrency(sum)}`
    );
  }
  if (!summary.data) {
    throw new Error(`Missing estimate_summary for ${projectId}`);
  }
  if (Math.abs(Number(summary.data.direct_cost) - expectedDirect) > 1) {
    throw new Error(
      `estimate_summary.direct_cost for ${projectId}: expected ${expectedDirect}, got ${summary.data.direct_cost}`
    );
  }
}

export async function applyDemoSeed(admin = createAdminClient()) {
  loadEnvLocal();

  console.log(`[demo-seed ${DEMO_SEED_VERSION}] Analyzing frozen fixtures…`);
  const snapshots = await buildAndCacheImportSnapshots();
  const planBoqResourceLinks = await ensurePlanBoqResourceLinks();

  console.log('[demo-seed] Resetting previous demo data…');
  await resetDemoSeed(admin);

  console.log('[demo-seed] Provisioning demo users…');
  const usersByKey = await ensureDemoUsers(admin);
  const owner = usersByKey.super_admin;
  const ownerId = owner.id;
  const db = await createAuthenticatedClient(admin, owner);

  console.log('[demo-seed] Company defaults…');
  const companyMeta = await seedCompanyDefaults(admin, db, ownerId);
  const library = await seedCompanyLibraryFromResources(db, ownerId, snapshots);

  console.log('[demo-seed] NIA project…');
  const niaResult = await insertImportedProject({
    admin,
    db,
    ownerId,
    projectMeta: NIA_PROJECT,
    snapshot: snapshots.nia,
    planBoqResourceLinks,
    companyByCode: library.byCode,
  });

  console.log('[demo-seed] STREVI project…');
  const streviResult = await insertImportedProject({
    admin,
    db,
    ownerId,
    projectMeta: STREVI_PROJECT,
    snapshot: snapshots.strevi,
    planBoqResourceLinks,
    companyByCode: library.byCode,
  });

  console.log('[demo-seed] NIA tender + master template…');
  await seedNiaTender(db, ownerId, niaResult, usersByKey);
  await seedMasterTemplate(db, ownerId, niaResult, snapshots.nia);

  console.log('[demo-seed] Commercial building (Megawide)…');
  const commercial = await applyMegawideDemo(admin);

  // Friendly demo label (keeps Megawide code/ID for verify:megawide-office).
  {
    const { error: renameError } = await db
      .from('projects')
      .update({
        project_name: 'Sample Commercial Building Demo Project',
        updated_by: ownerId,
      })
      .eq('id', COMMERCIAL_PROJECT_ID);
    if (renameError) {
      // Non-fatal if RLS blocks rename for this actor — seed still valid.
      console.warn(`[demo-seed] Commercial rename skipped: ${renameError.message}`);
    }
  }

  const { count: companyLibraryCount } = await admin
    .from('rate_library_items')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null)
    .eq('is_active', true);

  console.log('[demo-seed] Verifying counts…');
  await assertProjectCounts(
    admin,
    NIA_PROJECT.id,
    NIA_PROJECT.expected_boq,
    snapshots.nia.wbs_count,
    NIA_PROJECT.expected_direct
  );
  await assertProjectCounts(
    admin,
    STREVI_PROJECT.id,
    STREVI_PROJECT.expected_boq,
    snapshots.strevi.wbs_count,
    STREVI_PROJECT.expected_direct
  );

  const { data: niaStatus } = await admin
    .from('projects')
    .select('status')
    .eq('id', NIA_PROJECT.id)
    .single();
  const { data: streviStatus } = await admin
    .from('projects')
    .select('status')
    .eq('id', STREVI_PROJECT.id)
    .single();

  if (niaStatus?.status !== 'approved') {
    throw new Error(`NIA status expected approved, got ${niaStatus?.status}`);
  }
  if (streviStatus?.status !== 'draft') {
    throw new Error(`STREVI status expected draft, got ${streviStatus?.status}`);
  }

  const contentHash = createHash('sha256')
    .update(
      [
        snapshots.nia.fingerprint,
        snapshots.strevi.fingerprint,
        String(niaResult.boq_count),
        String(streviResult.boq_count),
        DEMO_SEED_VERSION,
      ].join('|')
    )
    .digest('hex');

  return {
    seed_version: DEMO_SEED_VERSION,
    content_hash: contentHash,
    users: DEMO_USERS.map((u) => ({
      email: u.email,
      role: u.role,
      label: u.label,
      password: DEMO_PASSWORD,
    })),
    company: {
      trade_categories: companyMeta.categories,
      units_of_measure: UNITS_OF_MEASURE,
      resource_library_items: companyLibraryCount ?? library.items,
      master_template_id: COMPANY_TEMPLATE_ID,
    },
    projects: {
      nia: {
        id: NIA_PROJECT.id,
        code: NIA_PROJECT.code,
        name: NIA_PROJECT.name,
        status: 'approved',
        boq_items: niaResult.boq_count,
        wbs_nodes: niaResult.wbs_count,
        direct_cost: niaResult.breakdown.direct_cost,
        grand_total: niaResult.breakdown.grand_total,
        tender_id: NIA_TENDER_ID,
        engine_wbs_note:
          'WBS count is Import Engine buildWbsFromBoq golden (107), not a UI-only subset.',
      },
      strevi: {
        id: STREVI_PROJECT.id,
        code: STREVI_PROJECT.code,
        name: STREVI_PROJECT.name,
        status: 'draft',
        boq_items: streviResult.boq_count,
        wbs_nodes: streviResult.wbs_count,
        direct_cost: streviResult.breakdown.direct_cost,
        grand_total: streviResult.breakdown.grand_total,
        engine_wbs_note:
          'WBS count is Import Engine buildWbsFromBoq golden (125).',
      },
      commercial: {
        id: commercial.project_id,
        code: commercial.project_code,
        name: 'Sample Commercial Building Demo Project',
        status: 'in_progress',
        boq_items: commercial.boq_item_count,
        wbs_nodes: commercial.wbs_node_count,
        direct_cost: commercial.direct_cost,
        grand_total: commercial.grand_total,
      },
    },
  };
}

loadEnvLocal();
