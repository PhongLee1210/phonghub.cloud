import "server-only";

import {
  effectiveContextBudget,
  resolveFallbackChain,
  resolveModelRef,
  splitModelRef,
} from "./config";
import { getProvider } from "./registry";
import { LLMError, LLMRequest, ModelAlias, ModelRef, LLMStreamChunk } from "./types";

/**
 * Public gateway API — the ONLY import app code uses. Resolves alias →
 * ModelRef → provider, applies the D8 fallback chain (chat alias only, and
 * only before the first token arrives), normalizes errors, and logs one
 * structured usage line per request.
 */
export async function* streamLLM(
  alias: ModelAlias,
  req: LLMRequest
): AsyncIterable<LLMStreamChunk> {
  const primaryRef = resolveModelRef(alias);
  const candidates: ModelRef[] =
    alias === "chat" ? [primaryRef, ...resolveFallbackChain()] : [primaryRef];

  logFallbackChainOnce(candidates);

  let lastError: unknown;

  for (let i = 0; i < candidates.length; i++) {
    const ref = candidates[i];
    const isLastCandidate = i === candidates.length - 1;
    const { providerId, model } = splitModelRef(ref);
    const provider = getProvider(providerId);

    if (!provider) {
      lastError = new LLMError(
        `Provider "${providerId}" requested by model ref "${ref}" is not configured (missing env key).`,
        { code: "auth", provider: providerId, retryable: false }
      );
      if (isLastCandidate) throw lastError;
      continue;
    }

    const startedAt = Date.now();
    let firstTokenAt: number | undefined;
    let receivedAnyChunk = false;

    // Tools are stripped for providers without mature tool-calling support
    // (see LLMProvider.supportsTools) — those candidates always run the
    // plain text-only path, never a broken/ignored tool request.
    const providerReq = provider.supportsTools ? req : { ...req, tools: undefined };

    try {
      for await (const chunk of provider.stream(model, providerReq)) {
        receivedAnyChunk = true;
        if (chunk.type === "text" && firstTokenAt === undefined) {
          firstTokenAt = Date.now();
        }
        if (chunk.type === "done") {
          logUsage({
            alias,
            ref,
            latencyToFirstTokenMs: firstTokenAt
              ? firstTokenAt - startedAt
              : undefined,
            usage: chunk.usage,
          });
        }
        yield chunk;
      }
      return;
    } catch (err) {
      const llmErr =
        err instanceof LLMError
          ? err
          : new LLMError(err instanceof Error ? err.message : String(err), {
              code: "unknown",
              provider: providerId,
              retryable: false,
            });

      logUsage({ alias, ref, errorCode: llmErr.code });

      // D8: never fall back mid-stream — only a pre-token failure is retryable.
      const canFallBack =
        !receivedAnyChunk && llmErr.retryable && !isLastCandidate;
      if (!canFallBack) throw llmErr;

      lastError = llmErr;
    }
  }

  throw lastError;
}

let fallbackChainLoggedOnce = false;

/**
 * One-time-per-lambda-instance visibility log for the D8 fallback chain —
 * only logs when a fallback is actually configured (LLM_CHAT_FALLBACKS
 * resolves to >1 candidate), silent otherwise. The fallback provider's key
 * is exposed to the same abuse surface as the primary; this is a reminder,
 * not an enforcement mechanism (see lib/llm/README.md).
 */
function logFallbackChainOnce(candidates: ModelRef[]) {
  if (fallbackChainLoggedOnce || candidates.length <= 1) return;
  fallbackChainLoggedOnce = true;
  console.log(
    JSON.stringify({
      scope: "llm.gateway.fallback_chain",
      chain: candidates,
      message:
        "Fallback chain is active — the fallback provider's key needs a spend cap too.",
    })
  );
}

function logUsage(entry: {
  alias: ModelAlias;
  ref: ModelRef;
  latencyToFirstTokenMs?: number;
  usage?: { inputTokens: number; outputTokens: number };
  errorCode?: string;
}) {
  console.log(
    JSON.stringify({
      scope: "llm.gateway",
      alias: entry.alias,
      model: entry.ref,
      latencyToFirstTokenMs: entry.latencyToFirstTokenMs,
      inputTokens: entry.usage?.inputTokens,
      outputTokens: entry.usage?.outputTokens,
      errorCode: entry.errorCode,
    })
  );
}

export { effectiveContextBudget };
