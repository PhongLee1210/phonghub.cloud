import { describe, expect, test } from "bun:test";

import {
  AGENT_CMD_MARKER,
  createCommandSplitter,
  encodeEvent,
  parseCommandStream,
} from "./protocol";

const M = AGENT_CMD_MARKER;

// ── createCommandSplitter ──────────────────────────────────────

describe("createCommandSplitter", () => {
  test("marker in one chunk — visible text returned, raw captured", () => {
    const s = createCommandSplitter();
    const visible = s.push(`answer${M}{"suggest":[]}`);
    expect(visible).toBe("answer");
    expect(s.finish()).toEqual({ remainder: "", raw: '{"suggest":[]}' });
  });

  test("marker split across 2 chunks — partial marker withheld", () => {
    const s = createCommandSplitter();
    const v1 = s.push("Hello<<<AGENT_CMDS");
    const v2 = s.push(`>>>{"suggest":[]}`);
    expect(v1 + v2).toBe("Hello");
    expect(s.finish()).toEqual({ remainder: "", raw: '{"suggest":[]}' });
  });

  test("marker split across 3 chunks — holdback spans two boundaries", () => {
    const s = createCommandSplitter();
    expect(s.push("<<<AGENT_")).toBe("");
    expect(s.push("CMDS>>")).toBe("");
    const v3 = s.push(`>{"suggest":[]}`);
    expect(v3).toBe("");
    expect(s.finish()).toEqual({ remainder: "", raw: '{"suggest":[]}' });
  });

  test("no marker at all — all text flushed across chunks + finish remainder", () => {
    const s = createCommandSplitter();
    const v1 = s.push("just a ");
    const v2 = s.push("normal answer ");
    const v3 = s.push("with no marker");
    const { remainder, raw } = s.finish();
    expect(v1 + v2 + v3 + remainder).toBe("just a normal answer with no marker");
    expect(raw).toBeUndefined();
  });

  test("empty answer before marker", () => {
    const s = createCommandSplitter();
    const visible = s.push(`${M}{"suggest":[]}`);
    expect(visible).toBe("");
    expect(s.finish()).toEqual({ remainder: "", raw: '{"suggest":[]}' });
  });

  test("marker inside suggest value does not trigger second split", () => {
    const s = createCommandSplitter();
    const visible = s.push(
      `answer${M}{"suggest":["What about ${M}?"]}`,
    );
    expect(visible).toBe("answer");
    const { raw } = s.finish();
    expect(raw).toBe(`{"suggest":["What about ${M}?"]}`);
    const parsed = parseCommandStream(raw!);
    expect(parsed.suggest).toEqual([`What about ${M}?`]);
  });

  test("multiple chunks after marker — all accumulate in rawBuffer", () => {
    const s = createCommandSplitter();
    expect(s.push(`answer${M}`)).toBe("answer");
    expect(s.push('{"sug')).toBe("");
    expect(s.push('gest":')).toBe("");
    expect(s.push('["q1","q2"]}')).toBe("");
    expect(s.finish()).toEqual({
      remainder: "",
      raw: '{"suggest":["q1","q2"]}',
    });
  });

  test("finish called twice — second returns empty remainder", () => {
    const s = createCommandSplitter();
    s.push("some text");
    const first = s.finish();
    expect(first.remainder).toBe("some text");
    const second = s.finish();
    expect(second.remainder).toBe("");
  });
});

// ── parseCommandStream ─────────────────────────────────────────

describe("parseCommandStream", () => {
  test("valid suggest", () => {
    expect(parseCommandStream('{"suggest": ["q1", "q2"]}')).toEqual({
      suggest: ["q1", "q2"],
    });
  });

  test("unknown keys silently ignored", () => {
    expect(
      parseCommandStream('{"suggest": ["q1"], "highlight": "x", "future": 42}'),
    ).toEqual({ suggest: ["q1"] });
  });

  test("malformed JSON returns empty", () => {
    expect(parseCommandStream("not json at all")).toEqual({});
  });

  test("empty string returns empty", () => {
    expect(parseCommandStream("")).toEqual({});
  });

  test("valid JSON array (not object) returns empty", () => {
    expect(parseCommandStream('["q1", "q2"]')).toEqual({});
  });

  test("valid JSON string (not object) returns empty", () => {
    expect(parseCommandStream('"hello"')).toEqual({});
  });

  test("suggest not an array returns empty", () => {
    expect(parseCommandStream('{"suggest": "not an array"}')).toEqual({});
  });

  test("empties and whitespace-only filtered, valid kept", () => {
    expect(parseCommandStream('{"suggest": ["", "q1", "  "]}')).toEqual({
      suggest: ["q1"],
    });
  });

  test("all-invalid suggest returns empty", () => {
    expect(parseCommandStream('{"suggest": ["", "  "]}')).toEqual({});
  });

  test("suggest item exceeding maxInputChars filtered out", () => {
    const long = "x".repeat(1001);
    expect(parseCommandStream(`{"suggest": ["${long}"]}`)).toEqual({});
  });

  test("suggest capped at 3 items", () => {
    expect(
      parseCommandStream('{"suggest": ["a","b","c","d","e"]}'),
    ).toEqual({ suggest: ["a", "b", "c"] });
  });

  test("unicode escapes decoded correctly", () => {
    expect(parseCommandStream('{"suggest": ["What\\u0027s his stack?"]}')).toEqual({
      suggest: ["What's his stack?"],
    });
  });

  test("leading/trailing whitespace trimmed before JSON.parse", () => {
    expect(
      parseCommandStream('  \n {"suggest": ["q"]}  \n'),
    ).toEqual({ suggest: ["q"] });
  });

  test("number value for suggest returns empty", () => {
    expect(parseCommandStream('{"suggest": 42}')).toEqual({});
  });

  test("null value for suggest returns empty", () => {
    expect(parseCommandStream('{"suggest": null}')).toEqual({});
  });

  test("array with non-string elements — numbers filtered, strings kept", () => {
    expect(
      parseCommandStream('{"suggest": [42, "q1", true, null, "q2"]}'),
    ).toEqual({ suggest: ["q1", "q2"] });
  });
});

// ── integration: splitter → parser ─────────────────────────────

describe("splitter → parser integration", () => {
  test("full pipeline across multiple pushes", () => {
    const s = createCommandSplitter();
    const v1 = s.push("Phong uses React.\n");
    const v2 = s.push(M);
    const v3 = s.push("\n");
    const v4 = s.push('{"suggest": ["More?"]}');
    const { raw } = s.finish();

    expect(v1 + v2 + v3 + v4).toBe("Phong uses React.\n");
    expect(raw).toBeDefined();
    expect(parseCommandStream(raw!)).toEqual({ suggest: ["More?"] });
  });

  test("no marker — finish remainder is visible text, raw undefined", () => {
    const s = createCommandSplitter();
    const chunks = ["This is ", "a normal ", "answer."];
    const visibleParts: string[] = [];
    for (const c of chunks) visibleParts.push(s.push(c));
    const { remainder, raw } = s.finish();

    expect(raw).toBeUndefined();
    expect(visibleParts.join("") + remainder).toBe("This is a normal answer.");
  });
});

// ── encodeEvent (smoke test, Task 1.4) ─────────────────────────

describe("encodeEvent", () => {
  test("produces single NDJSON line with trailing newline", () => {
    const line = encodeEvent({ type: "token", text: "hi" });
    expect(line).toBe('{"type":"token","text":"hi"}\n');
    expect(line.endsWith("\n")).toBe(true);
  });
});
