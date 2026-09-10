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

export function assertWithinNationalNightOutRateLimit(key: string): void {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  if (existing.count >= MAX_SUBMISSIONS) {
    throw new Error("RATE_LIMITED");
  }

  existing.count += 1;
  buckets.set(key, existing);
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
