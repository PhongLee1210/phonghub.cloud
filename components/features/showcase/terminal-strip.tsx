import * as React from "react";

import type { TerminalLine, TerminalTone } from "@/config/showcase";
import { cn } from "@/lib/utils";

/**
 * TerminalStrip — compact build-log strip rendered below the showcase's
 * code editor. Renders one line per entry with a tone-coloured glyph:
 *
 *   info    ›  Ready on http://localhost:3000
 *   success ✓  Compiled successfully in 1.2s
 *   warning !  ...
 *   error   ✗  ...
 *
 * Default content is sourced from `SHOWCASE_BUILD_LOG` (config/showcase.ts)
 * by the parent `BuilderShowcase`; this primitive just renders whatever
 * lines it's given.
 */
export interface TerminalStripProps {
  lines: readonly TerminalLine[];
  /**
   * Number of lines currently visible. Used by T2.1's reveal; defaults
   * to `lines.length` (all visible).
   */
  visibleCount?: number;
  /**
   * When `true`, renders an `aria-live="polite"` region so streamed
   * terminal output (T5.6) is announced. Off by default to keep the
   * initial SSR paint quiet for screen-reader users.
   */
  live?: boolean;
  className?: string;
}

const GLYPH: Record<TerminalTone, string> = {
  info: "›",
  success: "✓",
  warning: "!",
  error: "✗",
};

const TONE_TEXT: Record<TerminalTone, string> = {
  info: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  error: "text-destructive",
};

export const TerminalStrip = React.forwardRef<
  HTMLDivElement,
  TerminalStripProps
>(function TerminalStrip(
  { lines, visibleCount, live = false, className },
  ref,
) {
  const count = Math.max(
    0,
    Math.min(visibleCount ?? lines.length, lines.length),
  );
  const visible = lines.slice(0, count);

  return (
    <div
      ref={ref}
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
      aria-atomic={live ? false : undefined}
      className={cn(
        "rounded-xl bg-popover px-4 py-3 font-mono text-xs text-popover-foreground shadow-[var(--shadow-1)]",
        className,
      )}
    >
      {visible.length === 0 ? (
        <div className="text-muted-foreground/50">&nbsp;</div>
      ) : (
        <ul className="space-y-1">
          {visible.map((line, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span
                aria-hidden
                className={cn(
                  "w-3 flex-shrink-0 select-none text-center",
                  TONE_TEXT[line.tone],
                )}
              >
                {GLYPH[line.tone]}
              </span>
              <span
                className={cn(
                  "flex-1 whitespace-pre-wrap break-words",
                  TONE_TEXT[line.tone],
                )}
              >
                {line.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

TerminalStrip.displayName = "TerminalStrip";

export default TerminalStrip;
