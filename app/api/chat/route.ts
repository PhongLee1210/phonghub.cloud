import { NextRequest } from "next/server";

import { chatConfig } from "@/config/chat";
import { acquireConcurrencySlot } from "@/lib/chat/concurrency-limiter";
import { buildSystemPrompt } from "@/lib/chat/context";
import { encodeEvent } from "@/lib/chat/protocol";
import { checkRateLimit } from "@/lib/chat/rate-limit";
import { getRedisClient } from "@/lib/chat/redis";
import { resolveCitation, CitationTarget } from "@/lib/chat/resources";
import { getSuggestions } from "@/lib/chat/suggestion-worker";
import {
  checkCombinedBudget,
  trimHistoryToBudget,
} from "@/lib/chat/token-budget";
import { CHAT_TOOLS } from "@/lib/chat/tools";
import { checkTokenQuota, recordTokenUsage } from "@/lib/chat/token-quota";
import { isNonEmptyString, isObject } from "@/lib/guards";
import { effectiveContextBudget, streamLLM } from "@/lib/llm";
import { LLMError, LLMMessage, LLMStreamChunk } from "@/lib/llm/types";
import {
  AgentCitation,
  AgentEntityId,
  ChatErrorCode,
  ChatEventType,
  ChatMessageAction,
  ChatRequestBody,
  ChatStreamEvent,
  InternalRoute,
} from "@/types/chat";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Conservative, regex-based detection for an explicit "I want to support /
 * star the project" intent in the visitor's latest message. Deliberately
 * not routed through the LLM/tool layer — a separate, narrow stopgap left
 * untouched by the tool-calling planner (see plan). This only needs to
 * catch a clear, narrow phrase; a false negative just means the visitor
 * uses the always-visible header button instead.
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

const SEARCH_TOOL_NAMES = new Set([
  "search_projects",
  "search_experiences",
  "search_skills",
  "search_resume",
  "search_blog",
]);

/** Every search tool's execute() returns `{ agentId, title, summary }[]`. */
function extractSearchAgentIds(result: unknown): CitationTarget[] {
  if (!Array.isArray(result)) return [];
  return result
    .filter((item): item is { agentId: CitationTarget } =>
      isObject(item) && isNonEmptyString(item.agentId)
    )
    .map((item) => item.agentId);
}

/** Shared by highlight_resource/focus/open_modal/expand_section — all four echo `{ ok, target }`. */
function extractTarget(result: unknown): CitationTarget | undefined {
  if (!isObject(result) || result.ok !== true) return undefined;
  return isNonEmptyString(result.target) ? (result.target as CitationTarget) : undefined;
}

function extractNavigateRoute(result: unknown): InternalRoute | undefined {
  if (!isObject(result) || result.ok !== true) return undefined;
  return isNonEmptyString(result.route) ? (result.route as InternalRoute) : undefined;
}

/**
 * Resolves every resource the model surfaced this turn (via a search tool
 * or highlight_resource) into a citation chip. A hallucinated/stale id from
 * the model is a real possibility (tool-call args aren't schema-guaranteed
 * to reference something that still exists), so a failed lookup is skipped
 * rather than failing the whole turn.
 */
async function resolveCitations(
  targets: Set<CitationTarget>
): Promise<AgentCitation[] | undefined> {
  if (targets.size === 0) return undefined;

  const resolved = await Promise.all(
    Array.from(targets).map(async (target) => {
      try {
        return await resolveCitation(target);
      } catch (err) {
        console.warn("[chat/route] resolveCitation failed:", err);
        return undefined;
      }
    })
  );

  const citations = resolved.filter((c): c is AgentCitation => c !== undefined);
  return citations.length > 0 ? citations : undefined;
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

      const citationTargets = new Set<CitationTarget>();
      let highlightTarget: AgentEntityId | undefined;
      let focusTarget: AgentEntityId | undefined;
      let skillSelectTarget: AgentEntityId | undefined;
      let openModalTarget: CitationTarget | undefined;
      let navigateRoute: InternalRoute | undefined;

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

        // 5a. Fire suggestion worker concurrently — uses conversation history
        //     only, cheap/fast model, resolves while the main stream runs.
        const suggestionsPromise = getSuggestions(trimmedHistory.messages);

        // 5b. Dispatch the LLM stream.
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
          tools: CHAT_TOOLS,
        })[Symbol.asyncIterator]();

        // 6. Pull chunks and stream them. A throw here (pre-token or
        //    mid-stream) falls through to the unified catch below.
        // tool_call/tool_result chunks arrive as structured stream parts
        // (native tool-calling) — no text-tail to split out anymore.
        const emit = async (chunk: LLMStreamChunk) => {
          if (chunk.type === "text") {
            if (chunk.text) send({ type: ChatEventType.Token, text: chunk.text });
          } else if (chunk.type === "tool_call") {
            send({ type: ChatEventType.Thinking, step: chunk.name });
          } else if (chunk.type === "tool_result") {
            if (SEARCH_TOOL_NAMES.has(chunk.name)) {
              for (const agentId of extractSearchAgentIds(chunk.result)) {
                citationTargets.add(agentId);
              }
            } else if (chunk.name === "highlight_resource") {
              const target = extractTarget(chunk.result);
              if (target) {
                citationTargets.add(target);
                if (target !== "resume") {
                  highlightTarget = target;
                  send({ type: ChatEventType.ToolEffect, highlight: target });
                }
              }
            } else if (chunk.name === "focus") {
              const target = extractTarget(chunk.result);
              if (target) {
                citationTargets.add(target);
                if (target !== "resume") {
                  focusTarget = target;
                  send({ type: ChatEventType.ToolEffect, focus: target });
                }
              }
            } else if (chunk.name === "select_skill") {
              const target = extractTarget(chunk.result);
              if (target) {
                citationTargets.add(target);
                if (target !== "resume") {
                  skillSelectTarget = target;
                  send({ type: ChatEventType.ToolEffect, skillSelect: target });
                }
              }
            } else if (chunk.name === "open_modal" || chunk.name === "expand_section") {
              const target = extractTarget(chunk.result);
              if (target) {
                citationTargets.add(target);
                openModalTarget = target;
                try {
                  const citation = await resolveCitation(target);
                  send({ type: ChatEventType.ToolEffect, openModal: citation });
                } catch (err) {
                  // Hallucinated/stale target id — same failure mode
                  // resolveCitations() already tolerates at end-of-turn;
                  // just skip the early effect.
                  console.warn(
                    "[chat/route] resolveCitation (tool effect) failed:",
                    err
                  );
                }
              }
            } else if (chunk.name === "navigate_to") {
              const route = extractNavigateRoute(chunk.result);
              if (route) {
                navigateRoute = route;
                send({ type: ChatEventType.ToolEffect, navigate: route });
              }
            }
          } else if (chunk.type === "done") {
            void recordTokenUsage(ip, redis, chunk.usage.outputTokens).catch(
              (err) =>
                console.error("[chat/route] recordTokenUsage failed:", err)
            );

            if (starIntentDetected) {
              send({
                type: ChatEventType.Action,
                action: ChatMessageAction.StarRepo,
              });
            }

            const [citations, suggestions] = await Promise.all([
              resolveCitations(citationTargets),
              suggestionsPromise,
            ]);

            send({
              type: ChatEventType.Done,
              suggestions,
              highlight: highlightTarget,
              focus: focusTarget,
              skillSelect: skillSelectTarget,
              openModal: openModalTarget,
              navigate: navigateRoute,
              citations,
            });
          }
        };

        let first = await iterator.next();
        if (!first.done) await emit(first.value);
        while (true) {
          const next = await iterator.next();
          if (next.done) break;
          await emit(next.value);
        }
      } catch (err) {
        // Unified error handler — covers both pre-token failures (no
        // fallback configured / exhausted) and mid-stream failures.
        // Rate-limited errors from the provider are surfaced distinctly;
        // everything else is a generic upstream error.
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
