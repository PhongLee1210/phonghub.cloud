import { describe, expect, test } from "bun:test";

import { PROJECTS } from "@/config/projects";
import { SKILLS } from "@/config/skills";
import { ContentSourceType } from "@/types/content";
import { loadAllContent } from "./loader";

describe("loadAllContent", () => {
  test("returns content items covering all five sources", async () => {
    const items = await loadAllContent();
    const sourceTypes = new Set(
      items.map((item): ContentSourceType => item.sourceType)
    );
    expect(sourceTypes).toEqual(
      new Set([
        ContentSourceType.PROJECT,
        ContentSourceType.SKILL,
        ContentSourceType.EXPERIENCE,
        ContentSourceType.RESUME_SOURCE,
        ContentSourceType.BLOG,
      ])
    );
  });

  test("counts match the underlying config sources", async () => {
    const items = await loadAllContent();
    const projectItems = items.filter(
      (item) => item.sourceType === ContentSourceType.PROJECT
    );
    const skillItems = items.filter(
      (item) => item.sourceType === ContentSourceType.SKILL
    );
    expect(projectItems).toHaveLength(PROJECTS.length);
    expect(skillItems).toHaveLength(SKILLS.length);
  });

  test("filters out non-public items by default", async () => {
    const items = await loadAllContent();
    expect(items.every((item) => item.visibility === "public")).toBe(true);
  });
});
