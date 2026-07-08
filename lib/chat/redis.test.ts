import { describe, expect, test } from "bun:test";

import { readRedisConfigFromEnv } from "./redis";

describe("readRedisConfigFromEnv", () => {
  test("returns undefined when both vars are missing", () => {
    expect(readRedisConfigFromEnv({})).toBeUndefined();
  });

  test("returns undefined when only one var is present", () => {
    expect(
      readRedisConfigFromEnv({ UPSTASH_REDIS_REST_URL: "https://x" })
    ).toBeUndefined();
    expect(
      readRedisConfigFromEnv({ UPSTASH_REDIS_REST_TOKEN: "token" })
    ).toBeUndefined();
  });

  test("returns the config when both vars are present", () => {
    expect(
      readRedisConfigFromEnv({
        UPSTASH_REDIS_REST_URL: "https://x",
        UPSTASH_REDIS_REST_TOKEN: "token",
      })
    ).toEqual({ url: "https://x", token: "token" });
  });
});
