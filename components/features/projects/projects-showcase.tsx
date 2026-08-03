"use client";

import { MotionValue } from "framer-motion";

import { BuilderShowcase } from "@/components/features/showcase/builder-showcase";
import { CodeEditorPanel } from "@/components/features/showcase/code-editor-panel";
import { TerminalStrip } from "@/components/features/showcase/terminal-strip";
import { SHOWCASE_TAGLINE, SHOWCASE_BUILD_LOG } from "@/config/showcase";
import { PROJECT_SNIPPETS } from "@/config/project-snippets";
import { featuredProjects } from "@/config/projects";
import type { ProjectInterface } from "@/config/projects";

import { ProjectPreviewBody } from "./project-preview-body";

const DEFAULT_PROJECT: ProjectInterface = featuredProjects[0];

const DEFAULT_SNIPPET = PROJECT_SNIPPETS.find(
  (s) => s.projectId === DEFAULT_PROJECT.id,
);

export interface ProjectsShowcaseProps {
  project?: ProjectInterface;
  snippet?: (typeof PROJECT_SNIPPETS)[number];
  className?: string;
  scrollDriven?: boolean;
  scrollProgress?: MotionValue<number>;
}

export function ProjectsShowcase({
  project = DEFAULT_PROJECT,
  snippet = DEFAULT_SNIPPET,
  className,
  scrollDriven,
  scrollProgress,
}: ProjectsShowcaseProps) {
  const editor = snippet ? (
    <CodeEditorPanel
      filename={snippet.filename}
      language={snippet.language}
      lines={snippet.rawLines}
      mode={scrollDriven ? "static" : "reveal"}
      lineDelayMs={140}
    />
  ) : (
    <CodeEditorPanel
      filename="README.md"
      language="typescript"
      lines={[
        "// No snippet available for this project.",
        "// Add one to config/project-snippets.ts to populate this panel.",
      ]}
      mode={scrollDriven ? "static" : "reveal"}
      lineDelayMs={140}
    />
  );

  return (
    <BuilderShowcase
      tagline={SHOWCASE_TAGLINE}
      className={className}
      editor={editor}
      preview={<ProjectPreviewBody project={project} />}
      terminal={<TerminalStrip lines={SHOWCASE_BUILD_LOG} />}
      scrollDriven={scrollDriven}
      scrollProgress={scrollProgress}
    />
  );
}

export default ProjectsShowcase;
