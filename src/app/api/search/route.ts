import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/posts';
import {
  searchPostsCached,
  SEARCH_MAX_LIMIT,
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_RESULT_LIMIT,
  type SearchResponse,
} from '@/lib/search';

/**
 * GET /api/search?q=&limit=
 *
 * Server-side Fuse over the same PostMeta index as the blog list.
 * No external search engine — ~14 posts fit entirely in process memory.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQ = searchParams.get('q') ?? '';
  const q = rawQ.trim();

  if (q.length > SEARCH_MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `query exceeds ${SEARCH_MAX_QUERY_LENGTH} characters` },
      { status: 400 },
    );
  }

  const rawLimit = Number(searchParams.get('limit') ?? SEARCH_RESULT_LIMIT);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), SEARCH_MAX_LIMIT)
    : SEARCH_RESULT_LIMIT;

  if (!q) {
    const empty: SearchResponse = {
      query: '',
      results: [],
      total: 0,
      source: 'server',
    };
    return NextResponse.json(empty, {
      headers: cacheHeaders(),
    });
  }

  const posts = getAllPosts();
  const results = searchPostsCached(posts, q, limit);
  const body: SearchResponse = {
    query: q,
    results,
    total: results.length,
    source: 'server',
  };

  return NextResponse.json(body, {
    headers: cacheHeaders(),
  });
}

function cacheHeaders(): HeadersInit {
  // Content is build-time MDX; short CDN cache is safe and cuts cold latency.
  return {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  };
}
