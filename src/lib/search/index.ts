/**
 * search/ — shared blog search core.
 *
 *   options.ts  — Fuse weights / limits (single source of truth)
 *   types.ts    — wire types for API + client
 *   engine.ts   — pure searchPosts / searchPostsCached
 */
export {
  FUSE_SEARCH_OPTIONS,
  SEARCH_RESULT_LIMIT,
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MAX_LIMIT,
} from './options';
export type { SearchHit, SearchMatch, SearchResponse } from './types';
export { searchPosts, searchPostsCached } from './engine';
