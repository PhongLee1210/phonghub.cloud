"use client";

import { motion } from "framer-motion";
import { createElement } from "react";

import { ISkill } from "@/config/skills";
import { getSkillIcon } from "@/lib/get-skill-icon";
import { cn } from "@/lib/utils";

import {
  GraphPosition,
  NODE_DRIFT_AMPLITUDE_PX,
  NODE_DRIFT_DURATION_JITTER_SECONDS,
  NODE_DRIFT_MAX_DELAY_SECONDS,
  NODE_DRIFT_MIN_DURATION_SECONDS,
  NODE_SPAWN_FLIGHT_DISTANCE_PX,
  nodeDiameter,
  seededRandom,
} from "./skills-graph-layout";

const NODE_HOVER_TRANSITION = { type: "spring", duration: 0.4, bounce: 0.5 } as const;
const NODE_TAP_TRANSITION = { type: "spring", duration: 0.3, bounce: 0.5 } as const;
const NODE_SELECT_TRANSITION = { type: "spring", duration: 0.5, bounce: 0.6 } as const;
const NODE_DRAG_TRANSITION = { bounceStiffness: 500, bounceDamping: 14 } as const;
const NODE_DRAG_ELASTIC = 0.5;
const NODE_STAGGER_DELAY_SECONDS = 0.02;
const NODE_STAGGER_DELAY_CAP_SECONDS = 0.4;
const NODE_SPAWN_TRANSITION = { type: "spring", duration: 0.6, bounce: 0.45 } as const;

interface SkillNodeProps {
  skill: ISkill;
  pos: GraphPosition;
  isSelected: boolean;
  spawnOriginKey: string | null;
  layout: Record<string, GraphPosition>;
  index: number;
  reducedMotion: boolean | null;
  onClick: (key: string) => void;
}

export function SkillNode({
  skill,
  pos,
  isSelected,
  spawnOriginKey,
  layout,
  index,
  reducedMotion,
  onClick,
}: SkillNodeProps) {
  const size = nodeDiameter(skill.rating, isSelected);
  const enterDelay = Math.min(
    index * NODE_STAGGER_DELAY_SECONDS,
    NODE_STAGGER_DELAY_CAP_SECONDS
  );

  const driftX = (seededRandom(`${skill.key}:dx`) - 0.5) * 2 * NODE_DRIFT_AMPLITUDE_PX;
  const driftY = (seededRandom(`${skill.key}:dy`) - 0.5) * 2 * NODE_DRIFT_AMPLITUDE_PX;
  const driftX2 = (seededRandom(`${skill.key}:dx2`) - 0.5) * NODE_DRIFT_AMPLITUDE_PX;
  const driftY2 = (seededRandom(`${skill.key}:dy2`) - 0.5) * NODE_DRIFT_AMPLITUDE_PX;
  const driftDuration =
    NODE_DRIFT_MIN_DURATION_SECONDS +
    seededRandom(`${skill.key}:dur`) * NODE_DRIFT_DURATION_JITTER_SECONDS;
  const driftDelay = seededRandom(`${skill.key}:delay`) * NODE_DRIFT_MAX_DELAY_SECONDS;
  const driftTransition = {
    duration: driftDuration,
    repeat: Infinity,
    repeatType: "mirror" as const,
    ease: "easeInOut" as const,
  };

  const spawnOrigin =
    spawnOriginKey && spawnOriginKey !== skill.key ? layout[spawnOriginKey] : undefined;
  let spawnOffsetX = 0;
  let spawnOffsetY = 0;
  if (spawnOrigin) {
    const dx = spawnOrigin.x - pos.x;
    const dy = spawnOrigin.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    spawnOffsetX = (dx / dist) * NODE_SPAWN_FLIGHT_DISTANCE_PX;
    spawnOffsetY = (dy / dist) * NODE_SPAWN_FLIGHT_DISTANCE_PX;
  }

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.4, x: spawnOffsetX, y: spawnOffsetY }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.4 }}
        transition={
          reducedMotion ? { duration: 0 } : { ...NODE_SPAWN_TRANSITION, delay: enterDelay }
        }
      >
        <motion.div
          animate={{
            scale: isSelected ? 1.12 : 1,
            x: reducedMotion ? 0 : [0, driftX, driftX2, 0],
            y: reducedMotion ? 0 : [0, driftY, driftY2, 0],
          }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : {
                  scale: NODE_SELECT_TRANSITION,
                  x: { ...driftTransition, delay: driftDelay },
                  y: { ...driftTransition, delay: driftDelay + 0.3 },
                }
          }
          className="relative"
        >
          <motion.button
            type="button"
            data-agent-id={`skill:${skill.key}`}
            onClick={() => onClick(skill.key)}
            drag={!reducedMotion}
            dragSnapToOrigin
            dragElastic={NODE_DRAG_ELASTIC}
            dragTransition={NODE_DRAG_TRANSITION}
            whileHover={
              reducedMotion ? undefined : { scale: 1.15, transition: NODE_HOVER_TRANSITION }
            }
            whileTap={
              reducedMotion ? undefined : { scale: 0.92, transition: NODE_TAP_TRANSITION }
            }
            whileDrag={reducedMotion ? undefined : { scale: 1.2 }}
            style={{ width: size, height: size }}
            className={cn(
              "flex items-center justify-center rounded-full bg-background transition-shadow duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-2 border-primary shadow-[0_0_18px_4px_hsl(var(--primary)/0.4)]"
                : "shadow-[0_0_0_1px_hsl(var(--border))] hover:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.6)]"
            )}
          >
            {createElement(getSkillIcon(skill.icon), {
              size: Math.round(size * 0.4),
              className: "text-primary",
            })}
          </motion.button>
          <span
            className={cn(
              "absolute top-full left-1/2 -translate-x-1/2 mt-1 max-w-[4rem] truncate text-center text-[9px] font-medium",
              isSelected ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            {skill.name}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
