import { afterEach, describe, expect, test } from "bun:test";

import { useAiToolRegistry } from "./registry";

function resetRegistry() {
  useAiToolRegistry.setState({ tools: new Map() });
}

afterEach(resetRegistry);

describe("register / unregister", () => {
  test("register adds tool to the registry", () => {
    const { register } = useAiToolRegistry.getState();
    register("test_tool", {
      description: "A test tool",
      execute: async () => ({ data: { foo: "bar" } }),
    });

    const tools = useAiToolRegistry.getState().tools;
    expect(tools.size).toBe(1);
    expect(tools.has("test_tool")).toBe(true);
  });

  test("unregister removes tool from the registry", () => {
    const { register, unregister } = useAiToolRegistry.getState();
    register("test_tool", {
      description: "A test tool",
      execute: async () => ({ data: null }),
    });
    expect(useAiToolRegistry.getState().tools.size).toBe(1);

    unregister("test_tool");
    expect(useAiToolRegistry.getState().tools.size).toBe(0);
  });

  test("unregister non-existent tool is a no-op", () => {
    const { unregister } = useAiToolRegistry.getState();
    unregister("does_not_exist");
    expect(useAiToolRegistry.getState().tools.size).toBe(0);
  });

  test("re-registering same name overwrites previous entry", () => {
    const { register } = useAiToolRegistry.getState();
    register("dup", {
      description: "first",
      execute: async () => ({ data: 1 }),
    });
    register("dup", {
      description: "second",
      execute: async () => ({ data: 2 }),
    });

    const tools = useAiToolRegistry.getState().tools;
    expect(tools.size).toBe(1);
    expect(tools.get("dup")!.description).toBe("second");
  });
});

describe("snapshot", () => {
  test("returns serialized tools with pre-resolved data", async () => {
    const { register, snapshot } = useAiToolRegistry.getState();
    register("page_ctx", {
      description: "Get page context",
      execute: async () => ({ data: { route: "/skills", title: "Skills" } }),
    });

    const result = await snapshot();
    expect(result).toEqual([
      {
        name: "page_ctx",
        description: "Get page context",
        parameters: {},
        preResolved: { route: "/skills", title: "Skills" },
      },
    ]);
  });

  test("unwraps { data } envelope — preResolved is the inner value", async () => {
    const { register, snapshot } = useAiToolRegistry.getState();
    register("ctx", {
      description: "test",
      execute: async () => ({ data: "raw-value" }),
    });

    const [tool] = await snapshot();
    expect(tool.preResolved).toBe("raw-value");
  });

  test("empty registry returns empty array", async () => {
    const result = await useAiToolRegistry.getState().snapshot();
    expect(result).toEqual([]);
  });

  test("failing tool is excluded from snapshot", async () => {
    const { register, snapshot } = useAiToolRegistry.getState();
    register("good", {
      description: "works",
      execute: async () => ({ data: "ok" }),
    });
    register("bad", {
      description: "fails",
      execute: async () => {
        throw new Error("boom");
      },
    });

    const result = await snapshot();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("good");
  });

  test("preserves custom parameters in serialized output", async () => {
    const { register, snapshot } = useAiToolRegistry.getState();
    register("with_params", {
      description: "has params",
      parameters: { type: "object", properties: { q: { type: "string" } } },
      execute: async () => ({ data: null }),
    });

    const [tool] = await snapshot();
    expect(tool.parameters).toEqual({
      type: "object",
      properties: { q: { type: "string" } },
    });
  });

  test("multiple tools all resolve concurrently", async () => {
    const { register, snapshot } = useAiToolRegistry.getState();
    const order: string[] = [];

    register("a", {
      description: "a",
      execute: async () => {
        order.push("a");
        return { data: "a" };
      },
    });
    register("b", {
      description: "b",
      execute: async () => {
        order.push("b");
        return { data: "b" };
      },
    });

    const result = await snapshot();
    expect(result).toHaveLength(2);
    expect(order).toContain("a");
    expect(order).toContain("b");
  });
});
