import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import {
  effectiveContextBudget,
  envKeyForProvider,
  getModelMetadata,
  resolveFallbackChain,
  resolveModelRef,
  splitModelRef,
} from "./config";

const ENV_KEYS = ["LLM_CHAT_MODEL", "LLM_CHEAP_MODEL", "LLM_CHAT_FALLBACKS"];
const originalEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    originalEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});

describe("resolveModelRef", () => {
  test("returns the default when no env override is set", () => {
    expect(resolveModelRef("chat")).toBe("anthropic:claude-haiku-4-5");
    expect(resolveModelRef("cheap")).toBe("groq:llama-3.1-8b-instant");
  });

  test("returns the env override when set", () => {
    process.env.LLM_CHAT_MODEL = "openai:gpt-4o-mini";
    expect(resolveModelRef("chat")).toBe("openai:gpt-4o-mini");
  });

  test("throws on an override missing the separator", () => {
    process.env.LLM_CHAT_MODEL = "not-a-valid-ref";
    expect(() => resolveModelRef("chat")).toThrow();
  });

  test("throws on an override with an unknown provider", () => {
    process.env.LLM_CHAT_MODEL = "unknown-provider:some-model";
    expect(() => resolveModelRef("chat")).toThrow();
  });
});

describe("resolveFallbackChain", () => {
  test("returns an empty array when unset", () => {
    expect(resolveFallbackChain()).toEqual([]);
  });

  test("parses a comma-separated list, trims whitespace, drops empty entries", () => {
    process.env.LLM_CHAT_FALLBACKS =
      " groq:llama-3.3-70b , openai:gpt-4o-mini ,";
    expect(resolveFallbackChain()).toEqual([
      "groq:llama-3.3-70b",
      "openai:gpt-4o-mini",
    ]);
  });

  test("throws if any entry is malformed", () => {
    process.env.LLM_CHAT_FALLBACKS = "groq:llama-3.3-70b,not-valid";
    expect(() => resolveFallbackChain()).toThrow();
  });
});

describe("envKeyForProvider", () => {
  test("returns the right env var name for each provider", () => {
    expect(envKeyForProvider("anthropic")).toBe("ANTHROPIC_API_KEY");
    expect(envKeyForProvider("openai")).toBe("OPENAI_API_KEY");
    expect(envKeyForProvider("google")).toBe("GOOGLE_GENERATIVE_AI_API_KEY");
    expect(envKeyForProvider("groq")).toBe("GROQ_API_KEY");
    expect(envKeyForProvider("mistral")).toBe("MISTRAL_API_KEY");
  });
});

describe("splitModelRef", () => {
  test("splits a provider:model ref", () => {
    expect(splitModelRef("anthropic:claude-haiku-4-5")).toEqual({
      providerId: "anthropic",
      model: "claude-haiku-4-5",
    });
  });
});

describe("getModelMetadata", () => {
  test("returns known metadata for claude-haiku-4-5", () => {
    expect(getModelMetadata("anthropic:claude-haiku-4-5")).toEqual({
      contextWindowTokens: 200_000,
      maxOutputTokens: 8_192,
    });
  });

  test("returns known metadata for groq:llama-3.1-8b-instant", () => {
    expect(getModelMetadata("groq:llama-3.1-8b-instant")).toEqual({
      contextWindowTokens: 128_000,
      maxOutputTokens: 8_192,
    });
  });

  test("returns conservative default for an unknown model", () => {
    expect(getModelMetadata("groq:some-unknown-model")).toEqual({
      contextWindowTokens: 8_192,
      maxOutputTokens: 4_096,
    });
  });
});

describe("effectiveContextBudget", () => {
  test("internal budget is binding when model window is large", () => {
    expect(effectiveContextBudget("chat", 28_000)).toBe(28_000);
  });

  test("model window is binding when internal budget exceeds it", () => {
    process.env.LLM_CHAT_MODEL = "groq:unknown-tiny-model";
    expect(effectiveContextBudget("chat", 28_000)).toBe(8_192 - 4_096);
  });

  test("returns internal budget when model window exactly matches it", () => {
    process.env.LLM_CHAT_MODEL = "mistral:mistral-small-latest";
    expect(effectiveContextBudget("chat", 28_000)).toBe(
      Math.min(28_000, 32_000 - 8_192)
    );
  });
});
