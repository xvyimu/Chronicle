import type { IFuseOptions } from 'fuse.js';
import type { PostMeta } from '@/types';

/** Shared Fuse options — client hook, Route Handler, and tests all import this. */
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

export const SEARCH_RESULT_LIMIT = 10;
export const SEARCH_MAX_QUERY_LENGTH = 100;
export const SEARCH_MAX_LIMIT = 20;
