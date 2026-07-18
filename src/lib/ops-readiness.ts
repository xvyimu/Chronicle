/**
 * 运营延后事项的状态分类（纯函数，无 I/O）。
 * 供 scripts/check-ops-readiness 与单元测试共用。
 */

/** 站内搜索改外部引擎的文章数门槛。 */
export const EXTERNAL_SEARCH_POST_THRESHOLD = 200;

/** 真实用户 Core Web Vitals 目标（Speed Insights p75）。 */
export const RUM_TARGETS = {
  lcpMs: 2500,
  inpMs: 200,
  cls: 0.1,
} as const;

export type OpsTrackId =
  | 'gsc'
  | 'bing'
  | 'speed-insights'
  | 'external-search'
  | 'blog-image-blur'
  | 'css-prose-sink'
  | 'cache-components';

/**
 * 轨道状态：
 * - ready_for_auth：工程与公开 SEO 面已就绪，只差用户授权登录
 * - blocked_auth：明确依赖账号且当前禁止登录
 * - engineering_ready_waiting_samples：代码已接入，缺真实样本/token
 * - not_triggered：规模/素材/证据门槛未到
 * - live_regression：公开生产面异常，应先修再谈账号操作
 */
export type OpsTrackStatus =
  | 'ready_for_auth'
  | 'blocked_auth'
  | 'engineering_ready_waiting_samples'
  | 'not_triggered'
  | 'live_regression';

export type OpsTrackReport = {
  id: OpsTrackId;
  title: string;
  status: OpsTrackStatus;
  summary: string;
  nextAction: string;
  evidence: string[];
};

export type LocalOpsSnapshot = {
  /** 已发布文章数（生产过滤后）。 */
  publishedPostCount: number;
  /** 项目封面图是否都有 blur 条目。 */
  projectBlurCoverageOk: boolean;
  /** `public/images/blog` 下本地图片数量。 */
  blogImageCount: number;
  /** 正文图是否都有 blur 条目（无图时视为 true）。 */
  blogBlurCoverageOk: boolean;
  /** layout 是否在 Vercel 下渲染 Speed Insights。 */
  speedInsightsWired: boolean;
  /** 本地 robots 源是否声明 sitemap 字段（编译前结构检查）。 */
  robotsDeclaresSitemap: boolean;
  /** next.config 是否启用 cacheComponents（当前应否）。 */
  cacheComponentsEnabled: boolean;
  /** 是否存在明显外部异步数据源集成（启发式）。 */
  hasExternalDataIntegration: boolean;
};

export type LiveOpsSnapshot = {
  baseUrl: string;
  sitemapOk: boolean;
  robotsOk: boolean;
  robotsMentionsSitemap: boolean;
  homeOk: boolean;
  /** 响应中是否出现 speed-insights / va 脚本痕迹（尽力而为）。 */
  speedInsightsScriptHint: boolean;
  errors: string[];
};

function statusLabel(status: OpsTrackStatus): string {
  switch (status) {
    case 'ready_for_auth':
      return '可授权执行';
    case 'blocked_auth':
      return '阻塞：需账号授权';
    case 'engineering_ready_waiting_samples':
      return '工程就绪，等待样本';
    case 'not_triggered':
      return '未触发';
    case 'live_regression':
      return '生产公开面回归';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

/**
 * 根据本地与可选线上快照生成七条延后事项报告。
 * live 为 null 时不做生产回归判定，GSC/Bing 仍按“需授权”处理。
 */
export function buildOpsTrackReports(
  local: LocalOpsSnapshot,
  live: LiveOpsSnapshot | null,
): OpsTrackReport[] {
  const liveBroken =
    live !== null &&
    (!live.sitemapOk || !live.robotsOk || !live.robotsMentionsSitemap || !live.homeOk);

  const gsc: OpsTrackReport = liveBroken
    ? {
        id: 'gsc',
        title: 'Google Search Console',
        status: 'live_regression',
        summary: '生产 sitemap/robots/首页存在公开面异常，必须先修复再做域名验证。',
        nextAction:
          '修复生产 SEO 面后重跑 `pnpm check:ops-readiness -- --live`，再申请账号授权。',
        evidence: live?.errors ?? [],
      }
    : {
        id: 'gsc',
        title: 'Google Search Console',
        status: 'blocked_auth',
        summary:
          '工程与公开 SEO 面已就绪：sitemap/robots 由源码生成，生产冒烟可核验。剩余仅域名 DNS 验证与提交 sitemap。',
        nextAction:
          '用户明确授权 Google 账号登录后，按 docs/ops-deferred-work-plan.md §GSC 15 分钟剧本执行。',
        evidence: [
          `publishedPosts=${local.publishedPostCount}`,
          `robotsDeclaresSitemap=${local.robotsDeclaresSitemap}`,
          live
            ? `live sitemap/robots/home ok base=${live.baseUrl}`
            : 'live checks skipped (pass --live to probe production)',
        ],
      };

  const bing: OpsTrackReport = liveBroken
    ? {
        id: 'bing',
        title: 'Bing Webmaster',
        status: 'live_regression',
        summary: '与 GSC 共享公开 SEO 面；生产面异常时不导入。',
        nextAction: '先修复生产 SEO 面并完成 GSC，再从 GSC 导入 Bing。',
        evidence: live?.errors ?? [],
      }
    : {
        id: 'bing',
        title: 'Bing Webmaster',
        status: 'blocked_auth',
        summary: '不单独登录。最优路径是 GSC 验证成功后一键导入，避免重复 DNS。',
        nextAction: 'GSC 完成后，在同一授权窗口导入 Bing Webmaster。',
        evidence: ['dependsOn=gsc', 'importPath=gsc-property'],
      };

  const speed: OpsTrackReport = !local.speedInsightsWired
    ? {
        id: 'speed-insights',
        title: 'Vercel Speed Insights p75',
        status: 'not_triggered',
        summary: 'Speed Insights 组件未接线，需先恢复 layout 接入。',
        nextAction: '检查 src/app/layout.tsx 与 shouldRenderVercelInsights。',
        evidence: ['speedInsightsWired=false'],
      }
    : {
        id: 'speed-insights',
        title: 'Vercel Speed Insights p75',
        status: 'engineering_ready_waiting_samples',
        summary: `组件已在 Vercel 环境渲染。字段目标 LCP≤${RUM_TARGETS.lcpMs}ms / INP≤${RUM_TARGETS.inpMs}ms / CLS≤${RUM_TARGETS.cls}；无 token 与足够样本时禁止用 Lighthouse 代填。`,
        nextAction:
          '用户授权只读 Vercel 控制台或 API token 后，回填六页 p75 到 performance-baseline；样本不足则保持 pending。',
        evidence: [
          'layout:Analytics+SpeedInsights gated by VERCEL=1',
          live
            ? `liveScriptHint=${live.speedInsightsScriptHint}`
            : 'live script hint skipped',
        ],
      };

  const remainingToSearch = Math.max(
    0,
    EXTERNAL_SEARCH_POST_THRESHOLD - local.publishedPostCount,
  );
  const externalSearch: OpsTrackReport =
    local.publishedPostCount >= EXTERNAL_SEARCH_POST_THRESHOLD
      ? {
          id: 'external-search',
          title: '外部搜索引擎评估',
          status: 'ready_for_auth',
          summary: `已达 ${EXTERNAL_SEARCH_POST_THRESHOLD} 篇门槛，应启动评估 ADR（仍默认保留进程内 Fuse，除非 p95 证据要求迁移）。`,
          nextAction: '写评估 ADR：成本、索引构建、隐私、回滚；禁止直接上 Meili/ES。',
          evidence: [`publishedPosts=${local.publishedPostCount}`],
        }
      : {
          id: 'external-search',
          title: '外部搜索引擎评估',
          status: 'not_triggered',
          summary: `当前 ${local.publishedPostCount} 篇，距门槛 ${EXTERNAL_SEARCH_POST_THRESHOLD} 还差 ${remainingToSearch} 篇；站内 Fuse + /api/search 足够。`,
          nextAction: '保持 server/search；仅在文章数或搜索 p95 持续超标时重开评估。',
          evidence: [
            `publishedPosts=${local.publishedPostCount}`,
            `threshold=${EXTERNAL_SEARCH_POST_THRESHOLD}`,
          ],
        };

  const blogBlur: OpsTrackReport =
    local.blogImageCount === 0
      ? {
          id: 'blog-image-blur',
          title: '正文图 LQIP',
          status: 'not_triggered',
          summary: 'public/images/blog 无本地正文图；项目图 blur 已覆盖。',
          nextAction:
            '首张正文本地图落入 public/images/blog 后运行 pnpm gen:blur && pnpm check:blur。',
          evidence: [
            `blogImageCount=0`,
            `projectBlurCoverageOk=${local.projectBlurCoverageOk}`,
          ],
        }
      : local.blogBlurCoverageOk
        ? {
            id: 'blog-image-blur',
            title: '正文图 LQIP',
            status: 'ready_for_auth',
            summary: `检测到 ${local.blogImageCount} 张正文图且 blur 覆盖完整。`,
            nextAction: '在 MDX 中引用这些图片并确认 Next/Image 使用 blur map。',
            evidence: [
              `blogImageCount=${local.blogImageCount}`,
              'blogBlurCoverageOk=true',
            ],
          }
        : {
            id: 'blog-image-blur',
            title: '正文图 LQIP',
            status: 'live_regression',
            summary: `存在 ${local.blogImageCount} 张正文图但 blur map 未覆盖。`,
            nextAction: '运行 pnpm gen:blur 后 pnpm check:blur。',
            evidence: [
              `blogImageCount=${local.blogImageCount}`,
              `blogBlurCoverageOk=false`,
            ],
          };

  const cssProse: OpsTrackReport = {
    id: 'css-prose-sink',
    title: 'prose/article-ui CSS 下沉',
    status: 'not_triggered',
    summary:
      'prose.css 同时服务 about 与 blog；无 Coverage 证明前下沉有回归风险，保持根 layout 导入。',
    nextAction: '仅在有 CSS Coverage + 层叠方案证明净收益后开 ADR。',
    evidence: ['sharedConsumers=about,blog', 'importSite=root-layout'],
  };

  const cacheComponents: OpsTrackReport =
    local.cacheComponentsEnabled || local.hasExternalDataIntegration
      ? {
          id: 'cache-components',
          title: 'Cache Components',
          status: 'ready_for_auth',
          summary: '检测到 cacheComponents 或外部数据集成信号，应按迁移指南开 ADR。',
          nextAction:
            '阅读 docs/cache-components-migration.md 并开独立 ADR，禁止静默全量切换。',
          evidence: [
            `cacheComponentsEnabled=${local.cacheComponentsEnabled}`,
            `hasExternalDataIntegration=${local.hasExternalDataIntegration}`,
          ],
        }
      : {
          id: 'cache-components',
          title: 'Cache Components',
          status: 'not_triggered',
          summary:
            '本地 MDX/JSON + createCache 足够；nonce 动态 HTML 下启用也不会 magically SSG。',
          nextAction: '引入外部数据/ISR/细粒度失效前不要启用。',
          evidence: [
            `cacheComponentsEnabled=${local.cacheComponentsEnabled}`,
            `hasExternalDataIntegration=${local.hasExternalDataIntegration}`,
          ],
        };

  return [gsc, bing, speed, externalSearch, blogBlur, cssProse, cacheComponents];
}

/** 供 CLI 与测试使用的状态中文标签。 */
export function formatOpsStatus(status: OpsTrackStatus): string {
  return statusLabel(status);
}

/**
 * 从 blur map 源码文本判断给定 public 路径是否已有条目。
 */
export function blurMapHasPath(mapSource: string, publicPath: string): boolean {
  return mapSource.includes(`'${publicPath}'`) || mapSource.includes(`"${publicPath}"`);
}

/**
 * 计算一组图片路径的 blur 覆盖是否完整。
 */
export function isBlurCoverageComplete(
  mapSource: string,
  publicPaths: readonly string[],
): boolean {
  return publicPaths.every((p) => blurMapHasPath(mapSource, p));
}
