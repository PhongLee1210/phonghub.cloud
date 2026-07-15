import { parseEntityId } from "@/lib/chat/protocol";
import type { AgentCitation, AgentEntityId, CitationTarget } from "@/types/chat";

/**
 * Resolves an agent entity id to its DOM node via data-agent-id.
 * SSR-safe (guards `document`), returns null if the entity isn't on the
 * current page (the visitor may be elsewhere — graceful no-op).
 *
 * This is the single lookup path shared by highlight/scroll/open — the
 * overview's subsystem 1. `import type` on the protocol helper keeps this
 * module client-safe (server-only is erased by type-only imports).
 */
export function resolveEntity(agentId: AgentEntityId): HTMLElement | null {
  if (typeof document === "undefined") return null;
  if (!parseEntityId(agentId)) return null;
  return document.querySelector<HTMLElement>(
    `[data-agent-id="${agentId}"]`
  );
}

/**
 * Matches a `CitationTarget` (e.g. from `DoneEvent.openModal`) against the
 * server-resolved `AgentCitation[]` from the same turn, for open_modal /
 * expand_section content — the client never re-derives title/description
 * itself, it just picks the citation the server already resolved.
 */
export function findCitation(
  citations: AgentCitation[] | undefined,
  target: CitationTarget | undefined
): AgentCitation | undefined {
  if (!citations || !target) return undefined;
  if (target === "resume") return citations.find((c) => c.type === "resume");
  const parsed = parseEntityId(target);
  if (!parsed) return undefined;
  return citations.find((c) => c.type === parsed.kind && c.id === parsed.id);
}
