"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";

import type { ProjectInterface } from "@/config/projects";

const ProjectCard = dynamic(() => import("@/components/projects/project-card"));

interface AnimatedMobileProjectCardProps {
  project: ProjectInterface;
  delay: number;
}

export function AnimatedMobileProjectCard({
  project,
  delay,
}: AnimatedMobileProjectCardProps) {
  const [imageActive, setImageActive] = useState(false);

  return (
    <motion.div
      initial={{ clipPath: "inset(0 100% 0 0 round 0.5rem)" }}
      whileInView={{ clipPath: "inset(0 0% 0 0 round 0.5rem)" }}
      viewport={{ once: true }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={() => setImageActive(true)}
    >
      <ProjectCard project={project} imageActive={imageActive} />
    </motion.div>
  );
}
