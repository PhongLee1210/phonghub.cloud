"use client";

import type { ProjectInterface } from "@/config/projects";

import { ProjectsShowcase } from "./projects-showcase";

interface ScrollTheaterWrapperProps {
  project: ProjectInterface;
}

/**
 * Renders the showcase directly instead of scrubbing its opacity/scale
 * against scroll position — the sticky 200vh scroll-theater left the
 * preview panel stuck invisible on several viewports.
 */
export function ScrollTheaterWrapper({ project }: ScrollTheaterWrapperProps) {
  return <ProjectsShowcase project={project} />;
}
