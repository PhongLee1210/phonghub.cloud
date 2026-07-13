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
  {
    title: "Design",
    description: "Design and prototyping tools",
    category: SkillCategoryEnum.DESIGN,
  },
  {
    title: "Business",
    description: "Sales and business development skills",
    category: SkillCategoryEnum.BUSINESS,
  },
  {
    title: "Soft Skills",
    description: "Customer-facing and interpersonal skills",
    category: SkillCategoryEnum.SOFT_SKILLS,
  },
];

export default async function SkillsPage() {
  const { skills } = await fetch(`${getApiBaseUrl()}/api/skills`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => res.json())
    .catch(() => ({ skills: SKILLS }));

  const categories: SkillCategory[] = CATEGORY_SECTIONS.map((section) => ({
    title: section.title,
    description: section.description,
    skills: skills.filter(
      (skill: ISkill) => skill.category === section.category
    ),
  })).filter((section) => section.skills.length > 0);

  return (
    <PageContainer
      title={pagesConfig.skills.title}
      description={pagesConfig.skills.description}
    >
      <SkillsSection categories={categories} />
    </PageContainer>
  );
}
