/**
 * Generate tiny WebP blur placeholders for local images.
 * Sources:
 *   - public/images/projects/**
 *   - public/images/blog/**（正文图；目录不存在或为空时跳过）
 * Output: src/lib/image-blur-map.ts
 *
 * Usage: node scripts/generate-blur-data.mjs
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'src', 'lib', 'image-blur-map.ts');

/** @type {{ absDir: string, publicPrefix: string }[]} */
const sources = [
  {
    absDir: path.join(root, 'public', 'images', 'projects'),
    publicPrefix: '/images/projects',
  },
  {
    absDir: path.join(root, 'public', 'images', 'blog'),
    publicPrefix: '/images/blog',
  },
];

/** @type {Record<string, string>} */
const map = {};

for (const source of sources) {
  if (!fs.existsSync(source.absDir)) continue;
  const files = fs
    .readdirSync(source.absDir)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort();

  for (const file of files) {
    const abs = path.join(source.absDir, file);
    const buf = await sharp(abs)
      .resize(12, 12, { fit: 'inside' })
      .webp({ quality: 35 })
      .toBuffer();
    const key = `${source.publicPrefix}/${file}`;
    map[key] = `data:image/webp;base64,${buf.toString('base64')}`;
  }
}

const body = `/** Auto-generated blur placeholders for local project and blog images.
 * Re-run: pnpm gen:blur  (or node scripts/generate-blur-data.mjs)
 * Do not edit by hand.
 */
export const IMAGE_BLUR_DATA: Record<string, string> = ${JSON.stringify(map, null, 2)} as const;
`;

fs.writeFileSync(outFile, body, 'utf8');
console.log(
  `wrote ${Object.keys(map).length} blur entries → ${path.relative(root, outFile)}`,
);
