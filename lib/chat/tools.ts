import "server-only";

import { ToolSet, tool } from "ai";
import { z } from "zod";

import { ValidCategory, ValidSkills } from "@/config/constants";
import { CONTACT_INFO } from "@/config/contact";
import { ExperienceInterface } from "@/config/experience";
import { ProjectInterface } from "@/config/projects";
import { RESUME_RESOURCE } from "@/config/resume";
import { ISkill, SkillCategoryEnum } from "@/config/skills";
import { listPublishedPosts } from "@/lib/blog/service";
import { isAllowedRoute } from "@/lib/chat/prompt";
import { buildEntityId, parseEntityId } from "@/lib/chat/protocol";
import { CitationTarget } from "@/lib/chat/resources";
import {
  findCurrentCompany,
  findMostRecentExperience,
  getCareerTimeline,
} from "@/lib/data/experience";
import {
  filterProjectsByCategory,
  filterProjectsByTechStack,
  findFeaturedProjects,
  findMostRecentProject,
} from "@/lib/data/projects";
import { filterSkillsByCategory, getStrongestSkills } from "@/lib/data/skills";
import { LEAD_TOPICS } from "@/lib/lead/schema";
import { AgentEntityId } from "@/types/chat";

const CONTENT_DIR = "content/blog";

/**
 * Search tools return this, never the raw config objects — keeps the
 * tool-result payload (which flows back into the model's own context on
 * the next step) small, per the plan's "AI never knows raw DOM/props"
 * principle applied to token cost.
 */
interface ResourceSummary {
  agentId: CitationTarget;
  title: string;
  summary: string;
  rating?: number;
}

/** Caps every search tool's result list — keeps tool-result payloads small. */
const MAX_SEARCH_RESULTS = 5;

function toProjectSummary(project: ProjectInterface): ResourceSummary {
  return {
    agentId: buildEntityId("project", project.id),
    title: project.organization.name,
    summary: project.shortDescription,
  };
}

function toExperienceSummary(experience: ExperienceInterface): ResourceSummary {
  return {
    agentId: buildEntityId("experience", experience.id),
    title: `${experience.position} at ${experience.company}`,
    summary: experience.description[0] ?? "",
  };
}

function toSkillSummary(skill: ISkill): ResourceSummary {
  return {
    agentId: buildEntityId("skill", skill.key),
    title: skill.name,
    summary: skill.description,
    rating: skill.rating,
  };
}

const searchProjectsTool = tool({
  description:
    "Search Phong's projects. Filter by category or tech stack, or set mostRecentOnly to get just the latest (or currently ongoing) project. With no filters, returns the featured projects.",
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .describe(
        "Project category, e.g. 'Full Stack', 'Frontend', 'Mobile Dev'."
      ),
    techStack: z
      .string()
      .optional()
      .describe(
        "A technology/skill name to filter projects by, e.g. 'React', 'FastAPI'."
      ),
    mostRecentOnly: z
      .boolean()
      .optional()
      .describe(
        "Set true to return only the single most recent (or ongoing) project."
      ),
  }),
  execute: async ({ category, techStack, mostRecentOnly }) => {
    if (mostRecentOnly) return [toProjectSummary(findMostRecentProject())];

    let results: ProjectInterface[];
    if (category) {
      results = filterProjectsByCategory(category as ValidCategory);
    } else if (techStack) {
      results = filterProjectsByTechStack(techStack as ValidSkills);
    } else {
      results = findFeaturedProjects();
    }
    return results.slice(0, MAX_SEARCH_RESULTS).map(toProjectSummary);
  },
});

const searchExperiencesTool = tool({
  description:
    "Search Phong's work experience. Set currentOnly for his current company, mostRecentOnly for his latest role, or omit both for the full career timeline.",
  inputSchema: z.object({
    currentOnly: z
      .boolean()
      .optional()
      .describe("Set true to return only Phong's current company."),
    mostRecentOnly: z
      .boolean()
      .optional()
      .describe("Set true to return only the most recent role."),
  }),
  execute: async ({ currentOnly, mostRecentOnly }) => {
    if (currentOnly) {
      const current = findCurrentCompany();
      return current ? [toExperienceSummary(current)] : [];
    }
    if (mostRecentOnly)
      return [toExperienceSummary(findMostRecentExperience())];
    return getCareerTimeline()
      .slice(0, MAX_SEARCH_RESULTS)
      .map(toExperienceSummary);
  },
});

const searchSkillsTool = tool({
  description:
    "Search Phong's skills. Filter by category (e.g. 'frameworks', 'backend', 'ai-llm'), or omit it for his strongest skills overall. Each result includes a `rating` (1-5, where 5 = expert) — mention his proficiency level when relevant.",
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .describe(
        "Skill category key, e.g. 'languages', 'frameworks', 'ai-llm'."
      ),
  }),
  execute: async ({ category }) => {
    const results = category
      ? filterSkillsByCategory(category as SkillCategoryEnum)
      : getStrongestSkills();
    return results.slice(0, MAX_SEARCH_RESULTS).map(toSkillSummary);
  },
});

const searchResumeTool = tool({
  description: "Get Phong's resume — its title, description, and link.",
  inputSchema: z.object({}),
  execute: async () => [
    {
      agentId: "resume" as const,
      title: RESUME_RESOURCE.title,
      summary: RESUME_RESOURCE.description,
    },
  ],
});

const searchBlogTool = tool({
  description:
    "Search Phong's blog posts. Filter by category or tag, or omit both to list the most recent posts.",
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .describe("Blog post category to filter by."),
    tag: z.string().optional().describe("A tag to filter blog posts by."),
  }),
  execute: async ({ category, tag }) => {
    const posts = await listPublishedPosts(CONTENT_DIR, { forAgent: true });
    const filtered = posts.filter(
      (post) =>
        (!category || post.category === category) &&
        (!tag || post.tags.includes(tag))
    );
    return filtered.slice(0, MAX_SEARCH_RESULTS).map((post) => ({
      agentId: buildEntityId("blog", post.slug),
      title: post.title,
      summary: post.summary,
    }));
  },
});

const searchContactTool = tool({
  description:
    "Retrieve Phong's contact information, availability, and social media profiles. Call this when the user asks about: how to contact Phong, email address, phone number, reaching out, hiring Phong, whether he is available for work or open to opportunities, GitHub profile, LinkedIn, Twitter, Facebook, social media profiles, or any similar contact intent. A contact card UI will automatically appear in the chat — do not invent or repeat social links in your text reply.",
  inputSchema: z.object({}),
  execute: async () => ({
    available: CONTACT_INFO.available,
    name: CONTACT_INFO.name,
    email: CONTACT_INFO.email,
    socials: CONTACT_INFO.socials.map((s) => ({
      name: s.name,
      username: s.username,
    })),
  }),
});

/**
 * Shared agentId schema for the two presentation tools (reveal / open_detail).
 * Both act on a single resource identified by its agentId (or "resume").
 */
const targetSchema = z.object({
  target: z
    .string()
    .describe(
      "The agentId to act on — e.g. 'project:enrollment-platform', 'skill:react', 'experience:hiliosai', 'blog:my-post', or 'resume'."
    ),
});

/**
 * The two presentation tools consolidate the old 5-way split
 * (highlight_resource / focus / open_modal / expand_section / select_skill)
 * into an intent-based pair, so the model picks between "show it on the page"
 * (reveal) and "open its detail" (open_detail) instead of guessing UX
 * mechanics (scroll vs no-scroll vs graph) it has no viewport data for.
 *
 * reveal's scroll/no-scroll/graph decision is resolved client-side from page
 * state + viewport (see app/api/chat/route.ts + hooks/use-agent-bridge.ts).
 */
const revealTool = tool({
  description:
    "Make a single resource prominent on the current page so the visitor can see it. Use the exact agentId from an earlier search result, or 'resume'. The page chooses how: a skill is centered in the skills graph; anything else is scrolled into view (only if not already visible) and briefly highlighted. Prefer this over open_detail when the visitor just wants to be pointed at something already summarized.",
  inputSchema: targetSchema,
  execute: async ({ target }) => {
    const valid = target === "resume" || Boolean(parseEntityId(target));
    return valid
      ? { ok: true as const, target }
      : { ok: false as const, target, reason: "unrecognized agentId format" };
  },
});

const navigateToTool = tool({
  description:
    "Navigate the visitor to a page on the site. Only use routes the site actually has, with any <id>/<slug> filled from real data (e.g. '/projects/enrollment-platform').",
  inputSchema: z.object({
    route: z
      .string()
      .describe("The destination route, e.g. '/projects/enrollment-platform'."),
  }),
  execute: async ({ route }) => {
    return isAllowedRoute(route)
      ? { ok: true as const, route }
      : { ok: false as const, route, reason: "route not allowed" };
  },
});

/**
 * Validates a target and resolves it to a citation for the detail modal.
 * Sole executor behind open_detail.
 */
async function executeModalTarget({ target }: { target: string }) {
  const valid = target === "resume" || Boolean(parseEntityId(target));
  return valid
    ? { ok: true as const, target: target as CitationTarget }
    : { ok: false as const, target, reason: "unrecognized agentId format" };
}

const openDetailTool = tool({
  description:
    "Open the full detail view (title + description modal) for a single resource without navigating away. Use when the visitor asks to 'tell me more' or 'expand' something — i.e. they want detail beyond the summary, not just to be shown the item. Use the exact agentId from an earlier search result, or 'resume'.",
  inputSchema: targetSchema,
  execute: executeModalTarget,
});

const captureLeadTool = tool({
  description:
    "Offer to connect the visitor with Phong by showing a lead capture form in chat. Call when visitor expresses hiring intent, project collaboration interest, or explicitly asks to contact Phong. Extract name and email from conversation if mentioned. A lead form card will appear in chat — keep your text reply brief.",
  inputSchema: z.object({
    detected_topic: z.enum(LEAD_TOPICS),
    visitor_name: z.string().optional(),
    visitor_email: z.string().optional(),
  }),
  execute: async (args) => ({
    ok: true,
    detected_topic: args.detected_topic,
    visitor_name: args.visitor_name,
    visitor_email: args.visitor_email,
  }),
});

/**
 * Converts pre-resolved client tool definitions into AI SDK tool entries.
 * Client tools execute instantly (return cached result) — no LLM args needed.
 */
export function buildClientTools(
  clientTools: Array<{
    name: string;
    description: string;
    preResolved: unknown;
  }>
): ToolSet {
  const tools: ToolSet = {};
  for (const ct of clientTools) {
    tools[ct.name] = tool({
      description: ct.description,
      inputSchema: z.object({}),
      execute: async () => ct.preResolved,
    });
  }
  return tools;
}

export const CHAT_TOOLS = {
  search_projects: searchProjectsTool,
  search_experiences: searchExperiencesTool,
  search_skills: searchSkillsTool,
  search_resume: searchResumeTool,
  search_blog: searchBlogTool,
  search_contact: searchContactTool,
  reveal: revealTool,
  open_detail: openDetailTool,
  navigate_to: navigateToTool,
  capture_lead: captureLeadTool,
} satisfies ToolSet;
