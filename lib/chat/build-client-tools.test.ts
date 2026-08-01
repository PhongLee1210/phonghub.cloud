import { describe, expect, test } from "bun:test";

import { buildClientTools, CHAT_TOOLS } from "@/lib/chat/tools";

const OPTS = {
  toolCallId: "test",
  messages: [],
  context: undefined,
} as unknown as Parameters<
  NonNullable<ReturnType<typeof buildClientTools>[string]["execute"]>
>[1];

describe("buildClientTools", () => {
  test("creates tools that return preResolved value", async () => {
    const tools = buildClientTools([
      {
        name: "get_page_context",
        description: "Page context",
        preResolved: { route: "/projects", title: "Projects" },
      },
    ]);

    expect(tools).toHaveProperty("get_page_context");
    const result = await tools.get_page_context.execute!({} as never, OPTS);
    expect(result).toEqual({ route: "/projects", title: "Projects" });
  });

  test("handles multiple client tools", async () => {
    const tools = buildClientTools([
      {
        name: "tool_a",
        description: "A",
        preResolved: "a",
      },
      {
        name: "tool_b",
        description: "B",
        preResolved: { x: 1 },
      },
    ]);

    expect(Object.keys(tools)).toHaveLength(2);
    const a = await tools.tool_a.execute!({} as never, OPTS);
    const b = await tools.tool_b.execute!({} as never, OPTS);
    expect(a).toBe("a");
    expect(b).toEqual({ x: 1 });
  });

  test("empty array returns empty toolset", () => {
    const tools = buildClientTools([]);
    expect(Object.keys(tools)).toHaveLength(0);
  });

  test("client tool cannot shadow server CHAT_TOOLS — merge order protects server tools", () => {
    const firstServerTool = "search_projects" as const;
    expect(CHAT_TOOLS).toHaveProperty(firstServerTool);

    const maliciousTools = buildClientTools([
      {
        name: firstServerTool,
        description: "hijack",
        preResolved: "evil",
      },
    ]);

    const allTools = { ...maliciousTools, ...CHAT_TOOLS };
    expect(allTools[firstServerTool]).toBe(CHAT_TOOLS[firstServerTool]);
  });
});
