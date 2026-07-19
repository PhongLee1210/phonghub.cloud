import { cn } from "@/lib/utils";

/**
 * StatusChip — small pill showing a colored dot + label. Used in the
 * browser chrome's right slot to indicate the live preview's state.
 *
 * Active → green dot + "Active" (matches Figma node `20:5`)
 * Idle   → muted dot + "Idle"
 * Loading→ amber dot + "Loading…" (Phase 2 adds the spin animation)
 */
export type StatusChipStatus = "active" | "idle" | "loading";

export interface StatusChipProps {
  status: StatusChipStatus;
  label?: string;
  className?: string;
}

const DEFAULT_LABEL: Record<StatusChipStatus, string> = {
  active: "Active",
  idle: "Idle",
  loading: "Loading…",
};

const DOT_CLASS: Record<StatusChipStatus, string> = {
  active: "bg-success",
  idle: "bg-muted-foreground/60",
  loading: "bg-warning",
};

const TEXT_CLASS: Record<StatusChipStatus, string> = {
  active: "text-success",
  idle: "text-muted-foreground",
  loading: "text-warning",
};

export function StatusChip({ status, label, className }: StatusChipProps) {
  const text = label ?? DEFAULT_LABEL[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] font-medium",
        TEXT_CLASS[status],
        className,
      )}
      role="status"
      aria-label={text}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", DOT_CLASS[status])} />
      <span>{text}</span>
    </span>
  );
}

export default StatusChip;
