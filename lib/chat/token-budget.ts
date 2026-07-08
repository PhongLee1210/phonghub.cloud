/**
 * Pure token-estimation and trimming logic for the chat context budget.
 * No I/O, no env access, no "server-only" — nothing here touches secrets
 * or the filesystem, so it's trivially unit-testable and safe to import
 * from anywhere.
 */

export const CHARS_PER_TOKEN_ESTIMATE = 4;

/** ~4 chars/token is a conservative rule of thumb, not a provider-exact count. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN_ESTIMATE);
}

export interface SystemPromptData {
  persona: string;
  guardrails: string;
  projects: unknown[];
  skills: unknown[];
  experience: unknown[];
  /** Newest-first — oldest entries are dropped first when trimming. */
  blogPosts: unknown[];
}

export interface BuildResult {
  prompt: string;
  estimatedTokens: number;
  trimmedBlogPosts: number;
  /** True if the prompt is still over budget after dropping every blog post. */
  stillOverBudget: boolean;
}

function renderPrompt(data: Omit<SystemPromptData, "blogPosts">, blogPosts: unknown[]): string {
  return [
    data.persona,
    data.guardrails,
    "<data>",
    JSON.stringify({
      projects: data.projects,
      skills: data.skills,
      experience: data.experience,
      blogPosts,
    }),
    "</data>",
  ].join("\n\n");
}

/**
 * Assembles the system prompt string from already-fetched data, dropping
 * oldest blog posts (from the end of the array) until it fits the hard
 * budget or none remain. Never drops projects/skills/experience — those
 * are curated by the site owner and small by construction.
 */
export function assembleSystemPrompt(
  data: SystemPromptData,
  opts: { hardTokenBudget: number }
): BuildResult {
  const { persona, guardrails, projects, skills, experience, blogPosts } = data;
  const base = { persona, guardrails, projects, skills, experience };

  let posts = blogPosts;
  let prompt = renderPrompt(base, posts);
  let estimatedTokens = estimateTokens(prompt);
  let trimmedBlogPosts = 0;

  while (estimatedTokens > opts.hardTokenBudget && posts.length > 0) {
    posts = posts.slice(0, -1);
    trimmedBlogPosts++;
    prompt = renderPrompt(base, posts);
    estimatedTokens = estimateTokens(prompt);
  }

  return {
    prompt,
    estimatedTokens,
    trimmedBlogPosts,
    stillOverBudget: estimatedTokens > opts.hardTokenBudget,
  };
}

export interface HistoryMessageLike {
  role: "user" | "assistant";
  content: string;
}

export interface HistoryTrimResult {
  messages: HistoryMessageLike[];
  trimmedCount: number;
  estimatedTokens: number;
}

/**
 * Given history (oldest-first) and a token budget, drops oldest messages
 * until it fits. Always keeps at least the single most recent message,
 * even if it alone exceeds budget — the caller (checkCombinedBudget)
 * decides whether that residual case is a hard-reject.
 */
export function trimHistoryToBudget(
  messages: HistoryMessageLike[],
  opts: { hardTokenBudget: number }
): HistoryTrimResult {
  let trimmed = messages;
  let estimatedTokens = trimmed.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0
  );
  let trimmedCount = 0;

  while (estimatedTokens > opts.hardTokenBudget && trimmed.length > 1) {
    estimatedTokens -= estimateTokens(trimmed[0].content);
    trimmed = trimmed.slice(1);
    trimmedCount++;
  }

  return { messages: trimmed, trimmedCount, estimatedTokens };
}

export interface RequestBudgetCheck {
  ok: boolean;
  reason?: "system_prompt_irreducible" | "single_message_too_large";
}

/**
 * Final safety net after both sides have already been independently
 * trimmed to their own budgets — should rarely trip in practice. Blames
 * the single remaining message if history has already been trimmed to the
 * 1-message floor, otherwise blames the (already-trimmed) system prompt.
 */
export function checkCombinedBudget(params: {
  systemPromptTokens: number;
  historyTokens: number;
  historyMessageCount: number;
  maxTotalContextTokens: number;
}): RequestBudgetCheck {
  const total = params.systemPromptTokens + params.historyTokens;
  if (total <= params.maxTotalContextTokens) return { ok: true };

  return {
    ok: false,
    reason:
      params.historyMessageCount <= 1
        ? "single_message_too_large"
        : "system_prompt_irreducible",
  };
}
