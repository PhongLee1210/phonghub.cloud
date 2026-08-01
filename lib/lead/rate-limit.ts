import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { allowWhenUnconfigured, getRedisClient } from "@/lib/chat/redis";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

const LEAD_WINDOW = { max: 3, windowSeconds: 300 };

let warnedOnce = false;

function buildLimiter(): Ratelimit | undefined {
  const redis = getRedisClient();

  if (!redis) {
    if (!warnedOnce) {
      console.warn(
        "[lead/rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — " +
          (process.env.NODE_ENV === "production"
            ? "rejecting all lead submissions until configured."
            : "lead rate limiting is disabled in development.")
      );
      warnedOnce = true;
    }
    return undefined;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      LEAD_WINDOW.max,
      `${LEAD_WINDOW.windowSeconds} s`
    ),
    prefix: "phonghub:lead",
  });
}

let limiter: Ratelimit | undefined | null = null;
function getLimiter() {
  if (limiter === null) limiter = buildLimiter();
  return limiter;
}

export async function checkLeadRateLimit(
  ip: string
): Promise<RateLimitResult> {
  const l = getLimiter();
  if (!l) return { allowed: allowWhenUnconfigured() };

  const result = await l.limit(ip);
  if (!result.success) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((result.reset - Date.now()) / 1000)
      ),
    };
  }
  return { allowed: true };
}
