"use client";

import * as React from "react";
import { useCallback, useState } from "react";

import { BuilderShowcase } from "@/components/features/showcase/builder-showcase";
import { CodeEditorPanel } from "@/components/features/showcase/code-editor-panel";
import { TerminalStrip } from "@/components/features/showcase/terminal-strip";
import type { TerminalLine } from "@/lib/showcase/commands";
import { useShowcaseStream } from "@/lib/showcase/use-showcase-stream";
import { SKILL_SNIPPETS } from "@/config/skill-snippets";
import { featuredSkills, SkillCategoryEnum, SKILLS } from "@/config/skills";
import type { ISkill } from "@/config/skills";

import { SkillPreviewBody } from "./skill-preview-body";

/**
 * SkillsShowcase — wires `BuilderShowcase` to skills data.
 *
 * Editor  → TypeScript snippet (`SKILL_SNIPPETS[0]`) with the typewriter
 *           reveal driven by `CodeEditorPanel mode="reveal"`.
 * Preview → `<SkillPreviewBody>` over `featuredSkills` (top 6 by rating).
 * Terminal→ derived from `SKILLS` at module load — count + per-category
 *           averages for the four highest-rated categories. Recomputed only
 *           when `config/skills.ts` changes (Next.js bundler cache).
 *
 * The tagline is overridden with a skills-specific phrase; the Figma default
 * (`SHOWCASE_TAGLINE`) is reserved for the Projects hero in Phase 4.
 *
 * T5.5/T5.6 will wire `highlightedKeys` and editor snippet cycling via the
 * Zustand store; for now both are static.
 */

/** Skills-section tagline override (Figma default reserved for Projects). */
const SKILLS_TAGLINE = "My technical toolkit";

/**
 * Build the skills diagnostic terminal lines from the live config so they
 * stay accurate if `SKILLS` changes. Picks the four top-rated categories
 * (by average rating, then by count) and renders their summary line.
 *
 * Run once at module load — pure derivation, safe to cache for the bundle's
 * lifetime.
 */
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
    {
      tone: "info",
      text: `scanning skills… ${SKILLS.length} found`,
    },
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

/** Default editor snippet: TypeScript (top skill). */
const DEFAULT_SKILL_SNIPPET = SKILL_SNIPPETS[0];

export interface SkillsShowcaseProps {
  /** Override featured skills (defaults to `featuredSkills` from config). */
  skills?: typeof featuredSkills;
  /** AI-driven highlight (T5.6 wiring; undefined = no filter). */
  highlightedKeys?: string[];
  /** Override the diagnostic snippet (default: TypeScript). */
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
          compiled={streamedCode.length === 0 ? undefined : !isStreaming}
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

// Re-export so callers don't need to import the enum separately if they want
// to filter — kept here to keep SkillsShowcase's surface self-contained.
export { SkillCategoryEnum };
