import readingTime from 'reading-time';
import type { ContentSource } from '@/lib/content-source';
import { filesystemSource } from '@/lib/content-source';
import { CONTENT_DIR } from '@/lib/content-dirs';
import { parseFrontmatter } from '@/lib/parse-frontmatter';
import { createCache } from '@/lib/cache';
import { inferCategory } from '@/lib/category-rules';
import { postFrontmatterSchema } from '@/lib/schemas/post-frontmatter';
import type { PostFull, PostMeta } from '@/types';
import {
  extractPostHeadings,
  extractPostExcerpt,
  buildPostSearchText,
} from './search-text';

/**
 * Repository 层 — 缓存 + 读取 + frontmatter 校验 + reading-time 计算.
 *
 * 通过 createPostRepository(source) 注入 ContentSource, 测试可传 in-memory source.
 */

/** 文件名 → slug：去掉 YYYY-MM- 前缀和 .mdx 后缀 */
export function filenameToSlug(filename: string): string {
  return filename.replace(/^\d{4}-\d{2}-/, '').replace(/\.mdx$/, '');
}

/** 读取并解析单篇文章 (含 frontmatter zod 校验) */
function readPostFile(source: ContentSource, filename: string): PostFull {
  const relativePath = `${CONTENT_DIR.blog}/${filename}`;
  const raw = source.readFile(relativePath);
  if (raw === null) {
    throw new Error(`[posts/repository] 文件不存在: ${relativePath}`);
  }
  const { data, content } = parseFrontmatter(raw);

  const parsed = postFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`[内容校验失败] ${relativePath}: ${issues}`);
  }

  const frontmatter = parsed.data;
  const normalizedFrontmatter = {
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

/** 是否应该在当前环境展示 (生产环境过滤草稿) */
function isVisible(post: PostFull): boolean {
  if (process.env.NODE_ENV === 'production') {
    return post.published !== false;
  }
  return true;
}

export interface PostRepository {
  /** 获取全部文章 (按日期倒序), 不含正文 */
  getAllPosts(): PostMeta[];
  /** 根据 slug 获取单篇完整文章 (含正文) */
  getPostBySlug(slug: string): PostFull | null;
  /** 用于 generateStaticParams */
  getAllPostSlugs(): string[];
  /** 获取置顶文章 */
  getFeaturedPosts(): PostMeta[];
}

/**
 * 创建一个 PostRepository, 内部带缓存.
 *
 * @param source ContentSource 实例 (filesystemSource 或 in-memory source)
 */
export function createPostRepository(source: ContentSource): PostRepository {
  const cache = createCache<PostFull[]>({
    watchPath: CONTENT_DIR.blog,
    source,
  });
  let metadataSource: PostFull[] | null = null;
  let metadataCache: PostMeta[] | null = null;
  let metadataVisibility: boolean | null = null;

  function loadAll(): PostFull[] {
    return cache.getOrCompute(() => {
      const filenames = source.readDir(CONTENT_DIR.blog);
      if (filenames === null) {
        const message = `[posts/repository] 内容目录不存在: ${CONTENT_DIR.blog}`;
        if (process.env.NODE_ENV === 'production') throw new Error(message);
        console.warn(message);
        return [];
      }
      const posts = filenames
        .filter((f) => f.endsWith('.mdx'))
        .map((filename) => readPostFile(source, filename));
      const seenSlugs = new Set<string>();
      for (const post of posts) {
        if (seenSlugs.has(post.slug)) {
          throw new Error(`[posts/repository] 重复 slug: ${post.slug}`);
        }
        seenSlugs.add(post.slug);
      }
      return posts;
    });
  }

  function getAllPosts(): PostMeta[] {
    const allPosts = loadAll();
    const visibleInProduction = process.env.NODE_ENV === 'production';
    if (metadataSource === allPosts && metadataVisibility === visibleInProduction) {
      return metadataCache ?? [];
    }

    metadataSource = allPosts;
    metadataVisibility = visibleInProduction;
    metadataCache = allPosts
      .filter(isVisible)
      .sort((a, b) => {
        if (a.date < b.date) return 1;
        if (a.date > b.date) return -1;
        return a.slug.localeCompare(b.slug);
      })
      .map(({ content: _content, ...meta }) => meta);
    return metadataCache;
  }

  function getPostBySlug(slug: string): PostFull | null {
    loadAll();
    const all = cache.get() ?? [];
    return all.find((p) => p.slug === slug && isVisible(p)) ?? null;
  }

  function getAllPostSlugs(): string[] {
    return getAllPosts().map((p) => p.slug);
  }

  function getFeaturedPosts(): PostMeta[] {
    return getAllPosts().filter((p) => p.featured);
  }

  return { getAllPosts, getPostBySlug, getAllPostSlugs, getFeaturedPosts };
}

/**
 * 默认 PostRepository 实例 (基于 filesystemSource).
 * app/ 调用方使用此实例, 测试使用 createPostRepository(inMemorySource).
 */
export const postRepository = createPostRepository(filesystemSource);
