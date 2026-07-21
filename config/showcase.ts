/**
 * Showcase composition config — default build-log lines and hero tagline.
 *
 * Source: Figma file `vzSKdqNFnYFrHBiI7GeqAn`, node `20:5`.
 */

export type TerminalTone = "info" | "success" | "warning" | "error";

export interface TerminalLine {
  tone: TerminalTone;
  text: string;
}

/**
 * Hero tagline above the showcase composition.
 * Figma node `20:5` — keep verbatim.
 */
export const SHOWCASE_TAGLINE = "Let's build something amazing";

/**
 * Default terminal build-log lines shown beneath the editor.
 * Figma source had the typo "Conpiled" — corrected here.
 */
export const SHOWCASE_BUILD_LOG: readonly TerminalLine[] = [
  { tone: "info", text: "Ready on http://localhost:3000" },
  { tone: "success", text: "✓ Compiled successfully in 1.2s" },
];
