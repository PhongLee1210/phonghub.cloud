import { ISkill, SkillCategoryEnum } from "@/config/skills";

export const NODE_MIN_SIZE_PX = 20;
export const NODE_MAX_SIZE_PX = 40;
export const SELECTED_NODE_SIZE_BONUS_PX = 8;
export const MAX_SKILL_RATING = 5;
export const NODE_SPAWN_FLIGHT_DISTANCE_PX = 36;

export const NODE_DRIFT_AMPLITUDE_PX = 24;
export const NODE_DRIFT_MIN_DURATION_SECONDS = 4;
export const NODE_DRIFT_DURATION_JITTER_SECONDS = 4;
export const NODE_DRIFT_MAX_DELAY_SECONDS = 1.5;

const LAYOUT_NOMINAL_CONTAINER_PX = 420;
export const NODE_DRIFT_AMPLITUDE_SVG =
  (NODE_DRIFT_AMPLITUDE_PX / LAYOUT_NOMINAL_CONTAINER_PX) * 100;

const LAYOUT_RELAXATION_ITERATIONS = 100;
const LAYOUT_REPULSION_STRENGTH = 170;
const LAYOUT_EDGE_SPRING_STRENGTH = 0.02;
const LAYOUT_EDGE_IDEAL_LENGTH_PERCENT = 18;
const LAYOUT_CENTER_GRAVITY_STRENGTH = 0.01;
const LAYOUT_BOUNDS_PADDING_PERCENT = 12;
const LAYOUT_INITIAL_RADIUS_MIN_PERCENT = 20;
const LAYOUT_INITIAL_RADIUS_JITTER_PERCENT = 18;
const LAYOUT_INITIAL_ANGLE_JITTER_RADIANS = 0.8;
const LAYOUT_COLLISION_ITERATIONS = 40;
const LAYOUT_COLLISION_GAP_PERCENT = 3;

export type GraphPosition = { x: number; y: number };
export type GraphEdge = readonly [string, string];

/** Stable across server/client renders — unlike Math.random, avoids hydration mismatches. */
export function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  hash ^= hash << 13;
  hash ^= hash >>> 17;
  hash ^= hash << 5;
  return ((hash >>> 0) % 10_000) / 10_000;
}

export function nodeDiameter(rating: number, isSelected: boolean): number {
  const ratio = Math.min(Math.max(rating, 1), MAX_SKILL_RATING) / MAX_SKILL_RATING;
  const base = NODE_MIN_SIZE_PX + ratio * (NODE_MAX_SIZE_PX - NODE_MIN_SIZE_PX);
  return isSelected ? base + SELECTED_NODE_SIZE_BONUS_PX : base;
}

export function buildEdges(pool: readonly ISkill[]): GraphEdge[] {
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

  const categoryHubs: ISkill[] = [];
  for (const list of Array.from(byCategory.values())) {
    if (list.length === 0) continue;
    categoryHubs.push(list[0]);
    for (let i = 0; i < list.length; i++) {
      addEdge(list[i].key, list[(i + 1) % list.length].key);
    }
  }

  if (categoryHubs.length > 0) {
    const globalHub = categoryHubs.reduce((best, s) =>
      s.rating > best.rating ? s : best
    );
    for (const hub of categoryHubs) addEdge(globalHub.key, hub.key);
  }

  return edges;
}

export function computeLayout(
  pool: readonly ISkill[],
  edges: readonly GraphEdge[]
): Record<string, GraphPosition> {
  const categories = Array.from(new Set(pool.map((s) => s.category)));
  const categoryAngle = new Map(
    categories.map((c, i) => [c, (2 * Math.PI * i) / categories.length])
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

  const keys = pool.map((s) => s.key);
  const clamp = (v: number) =>
    Math.min(100 - LAYOUT_BOUNDS_PADDING_PERCENT, Math.max(LAYOUT_BOUNDS_PADDING_PERCENT, v));

  for (let iter = 0; iter < LAYOUT_RELAXATION_ITERATIONS; iter++) {
    const forces = new Map<string, GraphPosition>(keys.map((k) => [k, { x: 0, y: 0 }]));

    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const a = positions.get(keys[i])!;
        const b = positions.get(keys[j])!;
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let distSq = dx * dx + dy * dy;
        if (distSq < 0.01) {
          dx = seededRandom(`${keys[i]}:${keys[j]}:${iter}`) - 0.5;
          dy = seededRandom(`${keys[j]}:${keys[i]}:${iter}`) - 0.5;
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
      const f = forces.get(key)!;
      pos.x = clamp(pos.x + f.x - (pos.x - 50) * LAYOUT_CENTER_GRAVITY_STRENGTH);
      pos.y = clamp(pos.y + f.y - (pos.y - 50) * LAYOUT_CENTER_GRAVITY_STRENGTH);
    }
  }

  // Collision pass sized to actual node diameters — generic repulsion above can still
  // leave nodes touching once spring forces settle.
  const radiusPercent = new Map(
    pool.map((s) => [s.key, (nodeDiameter(s.rating, false) / LAYOUT_NOMINAL_CONTAINER_PX) * 50])
  );

  for (let iter = 0; iter < LAYOUT_COLLISION_ITERATIONS; iter++) {
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
          dx = seededRandom(`${aKey}:${bKey}:collide:${iter}`) - 0.5;
          dy = seededRandom(`${bKey}:${aKey}:collide:${iter}`) - 0.5;
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
      pos.x = clamp(pos.x);
      pos.y = clamp(pos.y);
    }
  }

  const result: Record<string, GraphPosition> = {};
  for (const key of keys) result[key] = positions.get(key)!;
  return result;
}
