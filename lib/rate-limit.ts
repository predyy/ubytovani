type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
};

const rateLimitStore = new Map<string, RateLimitState>();

export function checkRateLimit(
  key: string,
  options: { windowMs: number; max: number },
): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: options.max - 1,
      resetAt,
    };
  }

  if (existing.count >= options.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfter: retryAfterSeconds,
    };
  }

  const nextCount = existing.count + 1;
  rateLimitStore.set(key, { count: nextCount, resetAt: existing.resetAt });

  return {
    allowed: true,
    remaining: Math.max(0, options.max - nextCount),
    resetAt: existing.resetAt,
  };
}
