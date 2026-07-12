export type ChatRole = "user" | "assistant";

export type InternalRoute =
  | "/skills"
  | "/projects"
  | "/experience"
  | "/resume"
  | "/contact"
  | "/blogs"
  | `/projects/${string}`
  | `/blogs/${string}`;

export interface ProjectCardPayload {
  projectId: string;
  title: string;
  description: string;
  tags: string[];
  href: `/projects/${string}`;
}

export type ChatMessageAction = "star_repo";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  card?: ProjectCardPayload;
  action?: ChatMessageAction;
  createdAt: number;
  error?: boolean;
}

export interface PersistedChat {
  version: 1;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface PersistedChatV2 {
  version: 2;
  conversations: Conversation[];
  activeConversationId: string | null;
  updatedAt: number;
}

export interface ChatRequestBody {
  messages: Array<{ role: ChatRole; content: string }>;
}

export type ChatErrorCode =
  | "rate_limited"
  | "concurrency_limited"
  | "input_too_long"
  | "upstream_error"
  | "aborted";

export type ChatStreamEvent =
  | { type: "thinking"; step: string }
  | { type: "token"; text: string }
  | { type: "card"; card: ProjectCardPayload }
  | { type: "navigate"; href: InternalRoute }
  | { type: "action"; action: ChatMessageAction }
  | { type: "done"; suggestions?: string[] }
  | { type: "error"; code: ChatErrorCode; message: string };
