import Fuse from 'fuse.js';
import type { IFuseOptions, FuseResultMatch } from 'fuse.js';
import type { SearchDoc } from './types';

/**
 * Fuse 权重：标题 > 标签/分类 > 描述。
 * 20 篇规模，客户端内存索引足够；>200 篇时评估服务端方案（ADR-0006）。
 */
const FUSE_OPTIONS: IFuseOptions<SearchDoc> = {
  keys: [
    { name: 'title', weight: 0.5 },
    { name: 'tags', weight: 0.25 },
    { name: 'category', weight: 0.15 },
    { name: 'description', weight: 0.1 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 1,
  // R14：结果面板按 Fuse matches 区间渲染词高亮；fuse 按字段名回带区间。
  includeMatches: true,
};

/** 单次搜索返回条数上限。 */
export const SEARCH_RESULT_LIMIT = 8;
/** 查询最大长度（防超长输入）。 */
export const SEARCH_MAX_QUERY_LENGTH = 80;

/** Fuse 返回的单字段匹配区间（直接复用其类型，indices 为闭区间数组）。 */
export type MatchRange = FuseResultMatch;

/** 搜索结果：文档 + 各字段匹配区间（供词高亮）。 */
export type SearchResult = {
  item: SearchDoc;
  matches: ReadonlyArray<MatchRange>;
};

/**
 * 对文档数组执行一次搜索。
 * @param docs 搜索文档；空数组直接返回空
 * @param query 原始查询，内部 trim 并截断
 * @param limit 返回上限，默认 SEARCH_RESULT_LIMIT
 */
export function searchDocs(
  docs: SearchDoc[],
  query: string,
  limit: number = SEARCH_RESULT_LIMIT,
): SearchResult[] {
  const q = query.trim().slice(0, SEARCH_MAX_QUERY_LENGTH);
  if (!q || docs.length === 0) return [];
  const fuse = new Fuse(docs, FUSE_OPTIONS);
  return fuse.search(q, { limit }).map((r) => ({
    item: r.item,
    matches: r.matches ?? [],
  }));
}
