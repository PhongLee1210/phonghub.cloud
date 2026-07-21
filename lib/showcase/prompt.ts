import "server-only";

import type { AiCommandId, ShowcaseSection } from "./commands";

/**
 * buildShowcasePrompt — server-only system prompt builder for the
 * showcase AI commands. Parameterised by section + command so the same
 * template serves both Skills and Projects sections and all six
 * `AiCommandId` actions.
 *
 * Output contract: the model MUST emit only NDJSON events matching the
 * `ShowcaseEvent` union in `lib/showcase/commands.ts`. No prose, no
 * markdown fences. The streamer (`lib/showcase/server/stream-patch.ts`,
 * T5.3) parses line-by-line and silently skips malformed events with a
 * warning log.
 *
 * Server-only: importing this file from client code fails the build.
 */

export interface ShowcasePromptContext {
  /** Display name of the focused entity (skill name or project name). */
  subjectName: string;
  /** Tech-stack chips, language hints, or categories relevant to the subject. */
  tags?: readonly string[];
  /** Pre-existing code in the editor — the model can extend or modify it. */
  currentCode?: readonly string[];
  /** Optional free-text hint from the caller (e.g. user's intent). */
  hint?: string;
}

export interface BuildShowcasePromptArgs {
  section: ShowcaseSection;
  command: AiCommandId;
  context: ShowcasePromptContext;
}

const COMMAND_INTENTS: Record<AiCommandId, string> = {
  modify:
    "Modify the existing code in a small, intentional way and stream the new version as code-delta events.",
  theme:
    "Suggest a theme/styling change. Emit a terminal line describing the change, then any code delta required.",
  feature:
    "Add a small feature to the existing code. Stream the added code as code-delta events.",
  layout:
    "Propose a layout adjustment. Emit a terminal line describing the change; emit code deltas only if the code actually changes.",
  analytics:
    "Surface an analytics-style insight about the subject. Emit one or two terminal lines with the insight. Do not modify code.",
  reset:
    "Reset state. Emit a single terminal line confirming the reset. Do not modify code.",
};

function tagsFrag(tags?: readonly string[]): string {
  return tags && tags.length > 0
    ? ` (related: ${tags.slice(0, 6).join(", ")})`
    : "";
}

function buildSectionFraming(
  section: ShowcaseSection,
  ctx: ShowcasePromptContext,
): string {
  const subject = ctx.subjectName;
  const frag = tagsFrag(ctx.tags);
  if (section === "skills") {
    return `You are operating on the SKILLS section of a personal portfolio. The user is looking at a code snippet that illustrates the "${subject}" skill${frag}. Your job is to make the snippet more illustrative or to surface related skills via terminal output.`;
  }
  return `You are operating on the PROJECTS section of a personal portfolio. The user is looking at the code behind "${subject}"${frag}. Your job is to extend or annotate the code in a way that highlights real engineering decisions.`;
}

const OUTPUT_CONTRACT = `Output contract — read carefully:
- Emit ONLY newline-delimited JSON (NDJSON). One JSON object per line.
- Each line MUST be one of:
  {"type":"code-delta","text":"..."}            // append characters to the editor
  {"type":"terminal","line":{"tone":"info|success|warning|error","text":"..."}}  // append a terminal line
  {"type":"done","phase":"compiled|preview|idle"}  // stream complete
  {"type":"error","message":"...","code":"..."}   // surfaced as a toast (rare)
- Do NOT wrap output in markdown fences.
- Do NOT emit prose outside of JSON.
- Keep each code-delta small (a few characters or one short line) so the typewriter feels live.
- Total response: 6–20 events. Aim for concise, illustrative output.`;

export function buildShowcasePrompt({
  section,
  command,
  context,
}: BuildShowcasePromptArgs): string {
  const framing = buildSectionFraming(section, context);
  const commandIntent = COMMAND_INTENTS[command];

  const codeHint =
    context.currentCode && context.currentCode.length > 0
      ? `\n\nCurrent editor contents (lines, in order):\n${context.currentCode
          .slice(0, 40)
          .map((l, i) => `${i + 1}: ${l}`)
          .join("\n")}${context.currentCode.length > 40 ? `\n…(${context.currentCode.length - 40} more lines truncated)` : ""}`
      : "";

  const userHint = context.hint
    ? `\n\nCaller hint: ${context.hint}`
    : "";

  return [
    "You are the AI assistant inside a portfolio website's interactive showcase widget.",
    framing,
    "",
    `Command: ${command} — ${commandIntent}`,
    codeHint,
    userHint,
    "",
    OUTPUT_CONTRACT,
  ]
    .filter((part) => part.length > 0)
    .join("\n");
}

/**
 * Build the user-role message that pairs with `buildShowcasePrompt`'s
 * system message. Kept minimal — the system prompt carries the contract;
 * the user message carries the action.
 */
export function buildShowcaseUserMessage({
  command,
  context,
}: BuildShowcasePromptArgs): string {
  const tags = context.tags?.length ? ` (tags: ${context.tags.join(", ")})` : "";
  const hint = context.hint ? ` — ${context.hint}` : "";
  return `Run the "${command}" command on ${context.subjectName}${tags}${hint}.`;
}

export default buildShowcasePrompt;
