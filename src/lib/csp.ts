import { headers } from 'next/headers';

/**
 * CSP helpers — pure policy builders + layout nonce reader.
 *
 * Production policy lives here so vitest can lock invariants without spinning
 * NextRequest. The proxy still owns request/response header wiring.
 *
 * ADR: docs/adr/2026-07-17-csp-nonce-over-ssg.md
 *   - Keep per-request nonce + strict-dynamic
 *   - Never relax script-src to unsafe-inline for SSG
 */

/** report-to group name + same-origin sink; shared by report-uri / Reporting-Endpoints. */
export const CSP_REPORT_GROUP = 'csp-endpoint';
export const CSP_REPORT_PATH = '/api/csp-report';

/**
 * Production document CSP only. Dev skips CSP entirely (Turbopack HMR).
 * Caller supplies a fresh per-request nonce (base64 of randomUUID).
 */
export function buildProductionCsp(nonce: string): string {
  if (!nonce) {
    throw new Error('buildProductionCsp requires a non-empty nonce');
  }

  return [
    "default-src 'self'",
    // strict-dynamic trusts nonce-tagged scripts; allow Vercel + Giscus hosts for their loaders
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://giscus.app https://va.vercel-scripts.com`,
    // style-src keeps 'unsafe-inline' — Tailwind v4 injects inline styles
    // that are harder to nonce. Styles are lower risk than scripts for XSS.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    // Analytics/vitals POST to same-origin /_vercel/*; Giscus API as needed
    "connect-src 'self' https://giscus.app",
    'frame-src https://giscus.app',
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "manifest-src 'self'",
    "worker-src 'self'",
    'upgrade-insecure-requests',
    // T3: collect-only violation reporting. report-to (Reporting API) is the
    // modern channel; report-uri is kept for browsers that ignore report-to.
    // Enforcement is unchanged — this only adds a telemetry sink, no relaxation.
    `report-uri ${CSP_REPORT_PATH}`,
    `report-to ${CSP_REPORT_GROUP}`,
  ].join('; ');
}

/** Per-request nonce for CSP + inline script attributes. */
export function createCspNonce(): string {
  return btoa(crypto.randomUUID());
}

/**
 * Apply CSP only outside development. Turbopack HMR needs inline scripts +
 * websockets that a strict production policy would block.
 */
export function shouldApplyCsp(nodeEnv: string | undefined = process.env.NODE_ENV): boolean {
  return nodeEnv !== 'development';
}

/** Value for the Reporting-Endpoints response header (pairs with report-to). */
export function buildReportingEndpointsHeader(): string {
  return `${CSP_REPORT_GROUP}="${CSP_REPORT_PATH}"`;
}

/**
 * Read the per-request nonce the proxy forwarded on x-nonce.
 * Root layout applies it to project-owned inline scripts; Next applies it to
 * framework hydration scripts when the request CSP header is present.
 */
export async function getCspNonce(): Promise<string | undefined> {
  const nonce = (await headers()).get('x-nonce');
  return nonce ?? undefined;
}
