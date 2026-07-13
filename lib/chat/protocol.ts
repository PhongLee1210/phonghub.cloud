import { AgentEntityId, ChatStreamEvent, EntityKind } from "@/types/chat";

/**
 * Agent command channel — the single source of truth for agent↔client
 * communication over the NDJSON stream.
 *
 * Task 1.4: wire encoding (encodeEvent).
 * Task 4.0: ENTITY_ID_PREFIXES / buildEntityId / parseEntityId.
 *
 * The original Task 2 design (AGENT_CMD_MARKER + a JSON tail parsed out of
 * the model's free text) was replaced by native AI SDK tool-calling before
 * it shipped — see lib/chat/tools.ts and app/api/chat/route.ts. Tool calls
 * arrive as structured stream parts, so there is no text-tail to split or
 * validate anymore.
 */

/**
 * Serializes a ChatStreamEvent as a single NDJSON line.
 * Every event the route emits flows through this encoder, so a wire-format
 * change (if ever needed) is one edit.
 */
export function encodeEvent(event: ChatStreamEvent): string {
  return JSON.stringify(event) + "\n";
}

// ── Task 4.0: addressable entity-id scheme ──────────────────────

/**
 * The four entity kinds the agent can cite. Shared by the prompt builder
 * (context.ts emits these as `agentId`) and the client resolver
 * (entity-dom.ts parses them back). One source of truth so the prompt and
 * the DOM cannot drift.
 *
 * EntityKind / AgentEntityId live in types/chat.ts (client-safe, wire-level)
 * so types/chat.ts can reference them without a circular import.
 */
export const ENTITY_ID_PREFIXES = {
  project: "project",
  skill: "skill",
  experience: "experience",
  blog: "blog",
} as const satisfies Record<EntityKind, string>;

/** Builds an addressable id, e.g. buildEntityId("project", "enrollment-platform"). */
export function buildEntityId(kind: EntityKind, id: string): AgentEntityId {
  return `${ENTITY_ID_PREFIXES[kind]}:${id}`;
}

/** Parses one back; returns undefined if the prefix is unknown. */
export function parseEntityId(
  agentId: string
): { kind: EntityKind; id: string } | undefined {
  const idx = agentId.indexOf(":");
  if (idx <= 0) return undefined;
  const kind = agentId.slice(0, idx) as EntityKind;
  if (!(kind in ENTITY_ID_PREFIXES)) return undefined;
  const id = agentId.slice(idx + 1);
  if (id.length === 0) return undefined;
  return { kind, id };
}
