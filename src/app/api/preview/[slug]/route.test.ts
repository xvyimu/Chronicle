import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PostFull } from '@/types';
import { PREVIEW_RATE_LIMIT_MAX, resetSearchRateLimitForTests } from '@/server/search';

const MOCK_POST: PostFull = {
  title: 'Next.js App Router 实战',
  description: '一篇关于 App Router 的文章',
  date: '2026-06-01',
  tags: ['nextjs', 'react'],
  published: true,
  featured: false,
  slug: 'nextjs-app-router',
  readingTime: '8 min read',
  wordCount: 1500,
  excerpt: '一篇关于 App Router 的文章',
  headings: [],
  searchText: 'Next.js App Router',
  category: '前端开发',
  content: '# full body MDX that must NOT leak into the preview response',
};

vi.mock('@/server/content', () => ({
  getPostBySlug: vi.fn(),
}));

import { getPostBySlug } from '@/server/content';
import { GET } from './route';

function requestFor(slug: string, headers?: HeadersInit) {
  return new Request(`http://localhost/api/preview/${slug}`, { headers });
}

function paramsFor(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

describe('GET /api/preview/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSearchRateLimitForTests();
  });

  it('returns lightweight metadata for a known post', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(MOCK_POST as never);

    const res = await GET(
      requestFor('nextjs-app-router'),
      paramsFor('nextjs-app-router'),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({
      slug: 'nextjs-app-router',
      title: 'Next.js App Router 实战',
      description: '一篇关于 App Router 的文章',
      date: '2026-06-01',
      category: '前端开发',
      tags: ['nextjs', 'react'],
    });
    expect(body).not.toHaveProperty('content');
    expect(body).not.toHaveProperty('searchText');
    expect(body).not.toHaveProperty('headings');
    expect(res.headers.get('Cache-Control')).toBe(
      's-maxage=3600, stale-while-revalidate=86400',
    );
    expect(getPostBySlug).toHaveBeenCalledWith('nextjs-app-router');
  });

  it('returns 404 with code when the post is missing', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(null as never);

    const res = await GET(requestFor('does-not-exist'), paramsFor('does-not-exist'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: 'not found', code: 'NOT_FOUND' });
  });

  it('projects category as null when the post has none', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue({
      ...MOCK_POST,
      category: undefined,
    } as never);

    const res = await GET(
      requestFor('nextjs-app-router'),
      paramsFor('nextjs-app-router'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBeNull();
  });

  it('returns 429 with RATE_LIMITED after the preview window is exhausted', async () => {
    vi.mocked(getPostBySlug).mockResolvedValue(MOCK_POST as never);
    const headers = { 'x-vercel-forwarded-for': '203.0.113.9' };

    for (let i = 0; i < PREVIEW_RATE_LIMIT_MAX; i++) {
      const res = await GET(
        requestFor('nextjs-app-router', headers),
        paramsFor('nextjs-app-router'),
      );
      expect(res.status).toBe(200);
    }

    const limited = await GET(
      requestFor('nextjs-app-router', headers),
      paramsFor('nextjs-app-router'),
    );
    expect(limited.status).toBe(429);
    const body = await limited.json();
    expect(body.code).toBe('RATE_LIMITED');
    expect(limited.headers.get('Retry-After')).toBeTruthy();
    expect(limited.headers.get('Cache-Control')).toBe('no-store');
  });

  it('returns 500 with SERVER_ERROR when the repository throws', async () => {
    vi.mocked(getPostBySlug).mockRejectedValue(new Error('disk failed') as never);

    const res = await GET(
      requestFor('nextjs-app-router'),
      paramsFor('nextjs-app-router'),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: 'preview unavailable', code: 'SERVER_ERROR' });
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(body).not.toHaveProperty('stack');
  });
});
