import "server-only";

import { streamLLM } from "@/lib/llm";
import type { LLMStreamChunk } from "@/lib/llm/types";

import {
  buildShowcasePrompt,
  buildShowcaseUserMessage,
  type ShowcasePromptContext,
} from "../prompt";
import type {
  AiCommandId,
  ShowcaseEvent,
  ShowcaseSection,
  TerminalLine,
  TerminalTone,
} from "../commands";

/**
 * streamPatch — server-side bridge between the showcase AI commands and
 * the LLM gateway. Builds the prompt, calls `streamLLM` (cheap alias),
 * parses the model's NDJSON output into typed `ShowcaseEvent`s, and
 * yields them. Malformed lines are skipped with a warning log.
 *
 * Wire format (one JSON object per line):
 *   {"type":"code-delta","text":"..."}
 *   {"type":"terminal","line":{"tone":"success","text":"..."}}
 *   {"type":"done","phase":"compiled"}
 *   {"type":"error","message":"...","code":"..."}
 *
 * `reset` is a pure client action; calling `streamPatch` with
 * `command === "reset"` throws `ShowcasePatchError` so the route handler
 * can return 400 without consulting the model.
 */

const MAX_TOKENS = 800;
const TEMPERATURE = 0.6;

const VALID_TONES: readonly TerminalTone[] = [
  "info",
  "success",
  "warning",
  "error",
];

export interface StreamPatchArgs {
  section: ShowcaseSection;
  command: AiCommandId;
  context: ShowcasePromptContext;
  /** Optional abort signal (e.g. client disconnect). */
  signal?: AbortSignal;
}

export class ShowcasePatchError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ShowcasePatchError";
  }
}

export async function* streamPatch({
  section,
  command,
  context,
  signal,
}: StreamPatchArgs): AsyncIterable<ShowcaseEvent> {
  if (command === "reset") {
    throw new ShowcasePatchError(
      "client_only",
      'The "reset" command is handled client-side; no server stream is required.',
    );
  }

  const systemPrompt = buildShowcasePrompt({ section, command, context });
  const userMessage = buildShowcaseUserMessage({ section, command, context });

  let buffer = "";
  let eventCount = 0;
  let sawDone = false;

  try {
    const stream = streamLLM("cheap", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      maxTokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      ...(signal ? { signal } : {}),
    });

    for await (const chunk of stream) {
      const text = extractText(chunk);
      if (!text) continue;

      buffer += text;

      let nlIdx: number;
      while ((nlIdx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nlIdx).trim();
        buffer = buffer.slice(nlIdx + 1);
        if (!line) continue;

        const parsed = parseEvent(line);
        if (parsed) {
          eventCount++;
          if (parsed.type === "done") sawDone = true;
          yield parsed;
          if (parsed.type === "done") return;
        }
      }
    }
  } catch (err) {
    // Flush any partial line emitted before the failure so the user
    // still sees the partial output, then surface the error.
    const tailOnError = buffer.trim();
    if (tailOnError) {
      const parsed = parseEvent(tailOnError);
      if (parsed) {
        eventCount++;
        if (parsed.type === "done") sawDone = true;
        yield parsed;
      }
    }
    yield {
      type: "error",
      message:
        err instanceof Error ? err.message : "Unexpected error during stream.",
      code: err instanceof Error ? "stream_error" : "unknown",
    };
    return;
  }

  const tail = buffer.trim();
  if (tail) {
    const parsed = parseEvent(tail);
    if (parsed) {
      eventCount++;
      if (parsed.type === "done") sawDone = true;
      yield parsed;
    }
  }

  if (eventCount === 0) {
    yield {
      type: "terminal",
      line: { tone: "warning", text: "no output from assistant — try again" },
    };
  }
  if (!sawDone) {
    yield { type: "done", phase: "compiled" };
  }
}

function extractText(chunk: LLMStreamChunk): string | undefined {
  if (chunk.type === "text") return chunk.text;
  return undefined;
}

/**
 * Defensive NDJSON parser. Returns `undefined` for any line that isn't
 * valid JSON or doesn't satisfy the ShowcaseEvent contract; the stream
 * continues regardless.
 */
function parseEvent(line: string): ShowcaseEvent | undefined {
  let obj: unknown;
  try {
    obj = JSON.parse(line);
  } catch {
    console.warn(
      `[showcase/stream-patch] skipping malformed NDJSON line: ${line.slice(0, 120)}`,
    );
    return undefined;
  }

  if (!isObject(obj)) return undefined;

  const type = (obj as { type?: unknown }).type;

  switch (type) {
    case "code-delta": {
      const text = (obj as { text?: unknown }).text;
      if (typeof text !== "string" || text.length === 0) {
        return undefined;
      }
      return { type: "code-delta", text };
    }
    case "terminal": {
      const line = (obj as { line?: unknown }).line;
      if (!isObject(line)) return undefined;
      const tone = (line as { tone?: unknown }).tone;
      const text = (line as { text?: unknown }).text;
      if (
        typeof tone !== "string" ||
        !VALID_TONES.includes(tone as TerminalTone) ||
        typeof text !== "string" ||
        text.length === 0
      ) {
        return undefined;
      }
      const terminalLine: TerminalLine = {
        tone: tone as TerminalTone,
        text,
      };
      return { type: "terminal", line: terminalLine };
    }
    case "done": {
      const phase = (obj as { phase?: unknown }).phase;
      if (phase !== "compiled" && phase !== "preview" && phase !== "idle") {
        return { type: "done", phase: "compiled" };
      }
      return { type: "done", phase };
    }
    case "error": {
      const message = (obj as { message?: unknown }).message;
      const code = (obj as { code?: unknown }).code;
      if (typeof message !== "string") return undefined;
      return {
        type: "error",
        message,
        code: typeof code === "string" ? code : undefined,
      };
    }
    default:
      return undefined;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
