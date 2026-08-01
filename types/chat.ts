export const ChatRole = {
  User: "user",
  Assistant: "assistant",
} as const;
export type ChatRole = (typeof ChatRole)[keyof typeof ChatRole];

export const ThinkingPhase = {
  Thinking: "thinking",
  Done: "done",
} as const;
export type ThinkingPhase = (typeof ThinkingPhase)[keyof typeof ThinkingPhase];

export type InternalRoute =
  | "/skills"
  | "/projects"
  | "/experience"
  | "/resume"
  | "/contact"
  | "/blogs"
  | "/list100"
  | `/projects/${string}`
  | `/blogs/${string}`;

export type EntityKind = "project" | "skill" | "experience" | "blog";
export type AgentEntityId = `${EntityKind}:${string}`;

/**
 * Broader than EntityKind: resume is a citable resource but not an
 * addressable entity (no id space of its own, so it has no AgentEntityId).
 */
export type CitationKind = EntityKind | "resume";

/** resolveCitation's input — every addressable entity id, plus the resume
 * singleton. Also what open_modal/expand_section/highlight_resource tool
 * results carry, since every citable resource is a valid target for them. */
export type CitationTarget = AgentEntityId | "resume";

/** Per plan §"Citation Data Model" — what every agent response cites. */
export interface AgentCitation {
  id: string;
  type: CitationKind;
  title: string;
  /** Short blurb — also the content shown in a citation chip's hover preview and in open_modal/expand_section's modal. */
  description: string;
  href: string;
}

export interface ProjectCardPayload {
  projectId: string;
  title: string;
  description: string;
  tags: string[];
  href: `/projects/${string}`;
}

export const ChatMessageAction = {
  StarRepo: "star_repo",
  ContactCard: "contact_card",
} as const;
export type ChatMessageAction =
  (typeof ChatMessageAction)[keyof typeof ChatMessageAction];

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  card?: ProjectCardPayload;
  action?: ChatMessageAction;
  suggestions?: string[];
  /** Every resource the assistant cited in this reply, rendered as chips. */
  citations?: AgentCitation[];
  /** Raw thinking step keys (e.g. "search_projects") captured before content starts streaming. */
  thinkingSteps?: string[];
  /** How long the thinking phase lasted in milliseconds. */
  thinkingElapsedMs?: number;
  createdAt: number;
  error?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface PersistedChat {
  conversations: Conversation[];
  activeConversationId: string | null;
  updatedAt: number;
}

export interface SerializedClientTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  preResolved: unknown;
}

export interface ChatRequestBody {
  messages: Array<{ role: ChatRole; content: string }>;
  clientTools?: SerializedClientTool[];
}

export const ChatErrorCode = {
  RateLimited: "rate_limited",
  ConcurrencyLimited: "concurrency_limited",
  InputTooLong: "input_too_long",
  UpstreamError: "upstream_error",
  Aborted: "aborted",
} as const;
export type ChatErrorCode = (typeof ChatErrorCode)[keyof typeof ChatErrorCode];

export const ChatEventType = {
  Thinking: "thinking",
  Token: "token",
  Card: "card",
  Navigate: "navigate",
  Action: "action",
  ToolEffect: "tool_effect",
  Done: "done",
  Error: "error",
} as const;

/**
 * Same tool-effect fields as DoneEvent, delivered the moment each tool call
 * resolves mid-turn instead of bundled at the end. Exactly one field is
 * populated per event. `openModal` is already resolved to an AgentCitation
 * here (unlike DoneEvent.openModal), since there's no batched resolution
 * pass to defer to.
 */
export type ToolEffectEvent = {
  type: typeof ChatEventType.ToolEffect;
  highlight?: AgentEntityId;
  focus?: AgentEntityId;
  openModal?: AgentCitation;
  navigate?: InternalRoute;
  skillSelect?: AgentEntityId;
};

export type DoneEvent = {
  type: typeof ChatEventType.Done;
  suggestions?: string[];
  highlight?: AgentEntityId;
  /** No-scroll counterpart to `highlight` — set by the `focus` tool. */
  focus?: AgentEntityId;
  /** Set by `open_modal`/`expand_section` — the resource to show in the modal. */
  openModal?: CitationTarget;
  navigate?: InternalRoute;
  /** Set by `select_skill` — recenters the home page skills graph on this skill. */
  skillSelect?: AgentEntityId;
  /** Every resource the assistant surfaced this turn via a search/highlight tool call. */
  citations?: AgentCitation[];
};

export type ChatStreamEvent =
  | { type: typeof ChatEventType.Thinking; step: string }
  | { type: typeof ChatEventType.Token; text: string }
  | { type: typeof ChatEventType.Card; card: ProjectCardPayload }
  | { type: typeof ChatEventType.Navigate; href: InternalRoute }
  | {
      type: typeof ChatEventType.Action;
      action: ChatMessageAction;
    }
  | ToolEffectEvent
  | DoneEvent
  | { type: typeof ChatEventType.Error; code: ChatErrorCode; message: string };
