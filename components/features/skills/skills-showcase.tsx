"use client";

import { useCallback, useState } from "react";

import { BuilderShowcase } from "@/components/features/showcase/builder-showcase";
import { CodeEditorPanel } from "@/components/features/showcase/code-editor-panel";
import { TerminalStrip } from "@/components/features/showcase/terminal-strip";
import type { TerminalLine } from "@/lib/showcase/commands";
import { useShowcaseStream } from "@/lib/showcase/use-showcase-stream";
import { SKILL_SNIPPETS } from "@/config/skill-snippets";
import { featuredSkills, SKILLS } from "@/config/skills";
import type { ISkill } from "@/config/skills";

import { SkillPreviewBody } from "./skill-preview-body";

/**
 * SkillsShowcase — wires `BuilderShowcase` to skills data.
 *
 * Editor  → TypeScript snippet with typewriter reveal.
 * Preview → `<SkillPreviewBody>` over `featuredSkills` (top 6 by rating).
 * Terminal→ derived from `SKILLS` at module load — count + per-category
 *           averages for the highest-rated categories.
 */

/** Skills-section tagline override (Figma default reserved for Projects). */
const SKILLS_TAGLINE = "My technical toolkit";

function buildSkillsDiagnosticLines(): readonly TerminalLine[] {
  const byCat = new Map<string, ISkill[]>();
  for (const skill of SKILLS) {
    const arr = byCat.get(skill.category) ?? [];
    arr.push(skill);
    byCat.set(skill.category, arr);
  }

  const ranked = Array.from(byCat.entries())
    .map(([cat, arr]) => ({
      cat,
      count: arr.length,
      avg: arr.reduce((sum: number, s: ISkill) => sum + s.rating, 0) / arr.length,
    }))
    .sort((a, b) => b.avg - a.avg || b.count - a.count)
    .slice(0, 3);

  const lines: TerminalLine[] = [
    { tone: "info", text: `scanning skills… ${SKILLS.length} found` },
    {
      tone: "success",
      text: `featured: ${featuredSkills.length} highlighted, top rating ${featuredSkills[0]?.rating ?? 5}★`,
    },
  ];

  for (const r of ranked) {
    lines.push({
      tone: "success",
      text: `${r.cat}: ${r.count} skills, avg ${r.avg.toFixed(1)}★`,
    });
  }

  return lines;
}

const SKILLS_DIAGNOSTIC_LINES: readonly TerminalLine[] =
  buildSkillsDiagnosticLines();

const DEFAULT_SKILL_SNIPPET = SKILL_SNIPPETS[0];

export interface SkillsShowcaseProps {
  skills?: typeof featuredSkills;
  highlightedKeys?: string[];
  snippet?: (typeof SKILL_SNIPPETS)[number];
  className?: string;
}

export function SkillsShowcase({
  skills = featuredSkills,
  highlightedKeys,
  snippet = DEFAULT_SKILL_SNIPPET,
  className,
}: SkillsShowcaseProps) {
  const [streamedCode, setStreamedCode] = useState("");
  const [appendedTerminal, setAppendedTerminal] = useState<TerminalLine[]>([]);

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
    section: "skills",
    subjectName: snippet.skillKey,
    tags: highlightedKeys,
    currentCode: snippet.rawLines,
    onCodeDelta,
    onTerminal,
    onError,
  });

  return (
    <BuilderShowcase
      tagline={SKILLS_TAGLINE}
      className={className}
      activeCommandId={activeAction}
      onCommandSelect={onSelect}
      editor={
        <CodeEditorPanel
          filename={snippet.filename}
          language={snippet.language}
          lines={snippet.rawLines}
          mode="reveal"
          lineDelayMs={140}
          streamedCode={streamedCode}
          streaming={isStreaming}
          compiled={streamedCode.length > 0 ? !isStreaming : undefined}
        />
      }
      preview={
        <SkillPreviewBody
          skills={skills}
          highlightedKeys={highlightedKeys}
          limit={8}
        />
      }
      terminal={
        <TerminalStrip
          lines={SKILLS_DIAGNOSTIC_LINES}
          appendedLines={appendedTerminal}
          live={isStreaming}
        />
      }
    />
  );
}

export default SkillsShowcase;
