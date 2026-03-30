/**
 * Simple in-memory rate limiter for outreach actions
 * For production, use Redis-based rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  outlook_email: { maxRequests: 30, windowMs: 60 * 1000 }, // 30/min
  linkedin_connect: { maxRequests: 25, windowMs: 24 * 60 * 60 * 1000 }, // 25/day
  linkedin_message: { maxRequests: 50, windowMs: 24 * 60 * 60 * 1000 }, // 50/day
  google_scrape: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100/hour
};

export function checkRateLimit(
  key: string,
  action: string
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[action];
  if (!config) return { allowed: true, remaining: Infinity, resetIn: 0 };

  const limitKey = `${action}:${key}`;
  const now = Date.now();
  const entry = limits.get(limitKey);

  if (!entry || now >= entry.resetAt) {
    limits.set(limitKey, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetAt - now,
  };
}

export function resetRateLimit(key: string, action: string) {
  limits.delete(`${action}:${key}`);
}
