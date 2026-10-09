/**
 * error-report.ts — 客户端错误上报
 *
 * 把错误边界捕获到的异常 POST 到同源 `/api/client-error`，让生产环境的
 * 页面崩溃在站点日志里留痕。此前 `error.tsx` 只 `console.error`，错误只存在
 * 访客自己的浏览器里。
 *
 * 边界与取舍：
 *
 * - **只发同源**，不引第三方 SDK。CSP 的 `connect-src 'self'` 已允许这条路径，
 *   不需要为上报放宽任何指令。
 * - **失败即静默**。上报本身崩了绝不能影响错误页渲染——用 `sendBeacon` 优先
 *   （浏览器负责送达，页面卸载也不丢），退回 `fetch({keepalive:true})`，两条
 *   路径都包在 try/catch 里。
 * - **不收集隐私**。只发错误消息、digest、当前 pathname（**去掉查询串**——
 *   查询串里可能有用户内容）、截断后的堆栈、以及 UA。不发 cookie、不发 referrer。
 * - **本地开发不发**。开发环境的错误应该看终端，不该污染生产日志。
 *
 * 相关：端点 `src/app/api/client-error/route.ts` · 消费者 `src/app/error.tsx`
 */

/** 单字段截断上限，与端点侧一致；防止一条消息把日志行撑爆。 */
const MAX_FIELD_LEN = 512;

/** 上报端点（与 CSP 上报同源、同样 collect-only）。 */
export const CLIENT_ERROR_PATH = '/api/client-error';

export type ErrorReport = {
  message: string;
  digest?: string;
  path?: string;
  stack?: string;
  userAgent?: string;
};

/** Minimal shape we need from `window`; keeps this module free of DOM types. */
export type WindowLike = { navigator?: unknown };

/** The global window, or null when this runs on the server. */
export function detectWindow(): WindowLike | null {
  return typeof window === 'undefined' ? null : window;
}

/** 该不该上报：生产客户端且有 window。`win` 可注入，便于测试。 */
export function shouldReport(
  env: { NODE_ENV?: string } = process.env,
  win: WindowLike | null = detectWindow(),
): boolean {
  return env.NODE_ENV === 'production' && win !== null;
}

/** 截断并删掉空值，保证与端点侧的白名单字段一致。 */
export function buildReport(
  error: { message?: unknown; digest?: unknown; stack?: unknown },
  location: { pathname?: string; search?: string } | undefined,
  userAgent: string | undefined,
): ErrorReport | null {
  const message = typeof error.message === 'string' ? error.message : '';
  // 没有消息、没有 digest，这条上报没有诊断价值。
  if (!message && typeof error.digest !== 'string') return null;

  const report: ErrorReport = { message: message.slice(0, MAX_FIELD_LEN) };

  if (typeof error.digest === 'string' && error.digest) {
    report.digest = error.digest.slice(0, MAX_FIELD_LEN);
  }
  if (typeof error.stack === 'string' && error.stack) {
    report.stack = error.stack.slice(0, MAX_FIELD_LEN);
  }
  if (location?.pathname) {
    // 只留 pathname：查询串可能含用户输入或 token。
    report.path = location.pathname.slice(0, MAX_FIELD_LEN);
  }
  if (userAgent) {
    report.userAgent = userAgent.slice(0, MAX_FIELD_LEN);
  }

  return report;
}

/**
 * 发送一条上报。永远不抛出——调用方在 React 的 effect 里，抛了会变成
 * 二次崩溃，比丢掉一条遥测严重得多。
 */
export function sendErrorReport(report: ErrorReport | null): boolean {
  if (!report) return false;

  const body = JSON.stringify(report);

  try {
    // sendBeacon 优先：交给浏览器，页面正在卸载也送得出去。
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(CLIENT_ERROR_PATH, blob)) return true;
    }

    // keepalive 让 fetch 在页面卸载后仍能完成。
    void fetch(CLIENT_ERROR_PATH, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/**
 * 从任意错误对象组装并发送上报。给 `error.tsx` 用的一步入口。
 *
 * `location` 与 `userAgent` 可注入，便于测试；默认取全局。
 */
export function reportError(
  error: { message?: unknown; digest?: unknown; stack?: unknown },
  location?: { pathname?: string; search?: string },
  userAgent?: string,
  env: { NODE_ENV?: string } = process.env,
): boolean {
  if (!shouldReport(env)) return false;

  const loc = location ?? (typeof window !== 'undefined' ? window.location : undefined);
  const ua =
    userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : undefined);

  return sendErrorReport(buildReport(error, loc, ua));
}
