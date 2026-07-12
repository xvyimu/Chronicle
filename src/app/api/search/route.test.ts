import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PostMeta } from '@/types';

const MOCK_POSTS: PostMeta[] = [
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

vi.mock('@/lib/posts', () => ({
  getAllPosts: () => MOCK_POSTS,
}));

import { GET } from './route';

function requestFor(path: string) {
  return new Request(`http://localhost${path}`);
}

describe('GET /api/search', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty results for blank q', async () => {
    const res = await GET(requestFor('/api/search?q='));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ query: '', results: [], total: 0, source: 'server' });
  });

  it('returns ranked hits for a matching query', async () => {
    const res = await GET(requestFor('/api/search?q=Redis'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('server');
    expect(body.total).toBeGreaterThan(0);
    expect(body.results[0].item.slug).toBe('redis-caching-strategies');
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=60');
  });

  it('rejects oversized queries', async () => {
    const q = 'x'.repeat(101);
    const res = await GET(requestFor(`/api/search?q=${q}`));
    expect(res.status).toBe(400);
  });

  it('clamps limit to SEARCH_MAX_LIMIT', async () => {
    const res = await GET(requestFor('/api/search?q=Redis&limit=999'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results.length).toBeLessThanOrEqual(20);
  });
});
