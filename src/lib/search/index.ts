/**
 * search/ — shared blog search core.
 *
 *   options.ts    — Fuse weights / limits
 *   types.ts      — wire types for API + client
 *   project.ts    — PostMeta → SearchResultItem
 *   engine.ts     — pure searchPosts / searchPostsCached
 *   rate-limit.ts — process-local API throttle
 */
export {
  FUSE_SEARCH_OPTIONS,
  SEARCH_RESULT_LIMIT,
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MAX_LIMIT,
} from './options';
export type {
  SearchHit,
  SearchMatch,
  SearchResponse,
  SearchResultItem,
  SearchErrorBody,
} from './types';
export { toSearchResultItem } from './project';
export { searchPosts, searchPostsCached } from './engine';
export {
  checkSearchRateLimit,
  clientKeyFromRequest,
  resetSearchRateLimitForTests,
  SEARCH_RATE_LIMIT_MAX,
  SEARCH_RATE_LIMIT_WINDOW_MS,
} from './rate-limit';
