import "server-only";

import { EXPERIENCES } from "@/config/experience";
import { PROJECTS } from "@/config/projects";
import { SKILLS } from "@/config/skills";
import { ContentItem, ContentVisibility } from "@/types/content";
import { normalizeBlogPosts } from "./from-blog";
import { normalizeExperiences } from "./from-experience";
import { normalizeProjects } from "./from-project";
import { loadResumeSource, normalizeResumeSource } from "./from-resume";
import { normalizeSkills } from "./from-skill";

export interface LoadAllContentOptions {
  contentDir?: string;
  resumePath?: string;
  includeVisibility?: ContentVisibility[];
}

const DEFAULT_VISIBILITY: ContentVisibility[] = [ContentVisibility.PUBLIC];

/**
 * Aggregate entry point for the content layer. No caching here — mirrors
 * lib/blog/service.ts's own no-caching stance; a future caller (e.g. a
 * system-prompt builder) is responsible for caching if needed.
 */
export async function loadAllContent(
  opts: LoadAllContentOptions = {}
): Promise<ContentItem[]> {
  const includeVisibility = opts.includeVisibility ?? DEFAULT_VISIBILITY;

  const resume = await loadResumeSource(opts.resumePath);

  const items: ContentItem[] = [
    ...normalizeProjects(PROJECTS, SKILLS),
    ...normalizeSkills(SKILLS),
    ...normalizeExperiences(EXPERIENCES, SKILLS),
    ...normalizeResumeSource(resume),
    ...(await normalizeBlogPosts(opts.contentDir)),
  ];

  return items.filter((item) => includeVisibility.includes(item.visibility));
}
