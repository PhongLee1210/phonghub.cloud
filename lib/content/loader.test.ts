import { describe, expect, test } from "bun:test";

import { PROJECTS } from "@/config/projects";
import { SKILLS } from "@/config/skills";
import { loadAllContent } from "./loader";

describe("loadAllContent", () => {
  test("returns content items covering all five sources", async () => {
    const items = await loadAllContent();
    const sourceTypes = new Set(items.map((item): string => item.sourceType));
    expect(sourceTypes).toEqual(
      new Set(["project", "skill", "experience", "resume_source", "blog"])
    );
  });

  test("counts match the underlying config sources", async () => {
    const items = await loadAllContent();
    const projectItems = items.filter((item) => item.sourceType === "project");
    const skillItems = items.filter((item) => item.sourceType === "skill");
    expect(projectItems).toHaveLength(PROJECTS.length);
    expect(skillItems).toHaveLength(SKILLS.length);
  });

  test("filters out non-public items by default", async () => {
    const items = await loadAllContent();
    expect(items.every((item) => item.visibility === "public")).toBe(true);
  });
});
