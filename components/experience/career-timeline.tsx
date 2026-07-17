"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

import { AnimatedSection } from "@/components/common/animated-section";
import { ExperienceInterface } from "@/config/experience";
import { EASE_OUT, SPRING_GENTLE, SPRING_SNAPPY } from "@/lib/motion";

const ExperienceCard = dynamic(
  () => import("@/components/experience/experience-card")
);

interface CareerTimelineProps {
  experiences: ExperienceInterface[];
}

export default function CareerTimeline({ experiences }: CareerTimelineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [started, setStarted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  if (inView && !started) {
    setStarted(true);
  }

  return (
    <div ref={ref} className="space-y-0">
      {experiences.map((exp, index) => {
        const startYear = new Date(exp.startDate).getFullYear().toString();
        const dotDelay = prefersReducedMotion ? 0 : index * 0.15;
        const lineDelay = prefersReducedMotion ? 0 : index * 0.15 + 0.15;
        const cardDelay = prefersReducedMotion ? 0 : index * 0.15 + 0.05;

        return (
          <div key={exp.id} className="flex gap-8 items-start">
            {/* Timeline column — desktop only */}
            <div className="hidden md:flex flex-col items-center w-20 shrink-0 pt-5">
              <span className="font-mono text-xs text-muted-foreground/60 mb-2">
                {startYear}
              </span>
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"
                initial={{ scale: 0 }}
                animate={started ? { scale: 1 } : {}}
                transition={{ ...SPRING_SNAPPY, delay: dotDelay }}
              />
              {index < experiences.length - 1 && (
                <motion.div
                  className="w-px bg-border mt-2"
                  style={{ height: 120, transformOrigin: "top" }}
                  initial={{ scaleY: 0 }}
                  animate={started ? { scaleY: 1 } : {}}
                  transition={{ duration: 0.45, ease: EASE_OUT, delay: lineDelay }}
                />
              )}
            </div>

            {/* Card column */}
            <motion.div
              className="flex-1 pb-8"
              initial={{ opacity: 0, x: 16 }}
              animate={started ? { opacity: 1, x: 0 } : {}}
              transition={{ ...SPRING_GENTLE, delay: cardDelay }}
            >
              {/* Mobile: wrap in AnimatedSection for parity with old behavior */}
              <div className="md:hidden">
                <AnimatedSection delay={cardDelay} direction="up">
                  <ExperienceCard experience={exp} />
                </AnimatedSection>
              </div>
              {/* Desktop: card already animated by parent motion.div */}
              <div className="hidden md:block">
                <ExperienceCard experience={exp} />
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
