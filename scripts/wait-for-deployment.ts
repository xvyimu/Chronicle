/**
 * Wait until production is serving the commit that triggered this CI run.
 *
 * Vercel's Git integration deploys out-of-band on push to master, so this step
 * confirms the commit's Production deployment reached `state=success` *before*
 * `check:production-content` asserts against the site. A plain HTTP 200 would
 * not do: Vercel keeps serving the previous deployment while the new one builds,
 * so 200 says nothing about which revision is live.
 *
 * Revision comes from the GitHub Deployments API, which Vercel feeds as
 * `vercel[bot]` (verified 2026-10-08: it carries the commit SHA and its statuses
 * carry `state`).
 *
 * Failure handling is split three ways — see `waitForProductionDeployment` and
 * `isRetryableStatus`. Rationale and rejected alternatives: D-037.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const PRODUCTION_ENVIRONMENT = 'Production';
const GITHUB_API = 'https://api.github.com';
const DEFAULT_TIMEOUT_MS = 5 * 60_000;
const DEFAULT_POLL_MS = 10_000;
/** Per-request ceiling. Without it a half-open connection hangs the whole step. */
const REQUEST_TIMEOUT_MS = 15_000;

type DeploymentRef = { id: number; sha: string; environment: string };

type WaitOutcome =
  | { kind: 'confirmed' }
  | { kind: 'degraded' | 'misconfigured' | 'timeout'; reason: string };

type FetchLike = typeof fetch;

/**
 * Raised when the GitHub API answers with a non-ok status. `retryable` decides
 * whether the caller keeps polling (transient) or gives up immediately
 * (misconfiguration). Getting this wrong is expensive in both directions: a
 * misconfiguration that degrades silently means the step never verifies
 * anything, and a rate limit that hard-fails red-lights every deploy.
 */
class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'GitHubApiError';
  }
}

/**
 * GitHub answers a non-ok status for three reasons we care about, and they need
 * opposite handling. 5xx and 429 are transient; GitHub reports *both* its
 * primary and its secondary rate limit as 403, so a 403 means "back off" too —
 * a genuine permission problem would already have been handled by the token-less
 * retry in `apiGet`. Every other 4xx (401, 404, …) means the request itself is
 * wrong and retrying is pointless.
 */
function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429 || status === 403;
}

const API_HEADERS = {
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28',
  'user-agent': 'chronicle-deployment-wait/1.0',
} as const;

/**
 * GET a GitHub API path and parse the JSON body.
 *
 * Tolerates a token that lacks `deployments: read`: GitHub Actions scopes
 * `secrets.GITHUB_TOKEN` by the workflow's `permissions:` block, which for this
 * repo is `contents: read`, so an authorized request can 403. The repository is
 * public, so retrying once without authorization succeeds. The token is not
 * otherwise required — it only lifts the anonymous limit of 60 requests/hour,
 * which shared GitHub-hosted runner IPs can exhaust.
 */
async function apiGet<T>(path: string, label: string, fetchImpl: FetchLike): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  const request = (authorized: boolean): Promise<Response> =>
    fetchImpl(`${GITHUB_API}${path}`, {
      headers:
        authorized && token
          ? { ...API_HEADERS, authorization: `Bearer ${token}` }
          : API_HEADERS,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

  let res = await request(Boolean(token));
  if (!res.ok && res.status === 403 && token) {
    res = await request(false);
  }

  if (!res.ok) {
    throw new GitHubApiError(
      `${label} failed: HTTP ${res.status}`,
      isRetryableStatus(res.status),
    );
  }
  return res.json() as Promise<T>;
}

/** Newest Production deployment matching `sha`, or null if it is not registered yet. */
export async function findProductionDeployment(
  repo: string,
  sha: string,
  fetchImpl: FetchLike = fetch,
): Promise<DeploymentRef | null> {
  const deployments = await apiGet<DeploymentRef[]>(
    `/repos/${repo}/deployments?environment=${PRODUCTION_ENVIRONMENT}&per_page=10`,
    'deployments lookup',
    fetchImpl,
  );

  return (
    deployments.find((d) => d.sha === sha && d.environment === PRODUCTION_ENVIRONMENT) ??
    null
  );
}

/** Latest status state for a deployment (`success`, `in_progress`, `failure`, …). */
export async function latestDeploymentState(
  repo: string,
  deploymentId: number,
  fetchImpl: FetchLike = fetch,
): Promise<string | null> {
  const statuses = await apiGet<Array<{ state?: string }>>(
    `/repos/${repo}/deployments/${deploymentId}/statuses?per_page=1`,
    'deployment statuses lookup',
    fetchImpl,
  );
  return statuses[0]?.state ?? null;
}

async function probeHttpReachable(
  url: string,
  fetchImpl: FetchLike = fetch,
): Promise<boolean> {
  try {
    const res = await fetchImpl(url, {
      headers: { accept: 'text/html,application/xhtml+xml' },
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** How many consecutive transient API failures to tolerate before deciding. */
const API_FAILURE_TOLERANCE = 2;

export async function waitForProductionDeployment({
  repo,
  sha,
  siteUrl,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  pollMs = DEFAULT_POLL_MS,
  fetchImpl = fetch,
  log = console.log,
  sleep = delay,
}: {
  repo: string;
  sha: string;
  siteUrl: string;
  timeoutMs?: number;
  pollMs?: number;
  fetchImpl?: FetchLike;
  log?: (message: string) => void;
  sleep?: (ms: number) => Promise<void>;
}): Promise<WaitOutcome> {
  const deadline = Date.now() + timeoutMs;
  const shortSha = sha.slice(0, 7);
  let attempts = 0;
  let lastReason = `no Production deployment registered for ${shortSha}`;
  let consecutiveApiFailures = 0;

  while (Date.now() < deadline) {
    attempts += 1;

    try {
      const deployment = await findProductionDeployment(repo, sha, fetchImpl);
      consecutiveApiFailures = 0;

      if (deployment) {
        const state = await latestDeploymentState(repo, deployment.id, fetchImpl);
        if (state === 'success') {
          log(
            `[wait-for-deployment] attempt ${attempts}: ${shortSha} deployed to ${PRODUCTION_ENVIRONMENT} (id ${deployment.id})`,
          );
          return { kind: 'confirmed' };
        }
        if (state === 'failure' || state === 'error') {
          return {
            kind: 'timeout',
            reason: `deployment ${deployment.id} reported ${state}`,
          };
        }
        lastReason = `deployment ${deployment.id} is ${state ?? 'pending'}`;
      }
    } catch (error) {
      lastReason = error instanceof Error ? error.message : String(error);

      // A non-retryable status is a configuration problem (bad repo name, auth
      // failure) that polling cannot fix — fail loudly instead of degrading.
      if (error instanceof GitHubApiError && !error.retryable) {
        return { kind: 'misconfigured', reason: lastReason };
      }
      // Network error, 5xx, or a rate-limit 403: tolerate a blip or two, then
      // decide based on whether the site itself is up.
      consecutiveApiFailures += 1;
      if (consecutiveApiFailures >= API_FAILURE_TOLERANCE) {
        const reachable = await probeHttpReachable(siteUrl, fetchImpl);
        if (!reachable) {
          return {
            kind: 'timeout',
            reason: `${lastReason} and ${siteUrl} is unreachable`,
          };
        }
        log(
          `[wait-for-deployment] GitHub API unavailable (${lastReason}); degraded to HTTP probe: ${siteUrl} → reachable. Deployment revision NOT verified.`,
        );
        return { kind: 'degraded', reason: lastReason };
      }
    }

    log(`[wait-for-deployment] attempt ${attempts}: not ready (${lastReason})`);
    await sleep(pollMs);
  }

  return { kind: 'timeout', reason: lastReason };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`${name} is required (GitHub Actions sets it automatically).`);
  return value;
}

async function main(): Promise<void> {
  const repo = requireEnv('GITHUB_REPOSITORY');
  const sha = requireEnv('GITHUB_SHA');
  const siteUrl = (
    process.env.PRODUCTION_CONTENT_BASE_URL ?? requireEnv('NEXT_PUBLIC_SITE_URL')
  ).replace(/\/+$/u, '');

  const outcome = await waitForProductionDeployment({
    repo,
    sha,
    siteUrl,
    timeoutMs: Number(process.env.WAIT_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
    pollMs: Number(process.env.WAIT_POLL_MS ?? DEFAULT_POLL_MS),
  });

  switch (outcome.kind) {
    case 'confirmed':
      return;
    // The API was unusable while the site is up. This file's header promises not
    // to red-light a deploy over an API hiccup, so exit 0 — loudly, because the
    // revision was never actually verified.
    case 'degraded':
      console.warn(
        `[wait-for-deployment] proceeding with revision UNVERIFIED: ${outcome.reason}`,
      );
      return;
    case 'misconfigured':
      throw new Error(
        `[wait-for-deployment] the GitHub API rejected the request (${outcome.reason}) — check GITHUB_REPOSITORY and the token`,
      );
    case 'timeout':
      throw new Error(
        `[wait-for-deployment] ${siteUrl} did not confirm ${sha.slice(0, 7)} before the deadline — ${outcome.reason}`,
      );
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
