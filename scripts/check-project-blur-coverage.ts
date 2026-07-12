/**
 * Assert every projects.json image path has a blur LQIP entry.
 * Run after `pnpm gen:blur` when adding project covers.
 *
 * Usage: tsx scripts/check-project-blur-coverage.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const projects = JSON.parse(
  readFileSync(join(root, 'data', 'projects.json'), 'utf8'),
) as Array<{ id: string; image?: string }>;

const mapSource = readFileSync(join(root, 'src', 'lib', 'image-blur-map.ts'), 'utf8');

const missing: string[] = [];
for (const p of projects) {
  if (!p.image) continue;
  if (!mapSource.includes(`'${p.image}'`) && !mapSource.includes(`"${p.image}"`)) {
    missing.push(`${p.id}: ${p.image}`);
  }
}

if (missing.length > 0) {
  console.error('Missing blur entries (run pnpm gen:blur):\n' + missing.join('\n'));
  process.exit(1);
}

console.log(`blur coverage ok (${projects.filter((p) => p.image).length} images)`);
