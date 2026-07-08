import "server-only";

import type { Redis } from "@upstash/redis";

import { allowWhenUnconfigured } from "./redis";

export interface ConcurrencySlot {
  acquired: boolean;
  /** Idempotent — safe to call more than once (floors at 0, never double-decrements below). */
  release: () => Promise<void>;
}

export interface ConcurrencyLimiterOptions {
  maxConcurrent: number;
  /** Safety-net TTL in seconds in case release() never fires (crashed lambda). */
  slotTtlSeconds: number;
}

const KEY_PREFIX = "phonghub:chat:concurrency:";

// Atomic check-and-increment, same approach @upstash/ratelimit uses
// internally — a plain GET-then-INCR would race under concurrent requests
// from the same IP, which is exactly the abuse case this guards against.
// TTL is set only on the first INCR in a burst ("expire from first
// acquire"), not renewed by every arrival — simpler and self-healing: a
// sustained-abuse IP's key still expires ~slotTtlSeconds after it started,
// rather than being kept alive indefinitely by continuous traffic.
const ACQUIRE_SCRIPT = `
local n = redis.call('INCR', KEYS[1])
if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
if n > tonumber(ARGV[2]) then
  redis.call('DECR', KEYS[1])
  return 0
end
return 1
`;

// Floors at 0 defensively (double-release, or a release racing a TTL expiry).
const RELEASE_SCRIPT = `
local n = redis.call('DECR', KEYS[1])
if n < 0 then redis.call('SET', KEYS[1], 0) end
return 1
`;

/**
 * Acquires one concurrency slot for `ip`. Same fail-open-dev /
 * fail-closed-prod policy as checkRateLimit when redis is undefined, for
 * consistency across every Redis-backed guard.
 */
export async function acquireConcurrencySlot(
  ip: string,
  redis: Redis | undefined,
  opts: ConcurrencyLimiterOptions
): Promise<ConcurrencySlot> {
  if (!redis) {
    return { acquired: allowWhenUnconfigured(), release: async () => {} };
  }

  const key = `${KEY_PREFIX}${ip}`;
  const result = await redis.eval<[string, string], number>(
    ACQUIRE_SCRIPT,
    [key],
    [String(opts.slotTtlSeconds), String(opts.maxConcurrent)]
  );

  const acquired = result === 1;
  let released = false;

  return {
    acquired,
    release: async () => {
      if (!acquired || released) return;
      released = true;
      await redis.eval<[], number>(RELEASE_SCRIPT, [key], []);
    },
  };
}
