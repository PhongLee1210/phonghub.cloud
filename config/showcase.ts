import {
  BarChart3,
  LayoutPanelLeft,
  type LucideIcon,
  Palette,
  Plus,
  RotateCcw,
  Wand2,
} from "lucide-react";

/**
 * Showcase composition config — single source of truth for AI command
 * labels, default build-log lines, and hero tagline.
 *
 * Source: Figma file `vzSKdqNFnYFrHBiI7GeqAn`, node `20:5`.
 *
 * NOTE: Type definitions live inline here for now to keep T0.4
 * dependency-free. T5.1 will lift them into `lib/showcase/commands.ts`
 * and re-export from here so callers keep a single import surface.
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
 * Hero tagline above the showcase composition.
 * Figma node `20:5` — keep verbatim.
 */
export const SHOWCASE_TAGLINE = "Let's build something amazing";

/**
 * Six AI command buttons rendered in the floating toolbar.
 * Order and labels are Figma-verbatim.
 */
export const SHOWCASE_COMMANDS: readonly AiCommand[] = [
  { id: "modify", label: "Modify & See Changes", icon: Wand2 },
  { id: "theme", label: "Change Theme", icon: Palette },
  { id: "feature", label: "Add Feature", icon: Plus },
  { id: "layout", label: "Adjust Layout", icon: LayoutPanelLeft },
  { id: "analytics", label: "Show Analytics", icon: BarChart3 },
  { id: "reset", label: "Reset", icon: RotateCcw },
];

/**
 * Default terminal build-log lines shown beneath the editor.
 * Figma source had the typo "Conpiled" — corrected here.
 */
export const SHOWCASE_BUILD_LOG: readonly TerminalLine[] = [
  { tone: "info", text: "Ready on http://localhost:3000" },
  { tone: "success", text: "✓ Compiled successfully in 1.2s" },
];
