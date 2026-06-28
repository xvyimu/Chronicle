import { parseFrontmatter } from './parse-frontmatter';
import readingTime from 'reading-time';
import { z } from 'zod';
import { PostFrontmatter, PostMeta, PostFull } from '@/types';
import { CONTENT_DIR } from './constants';
import { getContentSource } from './content-source';
import { createCache } from './cache';
import { inferCategory } from './category-rules';

/** Zod schema for post frontmatter — consistent with projects.ts validation */
const postFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date 必须为 YYYY-MM-DD 格式'),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'updatedAt 必须为 YYYY-MM-DD 格式').optional(),
  tags: z.array(z.string()).optional().default([]),
  category: z.string().min(1).optional(),
  series: z.string().min(1).optional(),
  seriesOrder: z.number().int().positive().optional(),
  published: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  image: z.string()
    .refine(
      (v) => !v || /^https?:\/\//.test(v) || v.startsWith('/'),
      'image 必须是 http(s):// URL 或 / 开头的绝对路径',
    )
    .optional(),
  source: z.string().min(1).optional(),
  license: z.string().min(1).optional(),
});

/** 文件名 → slug：去掉 YYYY-MM- 前缀和 .mdx 后缀（导出供 RSS 脚本等复用） */
export function filenameToSlug(filename: string): string {
  return filename
    .replace(/^\d{4}-\d{2}-/, '')
    .replace(/\.mdx$/, '');
}

export function extractPostHeadings(content: string): string[] {
  return Array.from(content.matchAll(/^#{2,3}\s+(.+)$/gm))
    .map((match) => match[1])
    .map((heading) => heading.replace(/\s+#+$/, '').trim())
    .filter(Boolean);
}

function stripMdxForSearch(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[{}[\]()*_~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractPostExcerpt(content: string, maxLength = 180): string {
  const text = stripMdxForSearch(content);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function buildPostSearchText(
  post: Pick<PostFrontmatter, 'title' | 'description' | 'tags' | 'category' | 'series'>,
  content: string,
): string {
  const headings = extractPostHeadings(content).join(' ');
  const excerpt = extractPostExcerpt(content);
  return [
    post.title,
    post.description,
    post.category,
    post.series,
    ...post.tags,
    headings,
    excerpt,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 读取并解析单篇文章（含 frontmatter zod 校验） */
function readPostFile(filename: string): PostFull {
  const source = getContentSource();
  const relativePath = `${CONTENT_DIR.blog}/${filename}`;
  const raw = source.readFile(relativePath);
  if (raw === null) {
    throw new Error(`[posts.ts] 文件不存在: ${relativePath}`);
  }
  const { data, content } = parseFrontmatter(raw);

  // Zod 校验：类型 + 格式 + 必填一次性完成
  const parsed = postFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`[内容校验失败] ${relativePath}: ${issues}`);
  }

  const frontmatter: PostFrontmatter = parsed.data;
  const normalizedFrontmatter: PostFrontmatter = {
    ...frontmatter,
    category: frontmatter.category ?? inferCategory(frontmatter.tags) ?? undefined,
  };

  const stats = readingTime(content);
  const headings = extractPostHeadings(content);

  return {
    ...normalizedFrontmatter,
    slug: filenameToSlug(filename),
    readingTime: stats.text,
    wordCount: stats.words,
    excerpt: extractPostExcerpt(content),
    headings,
    searchText: buildPostSearchText(normalizedFrontmatter, content),
    content,
  };
}

/** 是否应该在当前环境展示（生产环境过滤草稿） */
function isVisible(post: PostFrontmatter): boolean {
  if (process.env.NODE_ENV === 'production') {
    return post.published !== false;
  }
  return true; // 开发环境默认显示草稿
}

const _cache = createCache<PostFull[]>({ watchPath: CONTENT_DIR.blog });

/** 获取全部文章（按日期倒序），带内存缓存避免重复读盘 */
export function getAllPosts(): PostMeta[] {
  const source = getContentSource();
  const cache = _cache.getOrCompute(() => {
    const filenames = source.readDir(CONTENT_DIR.blog);
    if (filenames === null) {
      console.warn(`[posts.ts] 内容目录不存在: ${CONTENT_DIR.blog}`);
      return [];
    }
    return filenames
      .filter((f) => f.endsWith('.mdx'))
      .map(readPostFile);
  });

  return cache
    .filter(isVisible)
    .sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return a.slug.localeCompare(b.slug); // 同日期按 slug 排序保证确定性
    })
    .map(({ content: _content, ...meta }) => meta); // 列表场景不需要正文
}

/** 获取置顶文章（首页用） */
export function getFeaturedPosts(): PostMeta[] {
  return getAllPosts().filter((p) => p.featured);
}

/** 根据 slug 获取单篇完整文章（含正文），找不到返回 null */
export function getPostBySlug(slug: string): PostFull | null {
  getAllPosts(); // 确保缓存已填充
  const cache = _cache.get() ?? [];
  const post = cache.find((p) => p.slug === slug && isVisible(p));
  return post ?? null;
}

/** 用于 generateStaticParams */
export function getAllPostSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

/** 按标签筛选 */
export function getPostsByTag(tagName: string): PostMeta[] {
  return getAllPosts().filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tagName.toLowerCase())
  );
}

/** 上一篇/下一篇（按日期相邻） */
export function getAdjacentPosts(slug: string): {
  prev: PostMeta | null;
  next: PostMeta | null;
} {
  const all = getAllPosts(); // 已按日期倒序
  const index = all.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };

  return {
    prev: all[index + 1] ?? null,
    next: all[index - 1] ?? null,
  };
}

export function getRelatedPosts(slug: string, limit = 3): PostMeta[] {
  const current = getPostBySlug(slug);
  if (!current) return [];

  const currentTags = new Set(current.tags.map((tag) => tag.toLowerCase()));
  return getAllPosts()
    .filter((post) => post.slug !== slug)
    .map((post) => {
      const sharedTags = post.tags.filter((tag) => currentTags.has(tag.toLowerCase())).length;
      const sameCategory = current.category && post.category === current.category ? 1 : 0;
      const sameSeries = current.series && post.series === current.series ? 2 : 0;
      return {
        post,
        score: sharedTags * 3 + sameCategory + sameSeries,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.post.date !== b.post.date) return a.post.date > b.post.date ? -1 : 1;
      return a.post.slug.localeCompare(b.post.slug);
    })
    .slice(0, limit)
    .map((item) => item.post);
}

export function getSeriesPosts(slug: string): PostMeta[] {
  const current = getPostBySlug(slug);
  if (!current?.series) return [];

  return getAllPosts()
    .filter((post) => post.series === current.series)
    .sort((a, b) => {
      const orderA = a.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      if (a.date !== b.date) return a.date > b.date ? -1 : 1;
      return a.slug.localeCompare(b.slug);
    });
}

/** 分页 */
export function getPaginatedPosts(page: number, pageSize: number) {
  const all = getAllPosts();
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    posts: all.slice(start, start + pageSize),
    currentPage: safePage,
    totalPages,
    totalPosts: all.length,
  };
}
