import { describe, expect, test } from "bun:test";

import { ISkill, SkillCategoryEnum } from "@/config/skills";
import { normalizeSkill } from "./from-skill";

const skill: ISkill = {
  key: "nextjs",
  name: "Next.js",
  description: "Effortlessly build dynamic apps.",
  rating: 5,
  icon: "nextjs",
  category: SkillCategoryEnum.FRONTEND,
};

describe("normalizeSkill", () => {
  test("namespaces the id and derives sourceUrl", () => {
    const item = normalizeSkill(skill);
    expect(item.id).toBe("skill:nextjs");
    expect(item.skillKey).toBe("nextjs");
    expect(item.sourceUrl).toBe("/skills#nextjs");
  });

  test("sets skillTags to the skill's own key", () => {
    const item = normalizeSkill(skill);
    expect(item.skillTags).toEqual(["nextjs"]);
  });

  test("passes through category and rating", () => {
    const item = normalizeSkill(skill);
    expect(item.category).toBe(SkillCategoryEnum.FRONTEND);
    expect(item.rating).toBe(5);
  });
});
