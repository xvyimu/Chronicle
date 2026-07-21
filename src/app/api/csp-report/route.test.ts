import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CSP_REPORT_RATE_LIMIT_MAX, resetSearchRateLimitForTests } from '@/server/search';
import { POST } from './route';

function reportUriRequest(body: unknown, headers?: HeadersInit) {
  return new Request('http://localhost/api/csp-report', {
    method: 'POST',
    headers: { 'content-type': 'application/csp-report', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/csp-report', () => {
  beforeEach(() => {
    resetSearchRateLimitForTests();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts a report-uri payload and returns 204 without a body', async () => {
    const res = await POST(
      reportUriRequest({
        'csp-report': {
          'document-uri': 'https://incca.ccwu.cc/blog/x',
          'violated-directive': "script-src 'self'",
          'blocked-uri': 'https://evil.example/inject.js',
        },
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.text()).toBe('');
    expect(console.warn).toHaveBeenCalledWith(
      '[csp-report]',
      expect.stringContaining('evil.example'),
    );
  });

  it('accepts a Reporting API (report-to) array payload', async () => {
    const res = await POST(
      reportUriRequest(
        [
          {
            type: 'csp-violation',
            body: {
              documentURL: 'https://incca.ccwu.cc/',
              effectiveDirective: 'script-src-elem',
              blockedURL: 'inline',
            },
          },
        ],
        { 'content-type': 'application/reports+json' },
      ),
    );
    expect(res.status).toBe(204);
    expect(console.warn).toHaveBeenCalledWith(
      '[csp-report]',
      expect.stringContaining('script-src-elem'),
    );
  });

  it('only logs whitelisted fields, never the raw attacker-controlled body', async () => {
    await POST(
      reportUriRequest({
        'csp-report': {
          'document-uri': 'https://incca.ccwu.cc/',
          'violated-directive': "script-src 'self'",
          'blocked-uri': 'https://evil.example/x.js',
          secret: 'should-not-be-logged',
          __proto__: { polluted: true },
        },
      }),
    );
    const logged = vi.mocked(console.warn).mock.calls[0]?.[1] as string;
    expect(logged).not.toContain('should-not-be-logged');
    expect(logged).not.toContain('polluted');
  });

  it('swallows malformed JSON and still returns 204', async () => {
    const res = await POST(reportUriRequest('{ not json'));
    expect(res.status).toBe(204);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('drops oversized payloads without logging', async () => {
    const huge = 'x'.repeat(20_000);
    const res = await POST(reportUriRequest({ 'csp-report': { 'document-uri': huge } }));
    expect(res.status).toBe(204);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('returns 429 with Retry-After after the report window is exhausted', async () => {
    const headers = { 'x-vercel-forwarded-for': '203.0.113.44' };
    const payload = {
      'csp-report': { 'violated-directive': "script-src 'self'" },
    };

    for (let i = 0; i < CSP_REPORT_RATE_LIMIT_MAX; i++) {
      const ok = await POST(reportUriRequest(payload, headers));
      expect(ok.status).toBe(204);
    }

    const limited = await POST(reportUriRequest(payload, headers));
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).toBeTruthy();
    expect(limited.headers.get('Cache-Control')).toBe('no-store');
  });
});
