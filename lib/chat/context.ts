import "server-only";

import { chatConfig } from "@/config/chat";
import { EXPERIENCES } from "@/config/experience";
import { PROJECTS } from "@/config/projects";
import { SKILLS } from "@/config/skills";
import { siteConfig } from "@/config/site";
import { listPublishedPosts } from "@/lib/blog/service";
import { buildPersona, GUARDRAILS } from "./prompt";
import { buildEntityId, RESPONSE_FORMAT_INSTRUCTIONS } from "./protocol";
import { assembleSystemPrompt, SystemPromptData } from "./token-budget";

const CONTENT_DIR = "content/blog";

// D3 — soft token-budget guard, dev-only signal that config/*.ts content is
// growing (distinct from contextBudget.hardSystemPromptTokenBudget, which
// is enforced in every environment via assembleSystemPrompt's trimming).
const SOFT_TOKEN_BUDGET = 15_000;

let cachedResult: { prompt: string; estimatedTokens: number } | undefined;

/**
 * Builds the system prompt from curated config + blog frontmatter (D3: no
 * RAG, no full-corpus stuffing). Cached per lambda instance — content only
 * changes on redeploy. Hard-trims oldest blog posts to fit
 * contextBudget.hardSystemPromptTokenBudget (enforced in all environments,
 * not just a dev warning) via the pure lib/chat/token-budget.ts.
 */
export async function buildSystemPrompt(): Promise<{
  prompt: string;
  estimatedTokens: number;
}> {
  if (cachedResult) return cachedResult;

  const posts = await listPublishedPosts(CONTENT_DIR).catch(() => []);

  const persona = buildPersona({
    authorName: siteConfig.authorName,
    url: siteConfig.url,
  });

  const data: SystemPromptData = {
    persona,
    guardrails: `${GUARDRAILS}\n\n${RESPONSE_FORMAT_INSTRUCTIONS}`,
    projects: PROJECTS.map((p) => ({
      agentId: buildEntityId("project", p.id),
      companyName: p.organization.name,
      shortDescription: p.shortDescription,
      descriptionPreview: p.descriptionDetails?.paragraphs?.[0],
      techStack: p.techStack,
      category: p.category,
    })),
    skills: SKILLS.map((s) => ({
      agentId: buildEntityId("skill", s.key),
      name: s.name,
      description: s.description,
      rating: s.rating,
      category: s.category,
    })),
    experience: EXPERIENCES.map((e) => ({
      agentId: buildEntityId("experience", e.id),
      position: e.position,
      company: e.company,
      startDate: e.startDate,
      endDate: e.endDate,
      description: e.description,
      achievements: e.achievements,
      skills: e.skills,
    })),
    // listPublishedPosts already sorts newest-first, which is exactly the
    // order assembleSystemPrompt needs to trim oldest posts first.
    blogPosts: posts.map((p) => ({
      agentId: buildEntityId("blog", p.slug),
      slug: p.slug,
      title: p.title,
      category: p.category,
      tags: p.tags,
      summary: p.summary,
    })),
  };

  const result = assembleSystemPrompt(data, {
    hardTokenBudget: chatConfig.contextBudget.hardSystemPromptTokenBudget,
  });

  if (result.estimatedTokens > SOFT_TOKEN_BUDGET) {
    // Fails loudly in dev rather than quietly breaking smaller-window
    // providers in prod (see plan §5A "Explicit non-changes" / D3).
    console.warn(
      `[chat/context] System prompt is ~${result.estimatedTokens} tokens, over the ${SOFT_TOKEN_BUDGET}-token soft-warn threshold. ` +
        `Trim config/*.ts content — this will keep getting hard-trimmed (${result.trimmedBlogPosts} blog posts dropped so far).`
    );
  }
  if (result.stillOverBudget) {
    // Config content alone (without any blog posts) exceeds the hard
    // budget — a deployment content problem, not a per-request attack.
    console.error(
      `[chat/context] System prompt is still ~${result.estimatedTokens} tokens after dropping all blog posts, ` +
        `over the ${chatConfig.contextBudget.hardSystemPromptTokenBudget}-token hard budget. Trim config/*.ts content.`
    );
  }

  cachedResult = { prompt: result.prompt, estimatedTokens: result.estimatedTokens };
  return cachedResult;
}
