import { describe, expect, test } from "bun:test";
import type { Redis } from "@upstash/redis";

import {
  checkTokenQuota,
  dailyQuotaKey,
  recordTokenUsage,
} from "./token-quota";

function makeFakeRedis() {
  const store = new Map<string, number>();

  const fake = {
    store,
    get: async (key: string) => store.get(key) ?? null,
    eval: async (_script: string, keys: string[], args: string[]) => {
      const key = keys[0];
      const increment = Number(args[0]);
      const n = (store.get(key) ?? 0) + increment;
      store.set(key, n);
      return n;
    },
  };

  return fake as unknown as Redis;
}

// NODE_ENV is typed readonly by Next's ambient types; this is only a
// compile-time restriction — the underlying object is mutable at runtime.
function setNodeEnv(value: string | undefined) {
  (process.env as { NODE_ENV?: string }).NODE_ENV = value;
}

describe("dailyQuotaKey", () => {
  test("is stable for the same (ip, date)", () => {
    const now = new Date("2026-07-06T12:00:00Z");
    expect(dailyQuotaKey("1.2.3.4", now)).toBe(
      dailyQuotaKey("1.2.3.4", new Date("2026-07-06T23:00:00Z"))
    );
  });

  test("differs across a UTC day boundary", () => {
    const before = dailyQuotaKey("1.2.3.4", new Date("2026-07-06T23:59:59Z"));
    const after = dailyQuotaKey("1.2.3.4", new Date("2026-07-07T00:00:01Z"));
    expect(before).not.toBe(after);
  });
});

describe("checkTokenQuota", () => {
  test("allowed with full budget when nothing recorded yet", async () => {
    const redis = makeFakeRedis();
    const result = await checkTokenQuota("ip", redis, 1000);
    expect(result).toEqual({ allowed: true, remainingTokens: 1000 });
  });

  test("allowed with reduced remaining budget after some usage", async () => {
    const redis = makeFakeRedis();
    const now = new Date();
    await recordTokenUsage("ip", redis, 300, now);
    const result = await checkTokenQuota("ip", redis, 1000, now);
    expect(result).toEqual({ allowed: true, remainingTokens: 700 });
  });

  test("blocked once usage reaches the daily budget", async () => {
    const redis = makeFakeRedis();
    const now = new Date();
    await recordTokenUsage("ip", redis, 1000, now);
    const result = await checkTokenQuota("ip", redis, 1000, now);
    expect(result).toEqual({ allowed: false, remainingTokens: 0 });
  });

  test("fails open in development when redis is unconfigured", async () => {
    const original = process.env.NODE_ENV;
    setNodeEnv("development");
    try {
      const result = await checkTokenQuota("ip", undefined, 1000);
      expect(result.allowed).toBe(true);
    } finally {
      setNodeEnv(original);
    }
  });

  test("fails closed in production when redis is unconfigured", async () => {
    const original = process.env.NODE_ENV;
    setNodeEnv("production");
    try {
      const result = await checkTokenQuota("ip", undefined, 1000);
      expect(result.allowed).toBe(false);
    } finally {
      setNodeEnv(original);
    }
  });
});

describe("recordTokenUsage", () => {
  test("accumulates across multiple calls the same day", async () => {
    const redis = makeFakeRedis();
    const now = new Date();
    await recordTokenUsage("ip", redis, 100, now);
    await recordTokenUsage("ip", redis, 250, now);
    const result = await checkTokenQuota("ip", redis, 1000, now);
    expect(result.remainingTokens).toBe(650);
  });

  test("is a no-op when redis is undefined", async () => {
    await expect(recordTokenUsage("ip", undefined, 100)).resolves.toBeUndefined();
  });
});
