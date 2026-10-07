/**
 * Analyze NIA / STREVI samples via frozen Import Engine (read-only).
 * Does not modify importer source — only bundles and calls analyzeSmartImportWorkbook.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

import { NIA_PROJECT, STREVI_PROJECT } from './demo-constants.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CACHE_DIR = resolve(ROOT, 'docs/demo-seed');

function ensureAnalyzeBundle() {
  const out = resolve(ROOT, 'scripts/_demo-seed-analyze-bundle.mjs');
  const build = spawnSync(
    'npx',
    [
      '--yes',
      'esbuild',
      'services/smart-import/analyze-workbook.ts',
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
    throw new Error(`esbuild analyze failed: ${build.stderr || build.stdout}`);
  }

  const wbsOut = resolve(ROOT, 'scripts/_demo-seed-wbs-bundle.mjs');
  const buildWbs = spawnSync(
    'npx',
    [
      '--yes',
      'esbuild',
      'lib/smart-import/build-wbs-from-boq.ts',
      '--bundle',
      '--platform=node',
      '--format=esm',
      `--outfile=${wbsOut}`,
      '--packages=external',
      '--alias:@=./',
    ],
    { cwd: ROOT, encoding: 'utf8', shell: true }
  );
  if (buildWbs.status !== 0) {
    throw new Error(`esbuild wbs failed: ${buildWbs.stderr || buildWbs.stdout}`);
  }

  return { analyzePath: out, wbsPath: wbsOut };
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

export async function analyzeFixture(sampleRelPath) {
  const { analyzePath, wbsPath } = ensureAnalyzeBundle();
  const { analyzeSmartImportWorkbook } = await import(
    pathToFileURL(analyzePath).href
  );
  const { buildWbsFromBoq } = await import(pathToFileURL(wbsPath).href);

  const abs = resolve(ROOT, sampleRelPath);
  if (!existsSync(abs)) {
    throw new Error(`Sample missing: ${sampleRelPath}`);
  }
  const buffer = readFileSync(abs);
  const analysis = await analyzeSmartImportWorkbook(buffer);
  const { wbs, boq } = buildWbsFromBoq(analysis.boq_rows ?? []);
  const leafSum = round2(
    (boq ?? []).reduce((s, r) => s + Number(r.amount || 0), 0)
  );

  return {
    sample: sampleRelPath,
    profile_key: analysis.profile_key ?? null,
    project_info: analysis.project_info ?? {},
    bid_summary: analysis.bid_summary ?? null,
    resource_rows: analysis.resource_rows ?? [],
    boq_rows: boq,
    wbs_nodes: wbs,
    leaf_count: boq.length,
    wbs_count: wbs.length,
    leaf_sum_rounded: leafSum,
    fingerprint: createHash('sha256')
      .update(
        boq
          .map(
            (r) =>
              `${r.row_index}|${r.description}|${r.unit}|${Number(r.quantity)}|${round2(r.amount)}`
          )
          .join('\n')
      )
      .digest('hex'),
  };
}

export async function buildAndCacheImportSnapshots() {
  mkdirSync(CACHE_DIR, { recursive: true });

  const nia = await analyzeFixture(NIA_PROJECT.sample);
  const strevi = await analyzeFixture(STREVI_PROJECT.sample);

  if (nia.leaf_count !== NIA_PROJECT.expected_boq) {
    throw new Error(
      `NIA leaf_count ${nia.leaf_count} !== expected ${NIA_PROJECT.expected_boq}`
    );
  }
  if (Math.abs(nia.leaf_sum_rounded - NIA_PROJECT.expected_direct) > 0.01) {
    throw new Error(
      `NIA direct ${nia.leaf_sum_rounded} !== expected ${NIA_PROJECT.expected_direct}`
    );
  }
  if (strevi.leaf_count !== STREVI_PROJECT.expected_boq) {
    throw new Error(
      `STREVI leaf_count ${strevi.leaf_count} !== expected ${STREVI_PROJECT.expected_boq}`
    );
  }
  if (Math.abs(strevi.leaf_sum_rounded - STREVI_PROJECT.expected_direct) > 0.01) {
    throw new Error(
      `STREVI direct ${strevi.leaf_sum_rounded} !== expected ${STREVI_PROJECT.expected_direct}`
    );
  }

  const slim = (snap) => ({
    sample: snap.sample,
    profile_key: snap.profile_key,
    leaf_count: snap.leaf_count,
    wbs_count: snap.wbs_count,
    leaf_sum_rounded: snap.leaf_sum_rounded,
    fingerprint: snap.fingerprint,
    resource_row_count: (snap.resource_rows ?? []).length,
  });

  const manifest = {
    generated_at: new Date().toISOString(),
    engine: 'Quantix Import Engine v1.0 (read-only analyze)',
    note:
      'WBS counts come from buildWbsFromBoq on frozen engine output (goldens: NIA 107, STREVI 125). Full row payloads are applied at seed time from samples/*.xlsx — not stored here.',
    nia: slim(nia),
    strevi: slim(strevi),
  };

  writeFileSync(
    resolve(CACHE_DIR, 'IMPORT_SNAPSHOTS.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  return { ...manifest, nia, strevi };
}
