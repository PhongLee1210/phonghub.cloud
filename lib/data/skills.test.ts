import { describe, expect, test } from "bun:test";

import { SKILLS, SkillCategoryEnum } from "@/config/skills";
import { filterSkillsByCategory, getStrongestSkills } from "./skills";

describe("getStrongestSkills", () => {
  test("returns the top-rated skills, defaulting to 6", () => {
    const result = getStrongestSkills();
    expect(result).toHaveLength(6);
    expect(result.every((s) => s.rating === 5)).toBe(true);
    expect(result).toEqual(SKILLS.slice(0, 6));
  });

  test("respects a custom limit", () => {
    expect(getStrongestSkills(2)).toEqual(SKILLS.slice(0, 2));
  });
});

describe("filterSkillsByCategory", () => {
  test("returns only skills in the given category", () => {
    const result = filterSkillsByCategory(SkillCategoryEnum.AI_LLM);
    expect(result.map((s) => s.key).sort()).toEqual(
      ["ai", "langchain", "langfuse"].sort()
    );
    expect(result.every((s) => s.category === SkillCategoryEnum.AI_LLM)).toBe(
      true
    );
  });
});
