import { PROJECTS, ProjectInterface, featuredProjects } from "@/config/projects";
import { ValidCategory, ValidSkills } from "@/config/constants";

function compareProjectRecency(
  a: ProjectInterface,
  b: ProjectInterface
): number {
  const aOngoing = a.endDate === null;
  const bOngoing = b.endDate === null;
  if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
  return b.startDate.getTime() - a.startDate.getTime();
}

export function findMostRecentProject(): ProjectInterface {
  return [...PROJECTS].sort(compareProjectRecency)[0];
}

export function findFeaturedProjects(): ProjectInterface[] {
  return featuredProjects;
}

export function filterProjectsByCategory(
  category: ValidCategory
): ProjectInterface[] {
  return PROJECTS.filter((project) => project.category.includes(category));
}

export function filterProjectsByTechStack(
  skill: ValidSkills
): ProjectInterface[] {
  return PROJECTS.filter((project) => project.techStack.includes(skill));
}
