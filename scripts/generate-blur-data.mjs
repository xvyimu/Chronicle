/**
 * Generate tiny WebP blur placeholders for local project images.
 * Output: src/lib/image-blur-map.ts (map only; helpers live in image-blur-data.ts)
 *
 * Usage: node scripts/generate-blur-data.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDir = path.join(root, 'public', 'images', 'projects');
const outFile = path.join(root, 'src', 'lib', 'image-blur-map.ts');

const files = fs
  .readdirSync(imageDir)
  .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  .sort();

/** @type {Record<string, string>} */
const map = {};

for (const file of files) {
  const abs = path.join(imageDir, file);
  const buf = await sharp(abs)
    .resize(12, 12, { fit: 'inside' })
    .webp({ quality: 35 })
    .toBuffer();
  const key = `/images/projects/${file}`;
  map[key] = `data:image/webp;base64,${buf.toString('base64')}`;
}

const body = `/** Auto-generated blur placeholders for local project images.
 * Re-run: pnpm gen:blur  (or node scripts/generate-blur-data.mjs)
 * Do not edit by hand.
 */
export const IMAGE_BLUR_DATA: Record<string, string> = ${JSON.stringify(map, null, 2)} as const;
`;

fs.writeFileSync(outFile, body, 'utf8');
console.log(
  `wrote ${Object.keys(map).length} blur entries → ${path.relative(root, outFile)}`,
);
