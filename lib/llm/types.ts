import "server-only";

// ── Provider identity ─────────────────────────────────────────────
// Extending to a 5th provider = add a literal here + one adapter file +
// one env key (see lib/llm/README.md).
export type ProviderId = "anthropic" | "openai" | "google" | "groq";

export type ModelRef = `${ProviderId}:${string}`;
export type ModelAlias = "chat" | "cheap";

// ── Provider-agnostic request ────────────────────────────────────
export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON schema, phase 2
}

export interface LLMRequest {
  messages: LLMMessage[];
  maxTokens: number;
  temperature?: number;
  tools?: LLMToolDef[]; // phase 2
  signal?: AbortSignal;
}

// ── Normalized stream output ─────────────────────────────────────
export type LLMStreamChunk =
  | { type: "text"; text: string }
  | { type: "tool_call"; name: string; args: unknown; id: string } // phase 2
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
  stream(model: string, req: LLMRequest): AsyncIterable<LLMStreamChunk>;
}
