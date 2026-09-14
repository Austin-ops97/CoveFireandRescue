/**
 * Lightweight in-memory rate limiting for public NNO endpoints.
 * Best-effort protection against rapid automated posts within a single server instance.
 */

type RateBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateBucket>();

const SUBMIT_WINDOW_MS = 15 * 60 * 1000;
const SUBMIT_MAX = 5;

const STATUS_LOOKUP_WINDOW_MS = 15 * 60 * 1000;
const STATUS_LOOKUP_MAX = 20;

function assertWithinRateLimit(
  key: string,
  max: number,
  windowMs: number
): void {
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
  assertWithinRateLimit(`submit:${key}`, SUBMIT_MAX, SUBMIT_WINDOW_MS);
}

export function assertWithinNationalNightOutStatusLookupRateLimit(key: string): void {
  assertWithinRateLimit(`status:${key}`, STATUS_LOOKUP_MAX, STATUS_LOOKUP_WINDOW_MS);
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
