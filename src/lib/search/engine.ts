import Fuse from 'fuse.js';
import type { PostMeta } from '@/types';
import { FUSE_SEARCH_OPTIONS, SEARCH_RESULT_LIMIT } from './options';
import type { SearchHit, SearchMatch } from './types';

/**
 * Pure search over an in-memory PostMeta list.
 * Used by /api/search and any future build-time index consumers.
 * Client path keeps its own lazy Fuse instance via useFuseSearch for zero-latency keystrokes.
 */
export function searchPosts(
  posts: PostMeta[],
  query: string,
  limit: number = SEARCH_RESULT_LIMIT,
): SearchHit[] {
  const q = query.trim();
  if (!q || posts.length === 0) return [];

  const fuse = new Fuse(posts, FUSE_SEARCH_OPTIONS);
  return fuse.search(q, { limit }).map((result) => ({
    item: result.item,
    matches: (result.matches ?? []) as SearchMatch[],
    score: result.score,
  }));
}

/**
 * Module-level Fuse cache keyed by posts array identity.
 * getAllPosts() returns a stable cached reference in production, so this stays hot.
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

  return fuse.search(q, { limit }).map((result) => ({
    item: result.item,
    matches: (result.matches ?? []) as SearchMatch[],
    score: result.score,
  }));
}
