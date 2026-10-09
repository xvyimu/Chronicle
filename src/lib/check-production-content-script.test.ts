import { describe, expect, it, vi } from 'vitest';

import {
  buildExpectations,
  checkExpectations,
  checkPage,
  fetchResponseWithRetry,
  isEveryPageBlocked,
  type CheckFailure,
  type PageExpectation,
} from '../../scripts/check-production-content';

const BASE_URL = 'http://127.0.0.1:3998';

function response(body: string, headers: Record<string, string> = {}) {
  return new Response(body, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', ...headers },
  });
}

describe('production content smoke script', () => {
  it('derives an About expectation from the first Markdown heading', () => {
    const about = buildExpectations(BASE_URL).find(({ label }) => label === 'about');

    expect(about?.path).toBe('/about');
    expect(about?.mustContain).toContain('关于西江月');
  });

  it('derives a representative article expectation from the first visible post', () => {
    const article = buildExpectations(BASE_URL).find(({ label }) => label === 'article');

    expect(article?.path).toMatch(/^\/blog\/[^/]+$/u);
    expect(article?.mustContain[0]).toBeTruthy();
  });

  it('derives a home-search expectation pointing at the search entry', () => {
    const search = buildExpectations(BASE_URL).find(
      ({ label }) => label === 'home-search',
    );

    expect(search?.path).toBe('/');
    expect(search?.contentTypeIncludes).toBe('text/html');
    expect(search?.mustContain).toContain('搜索文章');
  });

  it('requires a nonce strict CSP, HSTS, and nosniff on home', async () => {
    const home = buildExpectations(BASE_URL).find(({ label }) => label === 'home');
    expect(home?.requiredHeaders?.map(({ name }) => name)).toEqual([
      'content-security-policy',
      'strict-transport-security',
      'x-content-type-options',
    ]);

    const body = home?.mustContain.join(' ') ?? '';
    const failures = await checkPage(BASE_URL, home!, {
      attempts: 1,
      fetchImpl: async () =>
        response(body, {
          'content-security-policy':
            "default-src 'self'; script-src 'self' 'nonce-fixture' 'strict-dynamic'; style-src 'self' 'unsafe-inline'",
          'strict-transport-security': 'max-age=31536000; includeSubDomains',
          'x-content-type-options': 'nosniff',
        }),
    });

    expect(failures).toEqual([]);
  });

  it('turns a missing or wrong header into an actionable labeled failure', async () => {
    const home = buildExpectations(BASE_URL).find(({ label }) => label === 'home');
    const failures = await checkPage(BASE_URL, home!, {
      attempts: 1,
      fetchImpl: async () => response(home?.mustContain.join(' ') ?? ''),
    });

    expect(failures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'home',
          message: expect.stringContaining('content-security-policy'),
        }),
      ]),
    );
  });

  it('aborts a never-completing fetch at the per-attempt timeout', async () => {
    const fetchImpl = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('aborted', 'AbortError')),
            { once: true },
          );
        }),
    );

    await expect(
      fetchResponseWithRetry(`${BASE_URL}/hung`, {
        attempts: 1,
        fetchImpl,
        timeoutMs: 10,
      }),
    ).rejects.toThrow(/timed out after 10ms.*\/hung/u);
  });

  it('preserves retries and aggregates failures across expectations', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValue(response('healthy'));

    await expect(
      fetchResponseWithRetry(`${BASE_URL}/retry`, {
        attempts: 2,
        fetchImpl,
        retryDelayMs: 0,
        timeoutMs: 50,
      }),
    ).resolves.toMatchObject({ body: 'healthy', status: 200 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    const expectations: PageExpectation[] = [
      {
        label: 'first',
        path: '/first',
        contentTypeIncludes: 'text/html',
        mustContain: ['missing-first'],
      },
      {
        label: 'second',
        path: '/second',
        contentTypeIncludes: 'text/html',
        mustContain: ['missing-second'],
      },
    ];
    const failures = await checkExpectations(BASE_URL, expectations, {
      attempts: 1,
      fetchImpl: async () => response('neither marker'),
    });

    expect(failures.map(({ label }) => label)).toEqual(['first', 'second']);
  });

  it('returns 403 immediately without retrying (WAF block is not transient)', async () => {
    const fetchImpl = vi.fn(async () => new Response('forbidden', { status: 403 }));

    const result = await fetchResponseWithRetry(`${BASE_URL}/blocked`, {
      attempts: 5,
      fetchImpl,
      retryDelayMs: 0,
      timeoutMs: 50,
    });

    expect(result.status).toBe(403);
    // 403 short-circuits — no retries, no wasted CI time.
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('reports only the WAF block, not phantom content failures, on a 403 page', async () => {
    const expectation: PageExpectation = {
      label: 'home',
      path: '/',
      contentTypeIncludes: 'text/html',
      mustContain: ['some article title'],
    };

    const failures = await checkPage(BASE_URL, expectation, {
      attempts: 1,
      fetchImpl: async () => new Response('challenge page', { status: 403 }),
    });

    // One failure naming the real cause, rather than a "Missing expected
    // content" for every assertion in the expectation.
    expect(failures).toHaveLength(1);
    expect(failures[0]?.message).toContain('HTTP 403');
  });
});

describe('isEveryPageBlocked', () => {
  const expectations: PageExpectation[] = [
    { label: 'home', path: '/', contentTypeIncludes: 'text/html', mustContain: [] },
    { label: 'blog', path: '/blog', contentTypeIncludes: 'text/html', mustContain: [] },
  ];
  const blocked = (label: string): CheckFailure => ({
    label,
    message: `HTTP 403 at ${BASE_URL}/ — blocked before content could be read.`,
  });

  it('is true only when every expectation was blocked', () => {
    expect(isEveryPageBlocked(expectations, [blocked('home'), blocked('blog')])).toBe(
      true,
    );
  });

  it('is false when only some pages were blocked', () => {
    // blog loaded fine and produced no failure; home was challenged. Degrading
    // here would swallow a genuine regression on the one page that did load.
    expect(isEveryPageBlocked(expectations, [blocked('home')])).toBe(false);
  });

  it('is false when a blocked page is mixed with a real content failure', () => {
    expect(
      isEveryPageBlocked(expectations, [
        blocked('home'),
        { label: 'blog', message: 'Missing expected content "x" at /blog.' },
      ]),
    ).toBe(false);
  });

  it('is false when one label produced several failures', () => {
    // A blocked page short-circuits to exactly one failure; two failures under
    // the same label means something else went wrong alongside it.
    expect(isEveryPageBlocked(expectations, [blocked('home'), blocked('home')])).toBe(
      false,
    );
  });

  it('is false for an empty expectation list', () => {
    expect(isEveryPageBlocked([], [])).toBe(false);
  });
});
