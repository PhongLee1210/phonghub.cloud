import "server-only";

import type { Redis } from "@upstash/redis";

import { allowWhenUnconfigured } from "./redis";

export interface TokenQuotaResult {
  allowed: boolean;
  remainingTokens?: number;
}

const KEY_PREFIX = "phonghub:chat:tokenquota:";

/** TTL comfortably longer than a day so the key survives UTC-day-boundary edge cases, then self-expires. */
const QUOTA_KEY_TTL_SECONDS = 26 * 60 * 60;

// INCRBY + EXPIRE-only-on-first-write, same atomic pattern as the
// concurrency limiter's Lua script.
const RECORD_SCRIPT = `
local n = redis.call('INCRBY', KEYS[1], ARGV[1])
if n == tonumber(ARGV[1]) then redis.call('EXPIRE', KEYS[1], ARGV[2]) end
return n
`;

/** Pure — stable per (ip, UTC day), differs across day boundaries. */
export function dailyQuotaKey(ip: string, now: Date): string {
  return `${KEY_PREFIX}${ip}:${now.toISOString().slice(0, 10)}`;
}

/**
 * Checks (does NOT record) whether `ip` has budget remaining today. This
 * is a check against *prior recorded* usage, not a true up-front
 * reservation — actual outputTokens is only known when a request's `done`
 * chunk arrives, so there's a necessary small TOCTOU gap between check and
 * record, bounded by the concurrency limiter's maxConcurrent cap (worst-case
 * daily overshoot per IP <= maxConcurrent * maxOutputTokens).
 */
export async function checkTokenQuota(
  ip: string,
  redis: Redis | undefined,
  dailyBudget: number,
  now: Date = new Date()
): Promise<TokenQuotaResult> {
  if (!redis) {
    return { allowed: allowWhenUnconfigured() };
  }

  const used = (await redis.get<number>(dailyQuotaKey(ip, now))) ?? 0;
  if (used >= dailyBudget) {
    return { allowed: false, remainingTokens: 0 };
  }
  return { allowed: true, remainingTokens: dailyBudget - used };
}

/**
 * Records actual usage after a request completes — called with the `done`
 * chunk's usage.outputTokens. Accumulates across the UTC day; TTL is set
 * only on the key's first write for that day.
 */
export async function recordTokenUsage(
  ip: string,
  redis: Redis | undefined,
  outputTokens: number,
  now: Date = new Date()
): Promise<void> {
  if (!redis || outputTokens <= 0) return;

  await redis.eval<[string, string], number>(
    RECORD_SCRIPT,
    [dailyQuotaKey(ip, now)],
    [String(outputTokens), String(QUOTA_KEY_TTL_SECONDS)]
  );
}
