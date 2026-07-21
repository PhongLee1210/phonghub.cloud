import { NextRequest } from "next/server";

import { checkRateLimit } from "@/lib/chat/rate-limit";
import {
  isNonEmptyString,
  isObject,
  isString,
} from "@/lib/guards";
import { ShowcasePatchError, streamPatch } from "@/lib/showcase/server";
import type { AiCommandId, ShowcaseSection } from "@/lib/showcase/commands";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/showcase/patch — NDJSON-streamed AI patches for the showcase
 * composition. Body shape:
 *
 *   {
 *     "section":  "skills" | "projects",
 *     "command":  "modify" | "theme" | "feature" | "layout" | "analytics" | "reset",
 *     "context":  { "subjectName": string, "tags"?: string[], "currentCode"?: string[], "hint"?: string }
 *   }
 *
 * Each event from `streamPatch` is serialised as one NDJSON line. Rate
 * limiting reuses `lib/chat/rate-limit.ts` (same dev/prod split behavior
 * as `/api/chat`). `reset` returns 400 — it is a pure client action.
 */

const VALID_SECTIONS: readonly ShowcaseSection[] = ["skills", "projects"];
const VALID_COMMANDS: readonly AiCommandId[] = [
  "modify",
  "theme",
  "feature",
  "layout",
  "analytics",
  "reset",
];

const MAX_CONTEXT_TAGS = 12;
const MAX_CURRENT_CODE_LINES = 100;
const MAX_HINT_CHARS = 500;
const MAX_SUBJECT_CHARS = 120;

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function jsonError(
  status: number,
  code: string,
  message: string,
  retryAfterSeconds?: number,
): Response {
  return new Response(JSON.stringify({ type: "error", code, message }) + "\n", {
    status,
    headers: {
      "Content-Type": "application/x-ndjson",
      ...(retryAfterSeconds !== undefined
        ? { "Retry-After": String(retryAfterSeconds) }
        : {}),
    },
  });
}

interface ParsedBody {
  section: ShowcaseSection;
  command: AiCommandId;
  context: {
    subjectName: string;
    tags?: readonly string[];
    currentCode?: readonly string[];
    hint?: string;
  };
}

function validateBody(body: unknown): ParsedBody | undefined {
  if (!isObject(body)) return undefined;

  const { section, command, context } = body as Record<string, unknown>;
  if (!isString(section) || !VALID_SECTIONS.includes(section as ShowcaseSection)) {
    return undefined;
  }
  if (!isString(command) || !VALID_COMMANDS.includes(command as AiCommandId)) {
    return undefined;
  }

  if (!isObject(context)) return undefined;
  const subjectName = (context as Record<string, unknown>).subjectName;
  if (
    !isNonEmptyString(subjectName) ||
    subjectName.length > MAX_SUBJECT_CHARS
  ) {
    return undefined;
  }

  const tags = (context as Record<string, unknown>).tags;
  if (tags !== undefined) {
    if (!Array.isArray(tags) || tags.length > MAX_CONTEXT_TAGS) return undefined;
    if (!tags.every((t) => isNonEmptyString(t) && t.length <= 60)) return undefined;
  }

  const currentCode = (context as Record<string, unknown>).currentCode;
  if (currentCode !== undefined) {
    if (
      !Array.isArray(currentCode) ||
      currentCode.length > MAX_CURRENT_CODE_LINES
    ) {
      return undefined;
    }
    if (!currentCode.every((l) => isString(l) && l.length <= 500)) {
      return undefined;
    }
  }

  const hint = (context as Record<string, unknown>).hint;
  if (hint !== undefined) {
    if (!isString(hint) || hint.length > MAX_HINT_CHARS) return undefined;
  }

  return {
    section: section as ShowcaseSection,
    command: command as AiCommandId,
    context: {
      subjectName,
      tags: tags as string[] | undefined,
      currentCode: currentCode as string[] | undefined,
      hint: hint as string | undefined,
    },
  };
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "bad_request", "Malformed JSON body.");
  }

  const parsed = validateBody(body);
  if (!parsed) {
    return jsonError(
      400,
      "bad_request",
      "Invalid request: must include { section, command, context: { subjectName } }.",
    );
  }

  if (parsed.command === "reset") {
    return jsonError(
      400,
      "client_only",
      'The "reset" command is a pure client action — no API call required.',
    );
  }

  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return jsonError(
      429,
      "rate_limited",
      "You're sending showcase requests too quickly. Try again shortly.",
      rateLimit.retryAfterSeconds ?? 30,
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        const abortController = new AbortController();
        req.signal.addEventListener("abort", () => abortController.abort());

        for await (const event of streamPatch({
          section: parsed.section,
          command: parsed.command,
          context: parsed.context,
          signal: abortController.signal,
        })) {
          enqueue(event);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unexpected route error.";
        const code =
          err instanceof ShowcasePatchError ? err.code : "route_error";
        enqueue({ type: "error", message, code });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-store, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
