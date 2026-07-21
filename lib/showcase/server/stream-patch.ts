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
 * the LLM gateway. Builds the prompt, calls `streamLLM` (cheap alias —
 * the showcase is illustrative, not heavy reasoning), parses the model's
 * NDJSON output into typed `ShowcaseEvent`s, and yields them defensively
 * (malformed lines are skipped with a warning log; the stream continues).
 *
 * Wire format (line-delimited JSON — see `lib/showcase/commands.ts`):
 *
 *   {"type":"code-delta","text":"..."}
 *   {"type":"terminal","line":{"tone":"success","text":"..."}}
 *   {"type":"done","phase":"compiled"}
 *   {"type":"error","message":"...","code":"..."}
 *
 * Returns an `AsyncIterable<ShowcaseEvent>` so the route handler
 * (`app/api/showcase/patch/route.ts`, T5.4) can re-serialise each event
 * to NDJSON and stream it to the client.
 *
 * `reset` is a pure client action (per plan T5.5) — calling `streamPatch`
 * with `command === "reset"` throws a `ShowcasePatchError` so the route
 * handler can return a 400 without consulting the model.
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
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ShowcasePatchError";
    this.code = code;
  }
}

export async function* streamPatch({
  section,
  command,
  context,
  signal,
}: StreamPatchArgs): AsyncIterable<ShowcaseEvent> {
  if (command === "reset") {
    // Per plan T5.5: reset is purely client-side. The route handler
    // rejects before calling streamPatch, but defending here too keeps
    // the function safe to call directly from tests.
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

      // NDJSON = newline-delimited. Process every complete line in the
      // buffer; keep the trailing partial for the next chunk.
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
          if (parsed.type === "done") {
            // The model said it's done — stop reading even if more text
            // is buffered. Trailing prose after `done` is usually the
            // model ignoring the contract; ignore it cleanly.
            return;
          }
        }
      }
    }
  } catch (err) {
    // Flush any partial line the model emitted before failing — the
    // user benefits from seeing the partial output even when the stream
    // dies mid-event. Then yield the error event.
    const tailOnError = buffer.trim();
    if (tailOnError) {
      const parsed = parseEvent(tailOnError);
      if (parsed) {
        eventCount++;
        if (parsed.type === "done") sawDone = true;
        yield parsed;
      }
    }
    const message =
      err instanceof Error ? err.message : "Unexpected error during stream.";
    yield {
      type: "error",
      message,
      code: err instanceof Error ? "stream_error" : "unknown",
    };
    return;
  }

  // Flush any remaining buffered line (the model may have omitted the
  // trailing newline on the final event).
  const tail = buffer.trim();
  if (tail) {
    const parsed = parseEvent(tail);
    if (parsed) {
      eventCount++;
      if (parsed.type === "done") sawDone = true;
      yield parsed;
    }
  }

  // If the model produced no events OR forgot to emit `done`, emit a
  // terminal warning + done so the client UI resolves cleanly.
  if (eventCount === 0) {
    yield {
      type: "terminal",
      line: {
        tone: "warning",
        text: "no output from assistant — try again",
      },
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
 * Defensive NDJSON parser. Returns `undefined` (and logs a warning) for
 * any line that isn't valid JSON or doesn't satisfy the ShowcaseEvent
 * contract. The stream continues regardless — one bad line shouldn't
 * kill the user experience.
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

  if (!isObject(obj)) {
    console.warn(
      "[showcase/stream-patch] skipping non-object NDJSON line:",
      line.slice(0, 120),
    );
    return undefined;
  }

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
        // Default to compiled if the model forgot or sent something weird.
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

export { ShowcasePatchError as ShowcaseStreamError };
