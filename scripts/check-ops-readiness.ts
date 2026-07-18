/**
 * 运营延后事项就绪检查：外部账号 + 条件触发门槛。
 *
 * Usage:
 *   pnpm check:ops-readiness
 *   pnpm check:ops-readiness -- --live
 *   pnpm check:ops-readiness -- --live --base-url=https://incca.ccwu.cc
 *   pnpm check:ops-readiness -- --json
 *
 * 默认读取本地仓库事实；`--live` 探测公开 SEO 面。
 * 退出码：仅当本地工程不变量失败或 `--live` 发现公开面回归时为 1。
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildOpsTrackReports,
  formatOpsStatus,
  isBlurCoverageComplete,
  type LiveOpsSnapshot,
  type LocalOpsSnapshot,
  type OpsTrackReport,
} from '../src/lib/ops-readiness';

const rootDir = process.cwd();

function parseArgs(argv: string[]): {
  live: boolean;
  json: boolean;
  baseUrl: string | null;
} {
  let live = false;
  let json = false;
  let baseUrl: string | null = null;
  for (const arg of argv) {
    if (arg === '--live') live = true;
    else if (arg === '--json') json = true;
    else if (arg.startsWith('--base-url=')) baseUrl = arg.slice('--base-url='.length);
  }
  return { live, json, baseUrl };
}

function listImageFiles(absDir: string): string[] {
  if (!existsSync(absDir)) return [];
  return readdirSync(absDir)
    .filter((name) => /\.(png|jpe?g|webp|gif|avif)$/i.test(name))
    .sort();
}

function readPublishedPostCount(): number {
  // 轻量：统计 content/blog 下 mdx 文件数；与生产 published 过滤可能略有差异，
  // 门槛判断用上界即可。精确数仍以 check:seo / repository 为准。
  const blogDir = path.join(rootDir, 'content', 'blog');
  if (!existsSync(blogDir)) return 0;
  return readdirSync(blogDir).filter((f) => f.endsWith('.mdx')).length;
}

function readProjectImagePaths(): string[] {
  const projectsPath = path.join(rootDir, 'data', 'projects.json');
  if (!existsSync(projectsPath)) return [];
  const projects = JSON.parse(readFileSync(projectsPath, 'utf8')) as Array<{
    image?: string;
  }>;
  return projects.map((p) => p.image).filter((image): image is string => Boolean(image));
}

function gatherLocalSnapshot(): LocalOpsSnapshot {
  const blurMapPath = path.join(rootDir, 'src', 'lib', 'image-blur-map.ts');
  const blurMapSource = existsSync(blurMapPath) ? readFileSync(blurMapPath, 'utf8') : '';
  const projectImages = readProjectImagePaths();
  const blogDir = path.join(rootDir, 'public', 'images', 'blog');
  const blogFiles = listImageFiles(blogDir);
  const blogPublicPaths = blogFiles.map((f) => `/images/blog/${f}`);

  const layoutSource = readFileSync(
    path.join(rootDir, 'src', 'app', 'layout.tsx'),
    'utf8',
  );
  const robotsSource = readFileSync(
    path.join(rootDir, 'src', 'app', 'robots.ts'),
    'utf8',
  );
  const nextConfigPath = [
    path.join(rootDir, 'next.config.ts'),
    path.join(rootDir, 'next.config.mjs'),
    path.join(rootDir, 'next.config.js'),
  ].find((p) => existsSync(p));
  const nextConfigSource = nextConfigPath ? readFileSync(nextConfigPath, 'utf8') : '';

  // 启发式：源码中明确出现常见外部数据客户端时标记（不含 Vercel analytics）。
  const hasExternalDataIntegration =
    /@supabase\/|from ['"]@neondatabase|prisma\.|drizzle-orm|meilisearch|@elastic\//.test(
      layoutSource + nextConfigSource,
    );

  return {
    publishedPostCount: readPublishedPostCount(),
    projectBlurCoverageOk: isBlurCoverageComplete(blurMapSource, projectImages),
    blogImageCount: blogFiles.length,
    blogBlurCoverageOk: isBlurCoverageComplete(blurMapSource, blogPublicPaths),
    speedInsightsWired:
      layoutSource.includes('SpeedInsights') &&
      layoutSource.includes('shouldRenderVercelInsights'),
    robotsDeclaresSitemap: /sitemap\s*:/.test(robotsSource),
    cacheComponentsEnabled: /cacheComponents\s*:\s*true/.test(nextConfigSource),
    hasExternalDataIntegration,
  };
}

async function fetchText(
  url: string,
): Promise<{ ok: boolean; status: number; body: string; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': 'blog-ops-readiness/1.0' },
      redirect: 'follow',
    });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function gatherLiveSnapshot(baseUrl: string): Promise<LiveOpsSnapshot> {
  const origin = baseUrl.replace(/\/$/, '');
  const errors: string[] = [];

  const sitemap = await fetchText(`${origin}/sitemap.xml`);
  const robots = await fetchText(`${origin}/robots.txt`);
  const home = await fetchText(`${origin}/`);

  if (!sitemap.ok) {
    errors.push(
      `sitemap status=${sitemap.status}${sitemap.error ? ` ${sitemap.error}` : ''}`,
    );
  } else if (
    !sitemap.body.includes('<urlset') &&
    !sitemap.body.includes('<sitemapindex')
  ) {
    errors.push('sitemap body missing urlset/sitemapindex');
  }

  if (!robots.ok) {
    errors.push(
      `robots status=${robots.status}${robots.error ? ` ${robots.error}` : ''}`,
    );
  }

  const robotsMentionsSitemap = /sitemap:\s*https?:\/\//i.test(robots.body);
  if (robots.ok && !robotsMentionsSitemap) {
    errors.push('robots.txt missing Sitemap: absolute URL');
  }

  if (!home.ok) {
    errors.push(`home status=${home.status}${home.error ? ` ${home.error}` : ''}`);
  }

  const speedInsightsScriptHint =
    /speed-insights|\/_vercel\/speed-insights|va\.vercel-scripts/i.test(home.body);

  return {
    baseUrl: origin,
    sitemapOk:
      sitemap.ok &&
      (sitemap.body.includes('<urlset') || sitemap.body.includes('<sitemapindex')),
    robotsOk: robots.ok,
    robotsMentionsSitemap,
    homeOk: home.ok,
    speedInsightsScriptHint,
    errors,
  };
}

function printHuman(reports: OpsTrackReport[], local: LocalOpsSnapshot): void {
  console.log('运营延后事项就绪报告');
  console.log(`published MDX posts (file count): ${local.publishedPostCount}`);
  console.log(
    `blur: projects=${local.projectBlurCoverageOk ? 'ok' : 'MISSING'} blogImages=${local.blogImageCount} blogCoverage=${local.blogBlurCoverageOk ? 'ok' : 'n/a-or-missing'}`,
  );
  console.log('');
  for (const report of reports) {
    console.log(`[${formatOpsStatus(report.status)}] ${report.title}`);
    console.log(`  ${report.summary}`);
    console.log(`  next: ${report.nextAction}`);
    if (report.evidence.length > 0) {
      console.log(`  evidence: ${report.evidence.join('; ')}`);
    }
    console.log('');
  }
  console.log('详情与授权剧本见 docs/ops-deferred-work-plan.md');
}

function hasHardFailure(reports: OpsTrackReport[], local: LocalOpsSnapshot): boolean {
  if (!local.projectBlurCoverageOk) return true;
  if (!local.robotsDeclaresSitemap) return true;
  if (!local.speedInsightsWired) return true;
  return reports.some((r) => r.status === 'live_regression');
}

async function main(): Promise<void> {
  const { live, json, baseUrl } = parseArgs(process.argv.slice(2));
  const local = gatherLocalSnapshot();
  let liveSnapshot: LiveOpsSnapshot | null = null;

  if (live) {
    const resolved =
      baseUrl ??
      process.env.PRODUCTION_CONTENT_BASE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'https://incca.ccwu.cc';
    if (/localhost|127\.0\.0\.1/i.test(resolved)) {
      console.error(
        'Refusing --live against localhost. Pass --base-url=https://incca.ccwu.cc',
      );
      process.exit(2);
    }
    liveSnapshot = await gatherLiveSnapshot(resolved);
  }

  const reports = buildOpsTrackReports(local, liveSnapshot);

  if (json) {
    console.log(JSON.stringify({ local, live: liveSnapshot, reports }, null, 2));
  } else {
    printHuman(reports, local);
    if (liveSnapshot && liveSnapshot.errors.length > 0) {
      console.error(
        'Live errors:\n' + liveSnapshot.errors.map((e) => `- ${e}`).join('\n'),
      );
    }
  }

  if (hasHardFailure(reports, local)) {
    process.exit(1);
  }
}

void main();
