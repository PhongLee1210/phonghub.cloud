import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Icons } from "@/components/common/icons";
import ProjectDescription from "@/components/projects/project-description";
import AdaptiveImage from "@/components/ui/adaptive-image";
import { buttonVariants } from "@/components/ui/button";
import ChipContainer from "@/components/ui/chip-container";
import CustomTooltip from "@/components/ui/custom-tooltip";
import { PROJECTS } from "@/config/projects";
import { siteConfig } from "@/config/site";
import { getApiBaseUrl } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export async function generateStaticParams() {
  const { projects } = await fetch(`${getApiBaseUrl()}/api/projects`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .catch(() => ({ projects: PROJECTS }));

  return projects.map((project: { id: string }) => ({
    projectId: project.id,
  }));
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const project = PROJECTS.find((val) => val.id === projectId);
  if (!project) redirect("/projects");

  return (
    <article className="container relative max-w-3xl mx-auto px-4 py-6 lg:py-10">
      <Link
        href="/projects"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4")}
      >
        <Icons.chevronLeft className="mr-2 h-4 w-4" />
        All Projects
      </Link>
      <div>
        <time
          dateTime={project.startDate.toISOString()}
          className="block text-sm text-muted-foreground"
        >
          {formatDate(project.startDate)}
        </time>
        <h1 className="flex items-center justify-between mt-2 font-heading text-4xl leading-tight lg:text-5xl">
          {project.companyName}
          <div className="flex items-center">
            {project.githubLink && (
              <CustomTooltip text="Link to the source code.">
                <Link href={project.githubLink} target="_blank">
                  <Icons.gitHub className="w-6 ml-4 text-muted-foreground hover:text-foreground" />
                </Link>
              </CustomTooltip>
            )}
            {project.websiteLink && (
              <CustomTooltip text="Please note that some project links may be temporarily unavailable.">
                <Link href={project.websiteLink} target="_blank">
                  <Icons.externalLink className="w-6 ml-4 text-muted-foreground hover:text-foreground " />
                </Link>
              </CustomTooltip>
            )}
          </div>
        </h1>
        <ChipContainer textArr={project.category} />
        <div className="mt-4 flex space-x-4">
          <Link
            href={siteConfig.links.github}
            className="flex items-center space-x-2 text-sm"
          >
            <Image
              src="/me.JPG"
              alt={"Phong Lee"}
              width={42}
              height={42}
              className="rounded-full size-[42px] object-cover bg-background"
            />

            <div className="flex-1 text-left leading-tight">
              <p className="font-medium">{"Le Thanh Phong"}</p>
              <p className="text-[12px] text-muted-foreground">
                @{siteConfig.username}
              </p>
            </div>
          </Link>
        </div>
      </div>

      <AdaptiveImage
        src={project.companyLogoImg}
        alt={project.companyName}
        containerClassName="mx-auto my-4"
      />

      <div className="mb-7 ">
        <h2 className="inline-block font-heading text-3xl leading-tight lg:text-3xl mb-2">
          Tech Stack
        </h2>
        <ChipContainer textArr={project.techStack} />
      </div>

      <div className="mb-7 ">
        <h2 className="inline-block font-heading text-3xl leading-tight lg:text-3xl mb-2">
          Description
        </h2>
        {/* {<project.descriptionComponent />} */}
        <ProjectDescription
          paragraphs={project.descriptionDetails.paragraphs}
          bullets={project.descriptionDetails.bullets}
        />
      </div>

      <div className="mb-7 ">
        <h2 className="inline-block font-heading text-3xl leading-tight lg:text-3xl mb-5">
          Page Info
        </h2>
        {project.pagesInfoArr.map((page, ind) => (
          <div key={ind}>
            <h3 className="flex items-center font-heading text-xl leading-tight lg:text-xl mt-3">
              <Icons.star className="h-5 w-5 mr-2" /> {page.title}
            </h3>
            <div>
              <p>{page.description}</p>
              {page.imgArr.map((img, ind) => (
                <AdaptiveImage
                  key={ind}
                  src={img}
                  alt={img}
                  containerClassName="mx-auto my-4"
                  priority
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <hr className="mt-12" />
      <div className="flex justify-center py-6">
        <Link
          href="/projects"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          <Icons.chevronLeft className="mr-2 h-4 w-4" />
          All Projects
        </Link>
      </div>
    </article>
  );
}
