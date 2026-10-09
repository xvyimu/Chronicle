import { NextResponse } from 'next/server';
// Direct rate-limit import — avoid any heavy barrel so this telemetry handler
// does not cold-start the content pipeline on its isolate.
import { checkClientErrorRateLimit, clientKeyFromRequest } from '@/server/rate-limit';

/** 显式 Node runtime：与其余 Route Handler 一致，便于日志与限流共享进程状态。 */
export const runtime = 'nodejs';

/**
 * 单条上报的规范化投影：只保留诊断需要的字段，绝不回显原始 body。
 *
 * `message` 已在客户端截断并把 URL 中的查询串去掉；这里再截一次，防止
 * 手写 POST 塞超长串撑爆日志行。
 */
type NormalizedError = {
  message?: string;
  digest?: string;
  path?: string;
  stack?: string;
  userAgent?: string;
};

/** 上报体最大字节数：超过视为异常/滥用，直接丢弃不解析。 */
const MAX_REPORT_BYTES = 8_192;

/** 单字段截断上限：日志行不该被一条消息撑成几 KB。 */
const MAX_FIELD_LEN = 512;

/**
 * POST /api/client-error
 *
 * 客户端错误边界（`src/app/error.tsx`）的收集端点。用途是在生产环境里
 * **看得见**用户撞到的错误——在此之前 `error.tsx` 只做 `console.error`，
 * 报错只留在访客自己的浏览器控制台里，站点维护者什么也不知道。
 *
 * 处理方式与 `/api/csp-report` 一致：公开、无鉴权、**只写日志**——不落库、
 * 不外发、不回显。一旦这两条被改动（比如接入 Sentry 或写进 KV），隐私面
 * 就变了，必须同步更新本文与 `docs/ARCHITECTURE.md`。
 *
 * 无论解析成败一律返回 204，避免向潜在滥用者暴露解析细节。
 */
export async function POST(request: Request): Promise<NextResponse> {
  const key = clientKeyFromRequest(request);
  const limitState = checkClientErrorRateLimit(key);
  if (!limitState.ok) {
    // 静默丢弃：上报是尽力而为遥测，超配额直接 429 且不留 body。
    return new NextResponse(null, {
      status: 429,
      headers: {
        'Retry-After': String(
          Math.max(1, Math.ceil((limitState.resetMs - Date.now()) / 1000)),
        ),
        'Cache-Control': 'no-store',
      },
    });
  }

  try {
    // Early-out on Content-Length when present: avoid buffering oversized
    // bodies on a public unauthenticated sink. A missing or forged length
    // still falls through to the post-read size gate.
    const contentLength = request.headers.get('content-length');
    if (contentLength !== null) {
      const declared = Number(contentLength);
      if (Number.isFinite(declared) && declared > MAX_REPORT_BYTES) {
        return noContent();
      }
    }

    const raw = await request.text();
    if (raw.length > MAX_REPORT_BYTES) {
      return noContent();
    }

    const report = normalizeReport(raw);
    if (report) {
      console.warn('[client-error]', JSON.stringify(report));
    }
  } catch {
    // 畸形 JSON / 读取失败：吞掉，端点不因上报内容而报错。
  }

  return noContent();
}

/** 204：上报端点无响应体，且不缓存。 */
function noContent(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
}

/**
 * 把请求体规范化为统一投影。
 *
 * 只提取白名单字段并强制为字符串——上报体里的任何结构都不可信，不能
 * 直接写进日志（否则等于给攻击者一个往日志里注入任意内容的口子）。
 */
function normalizeReport(raw: string): NormalizedError | null {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) return null;

  const report: NormalizedError = {};
  for (const field of ['message', 'digest', 'path', 'stack', 'userAgent'] as const) {
    const value = parsed[field];
    if (typeof value === 'string' && value.length > 0) {
      report[field] = value.slice(0, MAX_FIELD_LEN);
    }
  }

  // 全空视为无效上报，不入日志。
  return Object.keys(report).length > 0 ? report : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
