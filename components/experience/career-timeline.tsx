"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

import { AnimatedSection } from "@/components/common/animated-section";
import { ExperienceInterface } from "@/config/experience";
import { EASE_OUT, SPRING_GENTLE, SPRING_SNAPPY } from "@/lib/motion";

const ExperienceCard = dynamic(
  () => import("@/components/experience/experience-card")
);

function TimelineEntry({
  exp,
  index,
  total,
  reducedMotion,
}: {
  exp: ExperienceInterface;
  index: number;
  total: number;
  reducedMotion: boolean | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const startYear = new Date(exp.startDate).getFullYear().toString();
  const lineDelay = reducedMotion ? 0 : 0.2;
  const cardDelay = reducedMotion ? 0 : 0.1;

  return (
    <div ref={ref} className="flex gap-8 items-start">
      <div className="hidden md:flex flex-col items-center w-20 shrink-0 pt-5">
        <span className="font-mono text-xs text-muted-foreground/60 mb-2">
          {startYear}
        </span>
        <motion.div
          className="w-2.5 h-2.5 rounded-full bg-primary shrink-0"
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : {}}
          transition={SPRING_SNAPPY}
        />
        {index < total - 1 && (
          <motion.div
            className="w-px bg-border mt-2"
            style={{ height: 120, transformOrigin: "top" }}
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.45, ease: EASE_OUT, delay: lineDelay }}
          />
        )}
      </div>

      <motion.div
        className="flex-1 pb-8"
        initial={{ opacity: 0, x: 16 }}
        animate={inView ? { opacity: 1, x: 0 } : {}}
        transition={{ ...SPRING_GENTLE, delay: cardDelay }}
      >
        <div className="md:hidden">
          <AnimatedSection delay={cardDelay} direction="up">
            <ExperienceCard experience={exp} />
          </AnimatedSection>
        </div>
        <div className="hidden md:block">
          <ExperienceCard experience={exp} />
        </div>
      </motion.div>
    </div>
  );
}

interface CareerTimelineProps {
  experiences: ExperienceInterface[];
}

export default function CareerTimeline({ experiences }: CareerTimelineProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className="space-y-0">
      {experiences.map((exp, index) => (
        <TimelineEntry
          key={exp.id}
          exp={exp}
          index={index}
          total={experiences.length}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}
