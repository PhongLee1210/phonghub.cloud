import { describe, expect, test } from "bun:test";
import type { Redis } from "@upstash/redis";

import { acquireConcurrencySlot } from "./concurrency-limiter";

/**
 * Minimal in-memory fake satisfying just the `.eval()` shape the limiter
 * calls, faithfully reproducing the two Lua scripts' semantics
 * synchronously (JS's single-threaded execution makes this atomic per call,
 * the same way real Lua execution on the Redis server is atomic).
 */
function makeFakeRedis() {
  const store = new Map<string, number>();

  const fake = {
    store,
    eval: async (script: string, keys: string[], args: string[]) => {
      const key = keys[0];
      if (script.includes("INCR")) {
        // acquire script: INCR, EXPIRE-on-first, reject-and-DECR-over-max
        const max = Number(args[1]);
        const n = (store.get(key) ?? 0) + 1;
        store.set(key, n);
        if (n > max) {
          store.set(key, n - 1);
          return 0;
        }
        return 1;
      }
      // release script: DECR, floor at 0
      const n = (store.get(key) ?? 0) - 1;
      store.set(key, Math.max(0, n));
      return 1;
    },
  };

  return fake as unknown as Redis;
}

const opts = { maxConcurrent: 2, slotTtlSeconds: 120 };

// NODE_ENV is typed readonly by Next's ambient types; this is only a
// compile-time restriction — the underlying object is mutable at runtime.
function setNodeEnv(value: string | undefined) {
  (process.env as { NODE_ENV?: string }).NODE_ENV = value;
}

describe("acquireConcurrencySlot", () => {
  test("acquires when under the limit", async () => {
    const redis = makeFakeRedis();
    const slot = await acquireConcurrencySlot("1.2.3.4", redis, opts);
    expect(slot.acquired).toBe(true);
  });

  test("rejects at the limit, counter unchanged", async () => {
    const redis = makeFakeRedis();
    await acquireConcurrencySlot("1.2.3.4", redis, opts);
    await acquireConcurrencySlot("1.2.3.4", redis, opts);
    const before = (redis as any).store.get("phonghub:chat:concurrency:1.2.3.4");
    const third = await acquireConcurrencySlot("1.2.3.4", redis, opts);
    expect(third.acquired).toBe(false);
    expect((redis as any).store.get("phonghub:chat:concurrency:1.2.3.4")).toBe(
      before
    );
  });

  test("release decrements; double-release never goes below 0", async () => {
    const redis = makeFakeRedis();
    const slot = await acquireConcurrencySlot("1.2.3.4", redis, opts);
    await slot.release();
    await slot.release();
    expect((redis as any).store.get("phonghub:chat:concurrency:1.2.3.4")).toBe(
      0
    );
  });

  test("sequential acquire/release/acquire cycles correctly", async () => {
    const redis = makeFakeRedis();
    const a = await acquireConcurrencySlot("ip", redis, opts);
    const b = await acquireConcurrencySlot("ip", redis, opts);
    expect(a.acquired).toBe(true);
    expect(b.acquired).toBe(true);
    await a.release();
    const c = await acquireConcurrencySlot("ip", redis, opts);
    expect(c.acquired).toBe(true);
  });

  test("boundary: exactly maxConcurrent accepted, the rest rejected", async () => {
    const redis = makeFakeRedis();
    const results = await Promise.all([
      acquireConcurrencySlot("ip", redis, opts),
      acquireConcurrencySlot("ip", redis, opts),
      acquireConcurrencySlot("ip", redis, opts),
    ]);
    const acceptedCount = results.filter((r) => r.acquired).length;
    expect(acceptedCount).toBe(2);
  });

  test("fails open in development when redis is unconfigured", async () => {
    const original = process.env.NODE_ENV;
    setNodeEnv("development");
    try {
      const slot = await acquireConcurrencySlot("ip", undefined, opts);
      expect(slot.acquired).toBe(true);
    } finally {
      setNodeEnv(original);
    }
  });

  test("fails closed in production when redis is unconfigured", async () => {
    const original = process.env.NODE_ENV;
    setNodeEnv("production");
    try {
      const slot = await acquireConcurrencySlot("ip", undefined, opts);
      expect(slot.acquired).toBe(false);
    } finally {
      setNodeEnv(original);
    }
  });
});
