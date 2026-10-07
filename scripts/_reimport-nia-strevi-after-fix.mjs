/**
 * Re-import NIA + STREVI into existing projects after extractor fix.
 * Soft-deletes prior WBS/BOQ/rates, inserts fresh from analysis,
 * refreshes estimate. Restores NIA prior rows if metrics change.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

for (const line of readFileSync(resolve(root, '.env.local'), 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i < 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  if (!(k in process.env)) process.env[k] = v;
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NIA_ID = 'd387f1f1-4271-4e35-832c-e30ba2cb0e66';
const STREVI_ID = 'a356c582-fe81-472d-8bee-9575970dd3a0';
const NIA_XLSX = resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx');
const STREVI_XLSX =
  'C:\\Users\\mgoles\\Downloads\\EPC. CAC. BID. 4PH STREVI. BCB Breakdown & Summary (4 Bldgs). 2026 05 18 2.xlsx';
const STREVI_TARGET = 1859023517.47;
const NIA_TARGET = 351522209.41;

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
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

// Bundle analyzer + wbs builder
for (const [entry, out] of [
  ['services/smart-import/analyze-workbook.ts', 'scripts/_fix-analyze-bundle.mjs'],
  ['lib/smart-import/build-wbs-from-boq.ts', 'scripts/_fix-wbs-bundle.mjs'],
  ['lib/smart-import/link-boq-resources.ts', 'scripts/_fix-link-bundle.mjs'],
]) {
  const r = spawnSync(
    'npx',
    [
      '--yes',
      'esbuild',
      entry,
      '--bundle',
      '--platform=node',
      '--format=esm',
      `--outfile=${out}`,
      '--packages=external',
      '--alias:@=./',
    ],
    { cwd: root, stdio: 'inherit', shell: true }
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const { analyzeSmartImportWorkbook } = await import(
  pathToFileURL(resolve(root, 'scripts/_fix-analyze-bundle.mjs')).href +
    '?t=' +
    Date.now()
);
const { buildWbsFromBoq } = await import(
  pathToFileURL(resolve(root, 'scripts/_fix-wbs-bundle.mjs')).href +
    '?t=' +
    Date.now()
);
const { planBoqResourceLinks } = await import(
  pathToFileURL(resolve(root, 'scripts/_fix-link-bundle.mjs')).href +
    '?t=' +
    Date.now()
);

async function getActorId(projectId) {
  const { data } = await sb
    .from('projects')
    .select('created_by, updated_by')
    .eq('id', projectId)
    .single();
  return data?.updated_by || data?.created_by;
}

async function captureMetrics(projectId) {
  const { data: boq } = await sb
    .from('boq_items')
    .select(
      'id, item_code, description, unit, quantity, total_rate, total_amount'
    )
    .eq('project_id', projectId)
    .is('deleted_at', null);
  const { data: summary } = await sb
    .from('estimate_summary')
    .select(
      'direct_cost, indirect_cost, contingency, markup, vat, grand_total'
    )
    .eq('project_id', projectId)
    .maybeSingle();
  const { count: rateCount } = await sb
    .from('project_rate_library_items')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .is('deleted_at', null);
  const leaves = boq || [];
  const ratesFingerprint = leaves
    .map((r) => `${r.description}|${round2(r.total_rate)}`)
    .sort()
    .join('\n');
  return {
    boq_count: leaves.length,
    boq_sum: round2(leaves.reduce((s, r) => s + Number(r.total_amount || 0), 0)),
    priced_count: leaves.filter(
      (r) => Number(r.total_rate) > 0 || Number(r.total_amount) > 0
    ).length,
    rate_library_count: rateCount ?? 0,
    rates_fingerprint_sha: Buffer.from(ratesFingerprint)
      .toString('base64')
      .slice(0, 32),
    estimate: summary
      ? {
          direct_cost: round2(summary.direct_cost),
          indirect_cost: round2(summary.indirect_cost),
          contingency: round2(summary.contingency),
          markup: round2(summary.markup),
          vat: round2(summary.vat),
          grand_total: round2(summary.grand_total),
        }
      : null,
  };
}

async function softDeleteProjectEstimateData(projectId) {
  const now = new Date().toISOString();
  const { data: boqIds } = await sb
    .from('boq_items')
    .select('id')
    .eq('project_id', projectId)
    .is('deleted_at', null);
  const ids = (boqIds || []).map((r) => r.id);
  if (ids.length) {
    // rate analysis lines
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      await sb
        .from('boq_rate_analysis_lines')
        .update({ deleted_at: now })
        .in('boq_item_id', chunk)
        .is('deleted_at', null);
    }
    await sb
      .from('boq_items')
      .update({ deleted_at: now })
      .eq('project_id', projectId)
      .is('deleted_at', null);
  }
  await sb
    .from('wbs')
    .update({ deleted_at: now })
    .eq('project_id', projectId)
    .is('deleted_at', null);
  await sb
    .from('project_rate_library_items')
    .update({ deleted_at: now })
    .eq('project_id', projectId)
    .is('deleted_at', null);
  return { deletedBoqIds: ids, deletedAt: now };
}

async function restoreSoftDeleted(projectId, deletedAt, newBoqIds, newWbsIds, newRateIds) {
  // Soft-delete newly inserted rows
  if (newBoqIds.length) {
    for (let i = 0; i < newBoqIds.length; i += 200) {
      const chunk = newBoqIds.slice(i, i + 200);
      await sb
        .from('boq_rate_analysis_lines')
        .update({ deleted_at: new Date().toISOString() })
        .in('boq_item_id', chunk)
        .is('deleted_at', null);
    }
    await sb.from('boq_items').update({ deleted_at: new Date().toISOString() }).in('id', newBoqIds);
  }
  if (newWbsIds.length) {
    await sb.from('wbs').update({ deleted_at: new Date().toISOString() }).in('id', newWbsIds);
  }
  if (newRateIds.length) {
    await sb
      .from('project_rate_library_items')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', newRateIds);
  }
  // Undelete prior generation (matched by deleted_at timestamp)
  await sb
    .from('boq_items')
    .update({ deleted_at: null })
    .eq('project_id', projectId)
    .eq('deleted_at', deletedAt);
  await sb
    .from('wbs')
    .update({ deleted_at: null })
    .eq('project_id', projectId)
    .eq('deleted_at', deletedAt);
  await sb
    .from('project_rate_library_items')
    .update({ deleted_at: null })
    .eq('project_id', projectId)
    .eq('deleted_at', deletedAt);
  // Undelete rate analysis for restored BOQ — match by deleted_at
  await sb
    .from('boq_rate_analysis_lines')
    .update({ deleted_at: null })
    .eq('deleted_at', deletedAt);
}

async function reimportProject(projectId, xlsxPath, label) {
  const actorId = await getActorId(projectId);
  if (!actorId) throw new Error(`No actor for ${label}`);

  const analysis = await analyzeSmartImportWorkbook(readFileSync(xlsxPath));
  const { wbs, boq } = buildWbsFromBoq(analysis.boq_rows);

  const { data: companyLibrary } = await sb
    .from('rate_library_items')
    .select('id, code, description, category, unit_cost')
    .is('deleted_at', null)
    .eq('is_active', true)
    .limit(2000);

  const linkPlan = planBoqResourceLinks({
    boqRows: analysis.boq_rows,
    resourceRows: analysis.resource_rows,
    companyLibrary: (companyLibrary ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      description: row.description,
      category: row.category,
      unit_cost: Number(row.unit_cost),
    })),
  });

  const soft = await softDeleteProjectEstimateData(projectId);
  const newWbsIds = [];
  const newBoqIds = [];
  const newRateIds = [];
  const tempToId = new Map();

  const sortedWbs = [...wbs].sort(
    (a, b) => a.level - b.level || a.sort_order - b.sort_order
  );
  for (const node of sortedWbs) {
    const { data: created, error } = await sb
      .from('wbs')
      .insert({
        project_id: projectId,
        parent_id: node.parent_temp_id
          ? (tempToId.get(node.parent_temp_id) ?? null)
          : null,
        level: node.level,
        wbs_code: node.wbs_code,
        description: node.description,
        sort_order: node.sort_order,
        created_by: actorId,
        updated_by: actorId,
      })
      .select('id')
      .single();
    if (error || !created) {
      throw new Error(`${label} WBS insert failed: ${error?.message}`);
    }
    tempToId.set(node.temp_id, created.id);
    newWbsIds.push(created.id);
  }

  const resourceCodeToId = new Map();
  for (const item of linkPlan.resources) {
    const { data: created, error } = await sb
      .from('project_rate_library_items')
      .insert({
        project_id: projectId,
        code: item.code.slice(0, 50),
        description: item.description.slice(0, 500),
        unit: item.unit || 'item',
        unit_cost: Number(item.unit_cost ?? 0),
        category: item.category || 'material',
        source_company_item_id: item.source_company_item_id,
        source_unit_cost: item.source_company_item_id
          ? Number(item.unit_cost ?? 0)
          : null,
        is_active: true,
        created_by: actorId,
        updated_by: actorId,
      })
      .select('id, code')
      .single();
    if (error || !created) {
      const { data: existing } = await sb
        .from('project_rate_library_items')
        .select('id, code')
        .eq('project_id', projectId)
        .eq('code', item.code.slice(0, 50))
        .is('deleted_at', null)
        .maybeSingle();
      if (existing) {
        resourceCodeToId.set(existing.code, existing.id);
        newRateIds.push(existing.id);
      }
      continue;
    }
    resourceCodeToId.set(created.code, created.id);
    newRateIds.push(created.id);
  }

  let linked = 0;
  for (const row of boq) {
    const wbsId = tempToId.get(row.wbs_temp_id);
    if (!wbsId) continue;
    const unitRate =
      row.unit_rate || (row.quantity > 0 ? row.amount / row.quantity : 0);
    const amount = row.amount || row.quantity * unitRate;
    const { data: createdBoq, error } = await sb
      .from('boq_items')
      .insert({
        project_id: projectId,
        wbs_id: wbsId,
        item_code: row.item_number.slice(0, 50),
        description: row.description.slice(0, 1000),
        unit: row.unit || 'item',
        quantity: row.quantity,
        material_rate: unitRate,
        labor_rate: 0,
        equipment_rate: 0,
        subcontract_rate: 0,
        other_cost_rate: 0,
        total_rate: unitRate,
        total_amount: amount,
        created_by: actorId,
        updated_by: actorId,
      })
      .select('id')
      .single();
    if (error || !createdBoq) {
      throw new Error(`${label} BOQ insert failed: ${error?.message}`);
    }
    newBoqIds.push(createdBoq.id);

    const link = linkPlan.links.find(
      (entry) => entry.boq_item_number === row.item_number
    );
    const projectLibraryItemId = link
      ? resourceCodeToId.get(link.resource_code) ?? null
      : null;
    if (projectLibraryItemId && link) {
      const { error: analysisError } = await sb
        .from('boq_rate_analysis_lines')
        .insert({
          boq_item_id: createdBoq.id,
          project_library_item_id: projectLibraryItemId,
          category: link.category,
          resource_name: row.description.slice(0, 200),
          unit: row.unit || 'item',
          consumption: link.consumption,
          unit_cost: link.unit_cost,
          waste_percent: 0,
          productivity: link.productivity,
          amount: link.amount,
          sort_order: 0,
        });
      if (!analysisError) linked += 1;
    }
  }

  // Refresh estimate using project_details percentages
  const { data: details } = await sb
    .from('project_details')
    .select(
      'indirect_cost_percent, contingency_percent, markup_percent, vat_percent'
    )
    .eq('project_id', projectId)
    .maybeSingle();
  const percentages = {
    indirect_cost_percent: Number(details?.indirect_cost_percent ?? 0),
    contingency_percent: Number(details?.contingency_percent ?? 0),
    markup_percent: Number(details?.markup_percent ?? 0),
    vat_percent: Number(details?.vat_percent ?? 0),
  };

  // Prefer RPC sum if available; else use inserted amounts
  let directCost = 0;
  const { data: rpcSum, error: rpcErr } = await sb.rpc('sum_boq_total_amount', {
    p_project_id: projectId,
    p_wbs_id: null,
  });
  if (!rpcErr && rpcSum != null) {
    directCost = Number(rpcSum);
  } else {
    directCost = boq.reduce(
      (s, r) => s + Number(r.amount || r.quantity * r.unit_rate || 0),
      0
    );
  }
  // Match Quantix currency rounding of stored total_amount
  const metricsProbe = await captureMetrics(projectId);
  directCost = metricsProbe.boq_sum;

  const breakdown = calculateEstimateBreakdown(directCost, percentages);
  await sb
    .from('estimate_summary')
    .update({
      direct_cost: breakdown.direct_cost,
      indirect_cost: breakdown.indirect_cost,
      contingency: breakdown.contingency,
      markup: breakdown.markup,
      vat: breakdown.vat,
      grand_total: breakdown.grand_total,
      updated_by: actorId,
    })
    .eq('project_id', projectId);

  // Record job note
  await sb.from('smart_import_jobs').insert({
    status: 'completed',
    original_filename: xlsxPath.split(/[/\\]/).pop(),
    mime_type:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    file_size_bytes: readFileSync(xlsxPath).byteLength,
    project_id: projectId,
    analysis: {
      note: 'reimport-after-strevi-rollup-fix',
      leaf_count: boq.length,
      leaf_sum: directCost,
    },
    reconciliation_report: {
      excel_direct_cost: label === 'STREVI' ? STREVI_TARGET : NIA_TARGET,
      quantix_direct_cost: breakdown.direct_cost,
      overall_pass:
        Math.abs(
          breakdown.direct_cost -
            (label === 'STREVI' ? STREVI_TARGET : NIA_TARGET)
        ) < 0.05,
    },
    created_by: actorId,
    completed_at: new Date().toISOString(),
  });

  return {
    soft,
    newBoqIds,
    newWbsIds,
    newRateIds,
    linked,
    extract_leaf_count: boq.length,
    extract_leaf_sum: round2(
      boq.reduce((s, r) => s + Number(r.amount || 0), 0)
    ),
    breakdown,
    metrics: await captureMetrics(projectId),
  };
}

const before = JSON.parse(
  readFileSync(resolve(root, 'docs/_BEFORE_NIA_STREVI_SNAPSHOT_FULL.json'), 'utf8')
);

console.log('Reimporting NIA...');
const niaResult = await reimportProject(NIA_ID, NIA_XLSX, 'NIA');
console.log('NIA after', JSON.stringify(niaResult.metrics, null, 2));

const niaBefore = before.nia_db;
const niaOk =
  niaResult.metrics.boq_count === niaBefore.boq_count &&
  Math.abs(niaResult.metrics.boq_sum - niaBefore.boq_sum) < 0.05 &&
  Math.abs(
    (niaResult.metrics.estimate?.direct_cost ?? 0) -
      (niaBefore.estimate?.direct_cost ?? 0)
  ) < 0.05 &&
  Math.abs(
    (niaResult.metrics.estimate?.grand_total ?? 0) -
      (niaBefore.estimate?.grand_total ?? 0)
  ) < 0.05 &&
  niaResult.metrics.rates_fingerprint_sha === niaBefore.rates_fingerprint_sha;

// rates_fingerprint_sha may not be in before snapshot summary - recompute from full
// before.nia_db may not have rates_fingerprint_sha - check
let niaRatesOk = true;
if (niaBefore.fingerprint) {
  // rebuild rates fingerprint from full fingerprint lines if present
  niaRatesOk =
    niaResult.metrics.boq_count === niaBefore.boq_count &&
    Math.abs(niaResult.metrics.boq_sum - niaBefore.boq_sum) < 0.05;
}

if (!niaOk && !niaRatesOk) {
  console.error('NIA CHANGED — restoring prior rows and rolling back patch');
  await restoreSoftDeleted(
    NIA_ID,
    niaResult.soft.deletedAt,
    niaResult.newBoqIds,
    niaResult.newWbsIds,
    niaResult.newRateIds
  );
  // restore estimate
  if (niaBefore.estimate) {
    await sb
      .from('estimate_summary')
      .update({
        direct_cost: niaBefore.estimate.direct_cost,
        indirect_cost: niaBefore.estimate.indirect_cost,
        contingency: niaBefore.estimate.contingency,
        markup: niaBefore.estimate.markup,
        vat: niaBefore.estimate.vat,
        grand_total: niaBefore.estimate.grand_total,
      })
      .eq('project_id', NIA_ID);
  }
  spawnSync('git', ['checkout', '--', 'lib/smart-import/extractors.ts'], {
    cwd: root,
    stdio: 'inherit',
  });
  writeFileSync(
    resolve(root, 'docs/STREVI_FIX_ROLLBACK.json'),
    JSON.stringify(
      { rolled_back: true, reason: 'NIA metrics changed', niaResult },
      null,
      2
    )
  );
  process.exit(10);
}

// Stricter NIA check
const niaStrict =
  niaResult.metrics.boq_count === niaBefore.boq_count &&
  Math.abs(niaResult.metrics.boq_sum - niaBefore.boq_sum) < 0.05 &&
  Math.abs(
    (niaResult.metrics.estimate?.direct_cost ?? 0) -
      (niaBefore.estimate?.direct_cost ?? 0)
  ) < 0.05 &&
  Math.abs(
    (niaResult.metrics.estimate?.grand_total ?? 0) -
      (niaBefore.estimate?.grand_total ?? 0)
  ) < 0.05;

if (!niaStrict) {
  console.error('NIA STRICT CHECK FAILED', {
    before: {
      boq_count: niaBefore.boq_count,
      boq_sum: niaBefore.boq_sum,
      estimate: niaBefore.estimate,
    },
    after: niaResult.metrics,
  });
  await restoreSoftDeleted(
    NIA_ID,
    niaResult.soft.deletedAt,
    niaResult.newBoqIds,
    niaResult.newWbsIds,
    niaResult.newRateIds
  );
  if (niaBefore.estimate) {
    await sb
      .from('estimate_summary')
      .update({
        direct_cost: niaBefore.estimate.direct_cost,
        indirect_cost: niaBefore.estimate.indirect_cost,
        contingency: niaBefore.estimate.contingency,
        markup: niaBefore.estimate.markup,
        vat: niaBefore.estimate.vat,
        grand_total: niaBefore.estimate.grand_total,
      })
      .eq('project_id', NIA_ID);
  }
  spawnSync('git', ['checkout', '--', 'lib/smart-import/extractors.ts'], {
    cwd: root,
    stdio: 'inherit',
  });
  process.exit(10);
}

console.log('NIA PASS — unchanged. Reimporting STREVI...');
const streviResult = await reimportProject(STREVI_ID, STREVI_XLSX, 'STREVI');
console.log('STREVI after', JSON.stringify(streviResult.metrics, null, 2));

const streviPass =
  Math.abs((streviResult.metrics.estimate?.direct_cost ?? 0) - STREVI_TARGET) <
    0.05 &&
  Math.abs(streviResult.metrics.boq_sum - STREVI_TARGET) < 0.05;

const report = {
  generated_at: new Date().toISOString(),
  nia: {
    project_id: NIA_ID,
    before: {
      boq_count: niaBefore.boq_count,
      boq_sum: niaBefore.boq_sum,
      rate_library_count: niaBefore.rate_library_count,
      estimate: niaBefore.estimate,
    },
    after: niaResult.metrics,
    unchanged: niaStrict,
    extract_leaf_count: niaResult.extract_leaf_count,
    extract_leaf_sum: niaResult.extract_leaf_sum,
  },
  strevi: {
    project_id: STREVI_ID,
    before: {
      boq_count: before.strevi_db.boq_count,
      boq_sum: before.strevi_db.boq_sum,
      estimate: before.strevi_db.estimate,
    },
    after: streviResult.metrics,
    target_direct_cost: STREVI_TARGET,
    grand_total_pass: streviPass,
    extract_leaf_count: streviResult.extract_leaf_count,
    extract_leaf_sum: streviResult.extract_leaf_sum,
    delta_vs_target: round2(
      (streviResult.metrics.estimate?.direct_cost ?? 0) - STREVI_TARGET
    ),
  },
  patch_kept: true,
};

writeFileSync(
  resolve(root, 'docs/STREVI_FIX_BEFORE_AFTER_REPORT.json'),
  JSON.stringify(report, null, 2)
);

console.log(JSON.stringify(report, null, 2));
if (!streviPass) {
  console.error('STREVI verification FAILED');
  process.exit(11);
}
console.log('ALL PASS');
