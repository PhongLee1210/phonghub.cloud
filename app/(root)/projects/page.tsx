import { Metadata } from "next";

import PageContainer from "@/components/common/page-container";
import ProjectCard from "@/components/projects/project-card";
import { ResponsiveTabs } from "@/components/ui/responsive-tabs";
import { pagesConfig } from "@/config/pages";
import { PROJECTS, type ProjectInterface } from "@/config/projects";
import { getApiBaseUrl } from "@/lib/api";

export const metadata: Metadata = {
  title: pagesConfig.projects.metadata.title,
  description: pagesConfig.projects.metadata.description,
};

export default async function ProjectsPage() {
  const { projects } = await fetch(`${getApiBaseUrl()}/api/projects`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .catch(() => ({ projects: PROJECTS }));

  const tabItems = [
    {
      value: "all",
      label: "All",
      content: (
        <div className="mx-auto my-4 grid justify-center gap-4 sm:grid-cols-2 lg:grid-cols-3 static">
          {projects.map((project: ProjectInterface) => (
            <ProjectCard project={project} key={project.id} />
          ))}
        </div>
      ),
    },
    {
      value: "personal",
      label: "Personal",
      content: (
        <div className="mx-auto my-4 grid justify-center gap-4 sm:grid-cols-2 lg:grid-cols-3 static">
          {projects
            .filter((project: ProjectInterface) => project.type === "Personal")
            .map((project: ProjectInterface) => (
              <ProjectCard project={project} key={project.id} />
            ))}
        </div>
      ),
    },
    {
      value: "professional",
      label: "Professional",
      content: (
        <div className="mx-auto my-4 grid justify-center gap-4 sm:grid-cols-2 lg:grid-cols-3 static">
          {projects
            .filter(
              (project: ProjectInterface) => project.type === "Professional"
            )
            .map((project: ProjectInterface) => (
              <ProjectCard project={project} key={project.id} />
            ))}
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title={pagesConfig.projects.title}
      description={pagesConfig.projects.description}
    >
      <ResponsiveTabs items={tabItems} defaultValue="all" />
    </PageContainer>
  );
}
