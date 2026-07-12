import { useEffect, useMemo, useState } from 'react';
import type Fuse from 'fuse.js';
import type { IFuseOptions } from 'fuse.js';
import type { PostMeta } from '@/types';

export type FuseMatch = {
  key?: string;
  value?: string;
  indices: readonly [number, number][];
};

export type SearchResult = {
  item: PostMeta;
  matches: readonly FuseMatch[];
};

/** Shared Fuse options — also used by build-time index scripts if added later. */
export const FUSE_SEARCH_OPTIONS: IFuseOptions<PostMeta> = {
  keys: [
    { name: 'title', weight: 0.36 },
    { name: 'description', weight: 0.22 },
    { name: 'excerpt', weight: 0.22 },
    { name: 'tags', weight: 0.16 },
    { name: 'category', weight: 0.1 },
    { name: 'series', weight: 0.08 },
    { name: 'headings', weight: 0.05 },
    { name: 'searchText', weight: 0.03 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
};

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

export function useFuseSearch(
  posts: PostMeta[],
  query: string,
): {
  fuseReady: boolean;
  results: SearchResult[];
} {
  const [fuse, setFuse] = useState<Fuse<PostMeta> | null>(() => {
    if (!fuseConstructor) return null;
    return getOrCreateFuse(posts, fuseConstructor);
  });

  // Preload and rebuild Fuse.js whenever posts identity changes.
  // Instance is cached per posts array reference to keep first keystroke hot.
  useEffect(() => {
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
    return fuse.search(query.trim(), { limit: 10 }).map((result) => ({
      item: result.item,
      matches: (result.matches ?? []) as FuseMatch[],
    }));
  }, [query, fuse]);

  return {
    fuseReady: Boolean(fuse),
    results,
  };
}
