import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import { LLMError } from "../types";
import type { LLMProvider, LLMStreamChunk } from "../types";

mock.module("server-only", () => ({}));

const capturedApiKeys: string[] = [];
let streamBehavior:
  | "ok"
  | "rate_limit_then_ok"
  | "rate_limit_all"
  | "auth_error" = "ok";
let callCount = 0;

function fakeStreamText() {
  callCount++;
  if (streamBehavior === "rate_limit_all") {
    throw Object.assign(new Error("rate limit exceeded"), { statusCode: 429 });
  }
  if (streamBehavior === "rate_limit_then_ok" && callCount === 1) {
    throw Object.assign(new Error("rate limit exceeded"), { statusCode: 429 });
  }
  if (streamBehavior === "auth_error") {
    throw Object.assign(new Error("invalid api key"), { statusCode: 401 });
  }
  return {
    fullStream: (async function* () {
      yield {
        type: "text-delta" as const,
        text: "hello",
        textDelta: "hello",
      };
      yield {
        type: "finish" as const,
        finishReason: "stop",
        totalUsage: { inputTokens: 10, outputTokens: 5 },
        usage: { inputTokens: 10, outputTokens: 5 },
        experimental_providerMetadata: {},
        response: {},
      };
    })(),
  };
}

mock.module("@ai-sdk/mistral", () => ({
  createMistral: ({ apiKey }: { apiKey: string }) => {
    capturedApiKeys.push(apiKey);
    return (_model: string) => ({ modelId: _model, provider: "mistral" });
  },
}));

mock.module("ai", () => ({
  streamText: () => fakeStreamText(),
  stepCountIs: () => undefined,
}));

async function collectChunks(
  iter: AsyncIterable<LLMStreamChunk>
): Promise<LLMStreamChunk[]> {
  const chunks: LLMStreamChunk[] = [];
  for await (const c of iter) chunks.push(c);
  return chunks;
}

const baseReq = {
  messages: [{ role: "user" as const, content: "hi" }],
  maxTokens: 100,
};

describe("mistral key rotation", () => {
  const originalEnv = { ...process.env };
  let mistralProvider: LLMProvider;
  let resetKeyIndex: () => void;

  beforeEach(async () => {
    const mod = await import("./mistral");
    mistralProvider = mod.mistralProvider;
    resetKeyIndex = mod.__resetKeyIndexForTests;
    resetKeyIndex();
    capturedApiKeys.length = 0;
    callCount = 0;
    streamBehavior = "ok";
    delete process.env.MISTRAL_API_KEY;
    delete process.env.FALLBACK_MISTRAL_API_KEY_FIRST;
    delete process.env.FALLBACK_MISTRAL_API_KEY_SECOND;
  });

  afterEach(() => {
    process.env.MISTRAL_API_KEY = originalEnv.MISTRAL_API_KEY;
    process.env.FALLBACK_MISTRAL_API_KEY_FIRST =
      originalEnv.FALLBACK_MISTRAL_API_KEY_FIRST;
    process.env.FALLBACK_MISTRAL_API_KEY_SECOND =
      originalEnv.FALLBACK_MISTRAL_API_KEY_SECOND;
  });

  test("isConfigured returns false when no keys set", () => {
    expect(mistralProvider.isConfigured()).toBe(false);
  });

  test("isConfigured returns true with only primary key", () => {
    process.env.MISTRAL_API_KEY = "key-primary";
    expect(mistralProvider.isConfigured()).toBe(true);
  });

  test("isConfigured returns true with only fallback key", () => {
    process.env.FALLBACK_MISTRAL_API_KEY_FIRST = "key-fallback";
    expect(mistralProvider.isConfigured()).toBe(true);
  });

  test("single key — rate limit throws normally", async () => {
    process.env.MISTRAL_API_KEY = "key-only";
    streamBehavior = "rate_limit_all";

    try {
      await collectChunks(mistralProvider.stream("test-model", baseReq));
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(LLMError);
      expect((err as LLMError).code).toBe("rate_limited");
    }
  });

  test("multiple keys — rate limit rotates to next key", async () => {
    process.env.MISTRAL_API_KEY = "key-A";
    process.env.FALLBACK_MISTRAL_API_KEY_FIRST = "key-B";
    streamBehavior = "rate_limit_then_ok";

    const chunks = await collectChunks(
      mistralProvider.stream("test-model", baseReq)
    );

    expect(capturedApiKeys).toEqual(["key-A", "key-B"]);
    expect(chunks.some((c) => c.type === "text")).toBe(true);
  });

  test("all keys exhausted — throws rate_limited", async () => {
    process.env.MISTRAL_API_KEY = "key-A";
    process.env.FALLBACK_MISTRAL_API_KEY_FIRST = "key-B";
    process.env.FALLBACK_MISTRAL_API_KEY_SECOND = "key-C";
    streamBehavior = "rate_limit_all";

    try {
      await collectChunks(mistralProvider.stream("test-model", baseReq));
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(LLMError);
      expect((err as LLMError).code).toBe("rate_limited");
    }
    expect(callCount).toBe(3);
  });

  test("non-rate-limit error throws immediately without rotation", async () => {
    process.env.MISTRAL_API_KEY = "key-A";
    process.env.FALLBACK_MISTRAL_API_KEY_FIRST = "key-B";
    streamBehavior = "auth_error";

    try {
      await collectChunks(mistralProvider.stream("test-model", baseReq));
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(LLMError);
      expect((err as LLMError).code).toBe("auth");
    }
    expect(callCount).toBe(1);
  });

  test("successful stream with single key", async () => {
    process.env.MISTRAL_API_KEY = "key-solo";
    streamBehavior = "ok";

    const chunks = await collectChunks(
      mistralProvider.stream("test-model", baseReq)
    );

    expect(capturedApiKeys).toEqual(["key-solo"]);
    expect(chunks).toEqual([
      { type: "text", text: "hello" },
      {
        type: "done",
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: "end",
      },
    ]);
  });
});
