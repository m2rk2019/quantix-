/**
 * Smoke-check WBS-tree BOQ ordering helper (no DB).
 */
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve('.');
spawnSync(
  'npx',
  [
    '--yes',
    'esbuild',
    'lib/boq/sort-by-wbs-tree.ts',
    '--bundle',
    '--platform=node',
    '--format=esm',
    '--outfile=scripts/_sort-wbs-bundle.mjs',
  ],
  { cwd: root, stdio: 'inherit', shell: true }
);

const { buildWbsTreeDisplayOrder, compareBoqByWbsTreeOrder } = await import(
  pathToFileURL(resolve(root, 'scripts/_sort-wbs-bundle.mjs')).href
);

// Tree:
// 1 General Requirements
//   1.1 Package A
// 2 Structural
const nodes = [
  { id: 'gr', parent_id: null, sort_order: 0 },
  { id: 'st', parent_id: null, sort_order: 1 },
  { id: 'pkg', parent_id: 'gr', sort_order: 0 },
];
const order = buildWbsTreeDisplayOrder(nodes);
// DFS: gr(0), pkg(1), st(2)
console.assert(order.get('gr') === 0, 'gr first');
console.assert(order.get('pkg') === 1, 'pkg under gr');
console.assert(order.get('st') === 2, 'structural after gr branch');

const items = [
  { wbs_id: 'st', created_at: '2026-01-01T00:00:02Z', label: 'ST-2' },
  { wbs_id: 'pkg', created_at: '2026-01-01T00:00:01Z', label: 'PKG-1' },
  { wbs_id: 'gr', created_at: '2026-01-01T00:00:02Z', label: 'GR-2' },
  { wbs_id: 'gr', created_at: '2026-01-01T00:00:01Z', label: 'GR-1' },
  { wbs_id: 'st', created_at: '2026-01-01T00:00:01Z', label: 'ST-1' },
];
items.sort((a, b) => compareBoqByWbsTreeOrder(a, b, order));
const labels = items.map((i) => i.label);
console.log(labels);
console.assert(
  JSON.stringify(labels) ===
    JSON.stringify(['GR-1', 'GR-2', 'PKG-1', 'ST-1', 'ST-2']),
  'expected GR then PKG then ST, within-node by created_at'
);
console.log('PASS sort-by-wbs-tree smoke');
