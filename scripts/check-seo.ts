import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { parseFrontmatter as parseFrontmatterType } from '../src/lib/parse-frontmatter';
import type { filenameToSlug as filenameToSlugType, getAllPosts as getAllPostsType } from '../src/lib/posts';
import type { getAllCategories as getAllCategoriesType } from '../src/lib/categories';
import type { getAllProjects as getAllProjectsType } from '../src/lib/projects';
import type { getAllTags as getAllTagsType } from '../src/lib/tags';
import type sitemapType from '../src/app/sitemap';

type Issue = {
  file?: string;
  message: string;
};

type CheckContext = {
  contentDir: { blog: string; projects: string };
  siteUrl: string;
  parseFrontmatter: typeof parseFrontmatterType;
  filenameToSlug: typeof filenameToSlugType;
  getAllPosts: typeof getAllPostsType;
  getAllCategories: typeof getAllCategoriesType;
  getAllProjects: typeof getAllProjectsType;
  getAllTags: typeof getAllTagsType;
  sitemap: typeof sitemapType;
};

const issues: Issue[] = [];
const rootDir = process.cwd();
const publicDir = path.join(rootDir, 'public');

function addIssue(message: string, file?: string): void {
  issues.push({ file, message });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function publicPathExists(publicPath: string): boolean {
  const normalized = publicPath.split(/[?#]/, 1)[0];
  if (!normalized.startsWith('/')) return false;
  return existsSync(path.join(publicDir, normalized));
}

function checkAbsoluteUrl(rawUrl: string, context: string, siteOrigin: string): void {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    addIssue(`${context} is not an absolute URL: ${rawUrl}`);
    return;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    addIssue(`${context} must use http(s): ${rawUrl}`);
  }

  if (url.origin !== siteOrigin) {
    addIssue(`${context} must use SITE_CONFIG.url origin (${siteOrigin}): ${rawUrl}`);
  }

  if (url.href.includes('localhost')) {
    addIssue(`${context} must not contain localhost: ${rawUrl}`);
  }
}

function checkMdxReferences(content: string, file: string): void {
  const markdownLinks = content.matchAll(/!?\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g);
  for (const match of markdownLinks) {
    const target = match[1];
    if (!target || target.startsWith('#') || target.startsWith('mailto:')) continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;

    if (target.startsWith('/')) {
      const cleanTarget = target.split(/[?#]/, 1)[0];
      if (cleanTarget.startsWith('/blog/') || cleanTarget.startsWith('/tags/') || cleanTarget.startsWith('/categories/')) {
        continue;
      }
      if (!publicPathExists(cleanTarget)) {
        addIssue(`Referenced public path does not exist: ${target}`, file);
      }
    }
  }
}

function checkPostFrontmatter(ctx: CheckContext): void {
  const blogDir = path.join(rootDir, ctx.contentDir.blog);
  if (!existsSync(blogDir)) {
    addIssue(`Blog directory does not exist: ${ctx.contentDir.blog}`);
    return;
  }

  const seenSlugs = new Set<string>();
  const filenames = readdirSync(blogDir).filter((filename) => filename.endsWith('.mdx'));

  for (const filename of filenames) {
    const file = path.join(ctx.contentDir.blog, filename).replace(/\\/g, '/');
    const raw = readFileSync(path.join(blogDir, filename), 'utf-8');
    const { data, content } = ctx.parseFrontmatter(raw);
    const slug = ctx.filenameToSlug(filename);

    if (seenSlugs.has(slug)) {
      addIssue(`Duplicate blog slug: ${slug}`, file);
    }
    seenSlugs.add(slug);

    if (!isRecord(data)) {
      addIssue('Frontmatter must be a YAML object', file);
      continue;
    }

    for (const key of ['title', 'description', 'date'] as const) {
      if (typeof data[key] !== 'string' || data[key].trim().length === 0) {
        addIssue(`Frontmatter ${key} is required`, file);
      }
    }

    if (typeof data.date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      addIssue(`Frontmatter date must use YYYY-MM-DD: ${data.date}`, file);
    }

    if (!Array.isArray(data.tags) || data.tags.length === 0 || data.tags.some((tag) => typeof tag !== 'string' || tag.trim() === '')) {
      addIssue('Frontmatter tags must be a non-empty string array', file);
    }

    if (typeof data.description === 'string' && data.description.trim().length < 20) {
      addIssue('Frontmatter description should be at least 20 characters for search snippets', file);
    }

    if (typeof data.image === 'string' && data.image.startsWith('/') && !publicPathExists(data.image)) {
      addIssue(`Frontmatter image does not exist: ${data.image}`, file);
    }

    checkMdxReferences(content, file);
  }
}

function checkProjects(ctx: CheckContext): void {
  const seenIds = new Set<string>();

  for (const project of ctx.getAllProjects()) {
    if (seenIds.has(project.id)) {
      addIssue(`Duplicate project id: ${project.id}`, ctx.contentDir.projects);
    }
    seenIds.add(project.id);

    if (project.image && project.image.startsWith('/') && !publicPathExists(project.image)) {
      addIssue(`Project image does not exist: ${project.image}`, ctx.contentDir.projects);
    }
  }
}

function checkSitemapCoverage(ctx: CheckContext): void {
  const siteOrigin = new URL(ctx.siteUrl).origin;
  const entries = ctx.sitemap();
  const urls = new Set(entries.map((entry) => entry.url));

  for (const entry of entries) {
    checkAbsoluteUrl(entry.url, 'Sitemap URL', siteOrigin);
  }

  const expectedUrls = [
    ctx.siteUrl,
    `${ctx.siteUrl}/blog`,
    `${ctx.siteUrl}/categories`,
    `${ctx.siteUrl}/projects`,
    `${ctx.siteUrl}/tags`,
    `${ctx.siteUrl}/about`,
    ...ctx.getAllPosts().map((post) => `${ctx.siteUrl}/blog/${post.slug}`),
    ...ctx.getAllProjects().map((project) => `${ctx.siteUrl}/projects/${project.id}`),
    ...ctx.getAllTags().map((tag) => `${ctx.siteUrl}/tags/${tag.slug}`),
    ...ctx.getAllCategories().map((category) => `${ctx.siteUrl}/categories/${encodeURIComponent(category.slug)}`),
  ];

  for (const url of expectedUrls) {
    if (!urls.has(url)) {
      addIssue(`Sitemap is missing expected URL: ${url}`);
    }
  }
}

async function main(): Promise<void> {
  process.env.NEXT_PUBLIC_SITE_URL ??= 'https://example.com';

  const [
    frontmatterModule,
    constantsModule,
    postsModule,
    categoriesModule,
    projectsModule,
    tagsModule,
    sitemapModule,
  ] = await Promise.all([
    import('../src/lib/parse-frontmatter'),
    import('../src/lib/constants'),
    import('../src/lib/posts'),
    import('../src/lib/categories'),
    import('../src/lib/projects'),
    import('../src/lib/tags'),
    import('../src/app/sitemap'),
  ]);

  const ctx: CheckContext = {
    contentDir: constantsModule.CONTENT_DIR,
    siteUrl: constantsModule.SITE_CONFIG.url,
    parseFrontmatter: frontmatterModule.parseFrontmatter,
    filenameToSlug: postsModule.filenameToSlug,
    getAllPosts: postsModule.getAllPosts,
    getAllCategories: categoriesModule.getAllCategories,
    getAllProjects: projectsModule.getAllProjects,
    getAllTags: tagsModule.getAllTags,
    sitemap: sitemapModule.default,
  };

  checkPostFrontmatter(ctx);
  checkProjects(ctx);
  checkSitemapCoverage(ctx);

  if (issues.length === 0) {
    console.log('SEO/content check passed.');
    return;
  }

  console.error(`SEO/content check failed with ${issues.length} issue(s):`);
  for (const issue of issues) {
    console.error(`- ${issue.file ? `${issue.file}: ` : ''}${issue.message}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
