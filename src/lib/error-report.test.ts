import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import {
  CLIENT_ERROR_PATH,
  buildReport,
  reportError,
  sendErrorReport,
  shouldReport,
} from './error-report';

describe('shouldReport', () => {
  it('reports only in a production client environment', () => {
    expect(shouldReport({ NODE_ENV: 'production' }, { navigator: {} })).toBe(true);
    expect(shouldReport({ NODE_ENV: 'development' }, { navigator: {} })).toBe(false);
    expect(shouldReport({ NODE_ENV: 'test' }, { navigator: {} })).toBe(false);
  });

  it('does not report when there is no window (server render)', () => {
    expect(shouldReport({ NODE_ENV: 'production' }, null)).toBe(false);
  });
});

describe('buildReport', () => {
  it('keeps the whitelisted fields', () => {
    const report = buildReport(
      { message: 'boom', digest: 'd1', stack: 'Error: boom\n  at x' },
      { pathname: '/blog/x', search: '?token=secret' },
      'Mozilla/5.0',
    );

    expect(report).toEqual({
      message: 'boom',
      digest: 'd1',
      stack: 'Error: boom\n  at x',
      path: '/blog/x',
      userAgent: 'Mozilla/5.0',
    });
  });

  it('keeps only the pathname, never the query string', () => {
    const report = buildReport(
      { message: 'boom' },
      { pathname: '/blog/x', search: '?token=secret&email=a@b.c' },
      undefined,
    );

    expect(report?.path).toBe('/blog/x');
    expect(JSON.stringify(report)).not.toContain('secret');
    expect(JSON.stringify(report)).not.toContain('a@b.c');
  });

  it('truncates every field to the shared limit', () => {
    const long = 'y'.repeat(2000);
    const report = buildReport(
      { message: long, digest: long, stack: long },
      { pathname: long },
      long,
    );

    for (const value of Object.values(report ?? {})) {
      expect((value as string).length).toBe(512);
    }
  });

  it('returns null when there is neither a message nor a digest', () => {
    expect(buildReport({}, { pathname: '/' }, 'ua')).toBeNull();
    expect(buildReport({ message: '' }, { pathname: '/' }, 'ua')).toBeNull();
  });

  it('still reports a digest-only error (React strips messages in prod)', () => {
    const report = buildReport({ digest: 'abc' }, { pathname: '/blog/x' }, undefined);

    expect(report?.digest).toBe('abc');
    expect(report?.message).toBe('');
  });
});

describe('sendErrorReport', () => {
  const originalNavigator = globalThis.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
    vi.unstubAllGlobals();
  });

  it('prefers sendBeacon when the browser provides it', () => {
    const beacon = vi.fn(() => true);
    Object.defineProperty(globalThis, 'navigator', {
      value: { sendBeacon: beacon, userAgent: 'ua' },
      configurable: true,
      writable: true,
    });

    const ok = sendErrorReport({ message: 'boom' });

    expect(ok).toBe(true);
    expect(beacon).toHaveBeenCalledWith(CLIENT_ERROR_PATH, expect.anything());
  });

  it('falls back to fetch with keepalive when sendBeacon is absent', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'ua' },
      configurable: true,
      writable: true,
    });
    const fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
    vi.stubGlobal('fetch', fetchMock);

    const ok = sendErrorReport({ message: 'boom' });

    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      CLIENT_ERROR_PATH,
      expect.objectContaining({ method: 'POST', keepalive: true }),
    );
  });

  it('never throws when the transport blows up', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: {
        sendBeacon: () => {
          throw new Error('transport exploded');
        },
      },
      configurable: true,
      writable: true,
    });

    // 上报失败绝不能让错误页二次崩溃。
    expect(() => sendErrorReport({ message: 'boom' })).not.toThrow();
  });

  it('returns false for a null report', () => {
    expect(sendErrorReport(null)).toBe(false);
  });
});

describe('reportError', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not send anything outside production', () => {
    const beacon = vi.fn(() => true);
    Object.defineProperty(globalThis, 'navigator', {
      value: { sendBeacon: beacon },
      configurable: true,
      writable: true,
    });

    expect(
      reportError({ message: 'boom' }, undefined, undefined, { NODE_ENV: 'test' }),
    ).toBe(false);
    expect(beacon).not.toHaveBeenCalled();
  });

  it('sends the report in production', () => {
    const beacon = vi.fn(() => true);
    Object.defineProperty(globalThis, 'navigator', {
      value: { sendBeacon: beacon, userAgent: 'ua' },
      configurable: true,
      writable: true,
    });

    const ok = reportError(
      { message: 'boom', digest: 'd1' },
      { pathname: '/blog/x' },
      'ua',
      { NODE_ENV: 'production' },
    );

    expect(ok).toBe(true);
    expect(beacon).toHaveBeenCalled();
  });
});
