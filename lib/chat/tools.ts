import "server-only";

import { tool, ToolSet } from "ai";
import { z } from "zod";

import { ValidCategory, ValidSkills } from "@/config/constants";
import { EXPERIENCES, ExperienceInterface } from "@/config/experience";
import { PROJECTS, ProjectInterface } from "@/config/projects";
import { RESUME_RESOURCE } from "@/config/resume";
import { ISkill, SkillCategoryEnum } from "@/config/skills";
import { listPublishedPosts } from "@/lib/blog/service";
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
import { isAllowedRoute } from "@/lib/chat/prompt";
import { buildEntityId, parseEntityId } from "@/lib/chat/protocol";
import { CitationTarget } from "@/lib/chat/resources";

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
  };
}

const searchProjectsTool = tool({
  description:
    "Search Phong's projects. Filter by category or tech stack, or set mostRecentOnly to get just the latest (or currently ongoing) project. With no filters, returns the featured projects.",
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .describe("Project category, e.g. 'Full Stack', 'Frontend', 'Mobile Dev'."),
    techStack: z
      .string()
      .optional()
      .describe("A technology/skill name to filter projects by, e.g. 'React', 'FastAPI'."),
    mostRecentOnly: z
      .boolean()
      .optional()
      .describe("Set true to return only the single most recent (or ongoing) project."),
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
    if (mostRecentOnly) return [toExperienceSummary(findMostRecentExperience())];
    return getCareerTimeline().slice(0, MAX_SEARCH_RESULTS).map(toExperienceSummary);
  },
});

const searchSkillsTool = tool({
  description:
    "Search Phong's skills. Filter by category (e.g. 'frameworks', 'backend', 'ai-llm'), or omit it for his strongest skills overall.",
  inputSchema: z.object({
    category: z
      .string()
      .optional()
      .describe("Skill category key, e.g. 'languages', 'frameworks', 'ai-llm'."),
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
    category: z.string().optional().describe("Blog post category to filter by."),
    tag: z.string().optional().describe("A tag to filter blog posts by."),
  }),
  execute: async ({ category, tag }) => {
    const posts = await listPublishedPosts(CONTENT_DIR);
    const filtered = posts.filter(
      (post) =>
        (!category || post.category === category) && (!tag || post.tags.includes(tag))
    );
    return filtered.slice(0, MAX_SEARCH_RESULTS).map((post) => ({
      agentId: buildEntityId("blog", post.slug),
      title: post.title,
      summary: post.summary,
    }));
  },
});

const highlightResourceTool = tool({
  description:
    "Visually highlight and scroll to a single resource already surfaced by a search tool earlier in this turn. Use the exact agentId from that search result (e.g. 'project:enrollment-platform', 'resume').",
  inputSchema: z.object({
    target: z
      .string()
      .describe(
        "The agentId to highlight — e.g. 'project:enrollment-platform', 'skill:react', 'experience:hiliosai', 'blog:my-post', or 'resume'."
      ),
  }),
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
    route: z.string().describe("The destination route, e.g. '/projects/enrollment-platform'."),
  }),
  execute: async ({ route }) => {
    return isAllowedRoute(route)
      ? { ok: true as const, route }
      : { ok: false as const, route, reason: "route not allowed" };
  },
});

const suggestFollowupsTool = tool({
  description:
    "Offer 2-3 short follow-up questions the visitor might ask next, phrased in their voice (e.g. \"What's his stack?\"), not yours.",
  inputSchema: z.object({
    questions: z.array(z.string()).min(1).max(3),
  }),
  execute: async ({ questions }) => ({ questions }),
});

/** Every tool the "chat" alias's tool-capable models can call. */
export const CHAT_TOOLS = {
  search_projects: searchProjectsTool,
  search_experiences: searchExperiencesTool,
  search_skills: searchSkillsTool,
  search_resume: searchResumeTool,
  search_blog: searchBlogTool,
  highlight_resource: highlightResourceTool,
  navigate_to: navigateToTool,
  suggest_followups: suggestFollowupsTool,
} satisfies ToolSet;
