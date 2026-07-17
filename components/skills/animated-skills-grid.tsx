"use client";

import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

import { Icons } from "@/components/common/icons";
import Rating from "@/components/skills/rating";
import { ISkill } from "@/config/skills";
import { SPRING_GENTLE } from "@/lib/motion";

interface AnimatedSkillsGridProps {
  skills: ISkill[];
}

function getSkillIcon(iconName: string) {
  const key = iconName as keyof typeof Icons;
  return Icons[key] ?? Icons.settings;
}

export default function AnimatedSkillsGrid({ skills }: AnimatedSkillsGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [started, setStarted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  if (inView && !started) {
    setStarted(true);
  }

  return (
    <div
      ref={ref}
      className="mx-auto grid justify-center gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {skills.map((skill, index) => {
        const IconComponent = getSkillIcon(skill.icon);
        const delay = prefersReducedMotion ? 0 : index * 0.08;

        return (
          <motion.div
            key={skill.key}
            data-agent-id={`skill:${skill.key}`}
            className="relative overflow-hidden rounded-lg border bg-background p-2"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={started ? { opacity: 1, scale: 1, y: 0 } : {}}
            transition={{ ...SPRING_GENTLE, delay }}
          >
            <div className="flex h-[230px] flex-col justify-between rounded-md p-6 sm:h-[230px]">
              <IconComponent size={50} />
              <div className="space-y-2">
                <h3 className="font-bold">{skill.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {skill.description}
                </p>
                <Rating stars={skill.rating} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
