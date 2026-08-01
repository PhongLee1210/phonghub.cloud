import "server-only";

import { siteConfig } from "@/config/site";
import { buildPersona, GUARDRAILS } from "./prompt";
import { estimateTokens } from "./token-budget";

let cachedResult: { prompt: string; estimatedTokens: number } | undefined;

/**
 * Builds the lean system prompt — persona + guardrails only.
 * All author data (projects, skills, experience, blog) is retrieved
 * at query time via search tools, keeping context tight and citations real.
 * Cached per lambda instance since persona/guardrails only change on redeploy.
 */
export async function buildSystemPrompt(): Promise<{
  prompt: string;
  estimatedTokens: number;
}> {
  if (cachedResult) return cachedResult;

  const persona = buildPersona({
    authorName: siteConfig.authorName,
    url: siteConfig.url,
  });

  const prompt = [persona, GUARDRAILS].join("\n\n");
  cachedResult = { prompt, estimatedTokens: estimateTokens(prompt) };
  return cachedResult;
}
