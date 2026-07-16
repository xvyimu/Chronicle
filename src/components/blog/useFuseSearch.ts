import { useEffect, useMemo, useState } from 'react';
import type Fuse from 'fuse.js';
import type { PostMeta } from '@/types';
import {
  FUSE_SEARCH_OPTIONS,
  SEARCH_RESULT_LIMIT,
  toSearchResultItem,
  toSearchResultMatches,
  type SearchHit,
  type SearchMatch,
} from '@/lib/search';

export type FuseMatch = SearchMatch;
export type SearchResult = SearchHit;

/** Re-export shared options so existing imports keep working. */
export { FUSE_SEARCH_OPTIONS, SEARCH_RESULT_LIMIT };

const fuseCache = new WeakMap<PostMeta[], Fuse<PostMeta>>();
let fuseConstructor: (typeof import('fuse.js'))['default'] | null = null;
let fuseLoadPromise: Promise<(typeof import('fuse.js'))['default']> | null = null;

function loadFuse() {
  if (fuseConstructor) return Promise.resolve(fuseConstructor);
  if (!fuseLoadPromise) {
    fuseLoadPromise = import('fuse.js')
      .then(({ default: FuseLib }) => {
        fuseConstructor = FuseLib;
        return FuseLib;
      })
      .catch((err) => {
        fuseLoadPromise = null;
        throw err;
      });
  }
  return fuseLoadPromise;
}

function getOrCreateFuse(posts: PostMeta[], FuseLib: typeof import('fuse.js').default) {
  const cached = fuseCache.get(posts);
  if (cached) return cached;
  const instance = new FuseLib(posts, FUSE_SEARCH_OPTIONS);
  fuseCache.set(posts, instance);
  return instance;
}

/**
 * Client-side Fuse over an in-memory PostMeta array.
 * Prefer this when the page already embeds posts (tests / offline).
 * Production blog page uses useServerSearch instead to drop payload weight.
 * Results project to SearchResultItem for parity with /api/search.
 */
export function useFuseSearch(
  posts: PostMeta[],
  query: string,
): {
  fuseReady: boolean;
  results: SearchResult[];
} {
  const [fuse, setFuse] = useState<Fuse<PostMeta> | null>(() => {
    if (posts.length === 0 || !fuseConstructor) return null;
    return getOrCreateFuse(posts, fuseConstructor);
  });

  useEffect(() => {
    if (posts.length === 0) {
      setFuse(null);
      return;
    }

    let cancelled = false;

    loadFuse()
      .then((FuseLib) => {
        if (cancelled) return;
        setFuse(getOrCreateFuse(posts, FuseLib));
      })
      .catch((err) => {
        console.error('Fuse.js 加载失败', err);
      });

    return () => {
      cancelled = true;
    };
  }, [posts]);

  const results = useMemo(() => {
    if (!query.trim() || !fuse) return [];
    return fuse.search(query.trim(), { limit: SEARCH_RESULT_LIMIT }).map((result) => ({
      item: toSearchResultItem(result.item),
      matches: toSearchResultMatches((result.matches ?? []) as FuseMatch[]),
      score: result.score,
    }));
  }, [query, fuse]);

  return {
    fuseReady: Boolean(fuse),
    results,
  };
}
