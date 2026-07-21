"use client";

import * as React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { scaleIn } from "@/lib/motion";
import ResponsiveImage from "@/components/ui/responsive-image";

import { BrowserChrome } from "./browser-chrome";
import { DeviceToggle, type DeviceId } from "./device-toggle";
import { StatusChip, type StatusChipStatus } from "./status-chip";

/**
 * LivePreviewFrame — browser-style frame showing a project screenshot
 * (Phase 1 mode). The iframe mode is a stub — it returns nothing for now
 * and is wired up in a later phase (see TODO inside).
 *
 * Composition:
 *
 *   ┌──────────────────────────────────────────────┐
 *   │ 🔒 phonghub.cloud          [ 💻 📱 📋 ]  ●  │  ← BrowserChrome
 *   ├──────────────────────────────────────────────┤
 *   │                                              │
 *   │            ResponsiveImage screenshot        │  ← body (aspect 16/10)
 *   │                                              │
 *   └──────────────────────────────────────────────┘
 *
 * T2.2 wraps the chrome in `motion.div` keyed to `scaleIn` so the whole
 * frame scales+fades as one unit inside the orchestrator's cascade.
 * Variant-only — `initial`/`animate` come from `BuilderShowcase`.
 */
export type LivePreviewMode = "screenshot" | "iframe";

export interface LivePreviewFrameProps {
  /** URL shown in the chrome's address pill. */
  url?: string;
  /** Initial device selection; controlled via `device`/`onDeviceChange`. */
  defaultDevice?: DeviceId;
  /** Controlled device value. */
  device?: DeviceId;
  onDeviceChange?: (device: DeviceId) => void;
  /** Status chip state in the chrome's right slot. */
  status?: StatusChipStatus;
  /** Override the default status label. */
  statusLabel?: string;
  /** Screenshot to render when `mode === "screenshot"`. */
  screenshot?: {
    src: string;
    alt: string;
  };
  /** Stub for iframe mode — not wired up in Phase 1. */
  iframeSrc?: string;
  /** Render mode. Defaults to `"screenshot"`. */
  mode?: LivePreviewMode;
  className?: string;
}

export function LivePreviewFrame({
  url,
  defaultDevice = "desktop",
  device,
  onDeviceChange,
  status = "active",
  statusLabel,
  screenshot,
  iframeSrc,
  mode = "screenshot",
  className,
}: LivePreviewFrameProps) {
  return (
    <motion.div
      variants={scaleIn}
      className={cn("will-change-[transform,opacity]", className)}
    >
      <BrowserChrome
        url={url}
        className="bg-card-2 shadow-[var(--shadow-2)]"
        right={
          <>
            <DeviceToggle
              value={device}
              defaultValue={defaultDevice}
              onChange={onDeviceChange}
            />
            <StatusChip status={status} label={statusLabel} />
          </>
        }
      >
        <div className="relative aspect-[16/10] w-full bg-card-2">
          {mode === "screenshot" ? (
            screenshot ? (
              <ResponsiveImage
                src={screenshot.src}
                alt={screenshot.alt}
                fill
                priority={false}
                aspectRatio="auto"
                fallbackAspectRatio={16 / 10}
                containerClassName="absolute inset-0 h-full w-full"
                className="h-full w-full rounded-none border-0 object-cover"
              />
            ) : (
              <EmptyState label="No screenshot provided" />
            )
          ) : mode === "iframe" && iframeSrc ? (
            // TODO(phase-next): render a sandboxed <iframe> for live AI-generated previews.
            // For now, fall back to the empty state so the frame stays visible.
            <EmptyState label="iframe mode — coming soon" />
          ) : (
            <EmptyState label="No preview available" />
          )}
        </div>
      </BrowserChrome>
    </motion.div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-card-2 text-center"
      role="presentation"
    >
      <span className="font-mono text-xs text-muted-foreground/60">{label}</span>
    </div>
  );
}

export default LivePreviewFrame;
