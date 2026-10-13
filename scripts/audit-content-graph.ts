import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { CONTENT_DIR } from '../src/lib/content-dirs';
import { extractWikilinks } from '../src/lib/posts/wikilink';
import { filenameToSlug } from '../src/lib/posts';
import { parseFrontmatter } from '../src/lib/parse-frontmatter';
import { postFrontmatterSchema } from '../src/lib/schemas/post-frontmatter';
import { TAG_TO_CATEGORY } from '../src/lib/category-rules-data';

const blogDir = path.resolve(process.cwd(), CONTENT_DIR.blog);
const posts = readdirSync(blogDir)
  .filter((filename) => filename.endsWith('.mdx'))
  .map((filename) => {
    const raw = readFileSync(path.join(blogDir, filename), 'utf8');
    const parsed = parseFrontmatter(raw);
    const frontmatter = postFrontmatterSchema.parse(parsed.data);
    return {
      filename,
      slug: filenameToSlug(filename),
      title: frontmatter.title,
      tags: frontmatter.tags,
      category: frontmatter.category,
      series: frontmatter.series,
      seriesOrder: frontmatter.seriesOrder,
      links: extractWikilinks(parsed.content).map((link) => link.slug),
    };
  });

const slugs = new Set(posts.map((post) => post.slug));
const inbound = new Map(posts.map((post) => [post.slug, 0]));
let brokenCount = 0;

console.log(`Content graph audit: ${posts.length} published source files`);
console.log('\nBroken wikilinks:');
for (const post of posts) {
  const broken = post.links.filter((slug) => !slugs.has(slug));
  for (const slug of broken) {
    brokenCount += 1;
    console.log(`- ${post.filename}: [[${slug}]]`);
  }
  for (const slug of post.links) {
    if (slugs.has(slug)) inbound.set(slug, (inbound.get(slug) ?? 0) + 1);
  }
}
if (brokenCount === 0) console.log('- none');

console.log('\nPosts with no inbound wikilinks:');
const orphans = posts.filter((post) => (inbound.get(post.slug) ?? 0) === 0);
for (const post of orphans) console.log(`- ${post.slug}: ${post.title}`);
if (orphans.length === 0) console.log('- none');

console.log('\nSeries coverage:');
const series = new Map<string, typeof posts>();
for (const post of posts) {
  if (!post.series) continue;
  series.set(post.series, [...(series.get(post.series) ?? []), post]);
}
for (const [name, members] of series) {
  const ordered = [...members].sort(
    (a, b) =>
      (a.seriesOrder ?? Number.MAX_SAFE_INTEGER) -
      (b.seriesOrder ?? Number.MAX_SAFE_INTEGER),
  );
  console.log(
    `- ${name}: ${ordered.length} posts; order ${ordered.map((post) => post.seriesOrder ?? '?').join(', ')}`,
  );
}

console.log('\nMetadata gaps (excluding categories inferred at runtime):');
const gaps = posts.filter((post) => post.tags.length === 0);
for (const post of gaps) {
  console.log(`- ${post.slug}: tags`);
}
if (gaps.length === 0) console.log('- none');

console.log('\nCategory inference checks:');
const categoryChecks = posts.map((post) => {
  const mappedCategories = [
    ...new Set(post.tags.map((tag) => TAG_TO_CATEGORY[tag]).filter(Boolean)),
  ];
  const inferredCategory = mappedCategories[0] ?? null;
  return { ...post, mappedCategories, inferredCategory };
});
const inferredCategories = categoryChecks.filter(
  (post) => !post.category && post.inferredCategory,
);
console.log(
  `- runtime category inference: ${inferredCategories.length}/${posts.length} posts covered`,
);
const ambiguousCategories = categoryChecks.filter(
  (post) => post.mappedCategories.length > 1 && !post.category,
);
for (const post of ambiguousCategories) {
  console.log(
    `- ambiguous ${post.slug}: ${post.mappedCategories.join(' / ')}; runtime chooses ${post.inferredCategory}`,
  );
}
if (ambiguousCategories.length === 0) console.log('- no implicit multi-category posts');

const explicitMismatches = categoryChecks.filter(
  (post) =>
    post.category &&
    post.mappedCategories.length > 0 &&
    !post.mappedCategories.includes(post.category),
);
for (const post of explicitMismatches) {
  console.log(
    `- explicit category differs from tag mappings ${post.slug}: ${post.category} (tags map to ${post.mappedCategories.join(' / ')})`,
  );
}
if (explicitMismatches.length === 0) console.log('- no explicit category mismatches');

if (brokenCount > 0) process.exitCode = 1;
