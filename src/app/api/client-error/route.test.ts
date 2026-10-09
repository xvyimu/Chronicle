import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  CLIENT_ERROR_RATE_LIMIT_MAX,
  resetSearchRateLimitForTests,
} from '@/server/rate-limit';
import { POST } from './route';

function errorRequest(body: unknown, headers?: HeadersInit) {
  return new Request('http://localhost/api/client-error', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('POST /api/client-error', () => {
  beforeEach(() => {
    resetSearchRateLimitForTests();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts a report and returns 204 without a body', async () => {
    const res = await POST(
      errorRequest({
        message: 'Cannot read properties of undefined',
        digest: 'abc123',
        path: '/blog/nextjs-app-router',
      }),
    );

    expect(res.status).toBe(204);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await res.text()).toBe('');
    expect(console.warn).toHaveBeenCalledWith(
      '[client-error]',
      expect.stringContaining('Cannot read properties'),
    );
  });

  it('projects only the whitelisted fields, dropping anything else', async () => {
    await POST(
      errorRequest({
        message: 'boom',
        cookie: 'session=secret',
        email: 'user@example.com',
        nested: { evil: true },
      }),
    );

    const logged = vi.mocked(console.warn).mock.calls[0]?.[1] as string;
    expect(logged).toContain('boom');
    // 非白名单字段（含像是隐私数据的东西）绝不进日志。
    expect(logged).not.toContain('session=secret');
    expect(logged).not.toContain('user@example.com');
    expect(logged).not.toContain('evil');
  });

  it('truncates oversized fields instead of logging them whole', async () => {
    const long = 'x'.repeat(5000);
    await POST(errorRequest({ message: long }));

    const logged = vi.mocked(console.warn).mock.calls[0]?.[1] as string;
    // 512 字段上限 + JSON 包装，远小于原始 5000。
    expect(logged.length).toBeLessThan(1000);
    expect(logged).not.toContain(long);
  });

  it('returns 204 for malformed JSON without logging', async () => {
    const res = await POST(errorRequest('{ not json'));

    expect(res.status).toBe(204);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('returns 204 for an empty projection without logging', async () => {
    const res = await POST(errorRequest({ unrelated: 'field' }));

    expect(res.status).toBe(204);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('drops a body that declares an oversized Content-Length', async () => {
    const res = await POST(
      errorRequest({ message: 'hi' }, { 'content-length': '999999' }),
    );

    expect(res.status).toBe(204);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('rate limits after the per-window quota', async () => {
    for (let i = 0; i < CLIENT_ERROR_RATE_LIMIT_MAX; i += 1) {
      await POST(errorRequest({ message: 'boom' }));
    }

    const res = await POST(errorRequest({ message: 'boom' }));

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
    expect(await res.text()).toBe('');
  });

  it('does not share its quota with the CSP report endpoint', async () => {
    const { POST: cspPost } = await import('../csp-report/route');

    for (let i = 0; i < CLIENT_ERROR_RATE_LIMIT_MAX; i += 1) {
      await POST(errorRequest({ message: 'boom' }));
    }
    // 客户端错误配额耗尽；CSP 端点用独立 key 前缀，不该被牵连。
    const res = await cspPost(
      new Request('http://localhost/api/csp-report', {
        method: 'POST',
        headers: { 'content-type': 'application/csp-report' },
        body: JSON.stringify({ 'csp-report': { 'blocked-uri': 'https://evil.test/x' } }),
      }),
    );

    expect(res.status).toBe(204);
  });
});
