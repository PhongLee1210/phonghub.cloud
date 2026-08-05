"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { animate, motion, useMotionValue, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

import { ROBOT_MAX_SIZE_VW, ROBOT_WAYPOINTS, SPRING_MAGNETIC, type RobotWaypoint } from "@/lib/motion";

const RobotScene = dynamic(
  () => import("@/components/three/robot-scene"),
  { ssr: false },
);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Docked position/size (fixed px, not vw/vh) for every route other than "/" -
// perched just above the chat launcher (components/chat/chat-launcher.tsx,
// which sits at bottom-[...+5rem] right-4 on mobile / bottom-[...+0.75rem]
// right-6 on desktop, z-[60]). Fixed px so it doesn't drift with viewport
// width the way the scroll-driven vw/vh waypoints intentionally do.
const DOCK_SIZE_PX = 56;
const DOCK_RIGHT_PX = 20;
const DOCK_BOTTOM_PX = 132;
const DOCK_Z_INDEX = 30;
const FLOAT_Z_INDEX = 35;

let webglChecked: boolean | null = null;

// Probes WebGL support once and caches the result for the life of the page.
// Re-probing on every mount (e.g. every time the user navigates back to the
// home page) leaked one live WebGL context per probe - browsers cap the
// number of live contexts per page, so after enough round trips getContext()
// started returning null and the robot vanished permanently.
function canWebGL(): boolean {
  if (webglChecked !== null) return webglChecked;
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    webglChecked = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
    return webglChecked;
  } catch {
    webglChecked = false;
    return false;
  }
}

function subscribeNoop() {
  return () => {};
}

function getIsDesktop() {
  return canWebGL() && window.innerWidth >= 1024;
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
  const pathname = usePathname();
  const isHome = pathname === "/";
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
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(0);

  const homeTarget = () => {
    const { sizeVw, rightVw, bottomVh } = waypointInterpolate(
      ROBOT_WAYPOINTS,
      topsRef.current,
      scrollY.get(),
    );
    return {
      x: -(rightVw / 100) * window.innerWidth,
      y: -(bottomVh / 100) * window.innerHeight,
      scale: sizeVw / ROBOT_MAX_SIZE_VW,
    };
  };

  const dockTarget = () => ({
    x: -DOCK_RIGHT_PX,
    y: -DOCK_BOTTOM_PX,
    scale: DOCK_SIZE_PX / ((ROBOT_MAX_SIZE_VW / 100) * window.innerWidth),
  });

  // Scroll only drives position while on the home page - set directly (no
  // spring) so the float stays 1:1 with scroll, same as before this changed.
  const recompute = () => {
    if (typeof window === "undefined" || !isHome) return;
    const t = homeTarget();
    x.set(t.x);
    y.set(t.y);
    scale.set(t.scale);
  };

  useMotionValueEvent(scrollY, "change", recompute);

  // Docking / undocking (route change) is the one transition that should
  // visibly animate - the robot "flies" from wherever it was on the home page
  // down into the corner dock, and back out again on return.
  useEffect(() => {
    if (!isDesktop || typeof window === "undefined") return;
    const target = isHome ? homeTarget() : dockTarget();
    const controls = [
      animate(x, target.x, SPRING_MAGNETIC),
      animate(y, target.y, SPRING_MAGNETIC),
      animate(scale, target.scale, SPRING_MAGNETIC),
    ];
    return () => controls.forEach((c) => c.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHome, isDesktop]);

  useIsomorphicLayoutEffect(() => {
    if (!isDesktop || !isHome) return;

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
  }, [isDesktop, isHome]);

  if (!isDesktop) return null;

  return (
    <motion.div
      className="pointer-events-none fixed bottom-0 right-0"
      style={{
        width: `${ROBOT_MAX_SIZE_VW}vw`,
        height: `${ROBOT_MAX_SIZE_VW}vw`,
        x,
        y,
        scale,
        zIndex: isHome ? FLOAT_Z_INDEX : DOCK_Z_INDEX,
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
