import { NextRequest } from "next/server";

import { chatConfig } from "@/config/chat";
import { acquireConcurrencySlot } from "@/lib/chat/concurrency-limiter";
import { buildSystemPrompt } from "@/lib/chat/context";
import { checkRateLimit } from "@/lib/chat/rate-limit";
import { getRedisClient } from "@/lib/chat/redis";
import { checkCombinedBudget, trimHistoryToBudget } from "@/lib/chat/token-budget";
import { checkTokenQuota, recordTokenUsage } from "@/lib/chat/token-quota";
import { streamLLM } from "@/lib/llm";
import { LLMError, LLMMessage, LLMStreamChunk } from "@/lib/llm/types";
import { ChatErrorCode, ChatRequestBody, ChatStreamEvent } from "@/types/chat";

export const runtime = "nodejs";
export const maxDuration = 60;

function ndjson(event: ChatStreamEvent): string {
  return JSON.stringify(event) + "\n";
}

function errorResponse(
  status: number,
  code: ChatErrorCode,
  message: string,
  retryAfterSeconds?: number
) {
  return new Response(ndjson({ type: "error", code, message }), {
    status,
    headers: {
      "Content-Type": "application/x-ndjson",
      ...(retryAfterSeconds !== undefined
        ? { "Retry-After": String(retryAfterSeconds) }
        : {}),
    },
  });
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function secondsUntilNextUtcMidnight(now: Date = new Date()): number {
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return Math.max(1, Math.ceil((nextMidnight - now.getTime()) / 1000));
}

function validateBody(body: unknown): ChatRequestBody | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return undefined;
  if (messages.length > chatConfig.limits.maxHistoryMessages) return undefined;

  for (const m of messages) {
    if (typeof m !== "object" || m === null) return undefined;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== "user" && role !== "assistant") return undefined;
    if (typeof content !== "string" || content.length === 0) return undefined;
    if (content.length > chatConfig.limits.maxInputChars) return undefined;
  }

  return { messages: messages as ChatRequestBody["messages"] };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(400, "input_too_long", "Malformed request body.");
  }

  const parsed = validateBody(body);
  if (!parsed) {
    return errorResponse(
      400,
      "input_too_long",
      "Invalid request: check message count, roles, and length."
    );
  }

  // Pure/sync, zero I/O — cheapest possible step, done before any network round trip.
  const trimmedHistory = trimHistoryToBudget(parsed.messages, {
    hardTokenBudget: chatConfig.contextBudget.hardHistoryTokenBudget,
  });
  if (trimmedHistory.trimmedCount > 0) {
    console.log(
      JSON.stringify({
        scope: "chat.budget",
        trimmedHistoryMessages: trimmedHistory.trimmedCount,
      })
    );
  }

  const ip = getClientIp(req);
  const redis = getRedisClient();

  // Independent, IP-keyed Redis reads — genuinely parallelizable, all
  // cheaper than the LLM call that follows.
  const [rateLimit, slot, quota] = await Promise.all([
    checkRateLimit(ip),
    acquireConcurrencySlot(ip, redis, chatConfig.concurrency),
    checkTokenQuota(ip, redis, chatConfig.limits.dailyTokenBudget),
  ]);

  if (!rateLimit.allowed) {
    await slot.release();
    return errorResponse(
      429,
      "rate_limited",
      "You're sending messages too quickly. Try again shortly.",
      rateLimit.retryAfterSeconds ?? 60
    );
  }

  if (!slot.acquired) {
    return errorResponse(
      429,
      "concurrency_limited",
      "You already have another message in flight. Wait for it to finish and try again.",
      5
    );
  }

  if (!quota.allowed) {
    await slot.release();
    return errorResponse(
      429,
      "rate_limited",
      "You've reached today's usage limit. Try again tomorrow.",
      secondsUntilNextUtcMidnight()
    );
  }

  const systemPromptResult = await buildSystemPrompt();

  const combinedBudget = checkCombinedBudget({
    systemPromptTokens: systemPromptResult.estimatedTokens,
    historyTokens: trimmedHistory.estimatedTokens,
    historyMessageCount: trimmedHistory.messages.length,
    maxTotalContextTokens: chatConfig.contextBudget.hardCombinedTokenBudget,
  });
  if (!combinedBudget.ok) {
    await slot.release();
    return errorResponse(
      400,
      "input_too_long",
      "Your conversation is too large for us to process — try starting a new one."
    );
  }

  const llmMessages: LLMMessage[] = [
    { role: "system", content: systemPromptResult.prompt },
    ...trimmedHistory.messages,
  ];

  const abortController = new AbortController();
  req.signal.addEventListener("abort", () => abortController.abort());

  const iterator = streamLLM("chat", {
    messages: llmMessages,
    maxTokens: chatConfig.limits.maxOutputTokens,
    signal: abortController.signal,
  })[Symbol.asyncIterator]();

  // Pull the first chunk before committing to a 200 response, so a
  // pre-token upstream failure (no fallback configured, or fallback
  // exhausted) can still surface as a real 502 per the plan's contract
  // table — once bytes are streaming we can no longer change the status.
  let first: IteratorResult<LLMStreamChunk>;
  try {
    first = await iterator.next();
  } catch (err) {
    await slot.release();
    const code: ChatErrorCode =
      err instanceof LLMError && err.code === "rate_limited"
        ? "rate_limited"
        : "upstream_error";
    return errorResponse(
      502,
      code,
      "Couldn't reach the assistant right now. Please try again."
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (chunk: LLMStreamChunk) => {
        if (chunk.type === "text") {
          controller.enqueue(
            encoder.encode(ndjson({ type: "token", text: chunk.text }))
          );
        } else if (chunk.type === "done") {
          void recordTokenUsage(ip, redis, chunk.usage.outputTokens).catch(
            (err) => console.error("[chat/route] recordTokenUsage failed:", err)
          );
          controller.enqueue(encoder.encode(ndjson({ type: "done" })));
        }
        // tool_call chunks are phase 2 (card/navigate events) — ignored for now.
      };

      try {
        if (!first.done) emit(first.value);
        while (true) {
          const next = await iterator.next();
          if (next.done) break;
          emit(next.value);
        }
      } catch {
        // Mid-stream failure: never falls back (D8), surfaces as an error event.
        controller.enqueue(
          encoder.encode(
            ndjson({
              type: "error",
              code: "upstream_error",
              message:
                "Something went wrong reaching the assistant. Please try again.",
            })
          )
        );
      } finally {
        // Note: this can't be a single try/finally around the whole POST
        // body — the stream's `start()` runs asynchronously after `return
        // new Response(stream, ...)` below already resolves the outer
        // function, so a top-level finally would release the slot the
        // instant the response is constructed, not when streaming actually
        // finishes. release() is idempotent, so this call site (covering
        // success, mid-stream error, and client abort) plus the early
        // pre-first-chunk catch above (covering the 502 path, which never
        // reaches here) together cover every exit path exactly once.
        await slot.release();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
