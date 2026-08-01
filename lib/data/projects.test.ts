import { describe, expect, test } from "bun:test";

import { PROJECTS, featuredProjects } from "@/config/projects";
import {
  filterProjectsByCategory,
  filterProjectsByTechStack,
  findFeaturedProjects,
  findMostRecentProject,
} from "./projects";

describe("findMostRecentProject", () => {
  test("returns the project with the latest startDate", () => {
    const result = findMostRecentProject();
    const maxStartDate = Math.max(
      ...PROJECTS.map((p) => p.startDate.getTime())
    );
    expect(result.startDate.getTime()).toBe(maxStartDate);
    expect(result.id).toBe("hiliosai-landing-sales-agent");
  });
});

describe("findFeaturedProjects", () => {
  test("returns the curated featuredProjects list", () => {
    expect(findFeaturedProjects()).toEqual(featuredProjects);
    expect(findFeaturedProjects()).toHaveLength(3);
  });
});

describe("filterProjectsByCategory", () => {
  test("returns only projects tagged with the given category", () => {
    const result = filterProjectsByCategory("Frontend");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("oasis-platform");
  });

  test("returns multiple projects when several share a category", () => {
    const result = filterProjectsByCategory("UI/UX");
    expect(result.map((p) => p.id).sort()).toEqual(
      ["ai-agents-enrollment", "hiliosai-landing-sales-agent"].sort()
    );
    expect(result.every((p) => p.category.includes("UI/UX"))).toBe(true);
  });
});

describe("filterProjectsByTechStack", () => {
  test("returns only projects using the given skill", () => {
    const result = filterProjectsByTechStack("GraphQL");
    expect(result.map((p) => p.id).sort()).toEqual(
      ["ai-agents-enrollment", "hiliosai-landing-sales-agent", "jetcare-platform"].sort()
    );
    expect(result.every((p) => p.techStack.includes("GraphQL"))).toBe(true);
  });

  test("returns an empty list when no project uses the skill", () => {
    expect(filterProjectsByTechStack("DBeaver")).toEqual([]);
  });
});
