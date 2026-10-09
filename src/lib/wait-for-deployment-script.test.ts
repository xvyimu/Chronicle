import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  findProductionDeployment,
  latestDeploymentState,
  waitForProductionDeployment,
} from '../../scripts/wait-for-deployment';

const SHA = 'd87050b7595976103dbed20bad22b70da56f30cc';
const REPO = 'xvyimu/Chronicle';

afterEach(() => {
  vi.unstubAllEnvs();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/** Routes by URL so a single fake serves both endpoints. */
function routedFetch(
  handler: (url: string) => Response | Promise<Response>,
): typeof fetch {
  return ((url: string) =>
    Promise.resolve(handler(String(url)))) as unknown as typeof fetch;
}

describe('findProductionDeployment', () => {
  it('returns the deployment whose sha matches, ignoring other revisions', async () => {
    const fetchImpl = routedFetch(() =>
      jsonResponse([
        {
          id: 2,
          sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          environment: 'Production',
        },
        { id: 1, sha: SHA, environment: 'Production' },
      ]),
    );

    const result = await findProductionDeployment(REPO, SHA, fetchImpl);
    expect(result?.id).toBe(1);
  });

  it('returns null when the commit has no Production deployment yet', async () => {
    const fetchImpl = routedFetch(() =>
      jsonResponse([
        {
          id: 9,
          sha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          environment: 'Production',
        },
      ]),
    );

    expect(await findProductionDeployment(REPO, SHA, fetchImpl)).toBeNull();
  });

  it('throws on a non-ok API response so the caller can classify it', async () => {
    const fetchImpl = routedFetch(() => jsonResponse({ message: 'rate limited' }, 403));

    await expect(findProductionDeployment(REPO, SHA, fetchImpl)).rejects.toThrow(
      /HTTP 403/u,
    );
  });

  it('passes an abort signal so a hung request cannot stall the step', async () => {
    let seenSignal: unknown;
    const fetchImpl = ((_url: string, init?: RequestInit) => {
      seenSignal = init?.signal;
      return Promise.resolve(jsonResponse([]));
    }) as unknown as typeof fetch;

    await findProductionDeployment(REPO, SHA, fetchImpl);

    // Without this, a half-open connection hangs the whole CI step until the job
    // timeout. The fix is only real if the signal actually reaches fetch.
    expect(seenSignal).toBeInstanceOf(AbortSignal);
  });
});

describe('token/scope handling', () => {
  it('retries without the token when an authorized request is refused with 403', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'scoped-token-without-deployments-read');
    const authorized: boolean[] = [];
    const fetchImpl = ((_url: string, init?: RequestInit) => {
      const hasAuth = Boolean(
        (init?.headers as Record<string, string> | undefined)?.authorization,
      );
      authorized.push(hasAuth);
      // The deployments endpoint rejects a token scoped to `contents: read`,
      // but answers the same URL anonymously because the repo is public.
      return Promise.resolve(
        hasAuth
          ? jsonResponse({ message: 'Resource not accessible by integration' }, 403)
          : jsonResponse([{ id: 1, sha: SHA, environment: 'Production' }]),
      );
    }) as unknown as typeof fetch;

    const result = await findProductionDeployment(REPO, SHA, fetchImpl);

    expect(result?.id).toBe(1);
    expect(authorized).toEqual([true, false]);
  });

  it('does not retry anonymously when there is no token to begin with', async () => {
    vi.stubEnv('GITHUB_TOKEN', '');
    let calls = 0;
    const fetchImpl = (() => {
      calls += 1;
      return Promise.resolve(jsonResponse({ message: 'rate limited' }, 403));
    }) as unknown as typeof fetch;

    await expect(findProductionDeployment(REPO, SHA, fetchImpl)).rejects.toThrow(
      /HTTP 403/u,
    );
    expect(calls).toBe(1);
  });
});

describe('latestDeploymentState', () => {
  it('reads the newest status state', async () => {
    const fetchImpl = routedFetch(() => jsonResponse([{ state: 'success' }]));
    expect(await latestDeploymentState(REPO, 1, fetchImpl)).toBe('success');
  });

  it('returns null when the deployment has no statuses yet', async () => {
    const fetchImpl = routedFetch(() => jsonResponse([]));
    expect(await latestDeploymentState(REPO, 1, fetchImpl)).toBeNull();
  });
});

describe('waitForProductionDeployment', () => {
  const noSleep = async (): Promise<void> => {};

  it('confirms as soon as the commit reaches Production with state=success', async () => {
    const fetchImpl = routedFetch((url) =>
      url.includes('/statuses')
        ? jsonResponse([{ state: 'success' }])
        : jsonResponse([{ id: 1, sha: SHA, environment: 'Production' }]),
    );

    const outcome = await waitForProductionDeployment({
      repo: REPO,
      sha: SHA,
      siteUrl: 'https://example.test',
      fetchImpl,
      sleep: noSleep,
      log: () => {},
    });

    expect(outcome.kind).toBe('confirmed');
  });

  it('keeps polling past a pending deployment, then confirms', async () => {
    const states = ['in_progress', 'in_progress', 'success'];
    let statusCalls = 0;
    const fetchImpl = routedFetch((url) => {
      if (url.includes('/statuses')) {
        const state = states[Math.min(statusCalls, states.length - 1)];
        statusCalls += 1;
        return jsonResponse([{ state }]);
      }
      return jsonResponse([{ id: 1, sha: SHA, environment: 'Production' }]);
    });

    const outcome = await waitForProductionDeployment({
      repo: REPO,
      sha: SHA,
      siteUrl: 'https://example.test',
      fetchImpl,
      sleep: noSleep,
      log: () => {},
    });

    expect(outcome.kind).toBe('confirmed');
    // Two pending polls before the third reports success — proves it retried
    // rather than confirming on the first sight of the deployment.
    expect(statusCalls).toBe(3);
  });

  it('fails fast when the deployment reports failure instead of waiting out the deadline', async () => {
    const fetchImpl = routedFetch((url) =>
      url.includes('/statuses')
        ? jsonResponse([{ state: 'failure' }])
        : jsonResponse([{ id: 7, sha: SHA, environment: 'Production' }]),
    );

    const outcome = await waitForProductionDeployment({
      repo: REPO,
      sha: SHA,
      siteUrl: 'https://example.test',
      fetchImpl,
      sleep: noSleep,
      log: () => {},
    });

    expect(outcome.kind).toBe('timeout');
    if (outcome.kind === 'timeout') {
      expect(outcome.reason).toContain('failure');
    }
  });

  it('degrades to an HTTP probe after two consecutive API failures', async () => {
    // API host fails; the site itself is fine. The two live on different hosts,
    // so the fake routes by URL rather than failing everything.
    const fetchImpl = routedFetch((url) =>
      url.startsWith('https://api.github.com')
        ? jsonResponse({ message: 'boom' }, 500)
        : new Response('ok', { status: 200 }),
    );
    const log = vi.fn();

    const outcome = await waitForProductionDeployment({
      repo: REPO,
      sha: SHA,
      siteUrl: 'https://example.test',
      fetchImpl,
      sleep: noSleep,
      log,
    });

    expect(outcome.kind).toBe('degraded');
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('Deployment revision NOT verified'),
    );
  });

  it('fails as misconfigured on a 4xx instead of degrading (retrying cannot fix it)', async () => {
    vi.stubEnv('GITHUB_TOKEN', '');
    const fetchImpl = routedFetch((url) =>
      url.startsWith('https://api.github.com')
        ? jsonResponse({ message: 'Not Found' }, 404)
        : new Response('ok', { status: 200 }),
    );

    const outcome = await waitForProductionDeployment({
      repo: REPO,
      sha: SHA,
      siteUrl: 'https://example.test',
      fetchImpl,
      sleep: noSleep,
      log: () => {},
    });

    expect(outcome.kind).toBe('misconfigured');
  });

  it('times out rather than degrading when the API fails and the site is down too', async () => {
    const fetchImpl = routedFetch(() => jsonResponse({ message: 'boom' }, 500));

    const outcome = await waitForProductionDeployment({
      repo: REPO,
      sha: SHA,
      siteUrl: 'https://example.test',
      fetchImpl,
      sleep: noSleep,
      log: () => {},
    });

    expect(outcome.kind).toBe('timeout');
    if (outcome.kind === 'timeout') {
      expect(outcome.reason).toContain('unreachable');
    }
  });

  it('times out when the commit never appears in Production', async () => {
    const fetchImpl = routedFetch(() => jsonResponse([]));

    const outcome = await waitForProductionDeployment({
      repo: REPO,
      sha: SHA,
      siteUrl: 'https://example.test',
      timeoutMs: 0,
      fetchImpl,
      sleep: noSleep,
      log: () => {},
    });

    expect(outcome.kind).toBe('timeout');
  });
});
