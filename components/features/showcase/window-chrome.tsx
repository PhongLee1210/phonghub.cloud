import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * WindowChrome — macOS-style window frame header used by the showcase
 * composition (editor panel, browser preview, terminal).
 *
 * Renders three decorative traffic-light dots on the left (aria-hidden),
 * a centred/left title, and an optional right slot for chips, toggles, etc.
 * Children render below the header inside the same framed surface.
 *
 * Styling is token-only and transparent to the surrounding theme — works
 * unchanged inside `<div className="showcase">` (navy) or any other theme.
 */
export interface WindowChromeProps {
  title: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function WindowChrome({
  title,
  right,
  children,
  className,
}: WindowChromeProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card text-card-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-card-2 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="flex flex-shrink-0 items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-destructive" />
            <span className="h-3 w-3 rounded-full bg-warning" />
            <span className="h-3 w-3 rounded-full bg-success" />
          </span>
          <span
            className="truncate font-mono text-xs text-muted-foreground"
            title={title}
          >
            {title}
          </span>
        </div>
        {right ? (
          <div className="flex flex-shrink-0 items-center gap-2">{right}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export default WindowChrome;
