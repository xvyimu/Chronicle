import type { PostMeta } from '@/types';

export type SearchMatch = {
  key?: string;
  value?: string;
  indices: readonly [number, number][];
};

export type SearchHit = {
  item: PostMeta;
  matches: readonly SearchMatch[];
  score?: number;
};

export type SearchResponse = {
  query: string;
  results: SearchHit[];
  total: number;
  source: 'server';
};
