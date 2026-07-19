import type { Metadata } from "next";

import { CodeEditorPanel } from "@/components/features/showcase/code-editor-panel";
import { LivePreviewFrame } from "@/components/features/showcase/live-preview-frame";
import { TerminalStrip } from "@/components/features/showcase/terminal-strip";
import { BuilderShowcase } from "@/components/features/showcase/builder-showcase";
import { SHOWCASE_BUILD_LOG } from "@/config/showcase";
import { SKILL_SNIPPETS } from "@/config/skill-snippets";

export const metadata: Metadata = {
  title: "Showcase Dev — scratch",
  robots: { index: false, follow: false },
};

/**
 * SCRATCH ROUTE — Phase 1 + Phase 2 integration checkpoint.
 *
 * Renders the full `BuilderShowcase` composition with mock data so the
 * Figma design can be verified at 360 / 768 / 1024 / 1536 widths.
 *
 * T2.1 uses this route to exercise `CodeEditorPanel mode="reveal"` —
 * the typewriter cascade triggers on scroll-into-view.
 *
 * This route is deleted in T3.3 (SkillsSectionV2 cutover) — do NOT link
 * to it from production navigation.
 */
export default function ShowcaseDevPage() {
  const snippet = SKILL_SNIPPETS[0];

  return (
    <main className="min-h-[100dvh] bg-background">
      <BuilderShowcase
        editor={
          <CodeEditorPanel
            filename={snippet.filename}
            language={snippet.language}
            lines={snippet.rawLines}
            mode="reveal"
            lineDelayMs={140}
          />
        }
        preview={
          <LivePreviewFrame
            url="https://phonghub.cloud"
            status="active"
            mode="screenshot"
          />
        }
        terminal={<TerminalStrip lines={SHOWCASE_BUILD_LOG} />}
      />
    </main>
  );
}
