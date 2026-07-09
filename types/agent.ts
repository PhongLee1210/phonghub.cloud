import { SkillCategoryEnum } from "@/config/skills";
import { ValidSkills } from "@/config/constants";
import {
  CitationId,
  ContentItemId,
  ContentSourceType,
  ExperienceId,
  ProjectId,
  SkillTag,
} from "./content";

/**
 * Types and interfaces only — no runtime dispatcher, reducer, or state
 * machine. Not wired into the existing chat runtime (types/chat.ts,
 * lib/chat/*, app/api/chat/route.ts, hooks/use-chat-store.ts); this is a
 * forward-looking contract for a future agent implementation.
 */

export type PortfolioSection =
  | "OVERVIEW"
  | "PROJECT"
  | "EXPERIENCE"
  | "SKILLS"
  | "RESUME"
  | "CONTACT";

export type PortfolioWidget = "PROJECT" | "SKILL" | "CONTACT";

export interface AgentQuery {
  raw: string;
  normalized?: string;
  /** ISO 8601. */
  submittedAt: string;
}

export interface AgentContextEntry {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface AgentContext {
  history: AgentContextEntry[];
  activeSection?: PortfolioSection;
  /** Free-form scratch data the agent accumulates mid-run (e.g. detected intent, extracted entities). */
  scratch: Record<string, unknown>;
}

export interface RetrievedContextItem {
  citationId: CitationId;
  contentItemId: ContentItemId;
  sourceType: ContentSourceType;
  /** Short excerpt actually used, not the full ContentItem. */
  snippet: string;
  relevanceScore: number;
}

export interface RetrievedContext {
  items: RetrievedContextItem[];
  queriedSources: ContentSourceType[];
  retrievedAt: string;
}

export interface UIPatchOperation {
  op: "set" | "merge" | "remove";
  /** JSON-pointer-ish path into AgentUIState, e.g. "/focusedProjectId". */
  path: string;
  value?: unknown;
}

export interface AgentUIState {
  activeSection: PortfolioSection;
  activeWidgets: PortfolioWidget[];
  focusedProjectId?: ProjectId;
  focusedExperienceId?: ExperienceId;
  isBusy: boolean;
  pendingPatches: UIPatchOperation[];
}

export type AgentActionType =
  | "navigate"
  | "focus_project"
  | "focus_experience"
  | "run_tool"
  | "request_approval";

export interface AgentAction {
  id: string;
  type: AgentActionType;
  payload: Record<string, unknown>;
  createdAt: string;
  status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
}

export interface PortfolioAgentState {
  query: AgentQuery;
  context: AgentContext;
  retrievedContext: RetrievedContext;
  uiState: AgentUIState;
  actionQueue: AgentAction[];
}

export interface BaseAgentEvent<TType extends string, TPayload> {
  id: string;
  type: TType;
  /** ISO 8601. */
  timestamp: string;
  /** Groups all events for one agent invocation. */
  runId: string;
  /** Groups events for one assistant turn. */
  messageId: string;
  payload: TPayload;
}

export interface AssistantTextPayload {
  text: string;
  isDelta: boolean;
}

export interface CitationCardPayload {
  citationId: CitationId;
  contentItemId: ContentItemId;
  sourceType: ContentSourceType;
  title: string;
  sourceUrl: string;
  snippet: string;
}

export interface UIPatchPayload {
  patches: UIPatchOperation[];
}

export interface ProjectFocusPayload {
  projectId: ProjectId;
  companyName: string;
  techStack: ValidSkills[];
  /** Why the agent focused this project — UI tooltip/debug only. */
  reason?: string;
}

export interface TimelineFocusPayload {
  experienceId: ExperienceId;
  position: string;
  company: string;
}

export interface SkillResultPayload {
  skillTag: SkillTag;
  name: string;
  category: SkillCategoryEnum;
  matchedQuery?: string;
}

export interface ToolStartedPayload {
  toolName: string;
  toolCallId: string;
  args: Record<string, unknown>;
}

export interface ToolFinishedPayload {
  toolCallId: string;
  toolName: string;
  status: "success" | "error";
  result?: unknown;
  errorMessage?: string;
}

export interface WorkflowStartedPayload {
  workflowId: string;
  workflowName: string;
  /** Step names, for progress UI. */
  steps: string[];
}

export interface ApprovalRequiredPayload {
  approvalId: string;
  actionId: string;
  description: string;
  /** ISO 8601 deadline, optional. */
  requiredBy?: string;
}

export type AgentErrorCode =
  | "retrieval_failed"
  | "tool_failed"
  | "workflow_failed"
  | "invalid_state"
  | "unknown";

export interface AgentErrorPayload {
  code: AgentErrorCode;
  message: string;
  recoverable: boolean;
}

export interface DonePayload {
  suggestions?: string[];
  finalSummary?: string;
}

export type AssistantTextEvent = BaseAgentEvent<"assistant_text", AssistantTextPayload>;
export type CitationCardEvent = BaseAgentEvent<"citation_card", CitationCardPayload>;
export type UIPatchEvent = BaseAgentEvent<"ui_patch", UIPatchPayload>;
export type ProjectFocusEvent = BaseAgentEvent<"project_focus", ProjectFocusPayload>;
export type TimelineFocusEvent = BaseAgentEvent<"timeline_focus", TimelineFocusPayload>;
export type SkillResultEvent = BaseAgentEvent<"skill_result", SkillResultPayload>;
export type ToolStartedEvent = BaseAgentEvent<"tool_started", ToolStartedPayload>;
export type ToolFinishedEvent = BaseAgentEvent<"tool_finished", ToolFinishedPayload>;
export type WorkflowStartedEvent = BaseAgentEvent<"workflow_started", WorkflowStartedPayload>;
export type ApprovalRequiredEvent = BaseAgentEvent<"approval_required", ApprovalRequiredPayload>;
export type ErrorEvent = BaseAgentEvent<"error", AgentErrorPayload>;
export type DoneEvent = BaseAgentEvent<"done", DonePayload>;

export type PortfolioAgentEvent =
  | AssistantTextEvent
  | CitationCardEvent
  | UIPatchEvent
  | ProjectFocusEvent
  | TimelineFocusEvent
  | SkillResultEvent
  | ToolStartedEvent
  | ToolFinishedEvent
  | WorkflowStartedEvent
  | ApprovalRequiredEvent
  | ErrorEvent
  | DoneEvent;
