import type { LucideIcon } from "lucide-react";

/**
 * Showcase command + wire types. Shared between the client Zustand store
 * (`lib/showcase/store.ts`) and the server streamer
 * (`lib/showcase/server/stream-patch.ts`) so neither has to depend on a
 * `config/*` module that pulls in icon JSX. `config/showcase.ts`
 * re-exports everything below to preserve its existing import surface.
 */

export type AiCommandId =
  | "modify"
  | "theme"
  | "feature"
  | "layout"
  | "analytics"
  | "reset";

export interface AiCommand {
  id: AiCommandId;
  label: string;
  icon: LucideIcon;
}

export type TerminalTone = "info" | "success" | "warning" | "error";

export interface TerminalLine {
  tone: TerminalTone;
  text: string;
}

export type ShowcaseSection = "skills" | "projects";

/**
 * Showcase lifecycle phases. Drives editor `compiled` state and the
 * status chip on the preview frame.
 *
 *   idle      → nothing happening (initial / after reset)
 *   coding    → stream is appending code-deltas to the editor
 *   compiled  → editor's typewriter finished, "✓ compiled" badge visible
 *   preview   → preview body reacting to AI output (highlight, swap, etc.)
 */
export type ShowcasePhase = "idle" | "coding" | "compiled" | "preview";

/**
 * Single NDJSON event emitted by `/api/showcase/patch` and parsed by
 * `lib/showcase/server/stream-patch.ts`.
 *
 *   code-delta   → append characters to the editor (typewriter effect)
 *   terminal     → append a line to the terminal strip
 *   done         → stream complete; flip phase to "compiled"
 *   error        → server-side error surfaced to the client
 */
export type ShowcaseEvent =
  | { type: "code-delta"; text: string }
  | { type: "terminal"; line: TerminalLine }
  | { type: "done"; phase: Exclude<ShowcasePhase, "coding"> }
  | { type: "error"; message: string; code?: string };
