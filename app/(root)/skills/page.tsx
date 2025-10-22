import { Metadata } from "next";

import PageContainer from "@/components/common/page-container";
import SkillsSection from "@/components/skills/skills-section";
import { pagesConfig } from "@/config/pages";
import { skillCategories } from "@/config/skills";

export const metadata: Metadata = {
  title: pagesConfig.skills.metadata.title,
  description: pagesConfig.skills.metadata.description,
};

export default function SkillsPage() {
  return (
    <PageContainer
      title={pagesConfig.skills.title}
      description={pagesConfig.skills.description}
    >
      <SkillsSection categories={skillCategories} />
    </PageContainer>
  );
}
