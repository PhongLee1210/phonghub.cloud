"use client";

import * as React from "react";
import { useCallback, useState } from "react";

import { BuilderShowcase } from "@/components/features/showcase/builder-showcase";
import { CodeEditorPanel } from "@/components/features/showcase/code-editor-panel";
import { TerminalStrip } from "@/components/features/showcase/terminal-strip";
import { SHOWCASE_TAGLINE, SHOWCASE_BUILD_LOG } from "@/config/showcase";
import { PROJECT_SNIPPETS } from "@/config/project-snippets";
import { featuredProjects } from "@/config/projects";
import type { ProjectInterface } from "@/config/projects";
import type { TerminalLine } from "@/lib/showcase/commands";
import { useShowcaseStream } from "@/lib/showcase/use-showcase-stream";

import { ProjectPreviewBody } from "./project-preview-body";

/**
 * ProjectsShowcase — wires `BuilderShowcase` to the featured project.
 *
 * Editor  → snippet matching `project.id` (default: `featuredProjects[0]`,
 *           i.e. HiliosAI). Typewriter reveal driven by `CodeEditorPanel
 *           mode="reveal"`.
 * Preview → `<ProjectPreviewBody>` (T4.1) wraps `<LivePreviewFrame>` with
 *           the project's website URL + hero screenshot + status "active".
 * Terminal→ the default `SHOWCASE_BUILD_LOG` lines ("Ready on…" +
 *           "✓ Compiled successfully in 1.2s").
 * Tagline → the Figma default `SHOWCASE_TAGLINE` ("Let's build something
 *           amazing") — reserved for this section since T0.4.
 *
 * T5.5/T5.6 will wire AI command streaming + snippet cycling via the
 * Zustand store; for now both are static.
 */

/** Default featured project (HiliosAI per `config/projects.ts` ordering). */
const DEFAULT_PROJECT: ProjectInterface = featuredProjects[0];

/** Snippet matching the default project, if any. */
const DEFAULT_SNIPPET = PROJECT_SNIPPETS.find(
  (s) => s.projectId === DEFAULT_PROJECT.id,
);

export interface ProjectsShowcaseProps {
  /** Override the featured project (default: `featuredProjects[0]`). */
  project?: ProjectInterface;
  /** Override the editor snippet (default: matches `project.id`). */
  snippet?: (typeof PROJECT_SNIPPETS)[number];
  className?: string;
}

export function ProjectsShowcase({
  project = DEFAULT_PROJECT,
  snippet = DEFAULT_SNIPPET,
  className,
}: ProjectsShowcaseProps) {
  const [streamedCode, setStreamedCode] = useState("");
  const [appendedTerminal, setAppendedTerminal] = useState<TerminalLine[]>([]);

  // Clear streamed state when the section re-mounts or the snippet changes.
  React.useEffect(() => {
    setStreamedCode("");
    setAppendedTerminal([]);
  }, [snippet]);

  const onCodeDelta = useCallback((text: string) => {
    setStreamedCode((prev) => prev + text);
  }, []);
  const onTerminal = useCallback((line: TerminalLine) => {
    setAppendedTerminal((prev) => [...prev, line]);
  }, []);
  const onError = useCallback((message: string) => {
    setAppendedTerminal((prev) => [
      ...prev,
      { tone: "error", text: `error: ${message}` },
    ]);
  }, []);

  const { activeAction, onSelect, isStreaming } = useShowcaseStream({
    section: "projects",
    subjectName: project.organization.name,
    tags: project.techStack,
    currentCode: snippet?.rawLines,
    onCodeDelta,
    onTerminal,
    onError,
  });

  // If no snippet matches, the editor falls back to an empty panel — the
  // `BuilderShowcase` grid still renders the preview slot correctly. The
  // home page should always have a matching snippet (all 3 featured
  // projects have one in `PROJECT_SNIPPETS`), so this is defensive.
  const editor = snippet ? (
    <CodeEditorPanel
      filename={snippet.filename}
      language={snippet.language}
      lines={snippet.rawLines}
      mode="reveal"
      lineDelayMs={140}
      streamedCode={streamedCode}
      streaming={isStreaming}
      compiled={streamedCode.length === 0 ? undefined : !isStreaming}
    />
  ) : (
    <CodeEditorPanel
      filename="README.md"
      language="typescript"
      lines={[
        "// No snippet available for this project.",
        "// Add one to config/project-snippets.ts to populate this panel.",
      ]}
      mode="reveal"
      lineDelayMs={140}
    />
  );

  return (
    <BuilderShowcase
      tagline={SHOWCASE_TAGLINE}
      className={className}
      activeCommandId={activeAction}
      onCommandSelect={onSelect}
      editor={editor}
      preview={<ProjectPreviewBody project={project} />}
      terminal={
        <TerminalStrip
          lines={SHOWCASE_BUILD_LOG}
          appendedLines={appendedTerminal}
          live={isStreaming}
        />
      }
    />
  );
}

export default ProjectsShowcase;
