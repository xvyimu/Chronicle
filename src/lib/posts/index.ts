/**
 * posts/ — 文章数据访问层 (拆分自原 posts.ts).
 *
 * 分层:
 *   schema.ts       — zod schema + 类型派生
 *   repository.ts   — 缓存 + 读取 + frontmatter 校验
 *   query.ts        — 筛选/排序/分页 (纯函数)
 *   search-text.ts  — MDX 清洗 (纯函数)
 *
 * barrel re-export 保持与原 posts.ts 相同的公共 API, 调用方零改动.
 */

import { postRepository } from './repository';
import type { PostMeta, PostFull } from '@/types';
import {
  filterByTag,
  getAdjacent,
  getRelated,
  getSeries,
  paginate,
} from './query';

// schema
export { postFrontmatterSchema } from './schema';
export type { PostFrontmatterInput, PostFrontmatterParsed } from './schema';

// repository (工厂 + 默认实例)
export { filenameToSlug, createPostRepository, postRepository } from './repository';
export type { PostRepository } from './repository';

// search-text
export {
  extractPostHeadings,
  extractPostExcerpt,
  buildPostSearchText,
} from './search-text';

// query 纯函数
export {
  comparePostsByDate,
  sortPostsByDateDesc,
} from './query';

/**
 * 向后兼容包装器 — 委托给默认 postRepository 实例.
 * 这些函数保持与原 posts.ts 相同的签名, app/ 调用方零改动.
 */
export function getAllPosts(): PostMeta[] {
  return postRepository.getAllPosts();
}

export function getPostBySlug(slug: string): PostFull | null {
  return postRepository.getPostBySlug(slug);
}

export function getAllPostSlugs(): string[] {
  return postRepository.getAllPostSlugs();
}

export function getFeaturedPosts(): PostMeta[] {
  return postRepository.getFeaturedPosts();
}

export function getPostsByTag(tagName: string): PostMeta[] {
  return filterByTag(postRepository.getAllPosts(), tagName);
}

export function getAdjacentPosts(slug: string): {
  prev: PostMeta | null;
  next: PostMeta | null;
} {
  return getAdjacent(postRepository.getAllPosts(), slug);
}

export function getRelatedPosts(slug: string, limit = 3): PostMeta[] {
  return getRelated(
    postRepository.getAllPosts(),
    slug,
    postRepository.getPostBySlug(slug),
    limit,
  );
}

export function getSeriesPosts(slug: string): PostMeta[] {
  return getSeries(
    postRepository.getAllPosts(),
    postRepository.getPostBySlug(slug),
  );
}

export function getPaginatedPosts(page: number, pageSize: number) {
  const result = paginate(postRepository.getAllPosts(), page, pageSize);
  // 保持与原 posts.ts 相同的字段名 (posts/totalPosts, 而非 items/totalItems)
  return {
    posts: result.items,
    currentPage: result.currentPage,
    totalPages: result.totalPages,
    totalPosts: result.totalItems,
  };
}
