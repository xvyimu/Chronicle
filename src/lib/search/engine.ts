import Fuse from 'fuse.js';
import type { FuseResult } from 'fuse.js';
import type { PostMeta } from '@/types';
import { FUSE_SEARCH_OPTIONS, SEARCH_RESULT_LIMIT } from './options';
import { toSearchResultItem } from './project';
import type { SearchHit, SearchMatch } from './types';

function toHits(results: FuseResult<PostMeta>[]): SearchHit[] {
  return results.map((result) => ({
    item: toSearchResultItem(result.item),
    matches: (result.matches ?? []) as SearchMatch[],
    score: result.score,
  }));
}

/**
 * Pure search over an in-memory PostMeta list.
 * Hits always project to SearchResultItem (no searchText on the wire).
 */
export function searchPosts(
  posts: PostMeta[],
  query: string,
  limit: number = SEARCH_RESULT_LIMIT,
): SearchHit[] {
  const q = query.trim();
  if (!q || posts.length === 0) return [];

  const fuse = new Fuse(posts, FUSE_SEARCH_OPTIONS);
  return toHits(fuse.search(q, { limit }));
}

/**
 * Module-level Fuse cache keyed by posts array identity.
 * getAllPosts() returns a stable cached reference in production, so this stays hot.
 * Projection happens after search so WeakMap keys stay full PostMeta[].
 */
const fuseByPosts = new WeakMap<PostMeta[], Fuse<PostMeta>>();

export function searchPostsCached(
  posts: PostMeta[],
  query: string,
  limit: number = SEARCH_RESULT_LIMIT,
): SearchHit[] {
  const q = query.trim();
  if (!q || posts.length === 0) return [];

  let fuse = fuseByPosts.get(posts);
  if (!fuse) {
    fuse = new Fuse(posts, FUSE_SEARCH_OPTIONS);
    fuseByPosts.set(posts, fuse);
  }

  return toHits(fuse.search(q, { limit }));
}
