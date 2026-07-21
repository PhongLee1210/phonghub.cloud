import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { __setProvidersForTests } from "@/lib/llm/registry";
import type {
  LLMProvider,
  LLMRequest,
  LLMStreamChunk,
  ProviderId,
} from "@/lib/llm/types";

import { ShowcasePatchError, streamPatch } from "./stream-patch";

/**
 * Unit tests for `streamPatch`. Uses the same FakeProvider pattern as
 * `lib/llm/index.test.ts` — the test-only `__setProvidersForTests()`
 * escape hatch seeds the real registry without module mocking.
 *
 * Covers: happy path (code-delta + terminal + done), partial-line
 * buffering across chunks, malformed-line skipping, empty-response
 * fallback, and the `reset` command guard.
 */

type Script =
  | { kind: "chunks"; chunks: LLMStreamChunk[] }
  | { kind: "throw"; error: Error; afterChunks?: LLMStreamChunk[] };

class FakeProvider implements LLMProvider {
  receivedReqs: LLMRequest[] = [];
  constructor(
    public id: ProviderId,
    private script: Script,
    public supportsTools = false,
  ) {}
  isConfigured() {
    return true;
  }
  async *stream(_model: string, req: LLMRequest): AsyncIterable<LLMStreamChunk> {
    this.receivedReqs.push(req);
    if (this.script.kind === "chunks") {
      for (const c of this.script.chunks) yield c;
      return;
    }
    if (this.script.afterChunks) {
      for (const c of this.script.afterChunks) yield c;
    }
    throw this.script.error;
  }
}

const DONE_CHUNK: LLMStreamChunk = {
  type: "done",
  usage: { inputTokens: 1, outputTokens: 1 },
  stopReason: "end",
};

function text(text: string): LLMStreamChunk {
  return { type: "text", text };
}

function seed(script: Script): FakeProvider {
  const fake = new FakeProvider("groq", script);
  __setProvidersForTests([fake]);
  return fake;
}

beforeEach(() => {
  process.env.LLM_CHEAP_MODEL = "groq:fake-cheap";
  __setProvidersForTests([]);
});

afterEach(() => {
  delete process.env.LLM_CHEAP_MODEL;
  __setProvidersForTests([]);
});

async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const item of iter) out.push(item);
  return out;
}

describe("streamPatch", () => {
  test("happy path: code-delta + terminal + done", async () => {
    seed({
      kind: "chunks",
      chunks: [
        text(
          [
            `{"type":"code-delta","text":"const x = 1"}`,
            `{"type":"terminal","line":{"tone":"success","text":"added x"}}`,
            `{"type":"done","phase":"compiled"}`,
            ``,
          ].join("\n"),
        ),
        DONE_CHUNK,
      ],
    });

    const events = await collect(
      streamPatch({
        section: "skills",
        command: "feature",
        context: { subjectName: "TypeScript" },
      }),
    );

    expect(events.map((e) => e.type)).toEqual([
      "code-delta",
      "terminal",
      "done",
    ]);
    expect(events[0]).toEqual({
      type: "code-delta",
      text: "const x = 1",
    });
    expect(events[1]).toEqual({
      type: "terminal",
      line: { tone: "success", text: "added x" },
    });
    expect(events[2]).toEqual({ type: "done", phase: "compiled" });
  });

  test("buffering: a JSON event split across chunks is reassembled", async () => {
    seed({
      kind: "chunks",
      chunks: [
        text(`{"type":"code-delta","text":"cons`),
        text(`t y = 2"}\n{"type":"done","phase":"compiled"}`),
        DONE_CHUNK,
      ],
    });

    const events = await collect(
      streamPatch({
        section: "projects",
        command: "modify",
        context: { subjectName: "HiliosAI" },
      }),
    );

    expect(events).toEqual([
      { type: "code-delta", text: "const y = 2" },
      { type: "done", phase: "compiled" },
    ]);
  });

  test("malformed JSON lines are skipped with no event emitted", async () => {
    seed({
      kind: "chunks",
      chunks: [
        text(
          [
            `{"type":"code-delta","text":"ok"}`,
            `not json at all`,
            `{"type":"terminal","line":{"tone":"info","text":"after bad"}}`,
            `{"type":"done","phase":"compiled"}`,
          ].join("\n"),
        ),
        DONE_CHUNK,
      ],
    });

    const events = await collect(
      streamPatch({
        section: "skills",
        command: "feature",
        context: { subjectName: "TypeScript" },
      }),
    );

    expect(events.map((e) => e.type)).toEqual([
      "code-delta",
      "terminal",
      "done",
    ]);
  });

  test("unknown event kinds are skipped", async () => {
    seed({
      kind: "chunks",
      chunks: [
        text(
          [
            `{"type":"code-delta","text":"ok"}`,
            `{"type":"something-weird","foo":"bar"}`,
            `{"type":"done","phase":"compiled"}`,
          ].join("\n"),
        ),
        DONE_CHUNK,
      ],
    });

    const events = await collect(
      streamPatch({
        section: "skills",
        command: "feature",
        context: { subjectName: "TypeScript" },
      }),
    );

    expect(events.map((e) => e.type)).toEqual(["code-delta", "done"]);
  });

  test("terminal event with invalid tone is dropped", async () => {
    seed({
      kind: "chunks",
      chunks: [
        text(
          [
            `{"type":"terminal","line":{"tone":"purple","text":"bad tone"}}`,
            `{"type":"terminal","line":{"tone":"success","text":"good"}}`,
            `{"type":"done","phase":"compiled"}`,
          ].join("\n"),
        ),
        DONE_CHUNK,
      ],
    });

    const events = await collect(
      streamPatch({
        section: "skills",
        command: "feature",
        context: { subjectName: "TypeScript" },
      }),
    );

    expect(events).toEqual([
      { type: "terminal", line: { tone: "success", text: "good" } },
      { type: "done", phase: "compiled" },
    ]);
  });

  test("empty model response yields a warning terminal line + done", async () => {
    seed({ kind: "chunks", chunks: [text(""), DONE_CHUNK] });

    const events = await collect(
      streamPatch({
        section: "skills",
        command: "analytics",
        context: { subjectName: "TypeScript" },
      }),
    );

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      type: "terminal",
      line: { tone: "warning" },
    });
    expect(events[1]).toEqual({ type: "done", phase: "compiled" });
  });

  test("missing done emits a fallback done", async () => {
    seed({
      kind: "chunks",
      chunks: [
        text(`{"type":"code-delta","text":"x"}\n`), // no done
        DONE_CHUNK,
      ],
    });

    const events = await collect(
      streamPatch({
        section: "skills",
        command: "feature",
        context: { subjectName: "TypeScript" },
      }),
    );

    expect(events.at(-1)).toEqual({ type: "done", phase: "compiled" });
  });

  test("model stream error is normalised to an error event", async () => {
    seed({
      kind: "throw",
      error: new Error("provider exploded"),
      afterChunks: [text(`{"type":"code-delta","text":"partial"}`)],
    });

    const events = await collect(
      streamPatch({
        section: "skills",
        command: "feature",
        context: { subjectName: "TypeScript" },
      }),
    );

    expect(events).toEqual([
      { type: "code-delta", text: "partial" },
      {
        type: "error",
        message: "provider exploded",
        code: "stream_error",
      },
    ]);
  });

  test("reset command throws before contacting the model", async () => {
    const fake = seed({
      kind: "chunks",
      chunks: [DONE_CHUNK],
    });

    // streamPatch is an async generator — the throw only happens on first
    // .next(), so we have to consume it via collect() to surface the error.
    await expect(
      collect(
        streamPatch({
          section: "skills",
          command: "reset",
          context: { subjectName: "TypeScript" },
        }),
      ),
    ).rejects.toBeInstanceOf(ShowcasePatchError);

    expect(fake.receivedReqs).toHaveLength(0);
  });

  test("context tags + hint are threaded into the prompt", async () => {
    const fake = seed({
      kind: "chunks",
      chunks: [
        text(`{"type":"done","phase":"compiled"}\n`),
        DONE_CHUNK,
      ],
    });

    await collect(
      streamPatch({
        section: "skills",
        command: "modify",
        context: {
          subjectName: "React",
          tags: ["hooks", "typescript"],
          hint: "show useEffect cleanup",
          currentCode: ["useEffect(() => {", "  sub()", "}, [])"],
        },
      }),
    );

    expect(fake.receivedReqs).toHaveLength(1);
    const sys = fake.receivedReqs[0].messages[0].content;
    expect(sys).toContain("React");
    expect(sys).toContain("hooks");
    expect(sys).toContain("useEffect cleanup");
    expect(sys).toContain("Output contract");
  });
});
