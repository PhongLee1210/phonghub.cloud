import { ISkill } from "@/config/skills";
import { SkillContentItem } from "@/types/content";

// ISkill has no timestamp field; updatedAt is a synthetic build-time
// constant, not a real "last changed" signal. Acceptable for MVP — a
// future git-blame-based approach could replace this.
const SYNTHETIC_UPDATED_AT = new Date("2026-01-01T00:00:00.000Z").toISOString();

export function normalizeSkill(skill: ISkill): SkillContentItem {
  return {
    id: `skill:${skill.key}`,
    title: skill.name,
    sourceType: "skill",
    sourceUrl: `/skills#${skill.key}`,
    skillTags: [skill.key],
    visibility: "public",
    confidence: 1.0,
    updatedAt: SYNTHETIC_UPDATED_AT,
    summary: skill.description,
    skillKey: skill.key,
    category: skill.category,
    rating: skill.rating,
  };
}

export function normalizeSkills(skills: ISkill[]): SkillContentItem[] {
  return skills.map(normalizeSkill);
}
