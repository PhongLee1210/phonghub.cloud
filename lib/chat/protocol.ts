import { chatConfig } from "@/config/chat";
import { ALLOWED_ROUTES } from "@/lib/chat/prompt";
import { isObject, isString, isUndefined } from "@/lib/guards";
import {
  AgentEntityId,
  ChatStreamEvent,
  EntityKind,
  InternalRoute,
} from "@/types/chat";

/**
 * Agent command channel — the single source of truth for agent↔client
 * communication over the NDJSON stream.
 *
 * Task 1.4: wire encoding (encodeEvent).
 * Task 2.1: AGENT_CMD_MARKER, ParsedCommands, RESPONSE_FORMAT_INSTRUCTIONS.
 * Task 2.3: createCommandSplitter, parseCommandStream, COMMAND_VALIDATORS.
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

// ── Task 2.1: command-channel contract ──────────────────────────

/**
 * The single delimiter that separates the visible answer from the command
 * JSON tail. The model emits this on its own line after the answer, then
 * immediately follows it with a JSON object.
 *
 * Named generally (not SUGGESTION_MARKER) because it carries every future
 * command — suggest, highlight, open, navigate — not just suggestions.
 */
export const AGENT_CMD_MARKER = "<<<AGENT_CMDS>>>";

/**
 * The typed shape the parser (Task 2.3) returns. Every key is optional —
 * a parse failure for one key leaves it undefined; malformed JSON entirely
 * leaves all keys undefined. The client falls back to seedSuggestions when
 * `suggest` is missing.
 *
 * The `done` wire event (`ChatEventType.Done` variant in types/chat.ts)
 * already carries `suggestions?: string[]` — Task 2.4 populates it from
 * `parsed.suggest`. Zero wire-format change.
 *
 * Adding a future command = adding an optional key here + a validator in
 * COMMAND_VALIDATORS (Task 2.3) + a tool description in
 * RESPONSE_FORMAT_INSTRUCTIONS. Additive, never breaking.
 */
export interface ParsedCommands {
  suggest?: string[];
  highlight?: AgentEntityId;
  navigate?: InternalRoute;
  // open?: string;             // post-v1 — needs imperative handles
}

/**
 * The prompt block that tells the model how to format its output. Appended
 * to guardrails in buildSystemPrompt() (lib/chat/context.ts) so it is
 * automatically counted in the token budget via assembleSystemPrompt.
 *
 * Interpolates ${AGENT_CMD_MARKER} so the delimiter in the instructions
 * can never drift from the actual constant. Includes a one-shot example
 * because cheap models (the chat-alias default and its fallbacks) adhere
 * more reliably with concrete demonstrations.
 *
 * Co-location rule: this string and COMMAND_VALIDATORS (Task 2.3) live in
 * the same file on purpose. A tool described in the prompt but missing a
 * validator (or vice versa) is a bug this file makes obvious.
 */
export const RESPONSE_FORMAT_INSTRUCTIONS = `How to format every reply:
- Write 2-4 sentences as the answer the visitor reads.
- On a new line after the answer, emit the delimiter exactly: ${AGENT_CMD_MARKER}
- Immediately after the delimiter, emit one JSON object (no markdown fences) with any of these keys you need:
  "suggest" — an array of 2-3 **SHORT** follow-up questions the visitor might ask next, each phrased in their voice ("What did he...", "Is he..."), never yours ("Ask me about..."). Only include questions answerable from the data above.
  "highlight" — the 'agentId' of the single entity your answer is about, exactly as it appears in the data above (e.g. "project:enrollment-platform"). Omit it if your answer is not about one specific entity.
  "navigate" — a route from the allowed list that the visitor should open next, with any <id> or <slug> filled from the data (e.g. "/projects/enrollment-platform"). Only emit it when moving the visitor to another page is the natural next step.
- The delimiter and JSON must never appear inside the visible answer.
- Omit a key rather than guess; the system fills in defaults.

Example reply:
Phong's strongest AI work is the enrollment platform — FastAPI microservices, GraphQL routing, and RAG-based lead classification.
${AGENT_CMD_MARKER}
{"suggest": ["What's his core tech stack?", "Has he worked with JS/TS?"], "highlight": "project:enrollment-platform"}`;

// ── Task 2.3: stream parser & command validator registry ───────

export interface CommandSplitter {
  push(text: string): string;
  finish(): { remainder: string; raw?: string };
}

export function createCommandSplitter(): CommandSplitter {
  const MARKER = AGENT_CMD_MARKER;
  let holdback = "";
  let rawBuffer = "";
  let markerFound = false;

  return {
    push(text: string): string {
      if (markerFound) {
        rawBuffer += text;
        return "";
      }

      const combined = holdback + text;
      const idx = combined.indexOf(MARKER);

      if (idx !== -1) {
        markerFound = true;
        const visible = combined.slice(0, idx);
        rawBuffer = combined.slice(idx + MARKER.length);
        holdback = "";
        return visible;
      }

      const withholdCount = Math.min(MARKER.length - 1, combined.length);
      const visible = combined.slice(0, combined.length - withholdCount);
      holdback = combined.slice(combined.length - withholdCount);
      return visible;
    },

    finish(): { remainder: string; raw?: string } {
      if (markerFound) {
        return { remainder: "", raw: rawBuffer };
      }
      const remainder = holdback;
      holdback = "";
      return { remainder };
    },
  };
}

type CommandValidator = (value: unknown) => unknown;

function validateSuggest(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const cleaned = value
    .map((item) => (isString(item) ? item.trim() : ""))
    .filter((s) => s.length > 0 && s.length <= chatConfig.limits.maxInputChars);

  return cleaned.length >= 1 ? cleaned.slice(0, 3) : undefined;
}

/** Validates a highlight command — must be a known-prefix entity id. */
function validateHighlight(value: unknown): AgentEntityId | undefined {
  if (!isString(value)) return undefined;
  const trimmed = value.trim();
  return parseEntityId(trimmed) ? (trimmed as AgentEntityId) : undefined;
}

/**
 * Builds a single regex from ALLOWED_ROUTES so the prompt and the validator
 * cannot drift. Converts `<id>`/`<slug>` placeholders into segment matchers.
 * Called once at module load.
 */
function buildAllowedRouteMatcher(): RegExp {
  const patterns = ALLOWED_ROUTES.map((route) =>
    route.replace(/<(?:id|slug)>/g, "[^/]+")
  );
  return new RegExp(`^(?:${patterns.join("|")})$`);
}

const ALLOWED_ROUTE_RE = buildAllowedRouteMatcher();

/** Validates a navigate command — must match an allowed route with ids filled. */
function validateNavigate(value: unknown): InternalRoute | undefined {
  if (!isString(value)) return undefined;
  const trimmed = value.trim();
  return ALLOWED_ROUTE_RE.test(trimmed)
    ? (trimmed as InternalRoute)
    : undefined;
}

const COMMAND_VALIDATORS = {
  suggest: validateSuggest,
  highlight: validateHighlight,
  navigate: validateNavigate,
} satisfies Record<string, CommandValidator>;

export function parseCommandStream(raw: string): ParsedCommands {
  const result: ParsedCommands = {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    return result;
  }

  if (!isObject(parsed)) {
    return result;
  }

  for (const [key, validator] of Object.entries(COMMAND_VALIDATORS)) {
    if (key in parsed) {
      const validated = validator(parsed[key]);
      if (!isUndefined(validated)) {
        (result as Record<string, unknown>)[key] = validated;
      }
    }
  }

  return result;
}
