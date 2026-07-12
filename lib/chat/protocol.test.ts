import { describe, expect, test } from "bun:test";

import { encodeEvent } from "./protocol";

describe("encodeEvent", () => {
  test("serializes a token event as NDJSON", () => {
    const line = encodeEvent({ type: "token", text: "hello" });
    expect(line).toBe('{"type":"token","text":"hello"}\n');
  });

  test("serializes a thinking event", () => {
    const line = encodeEvent({ type: "thinking", step: "preparing" });
    expect(line).toBe('{"type":"thinking","step":"preparing"}\n');
  });

  test("serializes a done event without suggestions", () => {
    const line = encodeEvent({ type: "done" });
    expect(line).toBe('{"type":"done"}\n');
  });

  test("serializes a done event with suggestions", () => {
    const line = encodeEvent({
      type: "done",
      suggestions: ["Tell me more", "Show projects"],
    });
    expect(line).toBe(
      '{"type":"done","suggestions":["Tell me more","Show projects"]}\n'
    );
  });

  test("serializes an error event", () => {
    const line = encodeEvent({
      type: "error",
      code: "upstream_error",
      message: "Something went wrong.",
    });
    expect(line).toBe(
      '{"type":"error","code":"upstream_error","message":"Something went wrong."}\n'
    );
  });

  test("serializes an action event", () => {
    const line = encodeEvent({ type: "action", action: "star_repo" });
    expect(line).toBe('{"type":"action","action":"star_repo"}\n');
  });

  test("every output line ends with a newline", () => {
    const events = [
      { type: "token", text: "a" },
      { type: "thinking", step: "x" },
      { type: "done" },
    ] as const;
    for (const e of events) {
      expect(encodeEvent(e)).toEndWith("\n");
    }
  });
});
