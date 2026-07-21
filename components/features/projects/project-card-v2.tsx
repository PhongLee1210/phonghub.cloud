"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { Icons } from "@/components/common/icons";
import { Badge } from "@/components/ui/badge";
import { SPRING_SHOWCASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { ProjectInterface } from "@/config/projects";

/**
 * ProjectCardV2 — redesigned project card for the home page's projects
 * section. Surfaces org name, dates, tech stack chips, and short
 * description on a `Card`-style surface with hover lift + glow.
 *
 * Differences from `components/projects/project-card.tsx` (still used by
 * `/projects` route and `WorkspaceIntro`):
 *   - Whole card is a `<Link>` to `/projects/[id]` (no separate "Read more" button).
 *   - Uses `motion.div` + `whileHover={{ y: -6 }}` for a tactile lift.
 *   - Surfaces the tech stack via `<Badge variant="outline">` (the existing
 *     `ProjectCard` only shows the category chips).
 *   - Uses showcase tokens (`bg-card`, `text-card-foreground`) so it sits
 *     comfortably inside the navy `.showcase` section as well as on the
 *     regular page surface.
 *
 * Memoised with `React.memo` — parent should pass stable callbacks if it
 * tracks click/selection state. Hover lift is suppressed automatically
 * under reduced-motion via the parent `<MotionConfig reducedMotion="user">`
 * in `BuilderShowcase`.
 */
export interface ProjectCardV2Props {
  project: ProjectInterface;
  /** Cap the number of tech-stack badges shown (default 6). */
  techStackLimit?: number;
  className?: string;
  /** Override the index page link. Defaults to `/projects/[id]`. */
  href?: string;
}

function formatRange(start: Date, end: Date | null): string {
  const startStr = start.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  if (!end) {
    return `${startStr} – Present`;
  }
  const endStr = end.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  return `${startStr} – ${endStr}`;
}

function ProjectCardV2Impl({
  project,
  techStackLimit = 6,
  className,
  href,
}: ProjectCardV2Props) {
  const dateRange = formatRange(project.startDate, project.endDate);
  const tech = project.techStack.slice(0, techStackLimit);
  const techOverflow = project.techStack.length - tech.length;
  const linkHref = href ?? `/projects/${project.id}`;

  return (
    <motion.article
      data-agent-id={`project:${project.id}`}
      whileHover={{ y: -6 }}
      transition={SPRING_SHOWCASE}
      className={cn(
        "group relative h-full overflow-hidden rounded-xl border border-border/60 bg-card text-card-foreground shadow-[var(--shadow-1)]",
        "transition-shadow duration-300 hover:shadow-[var(--shadow-2)]",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card",
        className,
      )}
    >
      <Link
        href={linkHref}
        prefetch={false}
        className="flex h-full flex-col gap-4 p-6 outline-none"
        aria-label={`${project.organization.name} — open project details`}
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                aria-hidden
                className={
                  project.organization.type === "personal"
                    ? "text-primary"
                    : "text-warning"
                }
              >
                {project.organization.type === "personal" ? (
                  <Icons.userFill className="h-3.5 w-3.5" />
                ) : (
                  <Icons.work className="h-3.5 w-3.5" />
                )}
              </span>
              <span className="font-mono uppercase tracking-wide">
                {dateRange}
              </span>
            </div>
            <h3 className="font-heading text-xl font-semibold leading-tight tracking-tight text-foreground">
              {project.organization.name}
            </h3>
          </div>
          <Icons.chevronRight
            className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden
          />
        </header>

        <p className="line-clamp-3 text-sm text-muted-foreground">
          {project.shortDescription}
        </p>

        <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
          {tech.map((t) => (
            <Badge key={t} variant="outline" className="font-mono text-[10px]">
              {t}
            </Badge>
          ))}
          {techOverflow > 0 ? (
            <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
              +{techOverflow}
            </Badge>
          ) : null}
        </div>
      </Link>
    </motion.article>
  );
}

export const ProjectCardV2 = React.memo(ProjectCardV2Impl);
ProjectCardV2.displayName = "ProjectCardV2";

export default ProjectCardV2;
