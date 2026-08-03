"use client";

import { useRef, useSyncExternalStore } from "react";
import { useScroll, useReducedMotion } from "framer-motion";

import type { ProjectInterface } from "@/config/projects";

import { ProjectsShowcase } from "./projects-showcase";

function subscribeNoop() {
  return () => {};
}

interface ScrollTheaterWrapperProps {
  project: ProjectInterface;
}

export function ScrollTheaterWrapper({ project }: ScrollTheaterWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const isReduced = mounted && reducedMotion;
  const isScrollDriven = mounted && !reducedMotion;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  return (
    <div
      ref={containerRef}
      style={{ height: isReduced ? "auto" : mounted ? "200vh" : "auto" }}
    >
      <div className={isScrollDriven ? "sticky top-0" : ""}>
        <ProjectsShowcase
          project={project}
          scrollDriven={isScrollDriven}
          scrollProgress={scrollYProgress}
        />
      </div>
    </div>
  );
}
