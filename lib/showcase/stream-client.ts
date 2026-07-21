import type { ShowcaseEvent } from "./commands";

/**
 * POSTs to `/api/showcase/patch`, incrementally parses the NDJSON
 * response, and dispatches events as they arrive. Returns an
 * AbortController the caller can use to cancel mid-stream.
 *
 * Mirrors the `lib/chat/client.ts` pattern: same NDJSON framing, same
 * `AbortController` surface, same defensive error normalisation.
 */
export interface ShowcaseStreamHandlers {
  onCodeDelta?: (text: string) => void;
  onTerminal?: (
    line: Extract<ShowcaseEvent, { type: "terminal" }>["line"],
  ) => void;
  onDone?: (
    phase: Extract<ShowcaseEvent, { type: "done" }>["phase"],
  ) => void;
  onError?: (message: string, code?: string) => void;
}

export interface ShowcaseStreamBody {
  section: "skills" | "projects";
  command: string;
  context: {
    subjectName: string;
    tags?: string[];
    currentCode?: string[];
    hint?: string;
  };
}

export function streamShowcasePatch(
  body: ShowcaseStreamBody,
  handlers: ShowcaseStreamHandlers,
): { abort: () => void } {
  const controller = new AbortController();

  (async () => {
    let response: Response;
    try {
      response = await fetch("/api/showcase/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      if (controller.signal.aborted) {
        handlers.onError?.("aborted", "Request cancelled.");
      } else {
        handlers.onError?.("upstream_error", "Network error — please retry.");
      }
      return;
    }

    if (!response.ok) {
      // 4xx/5xx with an NDJSON error event in the body — read the body
      // and surface the message.
      const text = await response.text();
      let message = `Request failed (HTTP ${response.status}).`;
      let code: string | undefined = `http_${response.status}`;
      const firstLine = text.split("\n")[0];
      try {
        const parsed = JSON.parse(firstLine);
        if (parsed && typeof parsed.message === "string") {
          message = parsed.message;
        }
        if (parsed && typeof parsed.code === "string") {
          code = parsed.code;
        }
      } catch {
        // Fall through with defaults.
      }
      handlers.onError?.(message, code);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      handlers.onError?.(
        "upstream_error",
        "No response stream received.",
      );
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nlIdx).trim();
          buffer = buffer.slice(nlIdx + 1);
          if (!line) continue;
          try {
            dispatch(JSON.parse(line) as ShowcaseEvent, handlers);
          } catch {
            // Skip malformed line — server should already defend, but be
            // defensive here too so a single bad line doesn't kill the UI.
          }
        }
      }
      const tail = buffer.trim();
      if (tail) {
        try {
          dispatch(JSON.parse(tail) as ShowcaseEvent, handlers);
        } catch {
          // ignore.
        }
      }
    } catch {
      if (controller.signal.aborted) {
        handlers.onError?.("aborted", "Request cancelled.");
      } else {
        handlers.onError?.("upstream_error", "Connection interrupted.");
      }
    }
  })();

  return { abort: () => controller.abort() };
}

function dispatch(
  event: ShowcaseEvent,
  handlers: ShowcaseStreamHandlers,
): void {
  switch (event.type) {
    case "code-delta":
      handlers.onCodeDelta?.(event.text);
      break;
    case "terminal":
      handlers.onTerminal?.(event.line);
      break;
    case "done":
      handlers.onDone?.(event.phase);
      break;
    case "error":
      handlers.onError?.(event.message, event.code);
      break;
  }
}
