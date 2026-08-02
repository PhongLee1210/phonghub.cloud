import "server-only";

import { createMistral } from "@ai-sdk/mistral";
import { stepCountIs, streamText } from "ai";

import { toLLMError } from "../errors";
import { LLMProvider, LLMRequest, LLMStreamChunk } from "../types";
import { splitSystemMessage } from "../utils";

const KEY_ENV_VARS = [
  "MISTRAL_API_KEY",
  "FALLBACK_MISTRAL_API_KEY_FIRST",
  "FALLBACK_MISTRAL_API_KEY_SECOND",
] as const;

let currentKeyIndex = 0;

function getAvailableKeys(): string[] {
  return KEY_ENV_VARS.map((v) => process.env[v]).filter(
    (key): key is string => Boolean(key)
  );
}

function createModelWithCurrentKey(model: string) {
  const keys = getAvailableKeys();
  const key = keys[currentKeyIndex % keys.length];
  return createMistral({ apiKey: key })(model);
}

async function* runWithCurrentKey(
  model: string,
  req: LLMRequest
): AsyncIterable<LLMStreamChunk> {
  const { system, messages } = splitSystemMessage(req.messages);
  const result = streamText({
    model: createModelWithCurrentKey(model),
    system,
    messages,
    maxOutputTokens: req.maxTokens,
    temperature: req.temperature,
    abortSignal: req.signal,
    tools: req.tools,
    stopWhen: req.tools ? stepCountIs(3) : undefined,
  });

  for await (const part of result.fullStream) {
    switch (part.type) {
      case "text-delta":
        yield { type: "text", text: part.text };
        break;
      case "tool-call":
        yield {
          type: "tool_call",
          name: part.toolName,
          args: part.input,
          id: part.toolCallId,
        };
        break;
      case "tool-result":
        yield {
          type: "tool_result",
          name: part.toolName,
          result: part.output,
          id: part.toolCallId,
        };
        break;
      case "finish":
        yield {
          type: "done",
          usage: {
            inputTokens: part.totalUsage.inputTokens ?? 0,
            outputTokens: part.totalUsage.outputTokens ?? 0,
          },
          stopReason: mapFinishReason(part.finishReason),
        };
        break;
      case "error":
        throw part.error;
      case "abort":
        yield {
          type: "done",
          usage: { inputTokens: 0, outputTokens: 0 },
          stopReason: "aborted",
        };
        break;
      default:
        break;
    }
  }
}

async function* run(
  model: string,
  req: LLMRequest
): AsyncIterable<LLMStreamChunk> {
  const keys = getAvailableKeys();
  const maxAttempts = keys.length;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      yield* runWithCurrentKey(model, req);
      return;
    } catch (err) {
      lastError = err;
      const llmErr = toLLMError(err, "mistral");
      if (llmErr.code !== "rate_limited" || attempt === maxAttempts - 1) {
        throw llmErr;
      }
      currentKeyIndex = (currentKeyIndex + 1) % keys.length;
      console.log(
        JSON.stringify({
          scope: "llm.mistral.key_rotation",
          attempt: attempt + 1,
          totalKeys: keys.length,
          reason: "rate_limited",
        })
      );
    }
  }

  throw toLLMError(lastError, "mistral");
}

function mapFinishReason(
  reason: string
): "end" | "max_tokens" | "tool_call" | "aborted" {
  switch (reason) {
    case "length":
      return "max_tokens";
    case "tool-calls":
      return "tool_call";
    case "other":
    case "unknown":
    case "stop":
    default:
      return "end";
  }
}

export const mistralProvider: LLMProvider = {
  id: "mistral",
  isConfigured: () => getAvailableKeys().length > 0,
  supportsTools: true,
  stream: run,
};

export function __resetKeyIndexForTests() {
  currentKeyIndex = 0;
}
