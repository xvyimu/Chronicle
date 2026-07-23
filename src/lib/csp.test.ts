import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  CSP_REPORT_GROUP,
  CSP_REPORT_PATH,
  buildProductionCsp,
  buildReportingEndpointsHeader,
  createCspNonce,
  shouldApplyCsp,
} from './csp';

const SAMPLE_NONCE = 'dGVzdC1ub25jZQ==';

/** Extract the script-src directive body (without the "script-src " prefix). */
function scriptSrcBody(csp: string): string {
  const match = /(?:^|;\s*)script-src\s+([^;]+)/i.exec(csp);
  expect(match, 'script-src directive must be present').toBeTruthy();
  return match![1].trim();
}

describe('buildProductionCsp', () => {
  it('embeds the per-request nonce on script-src', () => {
    const csp = buildProductionCsp(SAMPLE_NONCE);
    expect(csp).toContain(`'nonce-${SAMPLE_NONCE}'`);
    expect(scriptSrcBody(csp)).toContain(`'nonce-${SAMPLE_NONCE}'`);
  });

  it('keeps strict-dynamic on script-src (nonce model, not SSG relax)', () => {
    const body = scriptSrcBody(buildProductionCsp(SAMPLE_NONCE));
    expect(body).toContain("'strict-dynamic'");
  });

  it('does NOT put unsafe-inline on script-src (style-src may still use it)', () => {
    const csp = buildProductionCsp(SAMPLE_NONCE);
    const scriptBody = scriptSrcBody(csp);

    // Hard invariant from ADR 2026-07-17 / PROJECT.md: never relax script-src
    // to unsafe-inline to recover full-site SSG HTML cache.
    expect(scriptBody).not.toMatch(/'unsafe-inline'/);
    expect(scriptBody).not.toMatch(/'unsafe-eval'/);

    // style-src still allows unsafe-inline for Tailwind v4 — that is intentional
    // and must not be confused with a script-src relaxation.
    expect(csp).toMatch(/style-src[^;]*'unsafe-inline'/);
  });

  it('wires both report-uri and report-to to the same-origin sink', () => {
    const csp = buildProductionCsp(SAMPLE_NONCE);
    expect(csp).toContain(`report-uri ${CSP_REPORT_PATH}`);
    expect(csp).toContain(`report-to ${CSP_REPORT_GROUP}`);
    expect(CSP_REPORT_PATH).toBe('/api/csp-report');
    expect(CSP_REPORT_GROUP).toBe('csp-endpoint');
  });

  it('keeps object-src none and upgrade-insecure-requests', () => {
    const csp = buildProductionCsp(SAMPLE_NONCE);
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('allowlists Giscus + Vercel script hosts without opening the world', () => {
    const body = scriptSrcBody(buildProductionCsp(SAMPLE_NONCE));
    const tokens = body.split(/\s+/);
    expect(tokens).toContain('https://giscus.app');
    expect(tokens).toContain('https://va.vercel-scripts.com');
    // No wildcard host or scheme-only https: token (would open all HTTPS scripts).
    expect(tokens).not.toContain('*');
    expect(tokens).not.toContain('https:');
    expect(tokens).not.toContain('http:');
  });

  it('rejects an empty nonce so headers cannot ship a broken policy', () => {
    expect(() => buildProductionCsp('')).toThrow(/non-empty nonce/);
  });
});

describe('createCspNonce', () => {
  it('returns a non-empty base64-ish string and differs across calls', () => {
    const a = createCspNonce();
    const b = createCspNonce();
    expect(a.length).toBeGreaterThan(8);
    expect(b.length).toBeGreaterThan(8);
    expect(a).not.toBe(b);
  });
});

describe('shouldApplyCsp (dev vs prod branch)', () => {
  it('skips CSP in development (HMR / Turbopack)', () => {
    expect(shouldApplyCsp('development')).toBe(false);
  });

  it('applies CSP in production and test-like envs', () => {
    expect(shouldApplyCsp('production')).toBe(true);
    expect(shouldApplyCsp('test')).toBe(true);
    expect(shouldApplyCsp(undefined)).toBe(true);
  });
});

describe('buildReportingEndpointsHeader', () => {
  it('binds the report-to group to the same-origin path', () => {
    expect(buildReportingEndpointsHeader()).toBe(
      `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`,
    );
  });
});

describe('getCspNonce (proxy → layout handoff)', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('reads x-nonce from next/headers', async () => {
    vi.resetModules();
    vi.doMock('next/headers', () => ({
      headers: async () => new Headers([['x-nonce', SAMPLE_NONCE]]),
    }));
    const { getCspNonce } = await import('./csp');
    await expect(getCspNonce()).resolves.toBe(SAMPLE_NONCE);
  });

  it('returns undefined when proxy did not set x-nonce', async () => {
    vi.resetModules();
    vi.doMock('next/headers', () => ({
      headers: async () => new Headers(),
    }));
    const { getCspNonce } = await import('./csp');
    await expect(getCspNonce()).resolves.toBeUndefined();
  });
});

describe('nonce chain wiring (source contracts)', () => {
  const root = process.cwd();

  it('proxy still generates nonce, sets x-nonce + CSP, and uses lib/csp builders', () => {
    const source = readFileSync(path.join(root, 'src/proxy.ts'), 'utf8');
    expect(source).toMatch(/from ['"]@\/lib\/csp['"]/);
    expect(source).toContain('createCspNonce');
    expect(source).toContain('buildProductionCsp');
    expect(source).toContain('shouldApplyCsp');
    expect(source).toContain("requestHeaders.set('x-nonce'");
    expect(source).toContain('Content-Security-Policy');
    expect(source).toContain('Reporting-Endpoints');
    // Policy string must live in lib/csp — proxy must not re-inline a script-src.
    expect(source).not.toMatch(/`script-src/);
    expect(source).not.toMatch(/"script-src/);
  });

  it('root layout still pulls nonce via getCspNonce and passes it to DarkModeScript', () => {
    const source = readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8');
    expect(source).toContain('getCspNonce');
    expect(source).toContain('<DarkModeScript nonce={nonce} />');
  });

  it('SRI experiment stays behind ENABLE_SRI=1 (default off in next.config)', () => {
    const source = readFileSync(path.join(root, 'next.config.ts'), 'utf8');
    expect(source).toContain("process.env.ENABLE_SRI === '1'");
    expect(source).toMatch(/sri:\s*\{\s*algorithm:\s*'sha384'/);
    // Must not hard-assign experimental.sri outside the env-gated spread.
    expect(source).not.toMatch(
      /experimental:\s*\{[\s\S]*?\bsri:\s*\{\s*algorithm/,
    );
  });
});
