import Link from "next/link";

import { Icons } from "@/components/common/icons";
import { Button } from "@/components/ui/button";
import { AnimatedSection } from "@/components/common/animated-section";
import { AnimatedText } from "@/components/common/animated-text";
import { ValidSkills } from "@/config/constants";
import { SKILLS } from "@/config/skills";
import { pagesConfig } from "@/config/pages";
import { filterProjectsByTechStack } from "@/lib/data/projects";

import { RelatedProject } from "./skill-detail-panel";
import { SkillsGraphLoader } from "./skills-graph-loader";

function buildProjectsBySkill(): Record<string, RelatedProject[]> {
  const entries = SKILLS.map((skill) => {
    const projects = filterProjectsByTechStack(skill.name as ValidSkills)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
      .map((project) => ({
        id: project.id,
        title: project.organization.name,
        date: project.startDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
      }));
    return [skill.name, projects] as const;
  });
  return Object.fromEntries(entries);
}

/**
 * SkillsSectionV2 — home page skills section. Renders `<SkillsGraph>`, an
 * interactive constellation of connected skill nodes (click a node to
 * recenter the graph and see its detail + related projects), plus the
 * "View All → /skills" link.
 *
 * Server component — precomputes the skill→project lookup so the client
 * graph never needs the full `PROJECTS` dataset.
 */
export interface SkillsSectionV2Props {
  className?: string;
}

export function SkillsSectionV2({ className }: SkillsSectionV2Props) {
  const projectsBySkill = buildProjectsBySkill();

  return (
    <AnimatedSection
      direction="right"
      className={[
        "mx-auto w-full max-w-7xl space-y-8 px-4 py-16 md:px-6 md:py-24",
        className ?? "",
      ].join(" ")}
      id="skills"
    >
      <div className="flex max-w-[42rem] flex-col items-start space-y-4 text-left">
        <AnimatedText
          as="h2"
          className="font-heading text-3xl leading-[1.1] md:text-5xl"
        >
          {pagesConfig.skills.title}
        </AnimatedText>
        <AnimatedText
          as="p"
          delay={0.2}
          className="leading-normal text-muted-foreground sm:text-lg sm:leading-7"
        >
          {pagesConfig.skills.description}
        </AnimatedText>
      </div>

      <SkillsGraphLoader skills={SKILLS} projectsBySkill={projectsBySkill} />

      <AnimatedText delay={0.4} className="flex justify-start">
        <Link href="/skills" prefetch={false}>
          <Button variant="outline" className="rounded-xl">
            <Icons.chevronDown className="mr-2 h-4 w-4" aria-hidden />
            <span>View All</span>
          </Button>
        </Link>
      </AnimatedText>
    </AnimatedSection>
  );
}

export default SkillsSectionV2;
