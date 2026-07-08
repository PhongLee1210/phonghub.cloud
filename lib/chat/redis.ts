import "server-only";

import { Redis } from "@upstash/redis";

export interface RedisConfig {
  url: string;
  token: string;
}

/** Pure — reads env, returns config or undefined. No I/O. */
export function readRedisConfigFromEnv(
  env: Record<string, string | undefined> = process.env
): RedisConfig | undefined {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return undefined;
  return { url, token };
}

// undefined = not yet built, null = built and confirmed unavailable
let cached: Redis | null | undefined;

/** Lazily builds and caches a single Redis client per lambda instance. */
export function getRedisClient(): Redis | undefined {
  if (cached === undefined) {
    const config = readRedisConfigFromEnv();
    cached = config ? new Redis(config) : null;
  }
  return cached ?? undefined;
}

/**
 * Shared unconfigured-Redis policy: fail open in development (so local
 * iteration isn't blocked on provisioning Redis), fail closed in
 * production (never allow unbounded usage silently). Every Redis-backed
 * guard (rate limit, concurrency, token quota) uses this so the policy is
 * consistent and only decided in one place.
 */
export function allowWhenUnconfigured(
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  return nodeEnv !== "production";
}
