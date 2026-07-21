/**
 * posts/ — 文章数据访问层.
 *
 * 分层:
 *   repository.ts   — 缓存 + 读取 + frontmatter 校验
 *   query.ts        — 筛选/排序/分页 (纯函数)
 *   search-text.ts  — MDX 清洗 (纯函数)
 *   wikilink.ts     — wikilink 纯解析
 *   link-graph.ts   — 反链索引 + fail-closed 校验
 *
 * barrel re-export 提供统一的公共 API, app/ 调用方统一从 '@/lib/posts' 导入.
 * remark 插件不从此 barrel 导出（仅 MdxContent 直接导入）。
 */

import { postRepository } from './repository';
import type { PostMeta, PostFull } from '@/types';
import { filterByTag, getAdjacent, getRelated, getSeries, paginate } from './query';

// repository (工厂 + 默认实例, 测试可用 createPostRepository 注入)
export { createPostRepository, filenameToSlug, postRepository } from './repository';
export type { PostRepository } from './repository';

// search-text (纯函数, 用于搜索索引)
export {
  extractPostHeadings,
  extractPostExcerpt,
  buildPostSearchText,
} from './search-text';

// wikilink pure helpers
export { normalizeWikilinkSlug, wikilinkHref, extractWikilinks } from './wikilink';
export type { WikilinkMatch } from './wikilink';

// link graph / backlinks
export {
  getBacklinks,
  getGardenGraph,
  getNeighbors,
  assertWikilinksValid,
  buildBacklinkIndex,
  buildGardenEdges,
  createLinkGraph,
} from './link-graph';
export type {
  GardenGraph,
  GardenGraphEdge,
  GardenGraphNode,
  NeighborBundle,
} from './link-graph';
export { layoutForceGraph, filterGardenGraph } from './force-layout';
export {
  serializeGardenView,
  parseGardenView,
  mergePositions,
  loadGardenViewFromStorage,
  saveGardenViewToStorage,
  clearGardenViewStorage,
  GARDEN_VIEW_STORAGE_KEY,
} from './garden-view-storage';
export type { GardenSavedView, GardenViewPosition } from './garden-view-storage';

/**
 * 公共 API — 委托给默认 postRepository 实例.
 * app/ 调用方统一使用这些函数.
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
  return getSeries(postRepository.getAllPosts(), postRepository.getPostBySlug(slug));
}

export function getPaginatedPosts(page: number, pageSize: number) {
  const result = paginate(postRepository.getAllPosts(), page, pageSize);
  return {
    posts: result.items,
    currentPage: result.currentPage,
    totalPages: result.totalPages,
    totalPosts: result.totalItems,
  };
}
