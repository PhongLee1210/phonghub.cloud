import "server-only";

import type { ToolSet } from "ai";

// ── Provider identity ─────────────────────────────────────────────
// Extending to another provider = add a literal here + one adapter file +
// one env key (see lib/llm/README.md).
export type ProviderId = "anthropic" | "openai" | "google" | "groq" | "mistral";

export type ModelRef = `${ProviderId}:${string}`;
export type ModelAlias = "chat" | "cheap";

// ── Provider-agnostic request ────────────────────────────────────
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  maxTokens: number;
  temperature?: number;
  /**
   * Native AI SDK tools (Zod-schema'd, with `execute()`), passed straight
   * through to `streamText`. Every provider adapter already builds on
   * `streamText` from the same `ai` package, so there is no separate
   * provider-agnostic tool-schema translation layer to maintain — the
   * earlier `LLMToolDef` placeholder is gone; it never matched what
   * `tool()` actually expects.
   */
  tools?: ToolSet;
  signal?: AbortSignal;
}

// ── Normalized stream output ─────────────────────────────────────
export type LLMStreamChunk =
  | { type: "text"; text: string }
  | { type: "tool_call"; name: string; args: unknown; id: string }
  | { type: "tool_result"; name: string; result: unknown; id: string }
  | {
      type: "done";
      usage: { inputTokens: number; outputTokens: number };
      stopReason: "end" | "max_tokens" | "tool_call" | "aborted";
    };

// ── Normalized error taxonomy ─────────────────────────────────────
export type LLMErrorCode =
  | "auth"
  | "rate_limited"
  | "overloaded"
  | "context_too_long"
  | "bad_request"
  | "unknown";

export class LLMError extends Error {
  code: LLMErrorCode;
  provider: ProviderId;
  retryable: boolean;

  constructor(
    message: string,
    opts: { code: LLMErrorCode; provider: ProviderId; retryable: boolean }
  ) {
    super(message);
    this.name = "LLMError";
    this.code = opts.code;
    this.provider = opts.provider;
    this.retryable = opts.retryable;
  }
}

// ── The one interface every provider implements ──────────────────
export interface LLMProvider {
  id: ProviderId;
  /** True iff this provider's env key is present. */
  isConfigured(): boolean;
  /**
   * True iff this provider's models reliably support native tool-calling.
   * Gates whether `streamLLM` forwards `LLMRequest.tools` to `stream()` —
   * providers with `false` here always run the plain text-only path, even
   * if the caller supplied tools (see lib/llm/index.ts).
   */
  supportsTools: boolean;
  stream(model: string, req: LLMRequest): AsyncIterable<LLMStreamChunk>;
}
