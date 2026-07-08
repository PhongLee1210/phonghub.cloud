/**
 * Widget-facing chat configuration. Models are referenced only by alias
 * ("chat" | "cheap") — never by concrete provider/model id, per plan D2.
 * Alias resolution lives server-side in lib/llm/config.ts.
 */
export const chatConfig = {
  greeting:
    "Hi there 👋 I'm Phong's AI assistant. I can tell you about his projects, skills, and experience — or point you to the right page. What would you like to know?",

  seedSuggestions: [
    "What has Phong built with AI?",
    "What's his tech stack?",
    "Is he open to new opportunities?",
  ],

  footnote: "AI assistant — may make mistakes",

  limits: {
    /** Max chars accepted per user message, enforced client + server. */
    maxInputChars: 1000,
    /** Max messages sent to the API per request (most recent N). */
    maxHistoryMessages: 20,
    /** Messages kept in localStorage, trimmed on every write. */
    maxPersistedMessages: 50,
    /** Max output tokens requested from the model per reply. */
    maxOutputTokens: 1024,
    /**
     * Cumulative output tokens allowed per IP per UTC day, across all
     * requests — separate from rateLimit.perDay (a request-count budget).
     * Chosen slightly above the theoretical max from the request-count
     * limiter alone (40 req/day * 1024 max output tokens = 40,960), so in
     * normal operation the request-count limit stays the binding
     * constraint and this only kicks in if responses run unusually long.
     */
    dailyTokenBudget: 50_000,
  },

  rateLimit: {
    /** Per-IP budget, enforced before the gateway is invoked (D5). */
    perWindow: { max: 10, windowSeconds: 5 * 60 },
    perDay: { max: 40 },
  },

  concurrency: {
    /** Max simultaneous in-flight streamed requests per IP. */
    maxConcurrent: 2,
    /** Safety-net TTL (seconds) in case release() never fires (crashed lambda). */
    slotTtlSeconds: 120,
  },

  contextBudget: {
    /** Hard cap enforced in every environment (not just a dev warning) — oldest blog posts are trimmed to fit. */
    hardSystemPromptTokenBudget: 20_000,
    /** Hard cap on conversation history sent upstream — oldest messages are trimmed to fit. */
    hardHistoryTokenBudget: 6_000,
    /** Final safety net above the sum of the two budgets above — should rarely trip; catches config drift. */
    hardCombinedTokenBudget: 28_000,
  },

  storageKeys: {
    chat: "phonghub.chat.v1",
    open: "phonghub.chat.open",
  },
} as const;
