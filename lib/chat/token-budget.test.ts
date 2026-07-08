import { describe, expect, test } from "bun:test";

import {
  assembleSystemPrompt,
  checkCombinedBudget,
  estimateTokens,
  trimHistoryToBudget,
  type SystemPromptData,
} from "./token-budget";

describe("estimateTokens", () => {
  test("empty string is 0 tokens", () => {
    expect(estimateTokens("")).toBe(0);
  });

  test("rounds up at the 4-char boundary", () => {
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("abcde")).toBe(2);
  });
});

function makeData(blogPostCount: number, postSize = 50): SystemPromptData {
  return {
    persona: "persona",
    guardrails: "guardrails",
    projects: [{ id: "p1" }],
    skills: [{ name: "s1" }],
    experience: [{ position: "e1" }],
    blogPosts: Array.from({ length: blogPostCount }, (_, i) => ({
      slug: `post-${i}`,
      summary: "x".repeat(postSize),
    })),
  };
}

describe("assembleSystemPrompt", () => {
  test("fits without trimming when under budget", () => {
    const result = assembleSystemPrompt(makeData(2), { hardTokenBudget: 10_000 });
    expect(result.trimmedBlogPosts).toBe(0);
    expect(result.stillOverBudget).toBe(false);
    expect(result.prompt).toContain("post-0");
    expect(result.prompt).toContain("post-1");
  });

  test("drops oldest (last-indexed) posts first until it fits", () => {
    // Each post is large enough that keeping all of them blows the budget.
    const data = makeData(5, 200);
    const fullEstimate = estimateTokens(JSON.stringify(data));
    const result = assembleSystemPrompt(data, {
      hardTokenBudget: Math.floor(fullEstimate * 0.6),
    });
    expect(result.trimmedBlogPosts).toBeGreaterThan(0);
    expect(result.stillOverBudget).toBe(false);
    // Newest posts (lowest index) must survive; oldest (highest index) dropped first.
    expect(result.prompt).toContain("post-0");
    expect(result.prompt).not.toContain(`post-${4}`);
  });

  test("stillOverBudget is true when even zero blog posts doesn't fit", () => {
    const data = makeData(3);
    const result = assembleSystemPrompt(data, { hardTokenBudget: 1 });
    expect(result.trimmedBlogPosts).toBe(3);
    expect(result.stillOverBudget).toBe(true);
  });
});

describe("trimHistoryToBudget", () => {
  test("under budget: no trimming, order preserved", () => {
    const messages = [
      { role: "user" as const, content: "hi" },
      { role: "assistant" as const, content: "hello" },
    ];
    const result = trimHistoryToBudget(messages, { hardTokenBudget: 1000 });
    expect(result.trimmedCount).toBe(0);
    expect(result.messages).toEqual(messages);
  });

  test("over budget: drops oldest first, keeps most recent", () => {
    const messages = [
      { role: "user" as const, content: "a".repeat(400) }, // oldest
      { role: "assistant" as const, content: "b".repeat(400) },
      { role: "user" as const, content: "c".repeat(400) }, // most recent
    ];
    // Each message ~100 tokens; a budget of 250 fits 2 of the 3, forcing
    // exactly one drop (the oldest).
    const result = trimHistoryToBudget(messages, { hardTokenBudget: 250 });
    expect(result.trimmedCount).toBe(1);
    expect(result.messages[0].content).toBe("b".repeat(400));
    expect(result.messages[result.messages.length - 1].content).toBe(
      "c".repeat(400)
    );
  });

  test("never trims below the single most recent message", () => {
    const messages = [
      { role: "user" as const, content: "a".repeat(2000) },
      { role: "user" as const, content: "b".repeat(2000) },
    ];
    const result = trimHistoryToBudget(messages, { hardTokenBudget: 1 });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].content).toBe("b".repeat(2000));
  });
});

describe("checkCombinedBudget", () => {
  test("ok when sum is under budget", () => {
    const result = checkCombinedBudget({
      systemPromptTokens: 100,
      historyTokens: 100,
      historyMessageCount: 5,
      maxTotalContextTokens: 1000,
    });
    expect(result).toEqual({ ok: true });
  });

  test("blames the system prompt when history has more than 1 message left", () => {
    const result = checkCombinedBudget({
      systemPromptTokens: 900,
      historyTokens: 900,
      historyMessageCount: 3,
      maxTotalContextTokens: 1000,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("system_prompt_irreducible");
  });

  test("blames the single message when history is already at the 1-message floor", () => {
    const result = checkCombinedBudget({
      systemPromptTokens: 900,
      historyTokens: 900,
      historyMessageCount: 1,
      maxTotalContextTokens: 1000,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("single_message_too_large");
  });
});
