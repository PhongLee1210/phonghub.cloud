import "server-only";

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

import { toLLMError } from "../errors";
import { LLMProvider, LLMRequest, LLMStreamChunk } from "../types";
import { envKeyForProvider } from "../config";

async function* run(
  model: string,
  req: LLMRequest
): AsyncIterable<LLMStreamChunk> {
  try {
    const result = streamText({
      model: openai(model),
      messages: req.messages,
      maxOutputTokens: req.maxTokens,
      temperature: req.temperature,
      abortSignal: req.signal,
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
  } catch (err) {
    throw toLLMError(err, "openai");
  }
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

export const openaiProvider: LLMProvider = {
  id: "openai",
  isConfigured: () => Boolean(process.env[envKeyForProvider("openai")]),
  stream: run,
};
