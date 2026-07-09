import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { allowWhenUnconfigured, getRedisClient } from "@/lib/chat/redis";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

/**
 * Guards POST /api/github/star against duplicate/spam clicks — separate
 * budget from the chat message limiter (lib/chat/rate-limit.ts) since this
 * is a single low-cost write, not an LLM call. Generous enough that a
 * legitimate double-click never trips it, tight enough to stop scripted abuse.
 */
const STAR_WINDOW = { max: 5, windowSeconds: 60 };

let warnedOnce = false;

function buildLimiter(): Ratelimit | undefined {
  const redis = getRedisClient();

  if (!redis) {
    if (!warnedOnce) {
      console.warn(
        "[github/rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — " +
          (process.env.NODE_ENV === "production"
            ? "rejecting all star requests until configured."
            : "star rate limiting is disabled in development.")
      );
      warnedOnce = true;
    }
    return undefined;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(STAR_WINDOW.max, `${STAR_WINDOW.windowSeconds} s`),
    prefix: "phonghub:github:star",
  });
}

let limiter: Ratelimit | undefined | null = null;
function getLimiter() {
  if (limiter === null) limiter = buildLimiter();
  return limiter;
}

export async function checkStarRateLimit(ip: string): Promise<RateLimitResult> {
  const l = getLimiter();
  if (!l) return { allowed: allowWhenUnconfigured() };

  const result = await l.limit(ip);
  if (!result.success) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    };
  }
  return { allowed: true };
}
