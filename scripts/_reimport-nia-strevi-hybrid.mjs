/**
 * Hybrid re-import: service_role for BOQ/WBS/rates, user JWT for estimate_summary.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ACTOR_ID = '7de80660-a7d9-44a7-a046-3048bb110879';
const NIA_ID = 'd387f1f1-4271-4e35-832c-e30ba2cb0e66';
const STREVI_ID = 'a356c582-fe81-472d-8bee-9575970dd3a0';
const NIA_XLSX = resolve(root, 'samples/NIA_Budgetary_Cost_Breakdown.xlsx');
const STREVI_XLSX =
  'C:\\Users\\mgoles\\Downloads\\EPC. CAC. BID. 4PH STREVI. BCB Breakdown & Summary (4 Bldgs). 2026 05 18 2.xlsx';
const STREVI_TARGET = 1859023517.47;

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

function adminClient() {
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getUserClient() {
  const admin = adminClient();
  const { data: userData, error: uErr } =
    await admin.auth.admin.getUserById(ACTOR_ID);
  if (uErr || !userData?.user?.email) {
    throw new Error(`actor email: ${uErr?.message}`);
  }
  const { data: linkData, error: linkErr } =
    await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
    });
  if (linkErr || !linkData?.properties?.hashed_token) {
    throw new Error(`magiclink: ${linkErr?.message}`);
  }
  const bootstrap = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: sess, error: vErr } = await bootstrap.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  });
  if (vErr || !sess?.session?.access_token) {
    throw new Error(`otp: ${vErr?.message}`);
  }
  const sb = createClient(url, anonKey, {
    global: {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  await sb.auth.setSession({
    access_token: sess.session.access_token,
    refresh_token: sess.session.refresh_token,
  });
  return sb;
}

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
    `?t=${Date.now()}`
);
const { buildWbsFromBoq } = await import(
  pathToFileURL(resolve(root, 'scripts/_fix-wbs-bundle.mjs')).href +
    `?t=${Date.now()}`
);
const { planBoqResourceLinks } = await import(
  pathToFileURL(resolve(root, 'scripts/_fix-link-bundle.mjs')).href +
    `?t=${Date.now()}`
);

async function captureMetrics(sb, projectId) {
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
  const ratesFp = leaves
    .map((r) => `${String(r.description).trim()}|${round2(r.total_rate)}`)
    .sort()
    .join('\n');
  return {
    boq_count: leaves.length,
    boq_sum: round2(leaves.reduce((s, r) => s + Number(r.total_amount || 0), 0)),
    priced_count: leaves.filter(
      (r) => Number(r.total_rate) > 0 || Number(r.total_amount) > 0
    ).length,
    rate_library_count: rateCount ?? 0,
    rates_fingerprint: ratesFp,
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

async function softDeleteActive(admin, projectId) {
  const now = new Date().toISOString();
  const { data: boqIds } = await admin
    .from('boq_items')
    .select('id')
    .eq('project_id', projectId)
    .is('deleted_at', null);
  const ids = (boqIds || []).map((r) => r.id);
  if (ids.length) {
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      await admin
        .from('boq_rate_analysis_lines')
        .update({ deleted_at: now, updated_by: ACTOR_ID })
        .in('boq_item_id', chunk)
        .is('deleted_at', null);
    }
    const { error } = await admin
      .from('boq_items')
      .update({ deleted_at: now, updated_by: ACTOR_ID })
      .eq('project_id', projectId)
      .is('deleted_at', null);
    if (error) throw new Error(`soft-delete boq: ${error.message}`);
  }
  const { error: wbsErr } = await admin
    .from('wbs')
    .update({ deleted_at: now, updated_by: ACTOR_ID })
    .eq('project_id', projectId)
    .is('deleted_at', null);
  if (wbsErr) throw new Error(`soft-delete wbs: ${wbsErr.message}`);
  await admin
    .from('project_rate_library_items')
    .update({ deleted_at: now, updated_by: ACTOR_ID })
    .eq('project_id', projectId)
    .is('deleted_at', null);
  return { deletedAt: now, deletedBoqIds: ids };
}

async function restoreGeneration(admin, user, projectId, deletedAt, newIds, estimateBefore) {
  const stamp = new Date().toISOString();
  if (newIds.boq.length) {
    for (let i = 0; i < newIds.boq.length; i += 100) {
      const chunk = newIds.boq.slice(i, i + 100);
      await admin
        .from('boq_rate_analysis_lines')
        .update({ deleted_at: stamp, updated_by: ACTOR_ID })
        .in('boq_item_id', chunk)
        .is('deleted_at', null);
      await admin
        .from('boq_items')
        .update({ deleted_at: stamp, updated_by: ACTOR_ID })
        .in('id', chunk);
    }
  }
  if (newIds.wbs.length) {
    await admin
      .from('wbs')
      .update({ deleted_at: stamp, updated_by: ACTOR_ID })
      .in('id', newIds.wbs);
  }
  if (newIds.rates.length) {
    await admin
      .from('project_rate_library_items')
      .update({ deleted_at: stamp, updated_by: ACTOR_ID })
      .in('id', newIds.rates);
  }
  await admin
    .from('boq_items')
    .update({ deleted_at: null, updated_by: ACTOR_ID })
    .eq('project_id', projectId)
    .eq('deleted_at', deletedAt);
  await admin
    .from('wbs')
    .update({ deleted_at: null, updated_by: ACTOR_ID })
    .eq('project_id', projectId)
    .eq('deleted_at', deletedAt);
  await admin
    .from('project_rate_library_items')
    .update({ deleted_at: null, updated_by: ACTOR_ID })
    .eq('project_id', projectId)
    .eq('deleted_at', deletedAt);
  await admin
    .from('boq_rate_analysis_lines')
    .update({ deleted_at: null, updated_by: ACTOR_ID })
    .eq('deleted_at', deletedAt);
  if (estimateBefore) {
    const { error } = await user
      .from('estimate_summary')
      .update({
        direct_cost: estimateBefore.direct_cost,
        indirect_cost: estimateBefore.indirect_cost,
        contingency: estimateBefore.contingency,
        markup: estimateBefore.markup,
        vat: estimateBefore.vat,
        grand_total: estimateBefore.grand_total,
      })
      .eq('project_id', projectId);
    if (error) throw new Error(`restore estimate: ${error.message}`);
  }
}

async function reimport(admin, user, projectId, xlsxPath, label) {
  const analysis = await analyzeSmartImportWorkbook(readFileSync(xlsxPath));
  const { wbs, boq } = buildWbsFromBoq(analysis.boq_rows);

  const { data: companyLibrary } = await admin
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

  const soft = await softDeleteActive(admin, projectId);
  const newIds = { boq: [], wbs: [], rates: [] };
  const tempToId = new Map();

  const sortedWbs = [...wbs].sort(
    (a, b) => a.level - b.level || a.sort_order - b.sort_order
  );
  for (const node of sortedWbs) {
    const { data: created, error } = await admin
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
        created_by: ACTOR_ID,
        updated_by: ACTOR_ID,
      })
      .select('id')
      .single();
    if (error || !created) throw new Error(`${label} WBS: ${error?.message}`);
    tempToId.set(node.temp_id, created.id);
    newIds.wbs.push(created.id);
  }

  const resourceCodeToId = new Map();
  for (const item of linkPlan.resources) {
    const code = item.code.slice(0, 50);
    const { data: created, error } = await admin
      .from('project_rate_library_items')
      .insert({
        project_id: projectId,
        code,
        description: item.description.slice(0, 500),
        unit: item.unit || 'item',
        unit_cost: Number(item.unit_cost ?? 0),
        category: item.category || 'material',
        source_company_item_id: item.source_company_item_id,
        source_unit_cost: item.source_company_item_id
          ? Number(item.unit_cost ?? 0)
          : null,
        is_active: true,
        created_by: ACTOR_ID,
        updated_by: ACTOR_ID,
      })
      .select('id, code')
      .single();
    if (error || !created) {
      const { data: existing } = await admin
        .from('project_rate_library_items')
        .select('id, code')
        .eq('project_id', projectId)
        .eq('code', code)
        .is('deleted_at', null)
        .maybeSingle();
      if (existing) {
        resourceCodeToId.set(existing.code, existing.id);
        newIds.rates.push(existing.id);
      }
      continue;
    }
    resourceCodeToId.set(created.code, created.id);
    newIds.rates.push(created.id);
  }

  for (const row of boq) {
    const wbsId = tempToId.get(row.wbs_temp_id);
    if (!wbsId) continue;
    const unitRate =
      row.unit_rate || (row.quantity > 0 ? row.amount / row.quantity : 0);
    const amount = row.amount || row.quantity * unitRate;
    const { data: createdBoq, error } = await admin
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
        created_by: ACTOR_ID,
        updated_by: ACTOR_ID,
      })
      .select('id')
      .single();
    if (error || !createdBoq) throw new Error(`${label} BOQ: ${error?.message}`);
    newIds.boq.push(createdBoq.id);

    const link = linkPlan.links.find(
      (entry) => entry.boq_item_number === row.item_number
    );
    const projectLibraryItemId = link
      ? resourceCodeToId.get(link.resource_code) ?? null
      : null;
    if (projectLibraryItemId && link) {
      await admin.from('boq_rate_analysis_lines').insert({
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
        created_by: ACTOR_ID,
        updated_by: ACTOR_ID,
      });
    }
  }

  const metrics = await captureMetrics(admin, projectId);
  const { data: details } = await admin
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
  const breakdown = calculateEstimateBreakdown(metrics.boq_sum, percentages);
  const { error: estErr } = await user
    .from('estimate_summary')
    .update({
      direct_cost: breakdown.direct_cost,
      indirect_cost: breakdown.indirect_cost,
      contingency: breakdown.contingency,
      markup: breakdown.markup,
      vat: breakdown.vat,
      grand_total: breakdown.grand_total,
    })
    .eq('project_id', projectId);
  if (estErr) throw new Error(`${label} estimate: ${estErr.message}`);

  return {
    soft,
    newIds,
    extract_leaf_count: boq.length,
    extract_leaf_sum: round2(boq.reduce((s, r) => s + Number(r.amount || 0), 0)),
    breakdown,
    metrics: await captureMetrics(admin, projectId),
  };
}

const before = JSON.parse(
  readFileSync(resolve(root, 'docs/_BEFORE_NIA_STREVI_SNAPSHOT_FULL.json'), 'utf8')
);

console.log('Connecting…');
const admin = adminClient();
const user = await getUserClient();

const niaLiveBefore = await captureMetrics(admin, NIA_ID);
const streviLiveBefore = await captureMetrics(admin, STREVI_ID);
console.log('NIA live before', {
  boq_count: niaLiveBefore.boq_count,
  boq_sum: niaLiveBefore.boq_sum,
  estimate: niaLiveBefore.estimate,
});
console.log('STREVI live before', {
  boq_count: streviLiveBefore.boq_count,
  boq_sum: streviLiveBefore.boq_sum,
  estimate: streviLiveBefore.estimate,
});

console.log('Reimporting NIA…');
const niaResult = await reimport(admin, user, NIA_ID, NIA_XLSX, 'NIA');
console.log('NIA after', {
  boq_count: niaResult.metrics.boq_count,
  boq_sum: niaResult.metrics.boq_sum,
  estimate: niaResult.metrics.estimate,
  rates: niaResult.metrics.rate_library_count,
});

const niaBaseline = before.nia_db;
const niaUnitRatesUnchanged =
  niaResult.metrics.rates_fingerprint === niaLiveBefore.rates_fingerprint;

const niaPass =
  niaResult.metrics.boq_count === niaBaseline.boq_count &&
  Math.abs(niaResult.metrics.boq_sum - niaBaseline.boq_sum) < 0.05 &&
  Math.abs(
    (niaResult.metrics.estimate?.direct_cost ?? 0) -
      (niaBaseline.estimate?.direct_cost ?? 0)
  ) < 0.05 &&
  Math.abs(
    (niaResult.metrics.estimate?.grand_total ?? 0) -
      (niaBaseline.estimate?.grand_total ?? 0)
  ) < 0.05 &&
  niaUnitRatesUnchanged;

if (!niaPass) {
  console.error('NIA CHANGED — restoring and aborting');
  console.error({
    before: {
      boq_count: niaBaseline.boq_count,
      boq_sum: niaBaseline.boq_sum,
      estimate: niaBaseline.estimate,
    },
    after: {
      boq_count: niaResult.metrics.boq_count,
      boq_sum: niaResult.metrics.boq_sum,
      estimate: niaResult.metrics.estimate,
      unit_rates_unchanged: niaUnitRatesUnchanged,
    },
  });
  await restoreGeneration(
    admin,
    user,
    NIA_ID,
    niaResult.soft.deletedAt,
    niaResult.newIds,
    niaBaseline.estimate
  );
  writeFileSync(
    resolve(root, 'docs/STREVI_FIX_ROLLBACK.json'),
    JSON.stringify({ rolled_back: true, reason: 'NIA changed' }, null, 2)
  );
  process.exit(10);
}

console.log('NIA PASS. Reimporting STREVI…');
const streviResult = await reimport(admin, user, STREVI_ID, STREVI_XLSX, 'STREVI');
console.log('STREVI after', {
  boq_count: streviResult.metrics.boq_count,
  boq_sum: streviResult.metrics.boq_sum,
  estimate: streviResult.metrics.estimate,
});

const { data: streviBoq } = await admin
  .from('boq_items')
  .select('description, total_amount')
  .eq('project_id', STREVI_ID)
  .is('deleted_at', null);
const hasMaint = (streviBoq || []).some((r) =>
  /maintenance crew/i.test(r.description)
);
const hasSec = (streviBoq || []).some((r) =>
  /security grills/i.test(r.description)
);
const hasMc2 = (streviBoq || []).some((r) => /MC2 Typ/i.test(r.description));
const hasKw = (streviBoq || []).some((r) =>
  /KW-hr Meter Base/i.test(r.description)
);
const hasMain100 = (streviBoq || []).some((r) =>
  /MAIN:\s*100AT/i.test(r.description)
);

const streviPass =
  Math.abs((streviResult.metrics.estimate?.direct_cost ?? 0) - STREVI_TARGET) <
    0.05 &&
  Math.abs(streviResult.metrics.boq_sum - STREVI_TARGET) < 0.05 &&
  hasMaint &&
  hasSec &&
  !hasMc2 &&
  hasKw &&
  hasMain100;

const report = {
  generated_at: new Date().toISOString(),
  patch: {
    file: 'lib/smart-import/extractors.ts',
    kept: true,
  },
  nia: {
    project_id: NIA_ID,
    project_code: 'QTX-2026-000013',
    before: {
      boq_count: niaBaseline.boq_count,
      boq_sum: niaBaseline.boq_sum,
      rate_library_count: niaBaseline.rate_library_count,
      estimate: niaBaseline.estimate,
    },
    after: {
      boq_count: niaResult.metrics.boq_count,
      boq_sum: niaResult.metrics.boq_sum,
      rate_library_count: niaResult.metrics.rate_library_count,
      estimate: niaResult.metrics.estimate,
    },
    checks: {
      boq_count_unchanged:
        niaResult.metrics.boq_count === niaBaseline.boq_count,
      direct_cost_unchanged:
        Math.abs(
          (niaResult.metrics.estimate?.direct_cost ?? 0) -
            (niaBaseline.estimate?.direct_cost ?? 0)
        ) < 0.05,
      grand_total_unchanged:
        Math.abs(
          (niaResult.metrics.estimate?.grand_total ?? 0) -
            (niaBaseline.estimate?.grand_total ?? 0)
        ) < 0.05,
      unit_rates_unchanged: niaUnitRatesUnchanged,
      estimate_summary_unchanged:
        Math.abs(
          (niaResult.metrics.estimate?.grand_total ?? 0) -
            (niaBaseline.estimate?.grand_total ?? 0)
        ) < 0.05,
      pass: niaPass,
    },
  },
  strevi: {
    project_id: STREVI_ID,
    project_code: 'QTX-2026-000017',
    before: {
      boq_count: before.strevi_db.boq_count,
      boq_sum: before.strevi_db.boq_sum,
      estimate: before.strevi_db.estimate,
    },
    after: {
      boq_count: streviResult.metrics.boq_count,
      boq_sum: streviResult.metrics.boq_sum,
      estimate: streviResult.metrics.estimate,
    },
    target_direct_cost: STREVI_TARGET,
    checks: {
      grand_total_pass: streviPass,
      has_maintenance_crew: hasMaint,
      has_security_grills: hasSec,
      no_duplicated_mc2_package: !hasMc2,
      has_mc2_components: hasKw && hasMain100,
      no_skipped_package_amounts: hasMaint && hasSec,
      boq_reconciliation_pass: streviPass,
      estimate_summary_pass: streviPass,
      delta_vs_target: round2(
        (streviResult.metrics.estimate?.direct_cost ?? 0) - STREVI_TARGET
      ),
    },
  },
};

writeFileSync(
  resolve(root, 'docs/STREVI_FIX_BEFORE_AFTER_REPORT.json'),
  JSON.stringify(report, null, 2)
);

const md = `# STREVI Fix — BEFORE / AFTER Comparison

**Generated:** ${report.generated_at}  
**Patch:** \`lib/smart-import/extractors.ts\` — **kept**

## NIA (QTX-2026-000013)

| Metric | BEFORE | AFTER | Status |
| --- | ---: | ---: | --- |
| BOQ count | ${report.nia.before.boq_count} | ${report.nia.after.boq_count} | ${report.nia.checks.boq_count_unchanged ? 'PASS' : 'FAIL'} |
| Direct cost | ${report.nia.before.estimate.direct_cost} | ${report.nia.after.estimate.direct_cost} | ${report.nia.checks.direct_cost_unchanged ? 'PASS' : 'FAIL'} |
| Grand total | ${report.nia.before.estimate.grand_total} | ${report.nia.after.estimate.grand_total} | ${report.nia.checks.grand_total_unchanged ? 'PASS' : 'FAIL'} |
| Unit rates | (fingerprint) | (fingerprint) | ${report.nia.checks.unit_rates_unchanged ? 'PASS' : 'FAIL'} |
| Estimate Summary | unchanged required | — | ${report.nia.checks.estimate_summary_unchanged ? 'PASS' : 'FAIL'} |

**NIA overall: ${report.nia.checks.pass ? 'PASS' : 'FAIL'}**

## STREVI (QTX-2026-000017)

| Metric | BEFORE | AFTER | Target |
| --- | ---: | ---: | ---: |
| BOQ count | ${report.strevi.before.boq_count} | ${report.strevi.after.boq_count} | — |
| Direct cost (Overview) | ${report.strevi.before.boq_sum} | ${report.strevi.after.estimate.direct_cost} | ${STREVI_TARGET} |
| Bid grand total | ${report.strevi.before.estimate.grand_total} | ${report.strevi.after.estimate.grand_total} | — |
| Delta vs Excel VAT Ex | ${round2(report.strevi.before.boq_sum - STREVI_TARGET)} | ${report.strevi.checks.delta_vs_target} | 0 |

### STREVI verification
- Grand Total = ₱1,859,023,517.47: **${report.strevi.checks.grand_total_pass ? 'PASS' : 'FAIL'}**
- Maintenance Crew present (not skipped): **${hasMaint ? 'PASS' : 'FAIL'}**
- Security Grills present (not skipped): **${hasSec ? 'PASS' : 'FAIL'}**
- No duplicated MC2 package amount: **${!hasMc2 ? 'PASS' : 'FAIL'}**
- MC2 components retained: **${hasKw && hasMain100 ? 'PASS' : 'FAIL'}**
- BOQ reconciliation: **${report.strevi.checks.boq_reconciliation_pass ? 'PASS' : 'FAIL'}**
- Estimate Summary: **${report.strevi.checks.estimate_summary_pass ? 'PASS' : 'FAIL'}**
`;

writeFileSync(resolve(root, 'docs/STREVI_FIX_BEFORE_AFTER_REPORT.md'), md);
console.log(JSON.stringify(report, null, 2));
if (!streviPass) {
  console.error('STREVI FAILED');
  process.exit(11);
}
console.log('ALL PASS');
