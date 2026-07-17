"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";

import { SPRING_GENTLE } from "@/lib/motion";
import { AnimatedSection } from "@/components/common/animated-section";
import type { ProjectInterface } from "@/config/projects";
import type { ProjectSnippet } from "@/config/project-snippets";

const ProjectCard = dynamic(() => import("@/components/projects/project-card"));
const CodeTerminal = dynamic(
  () => import("@/components/projects/code-terminal"),
);

interface ProjectWorkspaceProps {
  project: ProjectInterface;
  snippet: ProjectSnippet | undefined;
}

export default function ProjectWorkspace({
  project,
  snippet,
}: ProjectWorkspaceProps) {
  const [previewVisible, setPreviewVisible] = useState(false);

  // No snippet: just render the card
  if (!snippet) {
    return (
      <AnimatedSection direction="up">
        <ProjectCard project={project} />
      </AnimatedSection>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8 items-start">
      {/* Left: code terminal */}
      <CodeTerminal
        snippet={snippet}
        onComplete={() => setPreviewVisible(true)}
        lineDelayMs={100}
        className="w-full"
      />

      {/* Right: project card revealed after terminal completes */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, x: 8 }}
        animate={
          previewVisible
            ? { opacity: 1, scale: 1, x: 0 }
            : { opacity: 0, scale: 0.95, x: 8 }
        }
        transition={SPRING_GENTLE}
        className="flex justify-start"
      >
        <ProjectCard project={project} />
      </motion.div>
    </div>
  );
}
