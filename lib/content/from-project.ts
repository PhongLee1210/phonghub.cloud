import { ISkill } from "@/config/skills";
import { ProjectInterface } from "@/config/projects";
import { ProjectContentItem, SkillTag } from "@/types/content";

/** Case-insensitive lookup by ISkill.name, shared by every adapter that needs to resolve a display name back to a cataloged skill. */
export function findSkillByName(rawName: string, skills: ISkill[]): ISkill | undefined {
  return skills.find((skill) => skill.name.toLowerCase() === rawName.toLowerCase());
}

/**
 * ProjectInterface.techStack / ExperienceInterface.skills are typed
 * ValidSkills[] — human-readable display names ("Next.js"), not
 * ISkill.key ("nextjs"). Best-effort resolve to the canonical SkillTag by
 * case-insensitive name match; falls back to a slugified version of the
 * raw name (and warns in dev) when no match exists, e.g. for tech not yet
 * catalogued in config/skills.ts.
 */
export function resolveSkillTag(rawName: string, skills: ISkill[]): SkillTag {
  const match = findSkillByName(rawName, skills);
  if (match) return match.key;

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[lib/content] No ISkill match for "${rawName}" — falling back to a slugified tag.`
    );
  }
  return rawName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeProject(
  project: ProjectInterface,
  skills: ISkill[]
): ProjectContentItem {
  const startDate = project.startDate.toISOString();
  const endDate = project.endDate ? project.endDate.toISOString() : null;
  const skillTags = project.techStack.map((tech) =>
    resolveSkillTag(tech, skills)
  );

  return {
    id: `project:${project.id}`,
    title: project.companyName,
    sourceType: "project",
    sourceUrl: `/projects/${project.id}`,
    projectId: project.id,
    skillTags,
    visibility: "public",
    confidence: 1.0,
    updatedAt: endDate ?? startDate,
    summary: project.shortDescription,
    companyName: project.companyName,
    category: project.category,
    techStack: project.techStack,
    type: project.type,
    startDate,
    endDate,
    websiteLink: project.websiteLink,
    githubLink: project.githubLink,
  };
}

export function normalizeProjects(
  projects: ProjectInterface[],
  skills: ISkill[]
): ProjectContentItem[] {
  return projects.map((project) => normalizeProject(project, skills));
}
