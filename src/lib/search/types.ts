/** Public search result card — no searchText / full headings payload. */
export type SearchResultItem = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category?: string;
  series?: string;
  featured?: boolean;
  excerpt: string;
};

export type SearchMatch = {
  key?: string;
  value?: string;
  indices: readonly [number, number][];
};

export type SearchHit = {
  item: SearchResultItem;
  matches: readonly SearchMatch[];
  score?: number;
};

export type SearchResponse = {
  query: string;
  results: SearchHit[];
  /** Number of results actually returned (post-limit), NOT the total match count. */
  count: number;
  source: 'server';
};

export type SearchErrorBody = {
  error: string;
  code: 'QUERY_TOO_LONG' | 'RATE_LIMITED' | 'BAD_REQUEST';
};

export type SearchErrorState =
  'bad_request' | 'network' | 'query_too_long' | 'rate_limited' | 'server';
