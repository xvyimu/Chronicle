/**
 * Generate tiny WebP blur placeholders for local images.
 * Sources:
 *   - public/images/projects/**
 *   - public/images/blog/**（正文图；目录不存在或为空时跳过）
 * Output: src/lib/image-blur-map.ts
 *
 * Usage: node scripts/generate-blur-data.mjs
 *
 * sharp 是 next 的可选依赖，pnpm 不把它提升到根 node_modules，
 * 裸 `import 'sharp'` 会 ERR_MODULE_NOT_FOUND。经 next 的解析路径拿它，
 * 版本随 next 走，不用在 package.json 里再钉一份。
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'src', 'lib', 'image-blur-map.ts');

const require = createRequire(import.meta.url);

/** sharp 是 next 的可选依赖（optionalDependency），pnpm 下不在根 node_modules；
 *  某些平台（不支持的 CPU 架构）安装时会静默跳过它。两种情况下 require.resolve 都抛
 *  MODULE_NOT_FOUND，原文信息看不出该装什么，这里补一句可执行的提示。*/
let sharp;
try {
  sharp = require(
    require.resolve('sharp', {
      paths: [path.dirname(require.resolve('next/package.json'))],
    }),
  );
} catch (err) {
  console.error(
    '[gen:blur] 找不到 sharp（它是 next 的可选依赖）。\n' +
      '  先跑 `pnpm install`；若仍失败，本平台可能不被 sharp 支持 —— 检查 Node 版本与 CPU 架构。\n' +
      `  原始错误：${err.message}`,
  );
  process.exit(1);
}

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
