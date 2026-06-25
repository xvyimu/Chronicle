import { parseFrontmatter } from './parse-frontmatter';
import readingTime from 'reading-time';
import { z } from 'zod';
import { PostFrontmatter, PostMeta, PostFull } from '@/types';
import { CONTENT_DIR } from './constants';
import { getContentSource } from './content-source';
import { createCache } from './cache';

/** Zod schema for post frontmatter — consistent with projects.ts validation */
const postFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date 必须为 YYYY-MM-DD 格式'),
  tags: z.array(z.string()).optional().default([]),
  published: z.boolean().optional().default(true),
  featured: z.boolean().optional().default(false),
  image: z.string()
    .refine(
      (v) => !v || /^https?:\/\//.test(v) || v.startsWith('/'),
      'image 必须是 http(s):// URL 或 / 开头的绝对路径',
    )
    .optional(),
});

/** 文件名 → slug：去掉 YYYY-MM- 前缀和 .mdx 后缀（导出供 RSS 脚本等复用） */
export function filenameToSlug(filename: string): string {
  return filename
    .replace(/^\d{4}-\d{2}-/, '')
    .replace(/\.mdx$/, '');
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

  const stats = readingTime(content);

  return {
    ...frontmatter,
    slug: filenameToSlug(filename),
    readingTime: stats.text,
    wordCount: stats.words,
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
