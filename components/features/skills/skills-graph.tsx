"use client";

import Link from "next/link";
import { createElement, useId, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Icons } from "@/components/common/icons";
import {
  ISkill,
  SKILL_CATEGORY_LABELS,
  SkillCategoryEnum,
} from "@/config/skills";
import { useChatStore } from "@/hooks/use-chat-store";
import { getSkillIcon } from "@/lib/get-skill-icon";
import { cn } from "@/lib/utils";

const SPRING_TRANSITION = { type: "spring", stiffness: 300, damping: 30 } as const;
const LINE_DRAW_TRANSITION = { duration: 0.6, ease: "easeOut" } as const;
const LINE_GLOW_DURATION_SECONDS = 2.6;
const LINE_GLOW_STAGGER_SECONDS = 0.12;

const SATELLITE_LIMIT = 6;
const GRAPH_RADIUS_PERCENT = 40;

/** Node diameter scales with a skill's rating — stronger skills read as "bigger" in the web. */
const NODE_MIN_SIZE_PX = 44;
const NODE_MAX_SIZE_PX = 88;
const CENTER_NODE_SIZE_BONUS_PX = 14;
const MAX_SKILL_RATING = 5;

const NODE_HOVER_TRANSITION = {
  type: "spring",
  duration: 0.45,
  bounce: 0.45,
} as const;
const NODE_TAP_TRANSITION = { type: "spring", duration: 0.3, bounce: 0.4 } as const;

const ZOOM_MIN = 0.7;
const ZOOM_MAX = 1.8;
const ZOOM_STEP = 0.2;
const ZOOM_DEFAULT = 1;

function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

function nodeDiameter(rating: number, isCenter: boolean): number {
  const ratio = Math.min(Math.max(rating, 1), MAX_SKILL_RATING) / MAX_SKILL_RATING;
  const base = NODE_MIN_SIZE_PX + ratio * (NODE_MAX_SIZE_PX - NODE_MIN_SIZE_PX);
  return isCenter ? base + CENTER_NODE_SIZE_BONUS_PX : base;
}

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

  const glowFilterId = useId();
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);

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
        <div className="relative aspect-square w-full max-w-xl mx-auto overflow-hidden rounded-lg sm:aspect-[4/3]">
          {/* Zoom controls */}
          <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-full border bg-background/90 p-1 shadow-sm backdrop-blur-sm">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
            >
              <Icons.zoomOut size={15} />
            </button>
            <button
              type="button"
              aria-label="Reset zoom"
              onClick={() => setZoom(ZOOM_DEFAULT)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
            >
              <Icons.reset size={14} />
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96]"
            >
              <Icons.zoomIn size={15} />
            </button>
          </div>

          {/* Scales the whole web on zoom; wheel-zoom only engages on a pinch
              gesture (ctrlKey) so normal page scroll passes through untouched. */}
          <motion.div
            className="absolute inset-0"
            style={{ transformOrigin: "50% 50%" }}
            animate={{ scale: zoom }}
            transition={reducedMotion ? { duration: 0 } : SPRING_TRANSITION}
            onWheel={(event) => {
              if (!event.ctrlKey) return;
              event.preventDefault();
              setZoom((z) => clampZoom(z - event.deltaY * 0.01));
            }}
          >
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden
            >
              <defs>
                {/* Soft bloom behind each thread — the crisp thread on top keeps it readable. */}
                <filter
                  id={glowFilterId}
                  x="-75%"
                  y="-75%"
                  width="250%"
                  height="250%"
                >
                  <feGaussianBlur stdDeviation="1.1" />
                </filter>
              </defs>
              <AnimatePresence>
                {satellites.map((skill, index) => {
                  const { x, y } = satellitePosition(index, satellites.length);
                  const glowTransition = {
                    pathLength: LINE_DRAW_TRANSITION,
                    opacity: {
                      duration: LINE_GLOW_DURATION_SECONDS,
                      repeat: reducedMotion ? 0 : Infinity,
                      repeatType: "mirror" as const,
                      ease: "easeInOut" as const,
                      delay: index * LINE_GLOW_STAGGER_SECONDS,
                    },
                  };
                  return (
                    <motion.g key={skill.key}>
                      {/* Blurred glow thread */}
                      <motion.line
                        x1={50}
                        y1={50}
                        x2={x}
                        y2={y}
                        className="stroke-primary"
                        strokeWidth={1.4}
                        vectorEffect="non-scaling-stroke"
                        filter={`url(#${glowFilterId})`}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                          pathLength: 1,
                          opacity: reducedMotion ? 0.35 : [0.2, 0.55, 0.2],
                        }}
                        exit={{ opacity: 0 }}
                        transition={glowTransition}
                      />
                      {/* Crisp thread on top of the glow */}
                      <motion.line
                        x1={50}
                        y1={50}
                        x2={x}
                        y2={y}
                        className="stroke-primary"
                        strokeWidth={0.4}
                        vectorEffect="non-scaling-stroke"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                          pathLength: 1,
                          opacity: reducedMotion ? 0.45 : [0.3, 0.7, 0.3],
                        }}
                        exit={{ opacity: 0 }}
                        transition={glowTransition}
                      />
                    </motion.g>
                  );
                })}
              </AnimatePresence>
            </svg>

            {/*
              Position anchor (left/top + 50% offset) lives on a plain div —
              the inner motion element owns `transform` for its layout/hover
              animation, so the two can't fight over the same CSS property.
            */}
            {(() => {
              const centerSize = nodeDiameter(centerSkill.rating, true);
              return (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <motion.div
                    layoutId={`skill-node-${centerSkill.key}`}
                    layout
                    transition={reducedMotion ? { duration: 0 } : SPRING_TRANSITION}
                    data-agent-id={`skill:${centerSkill.key}`}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <motion.div
                      animate={
                        reducedMotion
                          ? undefined
                          : {
                              boxShadow: [
                                "0 0 0px 0px hsl(var(--primary) / 0.25)",
                                "0 0 22px 6px hsl(var(--primary) / 0.45)",
                                "0 0 0px 0px hsl(var(--primary) / 0.25)",
                              ],
                            }
                      }
                      transition={{
                        duration: LINE_GLOW_DURATION_SECONDS,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ width: centerSize, height: centerSize }}
                      className="flex items-center justify-center rounded-full border-2 border-primary bg-background"
                    >
                      <SkillIcon
                        name={centerSkill.icon}
                        size={Math.round(centerSize * 0.4)}
                        className="text-primary"
                      />
                    </motion.div>
                    <span className="max-w-[5.5rem] truncate text-center text-xs font-semibold text-foreground">
                      {centerSkill.name}
                    </span>
                  </motion.div>
                </div>
              );
            })()}

            {/* Satellite nodes */}
            {satellites.map((skill, index) => {
              const { x, y } = satellitePosition(index, satellites.length);
              const size = nodeDiameter(skill.rating, false);
              return (
                <div
                  key={skill.key}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <motion.div
                    layoutId={`skill-node-${skill.key}`}
                    layout
                    transition={reducedMotion ? { duration: 0 } : SPRING_TRANSITION}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <motion.button
                      type="button"
                      data-agent-id={`skill:${skill.key}`}
                      onClick={() => setGraphCenterSkill(skill.key)}
                      whileHover={
                        reducedMotion
                          ? undefined
                          : { scale: 1.12, transition: NODE_HOVER_TRANSITION }
                      }
                      whileTap={
                        reducedMotion
                          ? undefined
                          : { scale: 0.95, transition: NODE_TAP_TRANSITION }
                      }
                      style={{ width: size, height: size }}
                      className="flex items-center justify-center rounded-full bg-background shadow-[0_0_0_1px_hsl(var(--border))] transition-shadow duration-150 ease-out hover:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <SkillIcon
                        name={skill.icon}
                        size={Math.round(size * 0.4)}
                        className="text-primary"
                      />
                    </motion.button>
                    <span className="max-w-[4.5rem] truncate text-center text-[10px] font-medium text-muted-foreground">
                      {skill.name}
                    </span>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
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
