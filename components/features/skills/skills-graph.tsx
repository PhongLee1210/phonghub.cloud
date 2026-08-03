"use client";

import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useId, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { ISkill, SKILL_CATEGORY_LABELS, SkillCategoryEnum } from "@/config/skills";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";

import { RelatedProject, SkillDetailPanel } from "./skill-detail-panel";
import { SkillNode } from "./skill-node";
import {
  NODE_DRIFT_AMPLITUDE_SVG,
  NODE_DRIFT_DURATION_JITTER_SECONDS,
  NODE_DRIFT_MAX_DELAY_SECONDS,
  NODE_DRIFT_MIN_DURATION_SECONDS,
  buildEdges,
  computeLayout,
  seededRandom,
} from "./skills-graph-layout";

const LINE_DRAW_TRANSITION = { duration: 0.9, ease: "easeInOut" } as const;
const LINE_GLOW_DURATION = 2.6;
const LINE_WIDTH_DURATION = 1.8;
const LINE_GLOW_STAGGER = 0.06;


const TAB_CATEGORIES = new Set<SkillCategoryEnum>([
  SkillCategoryEnum.LANGUAGES,
  SkillCategoryEnum.FRONTEND,
  SkillCategoryEnum.BACKEND,
  SkillCategoryEnum.DATABASES,
  SkillCategoryEnum.AI_LLM,
  SkillCategoryEnum.DEVELOPER_TOOLS,
]);

// Physics-derived positions use transcendental math (sin/cos/sqrt) that isn't
// bit-identical across JS engines — tiny differences compound over 100 iterations
// into visible coordinate drift, causing SSR/client hydration mismatches.
// Deferring to post-mount sidesteps the issue without needing float parity.
function subscribeNever() {
  return () => {};
}

export interface SkillsGraphProps {
  skills: ISkill[];
  projectsBySkill: Record<string, RelatedProject[]>;
}

export function SkillsGraph({ skills, projectsBySkill }: SkillsGraphProps) {
  const categories = useMemo(() => {
    const seen = new Set<SkillCategoryEnum>();
    for (const skill of skills) seen.add(skill.category);
    return Array.from(seen);
  }, [skills]);

  const glowFilterId = useId();
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);

  const activeCategory = useChatStore((s) => s.graphActiveCategory);
  const centerKey = useChatStore((s) => s.graphCenterSkillKey);
  const setGraphCategory = useChatStore((s) => s.setGraphCategory);
  const setGraphCenterSkill = useChatStore((s) => s.setGraphCenterSkill);
  const reducedMotion = useReducedMotion();

  const edges = useMemo(() => buildEdges(skills), [skills]);
  const layout = useMemo(() => computeLayout(skills, edges), [skills, edges]);

  const adjacency = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const [a, b] of edges) {
      map.set(a, [...(map.get(a) ?? []), b]);
      map.set(b, [...(map.get(b) ?? []), a]);
    }
    return map;
  }, [edges]);

  const categoryHubKeys = useMemo(() => {
    const relevant =
      activeCategory === "all"
        ? skills
        : skills.filter((s) => s.category === activeCategory);
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

  // Adjusting state during render (React's recommended pattern) to avoid a
  // stale closure or double-render from an effect.
  const [prevCategoryHubKeys, setPrevCategoryHubKeys] = useState(categoryHubKeys);
  if (categoryHubKeys !== prevCategoryHubKeys) {
    setPrevCategoryHubKeys(categoryHubKeys);
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      for (const key of categoryHubKeys) next.add(key);
      return next;
    });
  }

  const [spawnOriginKey, setSpawnOriginKey] = useState<string | null>(null);

  const handleNodeClick = (key: string) => {
    setGraphCenterSkill(key);
    setSpawnOriginKey(key);
    setRevealedKeys((prev) => {
      const neighbors = adjacency.get(key) ?? [];
      if (prev.has(key) && neighbors.every((n) => prev.has(n))) return prev;
      const next = new Set(prev);
      next.add(key);
      for (const neighbor of neighbors) next.add(neighbor);
      return next;
    });
  };

  const visibleSkills = useMemo(
    () => skills.filter((s) => revealedKeys.has(s.key)),
    [skills, revealedKeys]
  );
  const visibleEdges = useMemo(
    () => edges.filter(([a, b]) => revealedKeys.has(a) && revealedKeys.has(b)),
    [edges, revealedKeys]
  );

  const centerSkill = useMemo(
    () => skills.find((s) => s.key === centerKey) ?? skills[0],
    [skills, centerKey]
  );

  const graphContainerRef = useRef<HTMLDivElement>(null);
  const graphInView = useInView(graphContainerRef, { once: false, amount: 0.2 });

  const { scrollYProgress: graphScrollProgress } = useScroll({
    target: graphContainerRef,
    offset: ["start end", "end start"],
  });

  const labelsOpacity = useTransform(graphScrollProgress, [0, 0.4], [0, 1]);
  const edgePathLength = useTransform(graphScrollProgress, [0.1, 0.5], [0, 1]);
  const [exploreVisible, setExploreVisible] = useState(false);
  useMotionValueEvent(graphScrollProgress, "change", (v) => {
    setExploreVisible(v > 0.6 && graphInView);
  });

  if (!centerSkill) return null;

  const relatedProjects = (projectsBySkill[centerSkill.name] ?? []).slice(0, 3);

  return (
    <div ref={graphContainerRef} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4 rounded-xl border bg-background p-4 sm:p-6">
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
          {categories.filter((c) => TAB_CATEGORIES.has(c)).map((category) => (
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

        <div className="relative aspect-square w-full max-w-xl mx-auto overflow-hidden rounded-lg sm:aspect-[4/3]">
          <div className="absolute inset-0">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
              aria-hidden
            >
              <defs>
                <filter id={glowFilterId} x="-75%" y="-75%" width="250%" height="250%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="1.1" result="blur" />
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
                    const isActive = aKey === centerSkill.key || bKey === centerSkill.key;

                    // Drift params mirroring SkillNode — same seeds → endpoints
                    // track their node positions exactly.
                    const dAX = (seededRandom(`${aKey}:dx`) - 0.5) * 2 * NODE_DRIFT_AMPLITUDE_SVG;
                    const dAY = (seededRandom(`${aKey}:dy`) - 0.5) * 2 * NODE_DRIFT_AMPLITUDE_SVG;
                    const dAX2 = (seededRandom(`${aKey}:dx2`) - 0.5) * NODE_DRIFT_AMPLITUDE_SVG;
                    const dAY2 = (seededRandom(`${aKey}:dy2`) - 0.5) * NODE_DRIFT_AMPLITUDE_SVG;
                    const dADur = NODE_DRIFT_MIN_DURATION_SECONDS + seededRandom(`${aKey}:dur`) * NODE_DRIFT_DURATION_JITTER_SECONDS;
                    const dADelay = seededRandom(`${aKey}:delay`) * NODE_DRIFT_MAX_DELAY_SECONDS;

                    const dBX = (seededRandom(`${bKey}:dx`) - 0.5) * 2 * NODE_DRIFT_AMPLITUDE_SVG;
                    const dBY = (seededRandom(`${bKey}:dy`) - 0.5) * 2 * NODE_DRIFT_AMPLITUDE_SVG;
                    const dBX2 = (seededRandom(`${bKey}:dx2`) - 0.5) * NODE_DRIFT_AMPLITUDE_SVG;
                    const dBY2 = (seededRandom(`${bKey}:dy2`) - 0.5) * NODE_DRIFT_AMPLITUDE_SVG;
                    const dBDur = NODE_DRIFT_MIN_DURATION_SECONDS + seededRandom(`${bKey}:dur`) * NODE_DRIFT_DURATION_JITTER_SECONDS;
                    const dBDelay = seededRandom(`${bKey}:delay`) * NODE_DRIFT_MAX_DELAY_SECONDS;

                    const staticD = `M${a.x} ${a.y} L${b.x} ${b.y}`;

                    const glowTransition = {
                      duration: LINE_GLOW_DURATION,
                      repeat: reducedMotion ? 0 : Infinity,
                      repeatType: "mirror" as const,
                      ease: "easeInOut" as const,
                      delay: (index % 10) * LINE_GLOW_STAGGER,
                    };
                    const widthTransition = {
                      duration: LINE_WIDTH_DURATION,
                      repeat: reducedMotion ? 0 : Infinity,
                      repeatType: "mirror" as const,
                      ease: "easeInOut" as const,
                      delay: (index % 10) * LINE_GLOW_STAGGER * 0.5,
                    };
                    const driftA = (dur: number, delay: number) => ({
                      duration: dur,
                      repeat: Infinity,
                      repeatType: "mirror" as const,
                      ease: "easeInOut" as const,
                      delay: LINE_DRAW_TRANSITION.duration + delay,
                    });
                    return (
                      <motion.path
                        key={`${aKey}-${bKey}`}
                        d={staticD}
                        className="stroke-primary"
                        fill="none"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        filter={`url(#${glowFilterId})`}
                        style={mounted && !reducedMotion ? { pathLength: edgePathLength } : undefined}
                        initial={{ opacity: 0 }}
                        animate={{
                          strokeWidth: reducedMotion
                            ? isActive ? 0.8 : 0.45
                            : isActive ? [0.45, 1, 0.45] : [0.25, 0.65, 0.25],
                          opacity: reducedMotion
                            ? isActive ? 0.65 : 0.35
                            : isActive ? [0.5, 0.9, 0.5] : [0.22, 0.45, 0.22],
                          d: reducedMotion ? staticD : [
                            staticD,
                            `M${a.x + dAX} ${a.y + dAY} L${b.x + dBX} ${b.y + dBY}`,
                            `M${a.x + dAX2} ${a.y + dAY2} L${b.x + dBX2} ${b.y + dBY2}`,
                            staticD,
                          ],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          opacity: glowTransition,
                          strokeWidth: widthTransition,
                          d: driftA(Math.min(dADur, dBDur), Math.min(dADelay, dBDelay)),
                          default: reducedMotion ? { duration: 0 } : LINE_DRAW_TRANSITION,
                        }}
                      />
                    );
                  })}
              </AnimatePresence>
            </svg>

            <motion.div
              className="absolute inset-0"
              style={mounted && !reducedMotion ? { opacity: labelsOpacity } : undefined}
            >
              <AnimatePresence>
                {mounted &&
                  visibleSkills.map((skill, index) => {
                    const pos = layout[skill.key];
                    if (!pos) return null;
                    return (
                      <SkillNode
                        key={skill.key}
                        skill={skill}
                        pos={pos}
                        isSelected={skill.key === centerSkill.key}
                        spawnOriginKey={spawnOriginKey}
                        layout={layout}
                        index={index}
                        reducedMotion={reducedMotion}
                        onClick={handleNodeClick}
                      />
                    );
                  })}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        <motion.p
          className="text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={exploreVisible || reducedMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          Click a node to explore connections
        </motion.p>
      </div>

      <aside className="overflow-hidden rounded-xl border bg-background p-4 sm:p-6">
        <SkillDetailPanel
          skill={centerSkill}
          relatedProjects={relatedProjects}
          reducedMotion={reducedMotion}
        />
      </aside>
    </div>
  );
}

export default SkillsGraph;
