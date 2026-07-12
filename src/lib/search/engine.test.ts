import { describe, it, expect } from 'vitest';
import type { PostMeta } from '@/types';
import { searchPosts, searchPostsCached } from './engine';
import { FUSE_SEARCH_OPTIONS, SEARCH_RESULT_LIMIT } from './options';

const MOCK_POSTS: PostMeta[] = [
  {
    title: 'Next.js App Router Guide',
    description: 'Frontmatter summary for App Router',
    date: '2026-06-23',
    tags: ['Next.js', 'React'],
    published: true,
    featured: true,
    slug: 'nextjs-app-router',
    readingTime: '5 min read',
    wordCount: 1200,
    excerpt: 'A comprehensive guide to App Router',
    headings: ['Routing', 'Streaming'],
    searchText: 'Next.js App Router Guide Routing Streaming React Server Components',
  },
  {
    title: 'Redis Caching Strategies',
    description: 'Deep dive into Redis caching patterns',
    date: '2026-06-20',
    tags: ['Redis', '后端'],
    published: true,
    featured: false,
    slug: 'redis-caching-strategies',
    readingTime: '8 min read',
    wordCount: 2000,
    excerpt: 'Deep dive into Redis caching patterns',
    headings: ['Cache Aside', 'Invalidation'],
    searchText: 'Redis Caching Strategies Cache Aside Invalidation backend cache',
  },
];

describe('searchPosts', () => {
  it('returns empty for blank query', () => {
    expect(searchPosts(MOCK_POSTS, '   ')).toEqual([]);
  });

  it('ranks title matches and includes match indices', () => {
    const hits = searchPosts(MOCK_POSTS, 'Redis');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].item.slug).toBe('redis-caching-strategies');
    expect(hits[0].matches.some((m) => m.key === 'title')).toBe(true);
  });

  it('respects limit', () => {
    const hits = searchPosts(MOCK_POSTS, 'a', 1);
    expect(hits.length).toBeLessThanOrEqual(1);
  });

  it('defaults to SEARCH_RESULT_LIMIT', () => {
    expect(SEARCH_RESULT_LIMIT).toBe(10);
  });
});

describe('searchPostsCached', () => {
  it('returns the same ranking as searchPosts for a stable posts array', () => {
    const a = searchPosts(MOCK_POSTS, 'Invalidation');
    const b = searchPostsCached(MOCK_POSTS, 'Invalidation');
    expect(b.map((h) => h.item.slug)).toEqual(a.map((h) => h.item.slug));
  });
});

describe('FUSE_SEARCH_OPTIONS', () => {
  it('keeps title as the highest-weighted field', () => {
    const keys = FUSE_SEARCH_OPTIONS.keys as Array<{ name: string; weight: number }>;
    const title = keys.find((key) => key.name === 'title');
    expect(title?.weight).toBeGreaterThan(0.3);
    expect(FUSE_SEARCH_OPTIONS.includeMatches).toBe(true);
    expect(FUSE_SEARCH_OPTIONS.minMatchCharLength).toBe(2);
  });
});
