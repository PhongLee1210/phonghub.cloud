import { describe, expect, test } from "bun:test";

import { buildEntityId, encodeEvent, ENTITY_ID_PREFIXES, parseEntityId } from "./protocol";

// ── encodeEvent (smoke test, Task 1.4) ─────────────────────────

describe("encodeEvent", () => {
  test("produces single NDJSON line with trailing newline", () => {
    const line = encodeEvent({ type: "token", text: "hi" });
    expect(line).toBe('{"type":"token","text":"hi"}\n');
    expect(line.endsWith("\n")).toBe(true);
  });
});

// ── entity-id scheme (Task 4.0) ────────────────────────────────

describe("entity-id scheme", () => {
  test("buildEntityId prefixes with the kind", () => {
    expect(buildEntityId("project", "enrollment-platform")).toBe(
      "project:enrollment-platform"
    );
    expect(buildEntityId("skill", "react")).toBe("skill:react");
    expect(buildEntityId("experience", "hiliosai")).toBe("experience:hiliosai");
    expect(buildEntityId("blog", "my-post")).toBe("blog:my-post");
  });

  test("ENTITY_ID_PREFIXES covers all four kinds", () => {
    expect(Object.keys(ENTITY_ID_PREFIXES).sort()).toEqual([
      "blog",
      "experience",
      "project",
      "skill",
    ]);
  });

  test("parseEntityId round-trips buildEntityId output", () => {
    for (const kind of ["project", "skill", "experience", "blog"] as const) {
      const id = buildEntityId(kind, `test-${kind}`);
      expect(parseEntityId(id)).toEqual({ kind, id: `test-${kind}` });
    }
  });

  test("parseEntityId rejects missing colon", () => {
    expect(parseEntityId("nocolonhere")).toBeUndefined();
  });

  test("parseEntityId rejects unknown prefix", () => {
    expect(parseEntityId("unknown:thing")).toBeUndefined();
  });

  test("parseEntityId rejects empty id after prefix", () => {
    expect(parseEntityId("project:")).toBeUndefined();
  });

  test("parseEntityId handles ids containing colons", () => {
    expect(parseEntityId("blog:my:weird:slug")).toEqual({
      kind: "blog",
      id: "my:weird:slug",
    });
  });
});
