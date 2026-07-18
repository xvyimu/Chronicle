/**
 * Assert local content images have blur LQIP entries.
 * - Always checks projects.json image paths.
 * - If public/images/blog has files, each must appear in the blur map.
 *
 * Usage: tsx scripts/check-project-blur-coverage.ts
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isBlurCoverageComplete } from '../src/lib/ops-readiness';

const root = process.cwd();
const projects = JSON.parse(
  readFileSync(join(root, 'data', 'projects.json'), 'utf8'),
) as Array<{ id: string; image?: string }>;

const mapSource = readFileSync(join(root, 'src', 'lib', 'image-blur-map.ts'), 'utf8');
const missing: string[] = [];

for (const p of projects) {
  if (!p.image) continue;
  if (!isBlurCoverageComplete(mapSource, [p.image])) {
    missing.push(`project ${p.id}: ${p.image}`);
  }
}

const blogDir = join(root, 'public', 'images', 'blog');
let blogCount = 0;
if (existsSync(blogDir)) {
  const blogFiles = readdirSync(blogDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  blogCount = blogFiles.length;
  for (const file of blogFiles) {
    const publicPath = `/images/blog/${file}`;
    if (!isBlurCoverageComplete(mapSource, [publicPath])) {
      missing.push(`blog image: ${publicPath}`);
    }
  }
}

if (missing.length > 0) {
  console.error('Missing blur entries (run pnpm gen:blur):\n' + missing.join('\n'));
  process.exit(1);
}

const projectCount = projects.filter((p) => p.image).length;
console.log(`blur coverage ok (projects=${projectCount}, blogImages=${blogCount})`);
