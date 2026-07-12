import { Icons } from "@/components/common/icons";

export interface SeedSuggestionCard {
  title: string;
  subtitle: string;
  icon: keyof typeof Icons;
  prompt: string;
}

/**
 * Widget-facing chat configuration. Models are referenced only by alias
 * ("chat" | "cheap") — never by concrete provider/model id, per plan D2.
 * Alias resolution lives server-side in lib/llm/config.ts.
 */
export const chatConfig = {
  greeting:
    "Hi there 👋 I'm Phong's AI Portfolio Assistant. I can help you explore projects, skills, experience, and anything else you'd like to know about Phong.",

  seedSuggestions: [
    "What has Phong built with AI?",
    "What's his tech stack?",
    "Is he open to new opportunities?",
  ],

  seedSuggestionCards: [
    {
      title: "Experience",
      subtitle: "Where he's worked and what he owned",
      icon: "work",
      prompt: "What's Phong's work experience?",
    },
    {
      title: "Projects",
      subtitle: "AI agents, dashboards, and more",
      icon: "gitRepoIcon",
      prompt: "What has Phong built with AI?",
    },
    {
      title: "Skills",
      subtitle: "Languages, frameworks, and tools",
      icon: "settings",
      prompt: "What are Phong's strongest skills?",
    },
  ] satisfies SeedSuggestionCard[],

  footnote: "AI responses may not be 100% accurate.",

  limits: {
    /** Max chars accepted per user message, enforced client + server. */
    maxInputChars: 1000,
    /** Max messages sent to the API per request (most recent N). */
    maxHistoryMessages: 20,
    /** Messages kept in localStorage, trimmed on every write. */
    maxPersistedMessages: 50,
    /** Sampling temperature — 0 for deterministic, factual, on-brand answers. */
    temperature: 0,
    /** Max output tokens per reply — covers the visible answer (~100 tokens
     * for 2-4 sentences) + the command tail (~30-50 tokens for the marker +
     * JSON). Kept low to match the concise-answer persona. */
    maxOutputTokens: 640,
    /**
     * Cumulative output tokens allowed per IP per UTC day, across all
     * requests — separate from rateLimit.perDay (a request-count budget).
     * Well above the theoretical max from the request-count limiter alone
     * (40 req/day * 640 max output tokens = 25,600), so in normal operation
     * the request-count limit stays the binding constraint and this only
     * kicks in if responses run unusually long.
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
    chat: "phonghub.chat",
  },
} as const;
