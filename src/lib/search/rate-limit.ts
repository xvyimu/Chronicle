/**
 * Process-local fixed window rate limit for /api/search.
 * Multi-instance serverless is best-effort only; pairs with CDN cache.
 */

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetMs: number;
};

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

/** Max requests per window per key (IP). */
export const SEARCH_RATE_LIMIT_MAX = 60;
/** Window length in ms. */
export const SEARCH_RATE_LIMIT_WINDOW_MS = 60_000;

/** Prune stale buckets occasionally to avoid unbounded Map growth. */
const PRUNE_EVERY = 200;
let ops = 0;

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (now > bucket.reset) buckets.delete(key);
  }
}

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

/** Test helper — clear buckets between cases. */
export function resetSearchRateLimitForTests() {
  buckets.clear();
  ops = 0;
}

export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'anonymous';
}
