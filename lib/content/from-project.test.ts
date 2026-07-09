import { describe, expect, test } from "bun:test";

import { ISkill, SkillCategoryEnum } from "@/config/skills";
import { ProjectInterface } from "@/config/projects";
import { normalizeProject, resolveSkillTag } from "./from-project";

const skills: ISkill[] = [
  {
    key: "nextjs",
    name: "Next.js",
    description: "",
    rating: 5,
    icon: "nextjs",
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    key: "react",
    name: "React",
    description: "",
    rating: 5,
    icon: "react",
    category: SkillCategoryEnum.FRONTEND,
  },
];

describe("resolveSkillTag", () => {
  test("resolves a known skill name to its canonical key, case-insensitively", () => {
    expect(resolveSkillTag("next.js", skills)).toBe("nextjs");
    expect(resolveSkillTag("React", skills)).toBe("react");
  });

  test("falls back to a slugified tag when no skill matches", () => {
    expect(resolveSkillTag("Some Unknown Tech!", skills)).toBe(
      "some-unknown-tech"
    );
  });
});

const baseProject: ProjectInterface = {
  id: "sample-project",
  type: "Personal",
  companyName: "Sample Project",
  category: ["Web Dev"],
  shortDescription: "A sample project for testing.",
  techStack: ["Next.js", "React"],
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-06-01"),
  companyLogoImg: "/sample.png",
  descriptionDetails: { paragraphs: [], bullets: [] },
  pagesInfoArr: [],
};

describe("normalizeProject", () => {
  test("namespaces the id and derives sourceUrl", () => {
    const item = normalizeProject(baseProject, skills);
    expect(item.id).toBe("project:sample-project");
    expect(item.projectId).toBe("sample-project");
    expect(item.sourceUrl).toBe("/projects/sample-project");
  });

  test("converts Date fields to ISO strings", () => {
    const item = normalizeProject(baseProject, skills);
    expect(item.startDate).toBe(new Date("2024-01-01").toISOString());
    expect(item.endDate).toBe(new Date("2024-06-01").toISOString());
  });

  test("passes through a null endDate", () => {
    const item = normalizeProject({ ...baseProject, endDate: null }, skills);
    expect(item.endDate).toBeNull();
  });

  test("resolves skillTags from techStack", () => {
    const item = normalizeProject(baseProject, skills);
    expect(item.skillTags).toEqual(["nextjs", "react"]);
  });
});
