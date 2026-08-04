"use client";

import dynamic from "next/dynamic";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { ROBOT_WAYPOINTS, type RobotWaypoint } from "@/lib/motion";

const RobotScene = dynamic(
  () => import("@/components/three/robot-scene"),
  { ssr: false },
);

// --- Desktop + WebGL detection ---

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

function waypointValue(
  waypoints: readonly RobotWaypoint[],
  sectionTops: number[],
  scrollY: number,
  getter: (wp: RobotWaypoint) => number,
): number {
  const count = waypoints.length;
  if (count === 0) return 0;

  if (scrollY <= sectionTops[0]) return getter(waypoints[0]);

  for (let i = 0; i < count - 1; i++) {
    const start = sectionTops[i];
    const end = sectionTops[i + 1];
    if (scrollY >= start && scrollY < end) {
      const raw = (scrollY - start) / (end - start);
      const t = easeInOut(raw);
      return lerp(getter(waypoints[i]), getter(waypoints[i + 1]), t);
    }
  }

  return getter(waypoints[count - 1]);
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

// --- Component ---

export default function RobotCompanion() {
  const isDesktop = useSyncExternalStore(subscribeNoop, getIsDesktop, () => SERVER_VALUE);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isDesktop) return;
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, [isDesktop]);

  const { scrollY } = useScroll();

  const sectionTopsRef = useRef<number[]>([]);

  const measureSections = useCallback(() => {
    const tops: number[] = [];
    for (const sel of SECTION_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) {
        tops.push(el.getBoundingClientRect().top + window.scrollY);
      } else {
        const prev = tops.length > 0 ? tops[tops.length - 1] : 0;
        tops.push(prev + window.innerHeight);
      }
    }
    sectionTopsRef.current = tops;
  }, []);

  useEffect(() => {
    const timer = setTimeout(measureSections, 500);
    window.addEventListener("resize", measureSections, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureSections);
    };
  }, [measureSections]);

  // Container size: sizeVw% of viewport width, directly
  const sizePx = useTransform(scrollY, (y) => {
    if (typeof window === "undefined") return 300;
    const vw = waypointValue(ROBOT_WAYPOINTS, sectionTopsRef.current, y, (wp) => wp.sizeVw);
    return (vw / 100) * window.innerWidth;
  });

  const rightPx = useTransform(scrollY, (y) => {
    if (typeof window === "undefined") return 0;
    const vw = waypointValue(ROBOT_WAYPOINTS, sectionTopsRef.current, y, (wp) => wp.rightVw);
    return (vw / 100) * window.innerWidth;
  });

  const bottomPx = useTransform(scrollY, (y) => {
    if (typeof window === "undefined") return 0;
    const vh = waypointValue(ROBOT_WAYPOINTS, sectionTopsRef.current, y, (wp) => wp.bottomVh);
    return (vh / 100) * window.innerHeight;
  });

  if (!isDesktop) return null;

  return (
    <motion.div
      className="pointer-events-none fixed z-[35]"
      style={{
        width: sizePx,
        height: sizePx,
        right: rightPx,
        bottom: bottomPx,
        opacity: visible ? 1 : 0,
        willChange: "transform",
        transition: "opacity 0.6s ease-out",
      }}
    >
      <RobotScene />
    </motion.div>
  );
}
