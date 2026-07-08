import "server-only";

import { LLMError, LLMErrorCode, ProviderId } from "./types";

/**
 * Maps a raw error thrown by an @ai-sdk/* call into the normalized LLMError
 * taxonomy. AI SDK errors expose a `statusCode` (HTTP-shaped) on most
 * provider failures; we key off that first, then fall back to name/message
 * sniffing for SDK-level errors (e.g. AI_APICallError, AI_InvalidPromptError).
 */
export function toLLMError(err: unknown, provider: ProviderId): LLMError {
  if (err instanceof LLMError) return err;

  const statusCode = extractStatusCode(err);
  const message = err instanceof Error ? err.message : String(err);

  const { code, retryable } = classify(statusCode, message);

  return new LLMError(message, { code, provider, retryable });
}

function extractStatusCode(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const candidate = err as { statusCode?: unknown; status?: unknown };
  const raw = candidate.statusCode ?? candidate.status;
  return typeof raw === "number" ? raw : undefined;
}

function classify(
  statusCode: number | undefined,
  message: string
): { code: LLMErrorCode; retryable: boolean } {
  const lower = message.toLowerCase();

  if (statusCode === 401 || statusCode === 403 || lower.includes("api key")) {
    return { code: "auth", retryable: false };
  }
  if (statusCode === 429 || lower.includes("rate limit")) {
    return { code: "rate_limited", retryable: true };
  }
  if (
    statusCode === 529 ||
    statusCode === 503 ||
    lower.includes("overloaded")
  ) {
    return { code: "overloaded", retryable: true };
  }
  if (
    lower.includes("context") &&
    (lower.includes("too long") || lower.includes("maximum"))
  ) {
    return { code: "context_too_long", retryable: false };
  }
  if (statusCode !== undefined && statusCode >= 400 && statusCode < 500) {
    return { code: "bad_request", retryable: false };
  }
  if (statusCode !== undefined && statusCode >= 500) {
    return { code: "unknown", retryable: true };
  }
  return { code: "unknown", retryable: false };
}
