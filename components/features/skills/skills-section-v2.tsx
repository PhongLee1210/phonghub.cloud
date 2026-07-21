import Link from "next/link";

import { Icons } from "@/components/common/icons";
import { Button } from "@/components/ui/button";
import { featuredSkills } from "@/config/skills";

import { SkillsShowcase } from "./skills-showcase";

/**
 * SkillsSectionV2 — Phase 3 cutover replacement for the home page's
 * `<AnimatedSection id="skills">`. Wraps `<SkillsShowcase>` plus the
 * "View All → /skills" link in a section scoped with `.showcase` so the
 * navy theme covers both the composition and the link affordance.
 *
 * Server component — no client hooks. `SkillsShowcase` (client) owns all
 * motion. The outer `<section>` just provides `id="skills"` for hash
 * navigation and the View All link.
 *
 * Replaces (T3.3):
 *   - `<StackDiagnostic>` (home page)
 *   - `<AnimatedSkillsGrid>` (home page)
 *   - Manual `<AnimatedSection>` block on `app/(root)/page.tsx`
 *
 * Standalone `/skills` route is unchanged — still uses the legacy
 * `<SkillsSection>` card grid.
 */
export interface SkillsSectionV2Props {
  /** Override featured skills (defaults to `featuredSkills`). */
  skills?: typeof featuredSkills;
  className?: string;
}

export function SkillsSectionV2({
  skills = featuredSkills,
  className,
}: SkillsSectionV2Props) {
  return (
    <section
      id="skills"
      className={[
        "showcase my-14 bg-background text-foreground",
        className ?? "",
      ].join(" ")}
    >
      <SkillsShowcase skills={skills} />

      {/* View All — kept on the navy surface so the transition from
          showcase to button is seamless. Aligned to the showcase's
          max-w-7xl inner container. */}
      <div className="mx-auto w-full max-w-7xl px-4 pb-6 md:px-6">
        <Link href="/skills" prefetch={false}>
          <Button variant="outline" className="rounded-xl">
            <Icons.chevronDown className="mr-2 h-4 w-4" aria-hidden />
            <span>View All</span>
          </Button>
        </Link>
      </div>
    </section>
  );
}

export default SkillsSectionV2;
