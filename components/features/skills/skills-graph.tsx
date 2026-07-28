"use client";

import Link from "next/link";
import { createElement, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import {
  ISkill,
  SKILL_CATEGORY_LABELS,
  SkillCategoryEnum,
} from "@/config/skills";
import { useChatStore } from "@/hooks/use-chat-store";
import { getSkillIcon } from "@/lib/get-skill-icon";
import { cn } from "@/lib/utils";

const SPRING_TRANSITION = { type: "spring", stiffness: 300, damping: 30 } as const;

const SATELLITE_LIMIT = 6;
const GRAPH_RADIUS_PERCENT = 40;

function SkillIcon({
  name,
  size,
  className,
}: {
  name: string;
  size: number;
  className?: string;
}) {
  return createElement(getSkillIcon(name), { size, className });
}

export interface RelatedProject {
  id: string;
  title: string;
  date: string;
}

export interface SkillsGraphProps {
  skills: ISkill[];
  projectsBySkill: Record<string, RelatedProject[]>;
}

function proficiencyLabel(rating: number): string {
  if (rating >= 5) return "Expert";
  if (rating >= 4) return "Advanced";
  if (rating >= 3) return "Intermediate";
  return "Familiar";
}

function satellitePosition(index: number, count: number) {
  const angle = (2 * Math.PI * index) / count - Math.PI / 2;
  const x = 50 + GRAPH_RADIUS_PERCENT * Math.cos(angle);
  const y = 50 + GRAPH_RADIUS_PERCENT * Math.sin(angle);
  return { x, y };
}

export function SkillsGraph({ skills, projectsBySkill }: SkillsGraphProps) {
  const categories = useMemo(() => {
    const seen = new Set<SkillCategoryEnum>();
    for (const skill of skills) seen.add(skill.category);
    return Array.from(seen);
  }, [skills]);

  const activeCategory = useChatStore((s) => s.graphActiveCategory);
  const centerKey = useChatStore((s) => s.graphCenterSkillKey);
  const setGraphCategory = useChatStore((s) => s.setGraphCategory);
  const setGraphCenterSkill = useChatStore((s) => s.setGraphCenterSkill);
  const reducedMotion = useReducedMotion();

  const pool = useMemo(
    () =>
      activeCategory === "all"
        ? skills
        : skills.filter((skill) => skill.category === activeCategory),
    [skills, activeCategory]
  );

  const centerSkill = useMemo(
    () => pool.find((skill) => skill.key === centerKey) ?? pool[0] ?? skills[0],
    [pool, centerKey, skills]
  );

  const satellites = useMemo(() => {
    if (!centerSkill) return [];
    const sameCategory = skills.filter(
      (skill) =>
        skill.category === centerSkill.category && skill.key !== centerSkill.key
    );
    return sameCategory.slice(0, SATELLITE_LIMIT);
  }, [skills, centerSkill]);

  const relatedProjects = centerSkill
    ? (projectsBySkill[centerSkill.name] ?? []).slice(0, 3)
    : [];

  if (!centerSkill) return null;

  const proficiency = Math.round((centerSkill.rating / 5) * 100);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4 rounded-xl border bg-background p-4 sm:p-6">
        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setGraphCategory("all")}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setGraphCategory(category)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {SKILL_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        {/* Constellation graph */}
        <div className="relative aspect-square w-full max-w-xl mx-auto sm:aspect-[4/3]">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            {satellites.map((skill, index) => {
              const { x, y } = satellitePosition(index, satellites.length);
              return (
                <line
                  key={skill.key}
                  x1={50}
                  y1={50}
                  x2={x}
                  y2={y}
                  className="stroke-primary/30"
                  strokeWidth={0.4}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {/*
            Position anchor (left/top + 50% offset) lives on a plain div —
            the inner motion element owns `transform` for its layout/hover
            animation, so the two can't fight over the same CSS property.
          */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              layoutId={`skill-node-${centerSkill.key}`}
              layout
              transition={reducedMotion ? { duration: 0 } : SPRING_TRANSITION}
              data-agent-id={`skill:${centerSkill.key}`}
              className="flex flex-col items-center gap-1"
            >
              <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full border-2 border-primary bg-background shadow-lg shadow-primary/20 sm:h-24 sm:w-24">
                <SkillIcon name={centerSkill.icon} size={28} className="text-primary" />
                <span className="px-1 text-center text-[11px] font-semibold leading-tight text-foreground">
                  {centerSkill.name}
                </span>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wide text-primary">
                {proficiencyLabel(centerSkill.rating)}
              </span>
            </motion.div>
          </div>

          {/* Satellite nodes */}
          {satellites.map((skill, index) => {
            const { x, y } = satellitePosition(index, satellites.length);
            return (
              <div
                key={skill.key}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <motion.button
                  layoutId={`skill-node-${skill.key}`}
                  layout
                  transition={reducedMotion ? { duration: 0 } : SPRING_TRANSITION}
                  type="button"
                  data-agent-id={`skill:${skill.key}`}
                  onClick={() => setGraphCenterSkill(skill.key)}
                  whileHover={reducedMotion ? undefined : { scale: 1.05 }}
                  className="flex flex-col items-center gap-1 rounded-full border bg-background p-2 shadow-sm transition-colors hover:border-primary hover:shadow-md hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-3"
                >
                  <SkillIcon name={skill.icon} size={20} className="text-primary" />
                  <span className="max-w-[4.5rem] truncate text-[10px] font-medium text-foreground">
                    {skill.name}
                  </span>
                </motion.button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <aside className="rounded-xl border bg-background p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <SkillIcon
            name={centerSkill.icon}
            size={32}
            className="shrink-0 text-primary"
          />
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {centerSkill.name}
            </h3>
            <span className="text-xs font-medium text-primary">
              {proficiencyLabel(centerSkill.rating)}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Proficiency</span>
            <span>{proficiency}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${proficiency}%` }}
            />
          </div>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {centerSkill.description}
        </p>

        {relatedProjects.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-2 text-sm font-semibold text-foreground">
              Recent Projects
            </h4>
            <ul className="space-y-2">
              {relatedProjects.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    prefetch={false}
                    className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="truncate text-foreground">
                      {project.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {project.date}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  );
}

export default SkillsGraph;
