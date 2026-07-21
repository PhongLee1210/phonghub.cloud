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
 * Type definitions live in `lib/showcase/commands.ts` (lifted in T5.1 so
 * the Zustand store and server streamer can share them without a config
 * import). They're re-exported below to preserve the existing import
 * surface — callers can keep using `@/config/showcase`.
 */
export type {
  AiCommand,
  AiCommandId,
  ShowcaseEvent,
  ShowcasePhase,
  ShowcaseSection,
  TerminalLine,
  TerminalTone,
} from "@/lib/showcase/commands";
import type { AiCommand, TerminalLine } from "@/lib/showcase/commands";

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
