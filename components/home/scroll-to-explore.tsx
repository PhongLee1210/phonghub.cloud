"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

import { Icons } from "@/components/common/icons";
import { heroCopy } from "@/config/home";

const FADE_OUT_SCROLL_THRESHOLD_PX = 40;

export const ScrollToExplore = () => {
  const reducedMotion = useReducedMotion();
  const [isPastThreshold, setIsPastThreshold] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsPastThreshold(window.scrollY > FADE_OUT_SCROLL_THRESHOLD_PX);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isPastThreshold ? 0 : 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.45,
        delay: reducedMotion ? 0 : 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="pointer-events-none absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2"
    >
      <span className="font-miniver text-base font-normal text-muted-foreground">
        {heroCopy.scrollHint}
      </span>
      <Icons.arrowDown
        className={`h-4 w-4 text-muted-foreground ${
          reducedMotion ? "" : "animate-bounce"
        }`}
      />
    </motion.div>
  );
};
