"use client";

import * as React from "react";
import { motion } from "framer-motion";

import type { TerminalLine, TerminalTone } from "@/config/showcase";
import { fadeUpStagger, staggerContainer } from "@/lib/motion";
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
 * Default content is sourced from `SHOWCASE_BUILD_LOG` by the parent
 * `BuilderShowcase`; this primitive just renders whatever lines it's
 * given. T2.2 wraps each line in `motion.li` keyed to `fadeUpStagger`
 * so the parent cascade reveals them one-by-one.
 */
export interface TerminalStripProps {
  lines: readonly TerminalLine[];
  visibleCount?: number;
  live?: boolean;
  appendedLines?: readonly TerminalLine[];
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

function TerminalRow({ line }: { line: TerminalLine }) {
  return (
    <motion.li
      variants={fadeUpStagger}
      className="flex items-start gap-2 will-change-[transform,opacity]"
    >
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
    </motion.li>
  );
}

export const TerminalStrip = React.forwardRef<
  HTMLDivElement,
  TerminalStripProps
>(function TerminalStrip(
  { lines, visibleCount, live = false, appendedLines, className },
  ref,
) {
  const count = Math.max(
    0,
    Math.min(visibleCount ?? lines.length, lines.length),
  );
  const visible = lines.slice(0, count);
  const hasAppended = appendedLines && appendedLines.length > 0;

  return (
    <motion.div
      ref={ref}
      variants={fadeUpStagger}
      role={live ? "status" : undefined}
      aria-live={live ? "polite" : undefined}
      aria-atomic={live ? false : undefined}
      className={cn(
        "rounded-xl bg-popover px-4 py-3 font-mono text-xs text-popover-foreground shadow-[var(--shadow-1)]",
        className,
      )}
    >
      {visible.length === 0 && !hasAppended ? (
        <div className="text-muted-foreground/50">&nbsp;</div>
      ) : (
        <motion.ul variants={staggerContainer(0.08)} className="space-y-1">
          {visible.map((line, idx) => (
            <TerminalRow key={idx} line={line} />
          ))}
          {hasAppended ? (
            <li aria-hidden className="my-1 border-t border-border/40" />
          ) : null}
          {hasAppended
            ? appendedLines.map((line, idx) => (
                <TerminalRow key={`appended-${idx}`} line={line} />
              ))
            : null}
        </motion.ul>
      )}
    </motion.div>
  );
});

TerminalStrip.displayName = "TerminalStrip";

export default TerminalStrip;
