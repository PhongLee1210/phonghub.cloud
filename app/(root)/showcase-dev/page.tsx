import type { Metadata } from "next";

import { SkillsShowcase } from "@/components/features/skills/skills-showcase";

export const metadata: Metadata = {
  title: "Showcase Dev — scratch",
  robots: { index: false, follow: false },
};

/**
 * SCRATCH ROUTE — Phase 3 integration checkpoint.
 *
 * Renders the full `SkillsShowcase` composition with real config data so the
 * Figma design can be verified at 360 / 768 / 1024 / 1536 widths before the
 * T3.3 cutover swaps the home-page `#skills` section.
 *
 * This route is deleted in T3.3 (SkillsSectionV2 cutover) — do NOT link
 * to it from production navigation.
 */
export default function ShowcaseDevPage() {
  return (
    <main className="min-h-[100dvh] bg-background">
      <SkillsShowcase />
    </main>
  );
}
