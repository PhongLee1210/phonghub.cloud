import { ChatStreamEvent } from "@/types/chat";

/**
 * Agent command channel — the single source of truth for agent↔client
 * communication over the NDJSON stream.
 *
 * Task 1.4: wire encoding (encodeEvent).
 * Task 2: AGENT_CMD_MARKER, createCommandSplitter, parseCommandStream,
 *         RESPONSE_FORMAT_INSTRUCTIONS, COMMAND_VALIDATORS.
 *
 * Adding a new agent capability = append a tool description to
 * RESPONSE_FORMAT_INSTRUCTIONS + register a key validator in
 * COMMAND_VALIDATORS. Both live in THIS file so they cannot drift.
 */

/**
 * Serializes a ChatStreamEvent as a single NDJSON line.
 * Every event the route emits flows through this encoder, so a wire-format
 * change (if ever needed) is one edit.
 */
export function encodeEvent(event: ChatStreamEvent): string {
  return JSON.stringify(event) + "\n";
}
