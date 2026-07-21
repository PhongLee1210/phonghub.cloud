import * as React from "react";

import type { ProjectInterface } from "@/config/projects";

import { LivePreviewFrame, type LivePreviewMode } from "../showcase/live-preview-frame";
import type { DeviceId } from "../showcase/device-toggle";
import type { StatusChipStatus } from "../showcase/status-chip";

/**
 * ProjectPreviewBody — projects-section binding for the `BuilderShowcase`'s
 * `preview` slot. Thin wrapper around `<LivePreviewFrame>` that resolves
 * screenshot/url/status from a single `ProjectInterface`.
 *
 * Reuses `LivePreviewFrame` (T1.5) rather than re-implementing the browser
 * chrome — it was built for exactly this use case. The browser frame look
 * matches the Figma node `20:5` ("Meeting Booker / Active" — we surface
 * `organization.name` in the URL pill and `status="active"` for the chip).
 *
 * Server component — `LivePreviewFrame` is `"use client"`, so the client
 * boundary is automatic at that child.
 *
 * Screenshot resolution order:
 *   1. `project.companyLogoImg` (hero image)
 *   2. `project.pagesInfoArr[0]?.imgArr[0]` (first page screenshot)
 *   3. none → `LivePreviewFrame` renders its empty state
 */
export interface ProjectPreviewBodyProps {
  project: ProjectInterface;
  /** Override the device toggle (controlled). */
  device?: DeviceId;
  /** Override the default device ("desktop"). */
  defaultDevice?: DeviceId;
  onDeviceChange?: (device: DeviceId) => void;
  /** Override the chip status. Defaults to "active" per Figma. */
  status?: StatusChipStatus;
  statusLabel?: string;
  /** Defaults to "screenshot". */
  mode?: LivePreviewMode;
  className?: string;
}

export function ProjectPreviewBody({
  project,
  device,
  defaultDevice,
  onDeviceChange,
  status = "active",
  statusLabel,
  mode = "screenshot",
  className,
}: ProjectPreviewBodyProps) {
  const url = project.websiteLink;
  const screenshotSrc =
    (typeof project.companyLogoImg === "string" && project.companyLogoImg) ||
    project.pagesInfoArr[0]?.imgArr[0] ||
    undefined;

  return (
    <LivePreviewFrame
      url={url}
      device={device}
      defaultDevice={defaultDevice}
      onDeviceChange={onDeviceChange}
      status={status}
      statusLabel={statusLabel ?? (url ? undefined : "Draft")}
      mode={mode}
      screenshot={
        screenshotSrc
          ? { src: screenshotSrc, alt: `${project.organization.name} preview` }
          : undefined
      }
      className={className}
    />
  );
}

export default ProjectPreviewBody;
