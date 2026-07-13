export const ChatRole = {
  User: "user",
  Assistant: "assistant",
} as const;
export type ChatRole = (typeof ChatRole)[keyof typeof ChatRole];

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

/** Per plan §"Citation Data Model" — what every agent response cites. */
export interface AgentCitation {
  id: string;
  type: CitationKind;
  title: string;
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

export interface ChatRequestBody {
  messages: Array<{ role: ChatRole; content: string }>;
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
  Done: "done",
  Error: "error",
} as const;

export type DoneEvent = {
  type: typeof ChatEventType.Done;
  suggestions?: string[];
  highlight?: AgentEntityId;
  navigate?: InternalRoute;
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
  | DoneEvent
  | { type: typeof ChatEventType.Error; code: ChatErrorCode; message: string };
