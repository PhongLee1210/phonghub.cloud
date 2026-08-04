import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { chatConfig } from "@/config/chat";
import { allowWhenUnconfigured, getRedisClient } from "./redis";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

let warnedOnce = false;

function buildLimiters(): { window: Ratelimit; day: Ratelimit } | undefined {
  const redis = getRedisClient();

  if (!redis) {
    // Fail closed in production, fail open in development so local
    // iteration isn't blocked on provisioning Redis.
    if (!warnedOnce) {
      console.warn(
        "[chat/rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — " +
          (process.env.NODE_ENV === "production"
            ? "rejecting all chat requests until configured."
            : "rate limiting is disabled in development.")
      );
      warnedOnce = true;
    }
    return undefined;
  }

  const { perWindow, perDay } = chatConfig.rateLimit;

  return {
    window: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        perWindow.max,
        `${perWindow.windowSeconds} s`
      ),
      prefix: "phonghub:chat:window",
    }),
    day: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(perDay.max, "86400 s"),
      prefix: "phonghub:chat:day",
    }),
  };
}

let limiters: ReturnType<typeof buildLimiters> | null = null;
function getLimiters() {
  if (limiters === null) limiters = buildLimiters();
  return limiters;
}

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const limiters = getLimiters();

  if (!limiters) {
    return { allowed: allowWhenUnconfigured() };
  }

  const [windowResult, dayResult] = await Promise.all([
    limiters.window.limit(ip),
    limiters.day.limit(ip),
  ]);

  if (!windowResult.success || !dayResult.success) {
    const soonestResetMs = Math.min(windowResult.reset, dayResult.reset);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((soonestResetMs - Date.now()) / 1000)
      ),
    };
  }

  return { allowed: true };
}
