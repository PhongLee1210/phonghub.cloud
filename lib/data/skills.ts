import { ISkill, SKILLS, SkillCategoryEnum } from "@/config/skills";

const DEFAULT_STRONGEST_SKILLS_LIMIT = 6;

export function getStrongestSkills(
  limit: number = DEFAULT_STRONGEST_SKILLS_LIMIT
): ISkill[] {
  return SKILLS.slice(0, limit);
}

export function filterSkillsByCategory(
  category: SkillCategoryEnum
): ISkill[] {
  return SKILLS.filter((skill) => skill.category === category);
}
