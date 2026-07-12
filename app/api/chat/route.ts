import { NextRequest } from "next/server";

import { chatConfig } from "@/config/chat";
import { acquireConcurrencySlot } from "@/lib/chat/concurrency-limiter";
import { buildSystemPrompt } from "@/lib/chat/context";
import {
  createCommandSplitter,
  encodeEvent,
  parseCommandStream,
} from "@/lib/chat/protocol";
import { checkRateLimit } from "@/lib/chat/rate-limit";
import { getRedisClient } from "@/lib/chat/redis";
import {
  checkCombinedBudget,
  trimHistoryToBudget,
} from "@/lib/chat/token-budget";
import { checkTokenQuota, recordTokenUsage } from "@/lib/chat/token-quota";
import { isNonEmptyString, isObject, isUndefined } from "@/lib/guards";
import { effectiveContextBudget, streamLLM } from "@/lib/llm";
import { LLMError, LLMMessage, LLMStreamChunk } from "@/lib/llm/types";
import {
  ChatErrorCode,
  ChatEventType,
  ChatMessageAction,
  ChatRequestBody,
  ChatStreamEvent,
} from "@/types/chat";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Conservative, regex-based detection for an explicit "I want to support /
 * star the project" intent in the visitor's latest message. Deliberately
 * not routed through the LLM (no tool-calling wired up yet — see
 * `// tool_call chunks are phase 2` below) — this only needs to catch a
 * clear, narrow phrase, and a false negative just means the visitor uses
 * the always-visible header button instead.
 */
const STAR_INTENT_PATTERN =
  /\b(star|support)\b[\s\w'-]{0,40}\b(repo|repository|project|github)\b/i;

function detectsStarIntent(latestUserMessage: string | undefined): boolean {
  if (!latestUserMessage) return false;
  return STAR_INTENT_PATTERN.test(latestUserMessage);
}

function errorResponse(
  status: number,
  code: ChatErrorCode,
  message: string,
  retryAfterSeconds?: number
) {
  return new Response(
    encodeEvent({ type: ChatEventType.Error, code, message }),
    {
      status,
      headers: {
        "Content-Type": "application/x-ndjson",
        ...(retryAfterSeconds !== undefined
          ? { "Retry-After": String(retryAfterSeconds) }
          : {}),
      },
    }
  );
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
  if (!isObject(body)) return undefined;
  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) return undefined;
  if (messages.length > chatConfig.limits.maxHistoryMessages) return undefined;

  for (const m of messages) {
    if (!isObject(m)) return undefined;
    const { role, content } = m;
    if (role !== "user" && role !== "assistant") return undefined;
    if (!isNonEmptyString(content)) return undefined;
    if (content.length > chatConfig.limits.maxInputChars) return undefined;
  }

  return { messages: messages as ChatRequestBody["messages"] };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse(
      400,
      ChatErrorCode.InputTooLong,
      "Malformed request body."
    );
  }

  const parsed = validateBody(body);
  if (!parsed) {
    return errorResponse(
      400,
      ChatErrorCode.InputTooLong,
      "Invalid request: check message count, roles, and length."
    );
  }

  const latestUserMessage = [...parsed.messages]
    .reverse()
    .find((m) => m.role === "user");
  const starIntentDetected = detectsStarIntent(latestUserMessage?.content);

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

  // ── Guard checks (HTTP status codes) ─────────────────────────────
  // These four must reject with an HTTP status because no stream has
  // been opened yet — the client hasn't received a 200 response.

  const [rateLimit, slot, quota] = await Promise.all([
    checkRateLimit(ip),
    acquireConcurrencySlot(ip, redis, chatConfig.concurrency),
    checkTokenQuota(ip, redis, chatConfig.limits.dailyTokenBudget),
  ]);

  if (!rateLimit.allowed) {
    await slot.release();
    return errorResponse(
      429,
      ChatErrorCode.RateLimited,
      "You're sending messages too quickly. Try again shortly.",
      rateLimit.retryAfterSeconds ?? 60
    );
  }

  if (!slot.acquired) {
    return errorResponse(
      429,
      ChatErrorCode.ConcurrencyLimited,
      "You already have another message in flight. Wait for it to finish and try again.",
      5
    );
  }

  if (!quota.allowed) {
    await slot.release();
    return errorResponse(
      429,
      ChatErrorCode.RateLimited,
      "You've reached today's usage limit. Try again tomorrow.",
      secondsUntilNextUtcMidnight()
    );
  }

  // ── Stream boundary ──────────────────────────────────────────────
  // Return the Response immediately after guard checks. Everything below
  // (system prompt, budget, LLM dispatch) moves inside start() so the
  // client receives thinking events while waiting for the first token.
  // Failures past this point are NDJSON error events, not HTTP status
  // codes — the response is already committed to 200.

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatStreamEvent) => {
        controller.enqueue(encoder.encode(encodeEvent(event)));
      };

      const splitter = createCommandSplitter();

      try {
        // 1. Signal "preparing" — system prompt construction is next.
        send({ type: ChatEventType.Thinking, step: "preparing" });

        // 2. Build the system prompt (cached per lambda instance).
        const systemPromptResult = await buildSystemPrompt();

        // 3. Budget check using model-aware context window (Task 1.2).
        //    If the conversation is too large, emit an error event and
        //    bail — the finally block releases the slot.
        const combinedBudget = checkCombinedBudget({
          systemPromptTokens: systemPromptResult.estimatedTokens,
          historyTokens: trimmedHistory.estimatedTokens,
          historyMessageCount: trimmedHistory.messages.length,
          maxTotalContextTokens: effectiveContextBudget(
            "chat",
            chatConfig.contextBudget.hardCombinedTokenBudget
          ),
        });
        if (!combinedBudget.ok) {
          send({
            type: ChatEventType.Error,
            code: ChatErrorCode.InputTooLong,
            message:
              "Your conversation is too large for us to process — try starting a new one.",
          });
          return;
        }

        // 4. Signal "thinking" — the LLM dispatch is next; this is the
        //    real latency wait (500ms–3s for the first token).
        send({ type: ChatEventType.Thinking, step: "thinking" });

        // 5. Dispatch the LLM stream.
        const llmMessages: LLMMessage[] = [
          { role: "system", content: systemPromptResult.prompt },
          ...trimmedHistory.messages,
        ];

        const abortController = new AbortController();
        req.signal.addEventListener("abort", () => abortController.abort());

        const iterator = streamLLM("chat", {
          messages: llmMessages,
          maxTokens: chatConfig.limits.maxOutputTokens,
          temperature: chatConfig.limits.temperature,
          signal: abortController.signal,
        })[Symbol.asyncIterator]();

        // 6. Pull chunks and stream them. A throw here (pre-token or
        //    mid-stream) falls through to the unified catch below.
        const emit = (chunk: LLMStreamChunk) => {
          if (chunk.type === "text") {
            const visible = splitter.push(chunk.text);
            if (visible) {
              send({ type: ChatEventType.Token, text: visible });
            }
          } else if (chunk.type === "done") {
            void recordTokenUsage(ip, redis, chunk.usage.outputTokens).catch(
              (err) =>
                console.error("[chat/route] recordTokenUsage failed:", err)
            );

            const { remainder, raw } = splitter.finish();
            if (remainder) {
              send({ type: ChatEventType.Token, text: remainder });
            }

            const parsed = !isUndefined(raw) ? parseCommandStream(raw) : {};

            if (starIntentDetected) {
              send({
                type: ChatEventType.Action,
                action: ChatMessageAction.StarRepo,
              });
            }

            send({
              type: ChatEventType.Done,
              suggestions: parsed.suggest,
            });
          }
          // tool_call chunks are phase 2 (card/navigate events) — ignored for now.
        };

        let first = await iterator.next();
        if (!first.done) emit(first.value);
        while (true) {
          const next = await iterator.next();
          if (next.done) break;
          emit(next.value);
        }
      } catch (err) {
        // Unified error handler — covers both pre-token failures (no
        // fallback configured / exhausted) and mid-stream failures.
        // Rate-limited errors from the provider are surfaced distinctly;
        // everything else is a generic upstream error.
        splitter.finish();
        const code: ChatErrorCode =
          err instanceof LLMError && err.code === "rate_limited"
            ? ChatErrorCode.RateLimited
            : ChatErrorCode.UpstreamError;
        send({
          type: ChatEventType.Error,
          code,
          message: "Couldn't reach the assistant right now. Please try again.",
        });
      } finally {
        // Covers success, mid-stream error, pre-token error, and client
        // abort. release() is idempotent so this is the single exit path.
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
