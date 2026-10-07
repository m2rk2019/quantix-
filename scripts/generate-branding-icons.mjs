/**
 * Generate PNG branding assets from SVG sources.
 *   node scripts/generate-branding-icons.mjs
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const assets = [
  {
    input: resolve(root, 'public/favicon.svg'),
    outputs: [
      { path: resolve(root, 'public/icon-192.png'), size: 192 },
      { path: resolve(root, 'public/icon-512.png'), size: 512 },
    ],
  },
  {
    input: resolve(root, 'public/assets/branding/quantix-mark.svg'),
    outputs: [
      { path: resolve(root, 'public/assets/branding/quantix-mark.png'), size: 96 },
      { path: resolve(root, 'public/assets/branding/quantix-mark@2x.png'), size: 192 },
    ],
  },
  {
    input: resolve(root, 'public/assets/branding/quantix-logo.svg'),
    outputs: [
      { path: resolve(root, 'public/assets/branding/quantix-logo.png'), width: 248, aspect: 248 / 52 },
      { path: resolve(root, 'public/assets/branding/quantix-logo@2x.png'), width: 496, aspect: 248 / 52 },
    ],
  },
];

async function main() {
  const { default: sharp } = await import('sharp');

  for (const asset of assets) {
    const svg = readFileSync(asset.input);
    for (const output of asset.outputs) {
      if ('size' in output) {
        await sharp(svg).resize(output.size, output.size).png().toFile(output.path);
      } else {
        const height = Math.round(output.width / output.aspect);
        await sharp(svg).resize(output.width, height).png().toFile(output.path);
      }
      console.log(`Wrote ${output.path}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
