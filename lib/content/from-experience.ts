import { ISkill } from "@/config/skills";
import { ExperienceInterface } from "@/config/experience";
import { ContentSourceType, ContentVisibility, ExperienceContentItem } from "@/types/content";
import { resolveSkillTag } from "./from-project";

export function normalizeExperience(
  exp: ExperienceInterface,
  skills: ISkill[]
): ExperienceContentItem {
  const startDate = exp.startDate.toISOString();
  const endDate = exp.endDate === "Present" ? "Present" : exp.endDate.toISOString();
  const skillTags = exp.skills.map((skill) => resolveSkillTag(skill, skills));

  return {
    id: `experience:${exp.id}`,
    title: `${exp.position} at ${exp.company}`,
    sourceType: ContentSourceType.EXPERIENCE,
    sourceUrl: `/experience#${exp.id}`,
    skillTags,
    visibility: ContentVisibility.PUBLIC,
    confidence: 1.0,
    updatedAt: endDate === "Present" ? startDate : endDate,
    summary: exp.description.join(" "),
    experienceId: exp.id,
    position: exp.position,
    company: exp.company,
    location: exp.location,
    startDate,
    endDate,
    achievements: exp.achievements,
    companyUrl: exp.companyUrl,
  };
}

export function normalizeExperiences(
  exps: ExperienceInterface[],
  skills: ISkill[]
): ExperienceContentItem[] {
  return exps.map((exp) => normalizeExperience(exp, skills));
}
