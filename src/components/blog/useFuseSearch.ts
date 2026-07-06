import { useEffect, useMemo, useState } from 'react';
import type Fuse from 'fuse.js';
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

export function useFuseSearch(
  posts: PostMeta[],
  query: string,
): {
  fuseReady: boolean;
  results: SearchResult[];
} {
  const [fuse, setFuse] = useState<Fuse<PostMeta> | null>(null);

  const fuseOptions = useMemo(
    () => ({
      keys: [
        { name: 'title', weight: 0.36 },
        { name: 'description', weight: 0.22 },
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
    }),
    [],
  );

  // Preload and rebuild Fuse.js whenever posts changes. This keeps the first
  // search responsive while preserving a small client bundle through dynamic import.
  useEffect(() => {
    let cancelled = false;

    import('fuse.js')
      .then(({ default: FuseLib }) => {
        if (cancelled) return;
        setFuse(new FuseLib(posts, fuseOptions));
      })
      .catch((err) => {
        console.error('Fuse.js 加载失败', err);
      });

    return () => {
      cancelled = true;
    };
  }, [posts, fuseOptions]);

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
