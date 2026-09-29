import { EXPERIENCES } from "@/config/experience";
import { PROJECTS } from "@/config/projects";
import { SKILLS } from "@/config/skills";
import type { BlogPostSummary } from "@/lib/blog/service";
import { buildEntityId } from "@/lib/chat/protocol";
import type { AgentEntityId } from "@/types/chat";

export type DocKind = "project" | "experience" | "skill" | "blog";

/** One searchable record. Fields are ranked separately — see search.ts. */
export interface SearchDoc {
  agentId: AgentEntityId;
  kind: DocKind;
  /** The name a visitor would say out loud. */
  title: string;
  /** Short, high-signal terms: tech stack, category, tags. */
  tags: string[];
  /** Prose. Matched by containment only, never by fuzzy similarity. */
  body: string;
}

function projectDocs(): SearchDoc[] {
  return PROJECTS.map((project) => ({
    agentId: buildEntityId("project", project.id),
    kind: "project" as const,
    title: project.organization.name,
    tags: [...project.techStack, ...project.category],
    body: [
      project.shortDescription,
      ...(project.descriptionDetails?.paragraphs ?? []),
      ...(project.descriptionDetails?.bullets ?? []),
    ].join(" "),
  }));
}

function experienceDocs(): SearchDoc[] {
  return EXPERIENCES.map((experience) => ({
    agentId: buildEntityId("experience", experience.id),
    kind: "experience" as const,
    title: `${experience.position} at ${experience.company}`,
    tags: [...experience.skills, experience.company, experience.position],
    body: [...experience.description, ...experience.achievements].join(" "),
  }));
}

function skillDocs(): SearchDoc[] {
  return SKILLS.map((skill) => ({
    agentId: buildEntityId("skill", skill.key),
    kind: "skill" as const,
    title: skill.name,
    tags: [skill.key, skill.category],
    body: skill.description,
  }));
}

/**
 * Blog docs are built per call rather than at module load: posts come from the
 * filesystem through `lib/blog/service`, which is async and already cached
 * there (`"use cache"`). Keeping them out of the static index is what lets the
 * rest of retrieval stay synchronous and testable without touching disk.
 */
export function blogDocsFrom(posts: readonly BlogPostSummary[]): SearchDoc[] {
  return posts.map((post) => ({
    agentId: buildEntityId("blog", post.slug),
    kind: "blog" as const,
    title: post.title,
    tags: [...post.tags, post.category],
    body: post.summary,
  }));
}

/**
 * The static corpus, built once at module load. A few dozen entries, so this
 * costs microseconds — but rebuilding it inside the chat stream on every tool
 * call would be pointless work in the hot path.
 */
export const STATIC_INDEX: readonly SearchDoc[] = [
  ...projectDocs(),
  ...experienceDocs(),
  ...skillDocs(),
];
