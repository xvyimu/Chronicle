/**
 * Probe production health for the uptime workflow.
 *
 * Writes `state=up|down` to `$GITHUB_OUTPUT` and a human-readable two-line
 * report to `PROBE_REPORT` in `$GITHUB_ENV`, so the issue body in
 * `.github/workflows/uptime.yml` shows the raw evidence rather than a guess.
 *
 * Why two URLs and not one:
 *
 * The site sits behind Cloudflare, and GitHub Actions runners are datacenter
 * IPs that Cloudflare's Bot Fight Mode challenges (measured 2026-10-09:
 * `ruleId=bot_fight_mode, action=managed_challenge` on Azure IPs
 * 20.161.30.244 / 48.217.25.151 / 172.203.196.190; spoofing a Chrome UA does
 * not help — Cloudflare scores the IP, not the UA). Free-plan Bot Fight Mode
 * cannot be skipped by WAF custom rules: it does not run on the Ruleset
 * Engine, so `skip`/`allow` actions have no effect on it
 * (developers.cloudflare.com/bots/get-started/bot-fight-mode, "Limitations").
 *
 * So the CF domain alone cannot answer "is the origin alive?" — a `403` from
 * the edge is indistinguishable from an origin that is up but returning 403.
 * The second URL (the Vercel production alias, which bypasses Cloudflare)
 * answers that directly.
 *
 * Which probe decides the verdict: the Cloudflare one. The Vercel probe is
 * corroborating evidence for the issue report, not a second vote — it runs from
 * the same runner over a different path, so a failure there can mean DNS
 * pollution or Deployment Protection rather than a real outage. See
 * `overallState`. The design and the evidence behind it: D-039.
 *
 * Status classification — the same for both URLs:
 *   2xx / 3xx        edge or origin answering normally      → ok
 *   403 / 429        Cloudflare challenge or rate limit     → ok
 *   5xx              upstream failure (CF 52x, origin 500)  → fault
 *   000              could not connect / timed out          → fault
 *   other 4xx        404 route gone, 401 needs auth         → fault
 *
 * `403` counts as `ok` because it is the expected response to a datacenter
 * probe; it proves the edge is serving. What it does NOT prove is that the
 * origin is healthy — that is exactly what the Vercel probe is for.
 *
 * Usage: tsx scripts/probe-health.ts   (or: node scripts/probe-health.ts — Node 24
 * strips the types natively, and this script imports only `node:` builtins, so
 * the uptime workflow runs it without installing dependencies.)
 *
 * Exit code is 0 whenever the probe ran, whatever the verdict; the workflow
 * branches on the `state` output. Only a crash in this script itself (a missing
 * SITE_URL, say) exits 1 — a probe failure must not look like a script crash.
 *
 * Assertable unit surface: src/lib/probe-health-script.test.ts
 */
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Per-request ceiling. A half-open connection must not stall the whole job. */
const REQUEST_TIMEOUT_MS = 15_000;

/** Statuses that mean "the edge/origin is serving" rather than "it is broken". */
const HEALTHY_STATUSES = /^(2|3)\d\d$|^(403|429)$/u;

export type ProbeOutcome = 'ok' | 'fault';

export interface ProbeResult {
  url: string;
  label: string;
  /** HTTP status, or `000` when the connection failed or timed out. */
  status: number;
  outcome: ProbeOutcome;
}

/**
 * Classify one HTTP status. Exported and pure so the boundary cases (403,
 * 429, 5xx, 000) are locked by tests rather than by reading the regex.
 */
export function classifyStatus(status: number): ProbeOutcome {
  return HEALTHY_STATUSES.test(String(status)) ? 'ok' : 'fault';
}

/** Fetch one URL and classify it. Never throws — a failure becomes `000`. */
export async function probeUrl(
  url: string,
  label: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<ProbeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'chronicle-uptime-probe/1.0',
      },
      redirect: 'manual', // 3xx must stay a 3xx, not be followed
      signal: controller.signal,
    });
    return {
      url,
      label,
      status: response.status,
      outcome: classifyStatus(response.status),
    };
  } catch {
    // Connection refused, DNS failure, TLS error, abort — all the same to us:
    // the site could not be reached.
    return { url, label, status: 0, outcome: 'fault' };
  } finally {
    clearTimeout(timeout);
  }
}

/** Label prefix marking the primary probe (the Cloudflare-facing domain). */
export const PRIMARY_LABEL = 'cloudflare:';

/**
 * Overall verdict.
 *
 * The Cloudflare probe is the primary signal: if the edge cannot be reached,
 * the site is down no matter what the Vercel probe says. The Vercel probe is
 * corroborating evidence — when the edge fails it distinguishes "Cloudflare
 * broke / blocked us" from "the origin itself is down", and either way both
 * lines land in the issue report so a human sees the raw data.
 *
 * Deliberately NOT "down if any probe fails": the Vercel alias is a second
 * network path the runner may not reach (DNS, regional routing, Vercel
 * Deployment Protection answering 401). Treating a failure there as an outage
 * while the site serves fine would fire a false alarm every 10 minutes.
 */
export function overallState(results: ProbeResult[]): 'up' | 'down' {
  const primary = results.find((r) => r.label.startsWith(PRIMARY_LABEL));
  if (!primary) return 'down';
  return primary.outcome === 'ok' ? 'up' : 'down';
}

/** `HTTP 403` for a real status; `no response` for a connection failure. */
function describe(result: ProbeResult): string {
  const code = result.status === 0 ? '000 (no response)' : String(result.status);
  const verdict = result.outcome === 'ok' ? 'ok' : 'FAULT';
  return `${result.label} ${result.url} → HTTP ${code} [${verdict}]`;
}

export function buildReport(results: ProbeResult[]): string {
  return results.map(describe).join('\n');
}

async function main(): Promise<void> {
  const cfUrl = process.env.SITE_URL;
  if (!cfUrl) {
    throw new Error('SITE_URL is required (the workflow sets it from a repo variable).');
  }

  const targets: Array<{ url: string; label: string }> = [
    { url: cfUrl, label: PRIMARY_LABEL },
  ];

  // Optional: the Vercel production alias, which bypasses Cloudflare and so
  // proves the origin itself is up. Skipped when unset rather than failing, so
  // a project without a stable alias still gets the edge-only check.
  const vercelUrl = process.env.VERCEL_ORIGIN_URL?.trim();
  if (vercelUrl) {
    targets.push({ url: vercelUrl, label: 'vercel:' });
  }

  const results = await Promise.all(
    targets.map(({ url, label }) => probeUrl(url, label)),
  );

  const state = overallState(results);
  const report = buildReport(results);

  console.log(report);
  console.log(`state: ${state}`);

  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    appendFileSync(outputFile, `state=${state}\n`);
  }
  const envFile = process.env.GITHUB_ENV;
  if (envFile) {
    // Multi-line values need the heredoc form in GITHUB_ENV. The delimiter is
    // unlikely to collide with report content (urls, statuses), and a run in
    // which it did would surface as a workflow error, not silent truncation.
    appendFileSync(envFile, `PROBE_REPORT<<PROBE_EOF\n${report}\nPROBE_EOF\n`);
  }
}

const entryPath = process.argv[1];
if (entryPath && import.meta.url === pathToFileURL(path.resolve(entryPath)).href) {
  main().catch((error) => {
    console.error(error);
    // Set exitCode rather than calling process.exit(): on Windows, exiting
    // while undici's keep-alive handles are mid-close trips a libuv assertion
    // (`UV_HANDLE_CLOSING` in async.c) and aborts with 0xC0000409 instead of 1.
    process.exitCode = 1;
  });
}
