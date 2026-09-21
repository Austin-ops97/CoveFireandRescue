/**
 * Lightweight in-memory rate limiting for public NNO submissions.
 * Best-effort protection against rapid automated posts within a single server instance.
 */

type RateBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateBucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_SUBMISSIONS = 5;
const STATUS_LOOKUP_MAX = 8;

export function assertWithinRateLimit(
  key: string,
  options?: { windowMs?: number; max?: number }
): void {
  const windowMs = options?.windowMs ?? WINDOW_MS;
  const max = options?.max ?? MAX_SUBMISSIONS;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (existing.count >= max) {
    throw new Error("RATE_LIMITED");
  }

  existing.count += 1;
  buckets.set(key, existing);
}

export function assertWithinNationalNightOutRateLimit(key: string): void {
  assertWithinRateLimit(key, { windowMs: WINDOW_MS, max: MAX_SUBMISSIONS });
}

export function assertWithinStatusLookupRateLimit(key: string): void {
  assertWithinRateLimit(`nno-status:${key}`, {
    windowMs: WINDOW_MS,
    max: STATUS_LOOKUP_MAX,
  });
}

export function getClientIpFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}
