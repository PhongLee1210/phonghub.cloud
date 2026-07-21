"use client";

import { Laptop, Smartphone, Tablet, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * DeviceToggle — 3-segment segmented control for the browser chrome.
 *
 * Used by `LivePreviewFrame` to switch the preview between
 * desktop / tablet / mobile viewport sizes (visual hint only in Phase 1;
 * the screenshot itself doesn't resize until iframe mode lands post-v1).
 *
 * Keyboard: standard radiogroup pattern — Tab enters the group onto the
 * checked control, arrow keys move between segments, Tab leaves the group.
 */
export type DeviceId = "desktop" | "tablet" | "mobile";

export interface DeviceToggleProps {
  value?: DeviceId;
  defaultValue?: DeviceId;
  onChange?: (device: DeviceId) => void;
  className?: string;
}

interface SegmentDef {
  id: DeviceId;
  icon: LucideIcon;
  label: string;
}

const SEGMENTS: readonly SegmentDef[] = [
  { id: "desktop", icon: Laptop, label: "Desktop" },
  { id: "tablet", icon: Tablet, label: "Tablet" },
  { id: "mobile", icon: Smartphone, label: "Mobile" },
];

export function DeviceToggle({
  value,
  defaultValue = "desktop",
  onChange,
  className,
}: DeviceToggleProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<DeviceId>(defaultValue);
  const current = isControlled ? value : internalValue;

  const handleSelect = (next: DeviceId) => {
    if (!isControlled) setInternalValue(next);
    onChange?.(next);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = SEGMENTS.findIndex((s) => s.id === current);
    if (idx === -1) return;
    let nextIdx: number | null = null;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIdx = (idx + 1) % SEGMENTS.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIdx = (idx - 1 + SEGMENTS.length) % SEGMENTS.length;
        break;
      default:
        return;
    }
    event.preventDefault();
    const target = SEGMENTS[nextIdx];
    if (target) handleSelect(target.id);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Preview device"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-card-2 p-0.5",
        className,
      )}
    >
      {SEGMENTS.map((segment) => {
        const Icon = segment.icon;
        const checked = segment.id === current;
        return (
          <button
            key={segment.id}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={segment.label}
            tabIndex={checked ? 0 : -1}
            onClick={() => handleSelect(segment.id)}
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-[5px] text-muted-foreground transition-colors",
              "hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card-2",
              checked && "bg-accent text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

export default DeviceToggle;
