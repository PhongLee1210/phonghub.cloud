"use client";

import * as React from "react";

import type { AiCommand, AiCommandId } from "@/config/showcase";
import { cn } from "@/lib/utils";

/**
 * AiCommandButton — single button in the showcase's floating AI toolbar.
 *
 * Phase 1: static styling, fires `onSelect` on click. T2.2 adds the
 * `whileTap` spring + pulsing-ring active animation. T5.5 wires it to
 * the `/api/showcase/patch` streaming endpoint.
 *
 * `forwardRef` so `AiCommandToolbar` can manage roving-tabindex focus
 * (arrow-key navigation between segments).
 */
export interface AiCommandButtonProps {
  command: AiCommand;
  active?: boolean;
  disabled?: boolean;
  onSelect?: (id: AiCommandId) => void;
  className?: string;
}

export const AiCommandButton = React.forwardRef<
  HTMLButtonElement,
  AiCommandButtonProps
>(function AiCommandButton(
  { command, active = false, disabled = false, onSelect, className },
  ref,
) {
  const Icon = command.icon;
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      aria-pressed={active}
      onClick={() => onSelect?.(command.id)}
      title={command.label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5",
        "font-medium text-xs text-muted-foreground",
        "transition-colors duration-150",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        "disabled:pointer-events-none disabled:opacity-50",
        active && "bg-muted text-foreground ring-1 ring-ring/40",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden />
      <span className="whitespace-nowrap">{command.label}</span>
    </button>
  );
});

AiCommandButton.displayName = "AiCommandButton";

export default AiCommandButton;
