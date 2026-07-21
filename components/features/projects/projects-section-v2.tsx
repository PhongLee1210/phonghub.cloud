import * as React from "react";
import Link from "next/link";

import { Icons } from "@/components/common/icons";
import { Button } from "@/components/ui/button";
import { featuredProjects } from "@/config/projects";
import type { ProjectInterface } from "@/config/projects";

import { ProjectCardV2 } from "./project-card-v2";
import { ProjectsShowcase } from "./projects-showcase";

/**
 * ProjectsSectionV2 — Phase 4 cutover replacement for the home page's
 * `<AnimatedSection id="projects">`. Composition:
 *
 *   1. Hero composition via `<ProjectsShowcase>` (featured project #1 =
 *      HiliosAI per `featuredProjects[0]`).
 *   2. Grid of `<ProjectCardV2>` for the remaining featured projects
 *      (project #2 and #3 — the hero is shown in the showcase above).
 *   3. "View All → /projects" link.
 *
 * Server component — `<ProjectsShowcase>` (client) owns all motion via the
 * `BuilderShowcase` orchestrator. The grid section wraps in `motion` via
 * `BuilderShowcase`'s cascade only when inside it; the grid below uses
 * plain CSS (no motion) — T6.2 can add scroll-driven reveals if desired.
 *
 * Standalone `/projects` route is unchanged — still uses the legacy
 * `<ProjectCard>` / `<ProjectWorkspace>`.
 */
export interface ProjectsSectionV2Props {
  /**
   * Featured projects slice. Defaults to `featuredProjects` (3 entries).
   * The first entry is the hero; the rest populate the grid.
   */
  projects?: readonly ProjectInterface[];
  className?: string;
}

export function ProjectsSectionV2({
  projects = featuredProjects,
  className,
}: ProjectsSectionV2Props) {
  const [hero, ...rest] = projects;
  const gridProjects = rest.length > 0 ? rest : [];

  return (
    <section
      id="projects"
      className={["py-16 md:py-24", className ?? ""].join(" ")}
    >
      {hero ? <ProjectsShowcase project={hero} /> : null}

      {gridProjects.length > 0 ? (
        <div className="mx-auto w-full max-w-7xl px-4 pt-8 md:px-6">
          <header className="mb-6 mt-2">
            <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
              More featured projects
            </h3>
            <p className="text-sm text-muted-foreground">
              {gridProjects.length} more of what I&apos;ve been building.
            </p>
          </header>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gridProjects.map((project) => (
              <ProjectCardV2 key={project.id} project={project} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-7xl px-4 pt-8 md:px-6">
        <Link href="/projects" prefetch={false}>
          <Button variant="outline" className="rounded-xl">
            <Icons.chevronDown className="mr-2 h-4 w-4" aria-hidden />
            <span>View All</span>
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default ProjectsSectionV2;
