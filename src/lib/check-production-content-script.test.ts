import { describe, expect, it, vi } from 'vitest';

import {
  buildExpectations,
  checkExpectations,
  checkPage,
  fetchResponseWithRetry,
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

  it('builds an encoded server-search JSON expectation for that post', () => {
    const search = buildExpectations(BASE_URL).find(({ label }) => label === 'search');

    expect(search?.path).toMatch(/^\/api\/search\?q=.+/u);
    expect(search?.path).not.toContain(' ');
    expect(search?.contentTypeIncludes).toBe('application/json');
    expect(search?.json).toEqual({
      source: 'server',
      resultSlug: expect.any(String),
    });
  });

  it('validates the public SearchHit JSON shape returned by the search route', async () => {
    const search = buildExpectations(BASE_URL).find(({ label }) => label === 'search');
    const resultSlug = search?.json?.resultSlug;
    const failures = await checkPage(BASE_URL, search!, {
      attempts: 1,
      fetchImpl: async () =>
        response(
          JSON.stringify({
            source: 'server',
            results: [{ item: { slug: resultSlug } }],
          }),
          { 'content-type': 'application/json; charset=utf-8' },
        ),
    });

    expect(failures).toEqual([]);
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
});
