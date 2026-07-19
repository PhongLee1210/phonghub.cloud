import * as React from "react";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * BrowserChrome — window frame header styled like a browser address bar.
 *
 * Differs from `WindowChrome` (macOS editor frame) — no traffic-light
 * dots; instead a centred URL pill with a lock icon. The right slot is
 * designed for `<DeviceToggle>` + `<StatusChip>`.
 *
 * Children render below the chrome inside the same `rounded-xl border`
 * surface — typically a `<ResponsiveImage>` screenshot in T1.5's
 * `LivePreviewFrame`.
 */
export interface BrowserChromeProps {
  /** URL shown in the address pill. Truncated with ellipsis on overflow. */
  url?: string;
  /** Right slot — usually `<DeviceToggle>` + `<StatusChip>`. */
  right?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function BrowserChrome({
  url,
  right,
  children,
  className,
}: BrowserChromeProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/60 bg-card text-card-foreground",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-card-2 px-3 py-2">
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border/60 bg-background/60 px-2 py-1",
            "mx-2 min-h-[26px]",
          )}
        >
          <Lock
            aria-hidden
            className="h-3 w-3 flex-shrink-0 text-muted-foreground"
          />
          <span
            className="truncate font-mono text-[11px] text-muted-foreground"
            title={url}
          >
            {url ?? "about:blank"}
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

export default BrowserChrome;
