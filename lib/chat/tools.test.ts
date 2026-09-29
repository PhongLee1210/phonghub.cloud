import type { ToolExecutionOptions } from "ai";
import { describe, expect, test } from "bun:test";

import { THINKING_STEP_LABELS } from "@/config/chat";
import { PROJECTS } from "@/config/projects";
import { RESUME_RESOURCE } from "@/config/resume";
import { CHAT_TOOLS } from "@/lib/chat/tools";
import { findCurrentCompany } from "@/lib/data/experience";
import {
  filterProjectsByTechStack,
  findMostRecentProject,
} from "@/lib/data/projects";

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

describe("reveal", () => {
  test("accepts a well-formed entity id", async () => {
    const result = await execute("reveal", {
      target: `project:${PROJECTS[0].id}`,
    });
    expect(result).toEqual({ ok: true, target: `project:${PROJECTS[0].id}` });
  });

  test("accepts a skill agentId", async () => {
    const result = await execute("reveal", { target: "skill:react" });
    expect(result).toEqual({ ok: true, target: "skill:react" });
  });

  test("accepts 'resume'", async () => {
    const result = await execute("reveal", { target: "resume" });
    expect(result).toEqual({ ok: true, target: "resume" });
  });

  test("rejects a malformed id", async () => {
    const result = await execute("reveal", { target: "not-an-id" });
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

describe("open_detail", () => {
  test("accepts a well-formed entity id", async () => {
    const result = await execute("open_detail", {
      target: `project:${PROJECTS[0].id}`,
    });
    expect(result).toEqual({ ok: true, target: `project:${PROJECTS[0].id}` });
  });

  test("accepts 'resume'", async () => {
    const result = await execute("open_detail", { target: "resume" });
    expect(result).toEqual({ ok: true, target: "resume" });
  });

  test("rejects a malformed id", async () => {
    const result = await execute("open_detail", { target: "not-an-id" });
    expect(result).toEqual({
      ok: false,
      target: "not-an-id",
      reason: "unrecognized agentId format",
    });
  });
});

describe("THINKING_STEP_LABELS coverage", () => {
  // Regression guard: thinking-checklist.tsx falls back to the raw step key
  // (`THINKING_STEP_LABELS[s] ?? s`), so a tool without a label leaks its
  // internal name into the UI — visitors were reading "capture_lead".
  test("every chat tool has a visitor-facing label", () => {
    const unlabelled = Object.keys(CHAT_TOOLS).filter(
      (name) => !(name in THINKING_STEP_LABELS)
    );
    expect(unlabelled).toEqual([]);
  });

  test("every client tool name has a label", () => {
    // Client tools are registered in the browser (lib/ai-tools/) and their
    // names reach the same checklist. Kept as an explicit list because the
    // registry is populated at runtime, not importable here.
    const CLIENT_TOOL_NAMES = ["get_page_context"];
    const unlabelled = CLIENT_TOOL_NAMES.filter(
      (name) => !(name in THINKING_STEP_LABELS)
    );
    expect(unlabelled).toEqual([]);
  });

  test("no label is an empty string", () => {
    const empty = Object.entries(THINKING_STEP_LABELS)
      .filter(([, label]) => label.trim().length === 0)
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });
});

describe("free-text search", () => {
  test("a spelling the config does not use still finds projects", async () => {
    // The whole point of lib/retrieval: "Next.js" is the only spelling stored,
    // and the model routinely writes "nextjs".
    const result = (await execute("search_projects", {
      query: "nextjs",
    })) as Array<{ agentId: string }>;

    expect(result.length).toBeGreaterThan(0);
    const viaEnum = filterProjectsByTechStack("Next.js").map(
      (p) => `project:${p.id}`
    );
    expect([...result.map((r) => r.agentId)].sort()).toEqual(
      [...viaEnum].sort()
    );
  });

  test("a shorthand is labelled so the reply can stay honest", async () => {
    const result = (await execute("search_skills", { query: "ts" })) as Array<{
      agentId: string;
      matchedOn?: string;
    }>;

    const typescript = result.find((r) => r.agentId === "skill:typescript");
    expect(typescript).toBeDefined();
    expect(typescript!.matchedOn).toBe("ALIAS");
  });

  test("an exact hit carries no matchedOn hint", async () => {
    const result = (await execute("search_skills", {
      query: "GraphQL",
    })) as Array<{ agentId: string; matchedOn?: string }>;

    const graphql = result.find((r) => r.agentId === "skill:graphql");
    expect(graphql).toBeDefined();
    expect(graphql!.matchedOn).toBeUndefined();
  });

  test("a structured filter still wins over free text", async () => {
    // Enum filters are exact; free text is the fallback, not a replacement.
    const category = PROJECTS[0].category[0];
    const viaFilter = (await execute("search_projects", { category })) as Array<{
      agentId: string;
    }>;
    const withBoth = (await execute("search_projects", {
      category,
      query: "something unrelated entirely",
    })) as Array<{ agentId: string }>;

    expect(withBoth.map((r) => r.agentId)).toEqual(
      viaFilter.map((r) => r.agentId)
    );
  });

  test("an unrelated term returns nothing rather than a loose guess", async () => {
    expect(await execute("search_projects", { query: "cobol" })).toEqual([]);
    expect(await execute("search_skills", { query: "cobol" })).toEqual([]);
  });

  test("blog search matches on topic, not just recency", async () => {
    // Without a query this tool returns the most recent posts whatever was
    // asked, so a topic query must actually narrow the list.
    const onTopic = (await execute("search_blog", {
      query: "analytics",
    })) as Array<{ agentId: string; title: string }>;
    const recent = (await execute("search_blog", {})) as Array<{
      agentId: string;
    }>;

    expect(onTopic.length).toBeGreaterThan(0);
    expect(onTopic.every((p) => p.agentId.startsWith("blog:"))).toBe(true);
    // Narrower than the unfiltered recent list, which is the whole point.
    expect(onTopic.length).toBeLessThan(recent.length);
    expect(onTopic.some((p) => /analytics/i.test(p.title))).toBe(true);
  });
});
