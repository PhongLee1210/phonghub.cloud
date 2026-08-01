import { Metadata } from "next";

import PageContainer from "@/components/common/page-container";
import SkillsWorkspace from "@/components/features/skills/skills-workspace";
import { pagesConfig } from "@/config/pages";
import {
  ISkill,
  SkillCategory,
  SkillCategoryEnum,
  SKILLS,
} from "@/config/skills";

export const metadata: Metadata = {
  title: pagesConfig.skills.metadata.title,
  description: pagesConfig.skills.metadata.description,
};

const CATEGORY_SECTIONS: {
  title: string;
  description: string;
  category: SkillCategoryEnum;
}[] = [
  {
    title: "Languages",
    description: "Core programming and markup/style languages",
    category: SkillCategoryEnum.LANGUAGES,
  },
  {
    title: "Frameworks",
    description: "Full application frameworks across frontend and backend",
    category: SkillCategoryEnum.FRAMEWORKS,
  },
  {
    title: "Frontend",
    description: "UI state, styling, and component libraries",
    category: SkillCategoryEnum.FRONTEND,
  },
  {
    title: "Backend",
    description: "Server-side runtimes, APIs, and data-access layers",
    category: SkillCategoryEnum.BACKEND,
  },
  {
    title: "Databases",
    description: "Relational, NoSQL, and managed data stores",
    category: SkillCategoryEnum.DATABASES,
  },
  {
    title: "Cloud",
    description: "Cloud platforms and hosting infrastructure",
    category: SkillCategoryEnum.CLOUD,
  },
  {
    title: "AI / LLM",
    description: "AI application development and LLM observability",
    category: SkillCategoryEnum.AI_LLM,
  },
  {
    title: "DevOps",
    description: "Containerization, CI/CD, and build tooling",
    category: SkillCategoryEnum.DEVOPS,
  },
  {
    title: "Developer Tools",
    description: "Version control, testing, and database management tools",
    category: SkillCategoryEnum.DEVELOPER_TOOLS,
  },
];

export default function SkillsPage() {
  const categories: SkillCategory[] = CATEGORY_SECTIONS.map((section) => ({
    title: section.title,
    description: section.description,
    skills: SKILLS.filter(
      (skill: ISkill) => skill.category === section.category
    ),
  })).filter((section) => section.skills.length > 0);

  return (
    <PageContainer
      title={pagesConfig.skills.title}
      description={pagesConfig.skills.description}
    >
      <SkillsWorkspace categories={categories} />
    </PageContainer>
  );
}
