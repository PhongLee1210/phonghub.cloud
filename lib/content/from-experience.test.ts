import { describe, expect, test } from "bun:test";

import { ISkill, SkillCategoryEnum } from "@/config/skills";
import { ExperienceInterface } from "@/config/experience";
import { normalizeExperience } from "./from-experience";

const skills: ISkill[] = [
  {
    key: "nodejs",
    name: "Node.js",
    description: "",
    rating: 5,
    icon: "nodejs",
    category: SkillCategoryEnum.BACKEND,
  },
];

const baseExperience: ExperienceInterface = {
  id: "sample-co",
  position: "Software Engineer",
  company: "Sample Co",
  location: "Remote",
  startDate: new Date("2023-01-01"),
  endDate: "Present",
  description: ["Built things.", "Shipped features."],
  achievements: ["Shipped a thing."],
  skills: ["Node.js"],
};

describe("normalizeExperience", () => {
  test("composes title from position and company", () => {
    const item = normalizeExperience(baseExperience, skills);
    expect(item.title).toBe("Software Engineer at Sample Co");
  });

  test("namespaces the id and derives sourceUrl", () => {
    const item = normalizeExperience(baseExperience, skills);
    expect(item.id).toBe("experience:sample-co");
    expect(item.experienceId).toBe("sample-co");
    expect(item.sourceUrl).toBe("/experience#sample-co");
  });

  test("passes through endDate 'Present' untouched", () => {
    const item = normalizeExperience(baseExperience, skills);
    expect(item.endDate).toBe("Present");
  });

  test("converts a concrete endDate to an ISO string", () => {
    const item = normalizeExperience(
      { ...baseExperience, endDate: new Date("2024-01-01") },
      skills
    );
    expect(item.endDate).toBe(new Date("2024-01-01").toISOString());
  });

  test("joins description into summary and passes through achievements", () => {
    const item = normalizeExperience(baseExperience, skills);
    expect(item.summary).toBe("Built things. Shipped features.");
    expect(item.achievements).toEqual(["Shipped a thing."]);
  });
});
