/**
 * 公开 Route Handler 的进程内固定窗口限流（origin 尽力而为）。
 *
 * 语义：
 * - 只统计到达本 Node isolate 的请求（缓存未命中/未缓存）
 * - 带 s-maxage 的 CDN 命中不会进入本 Map
 * - 多实例 serverless 不跨 isolate 共享计数（无 Redis/KV；勿把本 Map 当全局限额）
 * - 不是全局安全边界；硬配额应放在平台 Firewall/WAF
 * - 运维边界与勾选表：docs/ops/public-api-rate-limit-boundary.md（CH-CR-001/002）
 *
 * 当前消费者：search / preview / csp-report。共用同一 Map，用 key 前缀隔离配额
 *（`preview:`、`csp-report:`）。模块仍放在 `server/search` 是历史路径；
 * 第四个非搜索消费者出现时再抽到 `server/rate-limit`。
 *
 * IP key 仅信任平台所有的 `x-vercel-forwarded-for`，忽略可伪造的通用转发头；
 * 无有效平台 IP 时回退 `anonymous`（同 isolate 内共享一桶，非安全分区）。
 */

/** 单次限流检查结果：是否放行、剩余配额与窗口重置时间。 */
export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetMs: number;
};

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

/** 每个 key 在窗口内允许的最大请求数。 */
export const SEARCH_RATE_LIMIT_MAX = 60;
/** 预览 API 窗口内最大请求数（hover 可能短时连发多个 slug）。 */
export const PREVIEW_RATE_LIMIT_MAX = 120;
/**
 * CSP 违规上报窗口内最大请求数。
 * 浏览器可能对单页多条违规连发上报；给一个宽松但有界的配额，
 * 防止被伪造上报刷爆日志（report 端点无鉴权、公开可 POST）。
 */
export const CSP_REPORT_RATE_LIMIT_MAX = 30;
/** 限流窗口长度（毫秒）。 */
export const SEARCH_RATE_LIMIT_WINDOW_MS = 60_000;

/** 每隔若干次操作清理过期 bucket，避免 Map 无界增长。 */
const PRUNE_EVERY = 200;
let ops = 0;

function normalizeIp(value: string): string | null {
  const ip = value.trim().replace(/^\[|\]$/g, '');
  if (!ip) return null;

  const ipv4 = ip.split('.');
  if (
    ipv4.length === 4 &&
    ipv4.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  ) {
    return ip;
  }

  if (ip.includes(':') && ip.length <= 45 && /^[0-9a-f:.]+$/i.test(ip)) {
    return ip;
  }

  return null;
}

function firstValidIp(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(',')) {
    const ip = normalizeIp(part);
    if (ip) return ip;
  }
  return null;
}

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (now > bucket.reset) buckets.delete(key);
  }
}

/**
 * 对给定 key 执行固定窗口计数并返回是否放行。
 * @param key 限流键，通常来自 clientKeyFromRequest
 * @param now 可选当前时间戳，便于测试注入
 * @param max 窗口内最大次数，默认 SEARCH_RATE_LIMIT_MAX
 * @param windowMs 窗口毫秒数，默认 SEARCH_RATE_LIMIT_WINDOW_MS
 */
export function checkSearchRateLimit(
  key: string,
  now = Date.now(),
  max = SEARCH_RATE_LIMIT_MAX,
  windowMs = SEARCH_RATE_LIMIT_WINDOW_MS,
): RateLimitResult {
  ops += 1;
  if (ops % PRUNE_EVERY === 0) prune(now);

  let bucket = buckets.get(key);
  if (!bucket || now > bucket.reset) {
    bucket = { count: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const remaining = Math.max(0, max - bucket.count);
  return {
    ok: bucket.count <= max,
    remaining,
    resetMs: bucket.reset,
  };
}

/**
 * 预览 API 限流：与搜索共用固定窗口实现，key 加 `preview:` 前缀隔离配额。
 */
export function checkPreviewRateLimit(
  key: string,
  now = Date.now(),
  max = PREVIEW_RATE_LIMIT_MAX,
  windowMs = SEARCH_RATE_LIMIT_WINDOW_MS,
): RateLimitResult {
  return checkSearchRateLimit(`preview:${key}`, now, max, windowMs);
}

/**
 * CSP 上报限流：与搜索共用固定窗口实现，key 加 `csp-report:` 前缀隔离配额。
 * 端点公开无鉴权，限流是防日志刷量的尽力而为措施，不是安全边界。
 */
export function checkCspReportRateLimit(
  key: string,
  now = Date.now(),
  max = CSP_REPORT_RATE_LIMIT_MAX,
  windowMs = SEARCH_RATE_LIMIT_WINDOW_MS,
): RateLimitResult {
  return checkSearchRateLimit(`csp-report:${key}`, now, max, windowMs);
}

/** 测试专用：清空限流桶与操作计数，避免用例间串扰。 */
export function resetSearchRateLimitForTests() {
  buckets.clear();
  ops = 0;
}

/**
 * 从请求提取可信限流 key。
 * 仅接受合法 `x-vercel-forwarded-for`；无有效 IP 时回退 `anonymous`。
 */
export function clientKeyFromRequest(request: Request): string {
  // Vercel 维护平台侧转发头，防止上游伪造通用 XFF。
  const vercelForwarded = firstValidIp(request.headers.get('x-vercel-forwarded-for'));
  if (vercelForwarded) return vercelForwarded;
  return 'anonymous';
}
