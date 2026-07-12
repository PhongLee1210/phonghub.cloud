import { ChatMessageAction, ChatRequestBody, ChatStreamEvent } from "@/types/chat";

/**
 * POSTs to /api/chat, incrementally parses the NDJSON response, and
 * dispatches events as they arrive. Returns an AbortController the caller
 * can use to cancel mid-stream (stop button, D1).
 */
export function streamChat(
  body: ChatRequestBody,
  handlers: {
    onToken: (text: string) => void;
    onThinking?: (step: string) => void;
    onCard?: (card: Extract<ChatStreamEvent, { type: "card" }>["card"]) => void;
    onNavigate?: (href: Extract<ChatStreamEvent, { type: "navigate" }>["href"]) => void;
    onAction?: (action: ChatMessageAction) => void;
    onDone: (suggestions?: string[]) => void;
    onError: (
      code: Extract<ChatStreamEvent, { type: "error" }>["code"],
      message: string
    ) => void;
  }
): { abort: () => void } {
  const controller = new AbortController();

  (async () => {
    let response: Response;
    try {
      response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch {
      if (controller.signal.aborted) {
        handlers.onError("aborted", "Request cancelled.");
      } else {
        handlers.onError("upstream_error", "Network error — please retry.");
      }
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      handlers.onError("upstream_error", "No response stream received.");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (!line) continue;
          dispatch(JSON.parse(line) as ChatStreamEvent, handlers);
        }
      }
      if (buffer.trim()) {
        dispatch(JSON.parse(buffer.trim()) as ChatStreamEvent, handlers);
      }
    } catch {
      if (controller.signal.aborted) {
        handlers.onError("aborted", "Request cancelled.");
      } else {
        handlers.onError("upstream_error", "Connection interrupted.");
      }
    }
  })();

  return { abort: () => controller.abort() };
}

function dispatch(
  event: ChatStreamEvent,
  handlers: Parameters<typeof streamChat>[1]
) {
  switch (event.type) {
    case "thinking":
      handlers.onThinking?.(event.step);
      break;
    case "token":
      handlers.onToken(event.text);
      break;
    case "card":
      handlers.onCard?.(event.card);
      break;
    case "navigate":
      handlers.onNavigate?.(event.href);
      break;
    case "action":
      handlers.onAction?.(event.action);
      break;
    case "done":
      handlers.onDone(event.suggestions);
      break;
    case "error":
      handlers.onError(event.code, event.message);
      break;
  }
}
