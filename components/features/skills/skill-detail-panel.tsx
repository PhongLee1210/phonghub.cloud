"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { createElement } from "react";

import { Icons } from "@/components/common/icons";
import { ISkill, SKILL_CATEGORY_LABELS } from "@/config/skills";
import { getSkillIcon } from "@/lib/get-skill-icon";

import { MAX_SKILL_RATING } from "./skills-graph-layout";

export interface RelatedProject {
  id: string;
  title: string;
  date: string;
}

const GLOW_DURATION = 2.6;
const GLOW_STAGGER = 0.06;

function proficiencyLabel(rating: number): string {
  if (rating >= 5) return "Expert";
  if (rating >= 4) return "Advanced";
  if (rating >= 3) return "Intermediate";
  return "Familiar";
}

interface SkillDetailPanelProps {
  skill: ISkill;
  relatedProjects: RelatedProject[];
  reducedMotion: boolean | null;
}

export function SkillDetailPanel({
  skill,
  relatedProjects,
  reducedMotion,
}: SkillDetailPanelProps) {
  const proficiency = Math.round((skill.rating / 5) * 100);

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={skill.key}
        initial={reducedMotion ? undefined : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background shadow-[0_0_18px_4px_hsl(var(--primary)/0.4)]">
            {createElement(getSkillIcon(skill.icon), { size: 26, className: "text-primary" })}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-foreground">{skill.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {SKILL_CATEGORY_LABELS[skill.category]}
              </span>
              <span className="text-xs font-medium text-primary">
                {proficiencyLabel(skill.rating)}
              </span>
            </div>
          </div>
        </div>

        <div
          className="mt-3 flex items-center gap-0.5"
          aria-label={`Rating ${skill.rating} out of ${MAX_SKILL_RATING}`}
        >
          {Array.from({ length: MAX_SKILL_RATING }).map((_, i) =>
            i < skill.rating ? (
              <Icons.star key={i} size={13} className="text-primary" />
            ) : (
              <Icons.starOutline key={i} size={13} className="text-muted-foreground/40" />
            )
          )}
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Proficiency</span>
            <span className="font-medium text-foreground">{proficiency}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary shadow-[0_0_8px_1px_hsl(var(--primary)/0.6)]"
              initial={reducedMotion ? undefined : { width: 0 }}
              animate={{ width: `${proficiency}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>

        <p className="mt-4 text-pretty text-sm text-muted-foreground">{skill.description}</p>

        {relatedProjects.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Icons.work size={13} className="text-primary" />
              Recent Projects
            </h4>
            <ol className="relative space-y-3">
              <div
                aria-hidden
                className="absolute left-[7px] top-2 bottom-2 w-px bg-primary/40"
              />
              {relatedProjects.map((project, index) => (
                <li key={project.id} className="relative flex gap-3">
                  <span className="relative z-10 mt-1.5 flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full border border-primary/50 bg-background">
                    <motion.span
                      className="h-1 w-1 rounded-full bg-primary shadow-[0_0_3px_1px_hsl(var(--primary)/0.5)]"
                      initial={{ opacity: 0.5 }}
                      animate={reducedMotion ? { opacity: 0.5 } : { opacity: [0.5, 1, 0.5] }}
                      transition={
                        reducedMotion
                          ? undefined
                          : {
                              duration: GLOW_DURATION,
                              repeat: Infinity,
                              repeatType: "mirror",
                              ease: "easeInOut",
                              delay: index * GLOW_STAGGER,
                            }
                      }
                    />
                  </span>
                  <Link
                    href={`/projects/${project.id}`}
                    prefetch={false}
                    className="group flex min-w-0 flex-1 items-center justify-between rounded-md px-2 py-1 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="truncate text-foreground group-hover:text-primary">
                      {project.title}
                    </span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {project.date}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
