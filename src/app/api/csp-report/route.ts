import { NextResponse } from 'next/server';
// Direct rate-limit import — avoid the search barrel so this collect-only
// handler does not cold-start Fuse / content pipeline on the telemetry isolate.
import {
  checkCspReportRateLimit,
  clientKeyFromRequest,
} from '@/server/search/rate-limit';

/** 显式 Node runtime：与其余 Route Handler 一致，便于日志与限流共享进程状态。 */
export const runtime = 'nodejs';

/** 单条上报的规范化投影：只保留诊断需要的字段，绝不回显原始 body。 */
type NormalizedReport = {
  documentUri?: string;
  violatedDirective?: string;
  effectiveDirective?: string;
  blockedUri?: string;
  disposition?: string;
};

/** 上报体最大字节数：超过视为异常/滥用，直接丢弃不解析。 */
const MAX_REPORT_BYTES = 16_384;

/**
 * POST /api/csp-report
 *
 * CSP 违规收集端点（collect-only）。同时接受两种浏览器格式：
 * - `report-uri`：`application/csp-report`，单对象 `{ "csp-report": {...} }`
 * - `report-to` / Reporting API：`application/reports+json`，数组 `[{ type, body }]`
 *
 * 端点公开、无鉴权、只写日志：不落库、不外发、不回显。以进程限流防日志刷量。
 * 无论解析成败一律返回 204，避免向潜在滥用者暴露解析细节。
 */
export async function POST(request: Request): Promise<NextResponse> {
  const key = clientKeyFromRequest(request);
  const limitState = checkCspReportRateLimit(key);
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
    // Early-out on Content-Length when present: avoid buffering multi-MB spam
    // bodies on a public unauthenticated sink. Missing/forged length still
    // falls through to the post-read size gate.
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

    const reports = normalizeReports(raw);
    for (const report of reports) {
      console.warn('[csp-report]', JSON.stringify(report));
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
 * 将两种上报格式规范化为统一投影数组。
 * 只提取白名单字段并强制为字符串，杜绝把任意攻击者可控结构写进日志。
 */
function normalizeReports(raw: string): NormalizedReport[] {
  const parsed: unknown = JSON.parse(raw);

  // Reporting API：数组，每项 { type: 'csp-violation', body: {...} }
  if (Array.isArray(parsed)) {
    return parsed.flatMap((entry) => {
      if (!isRecord(entry)) return [];
      const projected = projectReport(entry.body);
      return projected ? [projected] : [];
    });
  }

  // report-uri：{ "csp-report": {...} }
  if (isRecord(parsed) && isRecord(parsed['csp-report'])) {
    const projected = projectReport(parsed['csp-report']);
    return projected ? [projected] : [];
  }

  return [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * 从 body 取第一个非空字符串字段（camelCase / kebab-case 双写）。
 * 模块级，避免每条 report 再分配闭包。
 */
function pickString(
  body: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = body[key];
    if (typeof value === 'string' && value.length > 0) {
      // 截断以防超长 URI 撑爆日志行。
      return value.slice(0, 512);
    }
  }
  return undefined;
}

/** camelCase（Reporting API）与 kebab-case（report-uri）字段都取。 */
function projectReport(body: unknown): NormalizedReport | null {
  if (!isRecord(body)) return null;
  return {
    documentUri: pickString(body, 'documentURL', 'document-uri'),
    violatedDirective: pickString(body, 'violatedDirective', 'violated-directive'),
    effectiveDirective: pickString(body, 'effectiveDirective', 'effective-directive'),
    blockedUri: pickString(body, 'blockedURL', 'blocked-uri'),
    disposition: pickString(body, 'disposition'),
  };
}
