import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { __setProvidersForTests } from "./registry";
import { streamLLM } from "./index";
import { LLMError } from "./types";
import type {
  LLMProvider,
  LLMRequest,
  LLMStreamChunk,
  ProviderId,
} from "./types";

type Script =
  | { kind: "chunks"; chunks: LLMStreamChunk[] }
  | { kind: "throw"; error: LLMError; afterChunks?: LLMStreamChunk[] };

/** Scriptable fake implementing LLMProvider — no network, no real SDKs. */
class FakeProvider implements LLMProvider {
  /** Captures the request streamLLM actually forwarded, for gating assertions. */
  receivedReqs: LLMRequest[] = [];

  constructor(
    public id: ProviderId,
    private script: Script,
    private configured = true,
    public supportsTools = false
  ) {}

  isConfigured(): boolean {
    return this.configured;
  }

  async *stream(_model: string, req: LLMRequest): AsyncIterable<LLMStreamChunk> {
    this.receivedReqs.push(req);
    if (this.script.kind === "chunks") {
      for (const chunk of this.script.chunks) yield chunk;
      return;
    }
    if (this.script.afterChunks) {
      for (const chunk of this.script.afterChunks) yield chunk;
    }
    throw this.script.error;
  }
}

const DONE_CHUNK: LLMStreamChunk = {
  type: "done",
  usage: { inputTokens: 1, outputTokens: 1 },
  stopReason: "end",
};

function retryableError(provider: ProviderId): LLMError {
  return new LLMError("overloaded", { code: "overloaded", provider, retryable: true });
}

function nonRetryableError(provider: ProviderId): LLMError {
  return new LLMError("bad request", { code: "bad_request", provider, retryable: false });
}

/** Seeds the real registry with a fixed set of fakes — no module mocking. */
function setFakeProviders(providers: LLMProvider[]) {
  __setProvidersForTests(providers);
}

beforeEach(() => {
  setFakeProviders([]);

  // Deterministic alias resolution for every test in this file.
  process.env.LLM_CHAT_MODEL = "anthropic:primary-model";
  process.env.LLM_CHEAP_MODEL = "groq:cheap-model";
  delete process.env.LLM_CHAT_FALLBACKS;
});

afterEach(() => {
  delete process.env.LLM_CHAT_MODEL;
  delete process.env.LLM_CHEAP_MODEL;
  delete process.env.LLM_CHAT_FALLBACKS;
});

async function collect(iter: AsyncIterable<LLMStreamChunk>): Promise<LLMStreamChunk[]> {
  const out: LLMStreamChunk[] = [];
  for await (const chunk of iter) out.push(chunk);
  return out;
}

const req: LLMRequest = { messages: [{ role: "user", content: "hi" }], maxTokens: 100 };

describe("streamLLM", () => {
  test("invokes the provider resolved from the alias", async () => {
    setFakeProviders([
      new FakeProvider("anthropic", {
        kind: "chunks",
        chunks: [{ type: "text", text: "hello" }, DONE_CHUNK],
      }),
    ]);

    const chunks = await collect(streamLLM("chat", req));
    expect(chunks).toEqual([{ type: "text", text: "hello" }, DONE_CHUNK]);
  });

  test("unconfigured provider throws an auth LLMError", async () => {
    // no providers registered
    await expect(collect(streamLLM("chat", req))).rejects.toMatchObject({
      code: "auth",
    });
  });

  test("pre-token retryable error falls back to the next candidate once", async () => {
    process.env.LLM_CHAT_FALLBACKS = "groq:fallback-model";
    setFakeProviders([
      new FakeProvider("anthropic", { kind: "throw", error: retryableError("anthropic") }),
      new FakeProvider("groq", {
        kind: "chunks",
        chunks: [{ type: "text", text: "from fallback" }, DONE_CHUNK],
      }),
    ]);

    const chunks = await collect(streamLLM("chat", req));
    expect(chunks).toEqual([{ type: "text", text: "from fallback" }, DONE_CHUNK]);
  });

  test("pre-token retryable error on every candidate throws the last one", async () => {
    process.env.LLM_CHAT_FALLBACKS = "groq:fallback-model";
    setFakeProviders([
      new FakeProvider("anthropic", { kind: "throw", error: retryableError("anthropic") }),
      new FakeProvider("groq", { kind: "throw", error: retryableError("groq") }),
    ]);

    await expect(collect(streamLLM("chat", req))).rejects.toMatchObject({
      provider: "groq",
    });
  });

  test("pre-token non-retryable error never falls back", async () => {
    process.env.LLM_CHAT_FALLBACKS = "groq:fallback-model";
    setFakeProviders([
      new FakeProvider("anthropic", { kind: "throw", error: nonRetryableError("anthropic") }),
      new FakeProvider("groq", {
        kind: "chunks",
        chunks: [{ type: "text", text: "should not be reached" }, DONE_CHUNK],
      }),
    ]);

    await expect(collect(streamLLM("chat", req))).rejects.toMatchObject({
      provider: "anthropic",
    });
  });

  test("mid-stream error never falls back even if retryable", async () => {
    process.env.LLM_CHAT_FALLBACKS = "groq:fallback-model";
    setFakeProviders([
      new FakeProvider("anthropic", {
        kind: "throw",
        error: retryableError("anthropic"),
        afterChunks: [{ type: "text", text: "partial" }],
      }),
      new FakeProvider("groq", {
        kind: "chunks",
        chunks: [{ type: "text", text: "should not be reached" }, DONE_CHUNK],
      }),
    ]);

    const iter = streamLLM("chat", req)[Symbol.asyncIterator]();
    const first = await iter.next();
    expect(first.value).toEqual({ type: "text", text: "partial" });
    await expect(iter.next()).rejects.toMatchObject({ provider: "anthropic" });
  });

  test('"cheap" alias never applies the fallback chain', async () => {
    process.env.LLM_CHAT_FALLBACKS = "anthropic:should-not-be-used";
    setFakeProviders([
      new FakeProvider("groq", { kind: "throw", error: retryableError("groq") }),
      new FakeProvider("anthropic", {
        kind: "chunks",
        chunks: [{ type: "text", text: "should not be reached" }, DONE_CHUNK],
      }),
    ]);

    await expect(collect(streamLLM("cheap", req))).rejects.toMatchObject({
      provider: "groq",
    });
  });
});

describe("streamLLM — tool gating", () => {
  const fakeTools = { some_tool: {} } as unknown as LLMRequest["tools"];

  test("no tools requested — text-only path is unaffected regardless of supportsTools", async () => {
    const provider = new FakeProvider(
      "anthropic",
      { kind: "chunks", chunks: [{ type: "text", text: "hi" }, DONE_CHUNK] },
      true,
      false
    );
    setFakeProviders([provider]);

    await collect(streamLLM("chat", req));
    expect(provider.receivedReqs[0].tools).toBeUndefined();
  });

  test("supportsTools: true — tools are forwarded to stream()", async () => {
    const provider = new FakeProvider(
      "anthropic",
      { kind: "chunks", chunks: [DONE_CHUNK] },
      true,
      true
    );
    setFakeProviders([provider]);

    await collect(streamLLM("chat", { ...req, tools: fakeTools }));
    expect(provider.receivedReqs[0].tools).toBe(fakeTools);
  });

  test("supportsTools: false — tools are stripped before calling stream()", async () => {
    const provider = new FakeProvider(
      "anthropic",
      { kind: "chunks", chunks: [DONE_CHUNK] },
      true,
      false
    );
    setFakeProviders([provider]);

    await collect(streamLLM("chat", { ...req, tools: fakeTools }));
    expect(provider.receivedReqs[0].tools).toBeUndefined();
  });
});
