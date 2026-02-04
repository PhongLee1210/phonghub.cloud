import { Metadata } from "next";

import PageContainer from "@/components/common/page-container";
import SkillsSection from "@/components/skills/skills-section";
import { pagesConfig } from "@/config/pages";
import {
  ISkill,
  SkillCategory,
  SkillCategoryEnum,
  SKILLS,
} from "@/config/skills";
import { getApiBaseUrl } from "@/lib/api";

export const metadata: Metadata = {
  title: pagesConfig.skills.metadata.title,
  description: pagesConfig.skills.metadata.description,
};

export default async function SkillsPage() {
  const { skills } = await fetch(`${getApiBaseUrl()}/api/skills`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .catch(() => ({ skills: SKILLS }));

  const categories: SkillCategory[] = [
    {
      title: "Frontend Development",
      description:
        "Technologies for building user interfaces and client-side applications",
      skills: skills.filter(
        (skill: ISkill) => skill.category === SkillCategoryEnum.FRONTEND
      ),
    },
    {
      title: "Backend Development",
      description: "Server-side technologies, databases, and API development",
      skills: skills.filter(
        (skill: ISkill) => skill.category === SkillCategoryEnum.BACKEND
      ),
    },
    {
      title: "Cloud & DevOps",
      description:
        "Cloud platforms, deployment tools, and development infrastructure",
      skills: skills.filter(
        (skill: ISkill) => skill.category === SkillCategoryEnum.CLOUD_DEVOPS
      ),
    },
    {
      title: "Collaboration & Tools",
      description:
        "Version control, databases management, and development tools",
      skills: skills.filter(
        (skill: ISkill) =>
          skill.category === SkillCategoryEnum.COLLABORATION_TOOLS
      ),
    },
  ];

  return (
    <PageContainer
      title={pagesConfig.skills.title}
      description={pagesConfig.skills.description}
    >
      <SkillsSection categories={categories} />
    </PageContainer>
  );
}
