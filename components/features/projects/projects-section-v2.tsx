import * as React from "react";
import Link from "next/link";

import { Icons } from "@/components/common/icons";
import { Button } from "@/components/ui/button";
import { featuredProjects } from "@/config/projects";
import type { ProjectInterface } from "@/config/projects";

import { ProjectCardV2 } from "./project-card-v2";
import { ScrollTheaterWrapper } from "./scroll-theater-wrapper";

export interface ProjectsSectionV2Props {
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
      {hero ? <ScrollTheaterWrapper project={hero} /> : null}

      {gridProjects.length > 0 ? (
        <div id="projects-grid" className="mx-auto w-full max-w-7xl px-4 pt-8 md:px-6">
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
