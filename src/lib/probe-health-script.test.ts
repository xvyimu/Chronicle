import { describe, expect, it, vi } from 'vitest';

import {
  buildReport,
  classifyStatus,
  overallState,
  probeUrl,
  type ProbeResult,
} from '../../scripts/probe-health';

describe('classifyStatus', () => {
  it('treats 2xx and 3xx as healthy', () => {
    expect(classifyStatus(200)).toBe('ok');
    expect(classifyStatus(204)).toBe('ok');
    expect(classifyStatus(301)).toBe('ok');
    expect(classifyStatus(308)).toBe('ok');
  });

  it('treats Cloudflare challenge and rate-limit statuses as healthy', () => {
    // 403 is what a datacenter probe gets from Bot Fight Mode; 429 is the
    // rate-limit action. Both mean the edge is serving, not that the site is down.
    expect(classifyStatus(403)).toBe('ok');
    expect(classifyStatus(429)).toBe('ok');
  });

  it('treats 5xx and no-response as faults', () => {
    expect(classifyStatus(500)).toBe('fault');
    expect(classifyStatus(502)).toBe('fault');
    expect(classifyStatus(522)).toBe('fault');
    expect(classifyStatus(0)).toBe('fault');
  });

  it('treats 4xx other than 403/429 as faults', () => {
    // A 404 on the probed URL means the route is gone — that IS a regression
    // worth an issue, unlike a WAF challenge.
    expect(classifyStatus(404)).toBe('fault');
    expect(classifyStatus(401)).toBe('fault');
  });
});

describe('probeUrl', () => {
  it('records the status and outcome for a successful response', async () => {
    const fetchImpl = vi.fn(async () => new Response('ok', { status: 200 }));

    const result = await probeUrl('https://example.test/', 'cloudflare:', fetchImpl);

    expect(result).toMatchObject({ status: 200, outcome: 'ok', label: 'cloudflare:' });
  });

  it('reports 000 when the connection fails', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });

    const result = await probeUrl('https://down.test/', 'vercel:', fetchImpl);

    expect(result).toMatchObject({ status: 0, outcome: 'fault', label: 'vercel:' });
  });

  it('does not follow redirects, so a 3xx stays visible as 3xx', async () => {
    let seenRedirect: RequestRedirect | undefined;
    const fetchImpl = ((_url: string, init?: RequestInit) => {
      seenRedirect = init?.redirect;
      return Promise.resolve(new Response(null, { status: 301 }));
    }) as unknown as typeof fetch;

    const result = await probeUrl('https://example.test/', 'cloudflare:', fetchImpl);

    expect(seenRedirect).toBe('manual');
    expect(result.status).toBe(301);
  });

  it('aborts a hung request instead of stalling the job', async () => {
    const fetchImpl = ((_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new DOMException('aborted', 'AbortError')),
          { once: true },
        );
      })) as unknown as typeof fetch;

    // Production timeout is 15s; inject a short one so the test does not sit
    // for 15 seconds proving setTimeout works.
    const result = await probeUrl('https://hung.test/', 'cloudflare:', fetchImpl, 50);

    expect(result.outcome).toBe('fault');
    expect(result.status).toBe(0);
  });
});

describe('overallState', () => {
  const ok = (label: string): ProbeResult => ({
    url: 'https://x.test/',
    label,
    status: 200,
    outcome: 'ok',
  });
  const fault = (label: string): ProbeResult => ({
    url: 'https://x.test/',
    label,
    status: 500,
    outcome: 'fault',
  });

  it('is up when the primary (Cloudflare) probe succeeded', () => {
    expect(overallState([ok('cloudflare:'), ok('vercel:')])).toBe('up');
  });

  it('is up when the Cloudflare probe succeeded even if the Vercel probe failed', () => {
    // The Vercel alias is corroborating evidence only. It travels a different
    // path from the same runner (DNS, regional routing, Deployment Protection),
    // so a failure there must not raise an outage while the site serves fine.
    expect(overallState([ok('cloudflare:'), fault('vercel:')])).toBe('up');
  });

  it('is down when the Cloudflare probe failed, whatever the Vercel probe says', () => {
    expect(overallState([fault('cloudflare:'), ok('vercel:')])).toBe('down');
    expect(overallState([fault('cloudflare:'), fault('vercel:')])).toBe('down');
  });

  it('is down when the primary probe is missing', () => {
    expect(overallState([ok('vercel:')])).toBe('down');
    expect(overallState([])).toBe('down');
  });
});

describe('buildReport', () => {
  it('renders each probe as one line with its raw status', () => {
    const report = buildReport([
      { url: 'https://cf.test/', label: 'cloudflare:', status: 403, outcome: 'ok' },
      { url: 'https://v.test/', label: 'vercel:', status: 0, outcome: 'fault' },
    ]);

    expect(report.split('\n')).toEqual([
      'cloudflare: https://cf.test/ → HTTP 403 [ok]',
      'vercel: https://v.test/ → HTTP 000 (no response) [FAULT]',
    ]);
  });
});
