import type { ToolExecutionOptions } from "ai";
import { describe, expect, test } from "bun:test";

import { PROJECTS } from "@/config/projects";
import { RESUME_RESOURCE } from "@/config/resume";
import { CHAT_TOOLS } from "@/lib/chat/tools";
import { findCurrentCompany } from "@/lib/data/experience";
import { findMostRecentProject } from "@/lib/data/projects";

// execute() requires ToolExecutionOptions, but nothing under test reads it.
const OPTS = {
  toolCallId: "test",
  messages: [],
  context: undefined,
} as unknown as ToolExecutionOptions<never>;

function execute(
  name: keyof typeof CHAT_TOOLS,
  input: Record<string, unknown>
) {
  const tool = CHAT_TOOLS[name];
  if (!tool.execute) throw new Error(`${name} has no execute()`);
  return tool.execute(input as never, OPTS);
}

describe("search_projects", () => {
  test("mostRecentOnly returns the single most recent project", async () => {
    const result = await execute("search_projects", { mostRecentOnly: true });
    const recent = findMostRecentProject();
    expect(result).toEqual([
      {
        agentId: `project:${recent.id}`,
        title: recent.organization.name,
        summary: recent.shortDescription,
      },
    ]);
  });

  test("category filter returns only matching projects", async () => {
    const category = PROJECTS[0].category[0];
    const result = (await execute("search_projects", { category })) as Array<{
      agentId: string;
    }>;
    expect(result.length).toBeGreaterThan(0);
    for (const item of result) {
      const id = item.agentId.replace("project:", "");
      const project = PROJECTS.find((p) => p.id === id);
      expect(project?.category).toContain(category);
    }
  });

  test("no filters returns featured projects", async () => {
    const result = await execute("search_projects", {});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("search_experiences", () => {
  test("currentOnly returns Phong's current company", async () => {
    const result = await execute("search_experiences", { currentOnly: true });
    const current = findCurrentCompany();
    expect(result).toEqual([
      {
        agentId: `experience:${current!.id}`,
        title: `${current!.position} at ${current!.company}`,
        summary: current!.description[0],
      },
    ]);
  });
});

describe("search_skills", () => {
  test("returns strongest skills with no filter", async () => {
    const result = (await execute("search_skills", {})) as unknown[];
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("search_resume", () => {
  test("returns the resume resource", async () => {
    const result = await execute("search_resume", {});
    expect(result).toEqual([
      {
        agentId: "resume",
        title: RESUME_RESOURCE.title,
        summary: RESUME_RESOURCE.description,
      },
    ]);
  });
});

describe("search_blog", () => {
  test("returns an array (no filter)", async () => {
    const result = await execute("search_blog", {});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("highlight_resource", () => {
  test("accepts a well-formed entity id", async () => {
    const result = await execute("highlight_resource", {
      target: `project:${PROJECTS[0].id}`,
    });
    expect(result).toEqual({ ok: true, target: `project:${PROJECTS[0].id}` });
  });

  test("accepts 'resume'", async () => {
    const result = await execute("highlight_resource", { target: "resume" });
    expect(result).toEqual({ ok: true, target: "resume" });
  });

  test("rejects a malformed id", async () => {
    const result = await execute("highlight_resource", { target: "not-an-id" });
    expect(result).toEqual({
      ok: false,
      target: "not-an-id",
      reason: "unrecognized agentId format",
    });
  });
});

describe("navigate_to", () => {
  test("accepts an allowed route", async () => {
    const result = await execute("navigate_to", { route: "/skills" });
    expect(result).toEqual({ ok: true, route: "/skills" });
  });

  test("rejects a disallowed route", async () => {
    const result = await execute("navigate_to", { route: "/admin" });
    expect(result).toEqual({
      ok: false,
      route: "/admin",
      reason: "route not allowed",
    });
  });
});

describe("focus", () => {
  test("accepts a well-formed entity id", async () => {
    const result = await execute("focus", {
      target: `skill:${PROJECTS[0].techStack[0]}`,
    });
    expect(result).toMatchObject({ ok: true });
  });

  test("rejects a malformed id", async () => {
    const result = await execute("focus", { target: "not-an-id" });
    expect(result).toEqual({
      ok: false,
      target: "not-an-id",
      reason: "unrecognized agentId format",
    });
  });
});

describe("open_modal", () => {
  test("accepts a well-formed entity id", async () => {
    const result = await execute("open_modal", {
      target: `project:${PROJECTS[0].id}`,
    });
    expect(result).toEqual({ ok: true, target: `project:${PROJECTS[0].id}` });
  });

  test("accepts 'resume'", async () => {
    const result = await execute("open_modal", { target: "resume" });
    expect(result).toEqual({ ok: true, target: "resume" });
  });

  test("rejects a malformed id", async () => {
    const result = await execute("open_modal", { target: "not-an-id" });
    expect(result).toEqual({
      ok: false,
      target: "not-an-id",
      reason: "unrecognized agentId format",
    });
  });
});

describe("expand_section", () => {
  test("accepts a well-formed entity id", async () => {
    const result = await execute("expand_section", {
      target: `project:${PROJECTS[0].id}`,
    });
    expect(result).toEqual({ ok: true, target: `project:${PROJECTS[0].id}` });
  });
});
