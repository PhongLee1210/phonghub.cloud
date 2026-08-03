"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const SECTIONS = [
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "blog", label: "Blog" },
  { id: "cta", label: "Contact" },
] as const;

export function ScrollProgress() {
  const [activeId, setActiveId] = useState<string>("");
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", () => {
    setIsScrolling(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsScrolling(false), 1500);
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        let topmost: string | null = null;
        let topmostTop = Infinity;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const rect = entry.boundingClientRect;
            if (rect.top < topmostTop) {
              topmostTop = rect.top;
              topmost = entry.target.id;
            }
          }
        }
        if (topmost) setActiveId(topmost);
      },
      { threshold: 0.3 }
    );

    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }

    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  return (
    <motion.nav
      role="navigation"
      aria-label="Page sections"
      className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 md:flex"
      animate={{ opacity: isScrolling ? 1 : 0.15 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-3">
        {SECTIONS.map((section) => {
          const isActive = activeId === section.id;
          return (
            <button
              key={section.id}
              type="button"
              aria-label={section.label}
              aria-current={isActive ? "true" : undefined}
              onClick={() => handleClick(section.id)}
              className="group relative flex items-center"
            >
              <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                {section.label}
              </span>
              <span
                className={`block rounded-full transition-all ${
                  isActive
                    ? "h-3 w-3 bg-primary"
                    : "h-2 w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                }`}
              />
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
