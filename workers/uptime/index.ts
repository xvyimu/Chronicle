/**
 * Uptime probe Worker.
 *
 * Runs on a Cloudflare Cron Trigger every 10 minutes. Replaces the
 * GitHub Actions `schedule` workflow, which never fired after being merged
 * to master (documented in D-039: `schedule` registration on GitHub's side
 * can silently fail for newly-merged workflows; two hours of observation
 * showed zero `event=schedule` runs despite correct YAML on the default
 * branch).
 *
 * Why a Worker and not GitHub Actions:
 *  - Cron Triggers on Workers are reliable — they run on Cloudflare's
 *    underutilized machines, not GitHub's queued scheduler.
 *  - The Worker's `fetch()` to its own zone's origin bypasses Cloudflare's
 *    security features (Bot Fight Mode, WAF) by default — so it sees the
 *    origin directly, not a challenge page. This is the documented
 *    behavior of same-zone subrequests without `global_fetch_strictly_public`.
 *  - No dependency installation, no pnpm, no runner cold start.
 *
 * What it does:
 *  1. Fetch the production site (CF domain) — sees edge + origin chain.
 *  2. Classify the status (same table as `scripts/probe-health.ts`).
 *  3. If down, create a GitHub issue (or comment on an existing open one,
 *     throttled to 1 hour).
 *  4. If up, close any open uptime issue.
 *
 * The classification table lives here in plain JS — it's short enough not to
 * warrant a shared module, and this Worker is a separate deployment from
 * the Next.js app.
 *
 * Secrets (set via `wrangler secret put`):
 *  - GITHUB_TOKEN — a fine-grained PAT with `issues:write` on the repo.
 *    The GITHUB_TOKEN from Actions doesn't work here; Workers need a
 *    separate token.
 *  - SITE_URL — defaults to the production URL in the Worker code.
 *  - VERCEL_ORIGIN_URL — the Vercel production alias, for the secondary
 *    probe. Optional.
 *
 * Related: D-039 (decision log) · scripts/probe-health.ts (the GH Actions
 * version, kept as a fallback) · .github/workflows/uptime.yml
 */

interface Env {
  SITE_URL?: string;
  VERCEL_ORIGIN_URL?: string;
  GITHUB_TOKEN: string;
  GITHUB_REPO: string;
}

const UPTIME_LABEL = 'uptime';
const COMMENT_THROTTLE_MS = 60 * 60 * 1000;

/**
 * Statuses that mean "the edge/origin is serving" rather than "it is broken".
 *
 * 2xx / 3xx — normal response or redirect.
 * 403 / 429 — Cloudflare challenge or rate limit (edge is alive).
 * 5xx — upstream failure.
 * 000 — could not connect / timed out.
 */
function classifyStatus(status: number): 'ok' | 'fault' {
  if (status >= 200 && status < 400) return 'ok';
  if (status === 403 || status === 429) return 'ok';
  return 'fault';
}

async function probeUrl(
  url: string,
): Promise<{ status: number; outcome: 'ok' | 'fault' }> {
  try {
    const response = await fetch(url, {
      headers: { accept: 'text/html,application/xhtml+xml' },
      redirect: 'manual',
      cf: { cacheTtl: 0 },
    } as RequestInit);
    return { status: response.status, outcome: classifyStatus(response.status) };
  } catch {
    return { status: 0, outcome: 'fault' as const };
  }
}

async function createIssue(env: Env, report: string): Promise<void> {
  const existing = await githubApi(
    env,
    'GET',
    `/repos/${env.GITHUB_REPO}/issues?state=open&labels=${UPTIME_LABEL}&per_page=1`,
  );

  const time = new Date().toISOString();

  if (Array.isArray(existing) && existing.length > 0) {
    const issue = existing[0] as { number: number };

    // Throttle: don't comment if the last comment was within 1 hour.
    const comments = await githubApi(
      env,
      'GET',
      `/repos/${env.GITHUB_REPO}/issues/${issue.number}/comments?sort=created&direction=desc&per_page=1`,
    );
    const lastComment =
      Array.isArray(comments) && comments.length > 0
        ? (comments[0] as { created_at: string }).created_at
        : null;
    if (
      lastComment &&
      Date.now() - new Date(lastComment).getTime() < COMMENT_THROTTLE_MS
    ) {
      console.log(
        `Issue #${issue.number} already commented within the last hour — skipping.`,
      );
      return;
    }

    await githubApi(
      env,
      'POST',
      `/repos/${env.GITHUB_REPO}/issues/${issue.number}/comments`,
      {
        body: `⚠️ 仍然不可达 — ${time}\n\n\`\`\`\n${report}\n\`\`\``,
      },
    );
    console.log(`Commented on existing issue #${issue.number}`);
    return;
  }

  const created = await githubApi(env, 'POST', `/repos/${env.GITHUB_REPO}/issues`, {
    title: `🔴 站点探活失败 (${time.slice(0, 16)}Z)`,
    body: [
      '生产站点探活失败（Cloudflare Worker cron）。各探针的原始结果：',
      '',
      '```',
      report,
      '```',
      '',
      '排查顺序：Vercel 部署状态 → Cloudflare 边缘 → DNS。',
    ].join('\n'),
    labels: [UPTIME_LABEL],
  });
  console.log(`Created issue #${(created as { number: number }).number}`);
}

async function closeIssue(env: Env, report: string): Promise<void> {
  const existing = await githubApi(
    env,
    'GET',
    `/repos/${env.GITHUB_REPO}/issues?state=open&labels=${UPTIME_LABEL}&per_page=1`,
  );

  if (!Array.isArray(existing) || existing.length === 0) {
    console.log('Site is up and no open issue — nothing to do.');
    return;
  }

  const issue = existing[0] as { number: number };
  const time = new Date().toISOString();

  await githubApi(
    env,
    'POST',
    `/repos/${env.GITHUB_REPO}/issues/${issue.number}/comments`,
    {
      body: `✅ 站点已恢复 — ${time}\n\n\`\`\`\n${report}\n\`\`\``,
    },
  );
  await githubApi(env, 'PATCH', `/repos/${env.GITHUB_REPO}/issues/${issue.number}`, {
    state: 'closed',
  });
  console.log(`Closed issue #${issue.number}`);
}

async function githubApi(
  env: Env,
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'x-github-api-version': '2022-11-28',
      'user-agent': 'chronicle-uptime-worker/1.0',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${method} ${path} failed: ${response.status} ${text}`);
  }

  if (response.status === 204) return [];
  return response.json();
}

export default {
  async scheduled(
    _controller: ScheduledController,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<void> {
    const siteUrl = env.SITE_URL || 'https://incca.ccwu.cc';

    const results: Array<{
      label: string;
      url: string;
      status: number;
      outcome: 'ok' | 'fault';
    }> = [];

    // Primary: CF domain. Same-zone subrequest bypasses BFM by default.
    const cf = await probeUrl(siteUrl);
    results.push({ label: 'cloudflare:', url: siteUrl, ...cf });

    // Secondary: Vercel alias, if configured. Bypasses CF entirely.
    if (env.VERCEL_ORIGIN_URL) {
      const vercel = await probeUrl(env.VERCEL_ORIGIN_URL);
      results.push({ label: 'vercel:', url: env.VERCEL_ORIGIN_URL, ...vercel });
    }

    // Primary probe decides. CF ok = up; CF fault = down (Vercel is evidence).
    const primary = results[0];
    const state = primary?.outcome === 'ok' ? 'up' : 'down';

    const report = results
      .map((r) => {
        const code = r.status === 0 ? '000 (no response)' : String(r.status);
        return `${r.label} ${r.url} → HTTP ${code} [${r.outcome}]`;
      })
      .join('\n');

    console.log(report);
    console.log(`state: ${state}`);

    if (state === 'down') {
      await createIssue(env, report);
    } else {
      await closeIssue(env, report);
    }
  },
};
