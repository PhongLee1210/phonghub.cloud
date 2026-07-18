import { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import Script from "next/script";

import { EXPERIENCES } from "@/config/experience";
import { pagesConfig } from "@/config/pages";
import { PROJECT_SNIPPETS } from "@/config/project-snippets";
import { featuredProjects } from "@/config/projects";
import { siteConfig } from "@/config/site";
import { featuredSkills } from "@/config/skills";
import { listPublishedPosts } from "@/lib/blog/service";

import { AnimatedSection } from "@/components/common/animated-section";
import { AnimatedText } from "@/components/common/animated-text";
import { ClientPageWrapper } from "@/components/common/client-page-wrapper";
import { Icons } from "@/components/common/icons";
import { CareerLog } from "@/components/home/career-log";
import { Hero } from "@/components/home/hero";
import { StackDiagnostic } from "@/components/home/stack-diagnostic";
import { WorkspaceIntro } from "@/components/home/workspace-intro";
import { BlogDispatch } from "@/components/home/blog-dispatch";
import { AnimatedMobileProjectCard } from "@/components/home/animated-mobile-project-card";
import { Button } from "@/components/ui/button";

const ProjectCard = dynamic(() => import("@/components/projects/project-card"));
const ProjectWorkspace = dynamic(
  () => import("@/components/projects/project-workspace")
);
const AnimatedSkillsGrid = dynamic(
  () => import("@/components/skills/animated-skills-grid")
);
const CareerTimeline = dynamic(
  () => import("@/components/experience/career-timeline")
);
const AnimatedBlogGrid = dynamic(
  () => import("@/components/home/animated-blog-grid")
);

export const metadata: Metadata = {
  title: `${pagesConfig.home.metadata.title} | Le Thanh Phong - Software Engineer`,
  description: `${pagesConfig.home.metadata.description} Software engineer with full-stack web development, DevOps, and AI engineering expertise.`,
  alternates: {
    canonical: siteConfig.url,
  },
};

export default async function IndexPage() {
  const featuredPosts = (await listPublishedPosts("content/blog")).slice(0, 3);
  // Structured data for personal portfolio
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.authorName,
    url: siteConfig.url,
    image: siteConfig.ogImage,
    jobTitle: "Software Engineer",
    sameAs: [siteConfig.links.github, siteConfig.links.twitter],
  };

  // Structured data for website as a software application (template)
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Next.js Portfolio Template",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: siteConfig.authorName,
      url: siteConfig.url,
    },
  };

  return (
    <ClientPageWrapper>
      <Script
        id="schema-person"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <Script
        id="schema-software"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      <Hero />
      <AnimatedSection
        className="container space-y-6 bg-muted py-10 my-14"
        id="skills"
      >
        <div className="flex max-w-[42rem] flex-col items-start space-y-4 text-left">
          <AnimatedText
            as="h2"
            className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl"
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
        <StackDiagnostic skillCount={featuredSkills.length} />
        <AnimatedSkillsGrid skills={featuredSkills} />
        <AnimatedText delay={0.4} className="flex justify-start">
          <Link href="/skills" prefetch={false}>
            <Button variant={"outline"} className="rounded-xl">
              <Icons.chevronDown className="mr-2 h-4 w-4" /> View All
            </Button>
          </Link>
        </AnimatedText>
      </AnimatedSection>
      <AnimatedSection
        direction="right"
        className="container space-y-6 py-10 my-14"
        id="projects"
      >
        <div className="flex max-w-[42rem] flex-col items-start space-y-4 text-left">
          <AnimatedText
            as="h2"
            className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl"
          >
            {pagesConfig.projects.title}
          </AnimatedText>
          <AnimatedText
            as="p"
            delay={0.2}
            className="leading-normal text-muted-foreground sm:text-lg sm:leading-7"
          >
            {pagesConfig.projects.description}
          </AnimatedText>
        </div>
        <WorkspaceIntro projectCount={featuredProjects.length} />

        {/* Desktop: workspace split panels */}
        <div className="hidden md:block space-y-10">
          {featuredProjects.map((project) => (
            <ProjectWorkspace
              key={project.id}
              project={project}
              snippet={PROJECT_SNIPPETS.find((s) => s.projectId === project.id)}
            />
          ))}
        </div>

        {/* Mobile: standard cards */}
        <div className="grid gap-4 md:hidden">
          {featuredProjects.map((project, index) => (
            <AnimatedMobileProjectCard
              key={project.id}
              project={project}
              delay={0.1 * (index + 1)}
            />
          ))}
        </div>
        <AnimatedText delay={0.4} className="flex justify-start">
          <Link href="/projects" prefetch={false}>
            <Button variant={"outline"} className="rounded-xl">
              <Icons.chevronDown className="mr-2 h-4 w-4" /> View All
            </Button>
          </Link>
        </AnimatedText>
      </AnimatedSection>
      <AnimatedSection
        direction="left"
        className="container space-y-6 py-10 my-14"
        id="experience"
      >
        <div className="flex max-w-[42rem] flex-col items-start space-y-4 text-left">
          <AnimatedText
            as="h2"
            className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl"
          >
            {pagesConfig.experience.title}
          </AnimatedText>
          <AnimatedText
            as="p"
            delay={0.2}
            className="leading-normal text-muted-foreground sm:text-lg sm:leading-7"
          >
            {pagesConfig.experience.description}
          </AnimatedText>
        </div>
        <CareerLog experienceCount={EXPERIENCES.slice(0, 3).length} />
        <CareerTimeline experiences={EXPERIENCES.slice(0, 3)} />
        <AnimatedText delay={0.4} className="flex justify-start">
          <Link href="/experience" prefetch={false}>
            <Button variant={"outline"} className="rounded-xl">
              <Icons.chevronDown className="mr-2 h-4 w-4" /> View All
            </Button>
          </Link>
        </AnimatedText>
      </AnimatedSection>
      <AnimatedSection
        direction="up"
        className="container space-y-6 bg-muted py-10 my-14"
        id="blog"
      >
        <div className="flex max-w-[42rem] flex-col items-start space-y-4 text-left">
          <AnimatedText
            as="h2"
            className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-5xl"
          >
            {pagesConfig.blogs.title}
          </AnimatedText>
          <AnimatedText
            as="p"
            delay={0.2}
            className="leading-normal text-muted-foreground sm:text-lg sm:leading-7"
          >
            {pagesConfig.blogs.description}
          </AnimatedText>
        </div>
        <BlogDispatch postCount={featuredPosts.length} />
        <AnimatedBlogGrid posts={featuredPosts} />
        <AnimatedText delay={0.4} className="flex justify-start">
          <Link href="/blogs" prefetch={false}>
            <Button variant={"outline"} className="rounded-xl">
              <Icons.chevronDown className="mr-2 h-4 w-4" /> View All
            </Button>
          </Link>
        </AnimatedText>
      </AnimatedSection>
    </ClientPageWrapper>
  );
}
