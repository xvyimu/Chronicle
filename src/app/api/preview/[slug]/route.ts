import { NextResponse } from 'next/server';
import { getPostBySlug } from '@/server/content';
import { checkPreviewRateLimit, clientKeyFromRequest } from '@/server/search';

/**
 * G3 popover preview endpoint.
 * Returns lightweight post metadata for wikilink hover cards.
 * Body MDX is intentionally excluded to keep payload small.
 *
 * Public, unauthenticated: published metadata only (drafts filtered in prod).
 * Process rate-limit is best-effort per isolate — not a global enum shield.
 * Ops boundary: docs/ops/public-api-rate-limit-boundary.md (CH-CR-002).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const key = clientKeyFromRequest(request);
    const limitState = checkPreviewRateLimit(key);
    if (!limitState.ok) {
      return NextResponse.json(
        { error: 'rate limit exceeded', code: 'RATE_LIMITED' },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.max(1, Math.ceil((limitState.resetMs - Date.now()) / 1000)),
            ),
            'X-RateLimit-Remaining': '0',
            'Cache-Control': 'no-store',
          },
        },
      );
    }

    const { slug } = await params;
    const post = await getPostBySlug(slug);
    if (!post) {
      return NextResponse.json(
        { error: 'not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.date,
        category: post.category ?? null,
        tags: post.tags,
      },
      {
        headers: {
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: 'preview unavailable', code: 'SERVER_ERROR' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
}
