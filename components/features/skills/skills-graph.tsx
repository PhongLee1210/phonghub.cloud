"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import {
  createElement,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { Icons } from "@/components/common/icons";
import {
  ISkill,
  SKILL_CATEGORY_LABELS,
  SkillCategoryEnum,
} from "@/config/skills";
import { useChatStore } from "@/hooks/use-chat-store";
import { getSkillIcon } from "@/lib/get-skill-icon";
import { cn } from "@/lib/utils";

const SPRING_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const;
/** One-time fade-in when a thread first appears — a solid line the whole
 * time (no stroke-dasharray tricks), just slow and eased so it reads as a
 * smooth reveal instead of an abrupt cut. */
const LINE_DRAW_TRANSITION = { duration: 0.9, ease: "easeInOut" } as const;
const LINE_GLOW_DURATION_SECONDS = 2.6;
/** Thickness pulses on its own cadence (not synced to the glow's opacity
 * pulse) so the thread reads as flowing energy rather than a uniform blink. */
const LINE_WIDTH_DURATION_SECONDS = 1.8;
const LINE_GLOW_STAGGER_SECONDS = 0.06;

const NODE_DRIFT_AMPLITUDE_PX = 6;
const NODE_DRIFT_MIN_DURATION_SECONDS = 3;
const NODE_DRIFT_DURATION_JITTER_SECONDS = 3;
const NODE_DRIFT_MAX_DELAY_SECONDS = 2;

/** Node diameter scales with a skill's rating — stronger skills read as "bigger" in the web. */
const NODE_MIN_SIZE_PX = 20;
const NODE_MAX_SIZE_PX = 40;
const SELECTED_NODE_SIZE_BONUS_PX = 8;
const MAX_SKILL_RATING = 5;

const NODE_HOVER_TRANSITION = {
  type: "spring",
  duration: 0.4,
  bounce: 0.5,
} as const;
const NODE_TAP_TRANSITION = {
  type: "spring",
  duration: 0.3,
  bounce: 0.5,
} as const;
const NODE_SELECT_TRANSITION = {
  type: "spring",
  duration: 0.5,
  bounce: 0.6,
} as const;
const NODE_DRAG_TRANSITION = {
  bounceStiffness: 500,
  bounceDamping: 14,
} as const;
const NODE_DRAG_ELASTIC = 0.5;
const NODE_STAGGER_DELAY_SECONDS = 0.02;
const NODE_STAGGER_DELAY_CAP_SECONDS = 0.4;

/** Force-layout tuning — a small, dependency-free stand-in for d3-force. */
const LAYOUT_RELAXATION_ITERATIONS = 100;
const LAYOUT_REPULSION_STRENGTH = 170;
const LAYOUT_EDGE_SPRING_STRENGTH = 0.02;
const LAYOUT_EDGE_IDEAL_LENGTH_PERCENT = 18;
const LAYOUT_CENTER_GRAVITY_STRENGTH = 0.01;
const LAYOUT_BOUNDS_PADDING_PERCENT = 12;
const LAYOUT_INITIAL_RADIUS_MIN_PERCENT = 20;
const LAYOUT_INITIAL_RADIUS_JITTER_PERCENT = 18;
const LAYOUT_INITIAL_ANGLE_JITTER_RADIANS = 0.8;
/** Dedicated collision pass after relaxation, sized to actual node
 * diameters, so nodes stop short of overlapping regardless of how the
 * spring/repulsion forces above happened to settle. */
const LAYOUT_COLLISION_ITERATIONS = 40;
const LAYOUT_COLLISION_GAP_PERCENT = 3;
/** Assumed container width (px) used to convert node diameters into the
 * layout's 0-100 percent space — the graph container isn't measured at
 * layout time, so this is a conservative mid-size estimate. */
const LAYOUT_NOMINAL_CONTAINER_PX = 420;

/** How far (px) a newly revealed node flies in from the node that spawned it. */
const NODE_SPAWN_FLIGHT_DISTANCE_PX = 36;
const NODE_SPAWN_TRANSITION = {
  type: "spring",
  duration: 0.6,
  bounce: 0.45,
} as const;

const ZOOM_MIN = 0.7;
const ZOOM_MAX = 2.4;
const ZOOM_STEP = 0.2;
const ZOOM_DEFAULT = 1;

type GraphPosition = { x: number; y: number };
type GraphEdge = readonly [string, string];

// Mount state never changes after the initial client commit, so there's
// nothing to subscribe to — this just gives useSyncExternalStore a stable
// no-op subscription while still yielding false during SSR and true once
// hydrated on the client.
function subscribeNever() {
  return () => {};
}

function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

function nodeDiameter(rating: number, isSelected: boolean): number {
  const ratio =
    Math.min(Math.max(rating, 1), MAX_SKILL_RATING) / MAX_SKILL_RATING;
  const base = NODE_MIN_SIZE_PX + ratio * (NODE_MAX_SIZE_PX - NODE_MIN_SIZE_PX);
  return isSelected ? base + SELECTED_NODE_SIZE_BONUS_PX : base;
}

/** Deterministic pseudo-random in [0, 1) — stable across server/client renders, unlike Math.random. */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  hash ^= hash << 13;
  hash ^= hash >>> 17;
  hash ^= hash << 5;
  return ((hash >>> 0) % 10_000) / 10_000;
}

/**
 * Wires every skill into one connected graph: each category forms a ring
 * (so same-category skills read as a cluster), and every category's
 * strongest skill links to the single strongest skill overall, weaving the
 * clusters into one component instead of isolated islands.
 */
function buildEdges(pool: readonly ISkill[]): GraphEdge[] {
  const byCategory = new Map<SkillCategoryEnum, ISkill[]>();
  for (const skill of pool) {
    const list = byCategory.get(skill.category);
    if (list) list.push(skill);
    else byCategory.set(skill.category, [skill]);
  }

  const seen = new Set<string>();
  const edges: GraphEdge[] = [];
  const addEdge = (a: string, b: string) => {
    if (a === b) return;
    const canonical = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seen.has(canonical)) return;
    seen.add(canonical);
    edges.push([a, b]);
  };

  // pool is rating-sorted (see SKILLS), so the first skill in each category
  // list is that category's strongest — its natural hub.
  const categoryHubs: ISkill[] = [];
  for (const list of Array.from(byCategory.values())) {
    if (list.length === 0) continue;
    categoryHubs.push(list[0]);
    for (let i = 0; i < list.length; i++) {
      addEdge(list[i].key, list[(i + 1) % list.length].key);
    }
  }

  if (categoryHubs.length > 0) {
    const globalHub = categoryHubs.reduce((best, skill) =>
      skill.rating > best.rating ? skill : best
    );
    for (const hub of categoryHubs) addEdge(globalHub.key, hub.key);
  }

  return edges;
}

/** One-shot spring relaxation: cluster by category, then repel overlaps and
 * spring edges toward their ideal length. Cheap enough to run synchronously
 * for a few dozen nodes, and memoized so it only reruns when the pool changes. */
function computeLayout(
  pool: readonly ISkill[],
  edges: readonly GraphEdge[]
): Record<string, GraphPosition> {
  const categories = Array.from(new Set(pool.map((skill) => skill.category)));
  const categoryAngle = new Map(
    categories.map((category, i) => [
      category,
      (2 * Math.PI * i) / categories.length,
    ])
  );

  const positions = new Map<string, GraphPosition>();
  for (const skill of pool) {
    const angle =
      (categoryAngle.get(skill.category) ?? 0) +
      (seededRandom(skill.key) - 0.5) * LAYOUT_INITIAL_ANGLE_JITTER_RADIANS;
    const radius =
      LAYOUT_INITIAL_RADIUS_MIN_PERCENT +
      seededRandom(`${skill.key}:r`) * LAYOUT_INITIAL_RADIUS_JITTER_PERCENT;
    positions.set(skill.key, {
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
    });
  }

  const keys = pool.map((skill) => skill.key);

  for (
    let iteration = 0;
    iteration < LAYOUT_RELAXATION_ITERATIONS;
    iteration++
  ) {
    const forces = new Map<string, GraphPosition>(
      keys.map((key) => [key, { x: 0, y: 0 }])
    );

    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const a = positions.get(keys[i])!;
        const b = positions.get(keys[j])!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 0.01) {
          dx = seededRandom(`${keys[i]}:${keys[j]}:${iteration}`) - 0.5;
          dy = seededRandom(`${keys[j]}:${keys[i]}:${iteration}`) - 0.5;
          distSq = 0.01;
        }
        const dist = Math.sqrt(distSq);
        const force = LAYOUT_REPULSION_STRENGTH / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        forces.get(keys[i])!.x += fx;
        forces.get(keys[i])!.y += fy;
        forces.get(keys[j])!.x -= fx;
        forces.get(keys[j])!.y -= fy;
      }
    }

    for (const [aKey, bKey] of edges) {
      const a = positions.get(aKey);
      const b = positions.get(bKey);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const displacement = dist - LAYOUT_EDGE_IDEAL_LENGTH_PERCENT;
      const fx = (dx / dist) * displacement * LAYOUT_EDGE_SPRING_STRENGTH;
      const fy = (dy / dist) * displacement * LAYOUT_EDGE_SPRING_STRENGTH;
      forces.get(aKey)!.x += fx;
      forces.get(aKey)!.y += fy;
      forces.get(bKey)!.x -= fx;
      forces.get(bKey)!.y -= fy;
    }

    for (const key of keys) {
      const pos = positions.get(key)!;
      const force = forces.get(key)!;
      pos.x += force.x - (pos.x - 50) * LAYOUT_CENTER_GRAVITY_STRENGTH;
      pos.y += force.y - (pos.y - 50) * LAYOUT_CENTER_GRAVITY_STRENGTH;
      pos.x = Math.min(
        100 - LAYOUT_BOUNDS_PADDING_PERCENT,
        Math.max(LAYOUT_BOUNDS_PADDING_PERCENT, pos.x)
      );
      pos.y = Math.min(
        100 - LAYOUT_BOUNDS_PADDING_PERCENT,
        Math.max(LAYOUT_BOUNDS_PADDING_PERCENT, pos.y)
      );
    }
  }

  // Collision pass: push overlapping nodes apart by their actual (rating-
  // scaled) radius instead of the generic repulsion above, which only
  // balances against edge springs and can still leave nodes touching.
  const radiusPercent = new Map<string, number>();
  for (const skill of pool) {
    const diameterPercent =
      (nodeDiameter(skill.rating, false) / LAYOUT_NOMINAL_CONTAINER_PX) * 100;
    radiusPercent.set(skill.key, diameterPercent / 2);
  }

  for (
    let iteration = 0;
    iteration < LAYOUT_COLLISION_ITERATIONS;
    iteration++
  ) {
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const aKey = keys[i];
        const bKey = keys[j];
        const a = positions.get(aKey)!;
        const b = positions.get(bKey)!;
        const minDist =
          (radiusPercent.get(aKey) ?? 0) +
          (radiusPercent.get(bKey) ?? 0) +
          LAYOUT_COLLISION_GAP_PERCENT;

        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.01) {
          dx = seededRandom(`${aKey}:${bKey}:collide:${iteration}`) - 0.5;
          dy = seededRandom(`${bKey}:${aKey}:collide:${iteration}`) - 0.5;
          dist = 0.1;
        }
        if (dist >= minDist) continue;

        const overlap = (minDist - dist) / 2;
        const ux = dx / dist;
        const uy = dy / dist;
        a.x += ux * overlap;
        a.y += uy * overlap;
        b.x -= ux * overlap;
        b.y -= uy * overlap;
      }
    }

    for (const key of keys) {
      const pos = positions.get(key)!;
      pos.x = Math.min(
        100 - LAYOUT_BOUNDS_PADDING_PERCENT,
        Math.max(LAYOUT_BOUNDS_PADDING_PERCENT, pos.x)
      );
      pos.y = Math.min(
        100 - LAYOUT_BOUNDS_PADDING_PERCENT,
        Math.max(LAYOUT_BOUNDS_PADDING_PERCENT, pos.y)
      );
    }
  }

  const result: Record<string, GraphPosition> = {};
  for (const key of keys) result[key] = positions.get(key)!;
  return result;
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

export function SkillsGraph({ skills, projectsBySkill }: SkillsGraphProps) {
  const categories = useMemo(() => {
    const seen = new Set<SkillCategoryEnum>();
    for (const skill of skills) seen.add(skill.category);
    return Array.from(seen);
  }, [skills]);

  const glowFilterId = useId();
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);

  // computeLayout's force simulation runs Math.sin/cos/sqrt across 100
  // relaxation iterations; those transcendental functions aren't guaranteed
  // bit-identical across engines/platforms, and the tiny per-call differences
  // compound over the iterations into visibly different coordinates — a
  // server/client hydration mismatch. Deferring the physics-derived render to
  // after mount sidesteps chasing float-perfect parity for a decorative graph.
  const mounted = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );

  const activeCategory = useChatStore((s) => s.graphActiveCategory);
  const centerKey = useChatStore((s) => s.graphCenterSkillKey);
  const setGraphCategory = useChatStore((s) => s.setGraphCategory);
  const setGraphCenterSkill = useChatStore((s) => s.setGraphCenterSkill);
  const reducedMotion = useReducedMotion();

  // The graph itself always spans every skill — category tabs only control
  // which hub(s) get auto-revealed below, never which nodes exist. Building
  // edges/layout from a category-filtered subset made switching tabs swap
  // out the whole graph, dropping any already-revealed node from another
  // category; keeping one full graph means tabs are purely additive.
  const pool = skills;

  const edges = useMemo(() => buildEdges(pool), [pool]);
  const layout = useMemo(() => computeLayout(pool, edges), [pool, edges]);

  const adjacency = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const [a, b] of edges) {
      map.set(a, [...(map.get(a) ?? []), b]);
      map.set(b, [...(map.get(b) ?? []), a]);
    }
    return map;
  }, [edges]);

  /** One hub per category currently in view (skills is rating-sorted, so the
   * first occurrence of each category is its strongest skill) — the entry
   * points shown before the user expands anything. "all" yields one hub per
   * category; a specific tab yields just that category's hub. Only decides
   * what gets auto-revealed — never filters what's rendered. */
  const categoryHubKeys = useMemo(() => {
    const relevant =
      activeCategory === "all"
        ? skills
        : skills.filter((skill) => skill.category === activeCategory);
    const seen = new Set<SkillCategoryEnum>();
    const hubs: string[] = [];
    for (const skill of relevant) {
      if (seen.has(skill.category)) continue;
      seen.add(skill.category);
      hubs.push(skill.key);
    }
    return hubs;
  }, [skills, activeCategory]);

  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(
    () => new Set(categoryHubKeys)
  );

  // Collapse back to just the hub nodes whenever the category filter changes
  // (adjusting state during render, per React's guidance, instead of an effect).
  // Switching tabs reveals that category's hub(s) on top of whatever the
  // user already had open — it never hides an already-revealed node, since
  // rendering already filters revealed keys down to the active pool anyway.
  const [prevCategoryHubKeys, setPrevCategoryHubKeys] =
    useState(categoryHubKeys);
  if (categoryHubKeys !== prevCategoryHubKeys) {
    setPrevCategoryHubKeys(categoryHubKeys);
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      for (const key of categoryHubKeys) next.add(key);
      return next;
    });
  }

  /** The node whose neighbors most recently spawned — newly revealed nodes
   * fly in from here instead of just fading in in place. */
  const [spawnOriginKey, setSpawnOriginKey] = useState<string | null>(null);

  const handleNodeClick = (key: string) => {
    setGraphCenterSkill(key);
    setSpawnOriginKey(key);
    setRevealedKeys((prev) => {
      const neighbors = adjacency.get(key) ?? [];
      if (prev.has(key) && neighbors.every((neighbor) => prev.has(neighbor))) {
        return prev;
      }
      const next = new Set(prev);
      next.add(key);
      for (const neighbor of neighbors) next.add(neighbor);
      return next;
    });
  };

  const visibleSkills = useMemo(
    () => pool.filter((skill) => revealedKeys.has(skill.key)),
    [pool, revealedKeys]
  );
  const visibleEdges = useMemo(
    () => edges.filter(([a, b]) => revealedKeys.has(a) && revealedKeys.has(b)),
    [edges, revealedKeys]
  );

  const centerSkill = useMemo(
    () => pool.find((skill) => skill.key === centerKey) ?? pool[0] ?? skills[0],
    [pool, centerKey, skills]
  );

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
                {/* Merges a blurred copy behind the crisp stroke so each
                    thread is one continuous glowing line, not two separate
                    overlaid strokes that can drift apart visually. */}
                <filter
                  id={glowFilterId}
                  x="-75%"
                  y="-75%"
                  width="250%"
                  height="250%"
                >
                  <feGaussianBlur
                    in="SourceGraphic"
                    stdDeviation="1.1"
                    result="blur"
                  />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <AnimatePresence>
                {mounted &&
                  visibleEdges.map(([aKey, bKey], index) => {
                    const a = layout[aKey];
                    const b = layout[bKey];
                    if (!a || !b) return null;
                    const isActive =
                      aKey === centerSkill.key || bKey === centerSkill.key;
                    // Draw from whichever endpoint was already on screen toward
                    // the one that just spawned, so the thread visibly grows
                    // out to meet the new node instead of appearing all at once.
                    const start = spawnOriginKey === bKey ? b : a;
                    const end = spawnOriginKey === bKey ? a : b;
                    const glowOpacityTransition = {
                      duration: LINE_GLOW_DURATION_SECONDS,
                      repeat: reducedMotion ? 0 : Infinity,
                      repeatType: "mirror" as const,
                      ease: "easeInOut" as const,
                      delay: (index % 10) * LINE_GLOW_STAGGER_SECONDS,
                    };
                    const widthTransition = {
                      duration: LINE_WIDTH_DURATION_SECONDS,
                      repeat: reducedMotion ? 0 : Infinity,
                      repeatType: "mirror" as const,
                      ease: "easeInOut" as const,
                      delay: (index % 10) * LINE_GLOW_STAGGER_SECONDS * 0.5,
                    };
                    return (
                      <motion.line
                        key={`${aKey}-${bKey}`}
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        className="stroke-primary"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        filter={`url(#${glowFilterId})`}
                        initial={{ opacity: 0 }}
                        animate={{
                          strokeWidth: reducedMotion
                            ? isActive
                              ? 0.8
                              : 0.45
                            : isActive
                              ? [0.45, 1, 0.45]
                              : [0.25, 0.65, 0.25],
                          opacity: reducedMotion
                            ? isActive
                              ? 0.65
                              : 0.35
                            : isActive
                              ? [0.5, 0.9, 0.5]
                              : [0.22, 0.45, 0.22],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          opacity: glowOpacityTransition,
                          strokeWidth: widthTransition,
                          default: reducedMotion
                            ? { duration: 0 }
                            : LINE_DRAW_TRANSITION,
                        }}
                      />
                    );
                  })}
              </AnimatePresence>
            </svg>

            {/* Skill nodes — starts with just one hub per category; clicking
                a node reveals its directly connected neighbors, so the graph
                only grows as far as the user explores it. */}
            <AnimatePresence>
              {mounted &&
                visibleSkills.map((skill, index) => {
                  const pos = layout[skill.key];
                  if (!pos) return null;
                  const isSelected = skill.key === centerSkill.key;
                  const size = nodeDiameter(skill.rating, isSelected);
                  const enterDelay = Math.min(
                    index * NODE_STAGGER_DELAY_SECONDS,
                    NODE_STAGGER_DELAY_CAP_SECONDS
                  );
                  // Gentle per-node drift so the web feels alive instead of
                  // pinned in place — amplitude/timing seeded per skill so
                  // nodes don't all bob in lockstep.
                  const driftX =
                    (seededRandom(`${skill.key}:dx`) - 0.5) *
                    2 *
                    NODE_DRIFT_AMPLITUDE_PX;
                  const driftY =
                    (seededRandom(`${skill.key}:dy`) - 0.5) *
                    2 *
                    NODE_DRIFT_AMPLITUDE_PX;
                  const driftDuration =
                    NODE_DRIFT_MIN_DURATION_SECONDS +
                    seededRandom(`${skill.key}:dur`) *
                      NODE_DRIFT_DURATION_JITTER_SECONDS;
                  const driftDelay =
                    seededRandom(`${skill.key}:delay`) *
                    NODE_DRIFT_MAX_DELAY_SECONDS;
                  const driftTransition = {
                    duration: driftDuration,
                    repeat: Infinity,
                    repeatType: "mirror" as const,
                    ease: "easeInOut" as const,
                  };

                  // Fly in from whichever node spawned this one, instead of
                  // fading in in place — direction only, fixed distance, so it
                  // doesn't depend on measuring the container's real pixel size.
                  const spawnOrigin =
                    spawnOriginKey && spawnOriginKey !== skill.key
                      ? layout[spawnOriginKey]
                      : undefined;
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
                      key={skill.key}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    >
                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.4,
                          x: spawnOffsetX,
                          y: spawnOffsetY,
                        }}
                        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.4 }}
                        transition={
                          reducedMotion
                            ? { duration: 0 }
                            : { ...NODE_SPAWN_TRANSITION, delay: enterDelay }
                        }
                      >
                        <motion.div
                          animate={{
                            scale: isSelected ? 1.12 : 1,
                            x: reducedMotion ? 0 : [0, driftX, 0],
                            y: reducedMotion ? 0 : [0, driftY, 0],
                          }}
                          transition={
                            reducedMotion
                              ? { duration: 0 }
                              : {
                                  default: NODE_SELECT_TRANSITION,
                                  x: { ...driftTransition, delay: driftDelay },
                                  y: {
                                    ...driftTransition,
                                    delay: driftDelay + 0.3,
                                  },
                                }
                          }
                          className="flex flex-col items-center gap-1"
                        >
                          <motion.button
                            type="button"
                            data-agent-id={`skill:${skill.key}`}
                            onClick={() => handleNodeClick(skill.key)}
                            drag={!reducedMotion}
                            dragSnapToOrigin
                            dragElastic={NODE_DRAG_ELASTIC}
                            dragTransition={NODE_DRAG_TRANSITION}
                            whileHover={
                              reducedMotion
                                ? undefined
                                : {
                                    scale: 1.15,
                                    transition: NODE_HOVER_TRANSITION,
                                  }
                            }
                            whileTap={
                              reducedMotion
                                ? undefined
                                : {
                                    scale: 0.92,
                                    transition: NODE_TAP_TRANSITION,
                                  }
                            }
                            whileDrag={
                              reducedMotion ? undefined : { scale: 1.2 }
                            }
                            style={{ width: size, height: size }}
                            className={cn(
                              "flex items-center justify-center rounded-full bg-background transition-shadow duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              isSelected
                                ? "border-2 border-primary shadow-[0_0_18px_4px_hsl(var(--primary)/0.4)]"
                                : "shadow-[0_0_0_1px_hsl(var(--border))] hover:shadow-[0_0_0_1.5px_hsl(var(--primary)/0.6)]"
                            )}
                          >
                            <SkillIcon
                              name={skill.icon}
                              size={Math.round(size * 0.4)}
                              className="text-primary"
                            />
                          </motion.button>
                          <span
                            className={cn(
                              "max-w-[4rem] truncate text-center text-[9px] font-medium",
                              isSelected
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            {skill.name}
                          </span>
                        </motion.div>
                      </motion.div>
                    </div>
                  );
                })}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Detail panel */}
      <aside className="overflow-hidden rounded-xl border bg-background p-4 sm:p-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={centerSkill.key}
            initial={reducedMotion ? undefined : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background shadow-[0_0_18px_4px_hsl(var(--primary)/0.4)]">
                <SkillIcon
                  name={centerSkill.icon}
                  size={26}
                  className="text-primary"
                />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold text-foreground">
                  {centerSkill.name}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {SKILL_CATEGORY_LABELS[centerSkill.category]}
                  </span>
                  <span className="text-xs font-medium text-primary">
                    {proficiencyLabel(centerSkill.rating)}
                  </span>
                </div>
              </div>
            </div>

            <div
              className="mt-3 flex items-center gap-0.5"
              aria-label={`Rating ${centerSkill.rating} out of ${MAX_SKILL_RATING}`}
            >
              {Array.from({ length: MAX_SKILL_RATING }).map((_, i) =>
                i < centerSkill.rating ? (
                  <Icons.star key={i} size={13} className="text-primary" />
                ) : (
                  <Icons.starOutline
                    key={i}
                    size={13}
                    className="text-muted-foreground/40"
                  />
                )
              )}
            </div>

            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Proficiency</span>
                <span className="font-medium text-foreground">
                  {proficiency}%
                </span>
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

            <p className="mt-4 text-pretty text-sm text-muted-foreground">
              {centerSkill.description}
            </p>

            {relatedProjects.length > 0 && (
              <div className="mt-6">
                <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <Icons.work size={13} className="text-primary" />
                  Recent Projects
                </h4>
                <ol className="relative space-y-3">
                  {/* Glowing spine — echoes the graph edges' pulsing-thread
                      style so the timeline reads as part of the same system. */}
                  <div
                    aria-hidden
                    className="absolute left-[7px] top-2 bottom-2 w-px bg-primary/40"
                  />
                  {relatedProjects.map((project, index) => (
                    <li key={project.id} className="relative flex gap-3">
                      <span className="relative z-10 mt-1.5 flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full border border-primary/50 bg-background">
                        <motion.span
                          className="h-1 w-1 rounded-full bg-primary shadow-[0_0_3px_1px_hsl(var(--primary)/0.5)]"
                          animate={
                            reducedMotion
                              ? undefined
                              : { opacity: [0.5, 1, 0.5] }
                          }
                          transition={
                            reducedMotion
                              ? undefined
                              : {
                                  duration: LINE_GLOW_DURATION_SECONDS,
                                  repeat: Infinity,
                                  repeatType: "mirror",
                                  ease: "easeInOut",
                                  delay: index * LINE_GLOW_STAGGER_SECONDS,
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
      </aside>
    </div>
  );
}

export default SkillsGraph;
