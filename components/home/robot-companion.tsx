"use client";

import dynamic from "next/dynamic";
import { motion, useMotionValue, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { ROBOT_MAX_SIZE_VW, ROBOT_WAYPOINTS, type RobotWaypoint } from "@/lib/motion";

const RobotScene = dynamic(
  () => import("@/components/three/robot-scene"),
  { ssr: false },
);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function canWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function subscribeNoop() {
  return () => {};
}

let cachedDesktop: boolean | null = null;

function getIsDesktop() {
  const next = canWebGL() && window.innerWidth >= 1024;
  if (cachedDesktop !== null && cachedDesktop === next) return cachedDesktop;
  cachedDesktop = next;
  return next;
}

const SERVER_VALUE = false;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

// Interpolates {sizeVw, rightVw, bottomVh} across the waypoint table for a
// given scrollY. Continuous (no jumps) - the flicker was never in this math,
// it was in how the result was applied (layout props) and in stale section tops.
function waypointInterpolate(
  waypoints: readonly RobotWaypoint[],
  sectionTops: number[],
  scrollY: number,
): Required<RobotWaypoint> {
  const count = waypoints.length;
  const last = waypoints[count - 1] ?? { sizeVw: 0, rightVw: 0, bottomVh: 0 };

  if (count === 0 || sectionTops.length === 0) return last;

  if (scrollY <= sectionTops[0]) {
    const w = waypoints[0];
    return { sizeVw: w.sizeVw, rightVw: w.rightVw, bottomVh: w.bottomVh };
  }

  for (let i = 0; i < count - 1; i++) {
    const start = sectionTops[i];
    const end = sectionTops[i + 1];
    if (scrollY >= start && scrollY < end) {
      const raw = end > start ? (scrollY - start) / (end - start) : 0;
      const t = easeInOut(raw);
      const a = waypoints[i];
      const b = waypoints[i + 1];
      return {
        sizeVw: lerp(a.sizeVw, b.sizeVw, t),
        rightVw: lerp(a.rightVw, b.rightVw, t),
        bottomVh: lerp(a.bottomVh, b.bottomVh, t),
      };
    }
  }

  return { sizeVw: last.sizeVw, rightVw: last.rightVw, bottomVh: last.bottomVh };
}

// Document offset top, ignoring live CSS transforms. getBoundingClientRect
// includes transforms (e.g. the crossfade y/scale on #experience and #blog),
// so it drifts as the user scrolls. offsetTop accumulation walks the offset
// parent chain and returns the stable layout position instead.
function documentOffsetTop(el: Element): number {
  let top = 0;
  let node: Element | null = el;
  while (node) {
    top += (node as HTMLElement).offsetTop || 0;
    node = (node as HTMLElement).offsetParent as Element | null;
  }
  return top;
}

const SECTION_SELECTORS = [
  "section:first-of-type",  // Hero
  "#skills",
  "#projects",              // Let's build something
  "#projects-grid",         // More featured projects
  "#experience",
  "#blog",
  "#cta",
];

export default function RobotCompanion() {
  const isDesktop = useSyncExternalStore(subscribeNoop, getIsDesktop, () => SERVER_VALUE);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isDesktop) return;
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, [isDesktop]);

  const { scrollY } = useScroll();

  // Section tops live in a ref (read fresh on every recompute) rather than a
  // MotionValue: framer-motion's array-input useTransform requires every
  // input to be the same MotionValue<T>, which a number[] can't share with
  // scrollY's MotionValue<number>. Reactivity instead comes from calling
  // recompute() directly - once per scroll tick (useMotionValueEvent) and
  // once whenever the measured tops change.
  const topsRef = useRef<number[]>([]);
  const transform = useMotionValue("translate3d(0px, 0px, 0px) scale(0)");

  const recompute = () => {
    if (typeof window === "undefined") return;
    const { sizeVw, rightVw, bottomVh } = waypointInterpolate(
      ROBOT_WAYPOINTS,
      topsRef.current,
      scrollY.get(),
    );
    const scale = sizeVw / ROBOT_MAX_SIZE_VW;
    const rightPx = (rightVw / 100) * window.innerWidth;
    const bottomPx = (bottomVh / 100) * window.innerHeight;
    transform.set(`translate3d(${-rightPx}px, ${-bottomPx}px, 0px) scale(${scale})`);
  };

  useMotionValueEvent(scrollY, "change", recompute);

  useIsomorphicLayoutEffect(() => {
    if (!isDesktop) return;

    const measure = () => {
      const tops: number[] = [];
      for (const sel of SECTION_SELECTORS) {
        const el = document.querySelector(sel);
        if (el) {
          tops.push(documentOffsetTop(el));
        } else {
          const prev = tops.length > 0 ? tops[tops.length - 1] : 0;
          tops.push(prev + window.innerHeight);
        }
      }
      topsRef.current = tops;
      recompute();
    };

    measure();

    const ro = new ResizeObserver(measure);
    for (const sel of SECTION_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) ro.observe(el);
    }
    ro.observe(document.body);

    document.fonts?.ready.then(measure);
    window.addEventListener("load", measure);

    return () => {
      ro.disconnect();
      window.removeEventListener("load", measure);
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <motion.div
      className="pointer-events-none fixed bottom-0 right-0 z-[35]"
      style={{
        width: `${ROBOT_MAX_SIZE_VW}vw`,
        height: `${ROBOT_MAX_SIZE_VW}vw`,
        transform,
        transformOrigin: "100% 100%",
        opacity: visible ? 1 : 0,
        willChange: "transform",
        transition: "opacity 0.6s ease-out",
      }}
    >
      <RobotScene />
    </motion.div>
  );
}
