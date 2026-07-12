import "server-only";

import { LLMMessage } from "./types";

/**
 * Splits a system-role message out of a flat LLMMessage[] so it can be
 * passed to streamText's `system` parameter instead of inside `messages`.
 *
 * AI SDK v7 defaults `allowSystemInMessages` to false, rejecting
 * role:"system" entries in the messages array. All provider adapters
 * use this to extract the system prompt before calling streamText.
 */
export function splitSystemMessage(messages: LLMMessage[]): {
  system: string | undefined;
  messages: LLMMessage[];
} {
  const systemMessage = messages.find((m) => m.role === "system");
  return {
    system: systemMessage?.content,
    messages: messages.filter((m) => m.role !== "system"),
  };
}
