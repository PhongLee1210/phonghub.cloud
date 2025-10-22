import { Icons } from "@/components/common/icons";
import { buttonVariants } from "@/components/ui/button";
import { pagesConfig } from "@/config/pages";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: `${pagesConfig.resume.metadata.title} | ${siteConfig.authorName} - Software Engineer`,
  description: `${pagesConfig.resume.metadata.description} - Download Le Thanh Phong&apos;s resume in PDF format or view online.`,
  alternates: {
    canonical: `${siteConfig.url}/resume`,
  },
  openGraph: {
    title: `${pagesConfig.resume.metadata.title} | ${siteConfig.authorName}`,
    description: `${pagesConfig.resume.metadata.description} - Professional resume download and online viewing.`,
    url: `${siteConfig.url}/resume`,
    type: "website",
  },
};

export default function ResumePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {pagesConfig.resume.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {pagesConfig.resume.description}
          </p>
        </div>

        {/* PDF Download Section */}
        <div className="mb-8 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center justify-center">
            <Icons.post className="h-16 w-16 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Download Resume</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Download my professional resume in PDF format to view my complete
            work experience, skills, and achievements.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/resume/Phong-Lee-Resume-main.pdf"
              target="_blank"
              className={cn(buttonVariants({ size: "lg" }))}
              aria-label="Download Le Thanh Phong's resume PDF"
            >
              <Icons.download className="mr-2 h-4 w-4" />
              Download PDF
            </Link>

            <Link
              href="/resume/Phong-Lee-Resume-main.pdf"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "lg",
                })
              )}
              aria-label="View Le Thanh Phong's resume in browser"
            >
              <Icons.eye className="mr-2 h-4 w-4" />
              View in Browser
            </Link>
          </div>
        </div>

        {/* Online Resume Section */}
        <div className="mb-8 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="mb-4 flex items-center justify-center">
            <Icons.externalLink className="h-16 w-16 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">View Online Resume</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            View my interactive resume online with a beautiful, responsive
            design that showcases my experience and skills in an engaging
            format.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={siteConfig.links.resume}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }))}
              aria-label="View Le Thanh Phong's online resume"
            >
              <Icons.externalLink className="mr-2 h-4 w-4" />
              View Online Resume
            </Link>

            <Link
              href={siteConfig.links.resume}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({
                  variant: "outline",
                  size: "lg",
                })
              )}
              aria-label="Open online resume in new tab"
            >
              <Icons.externalLink className="mr-2 h-4 w-4" />
              Open in New Tab
            </Link>
          </div>
        </div>

        {/* Alternative Options */}
        <div className="mb-8 rounded-lg border border-dashed bg-muted/50 p-6 text-card-foreground">
          <div className="mb-4 flex items-center justify-center">
            <Icons.infoMark className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Need Help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you&apos;re having trouble accessing the resume, here are some
            alternatives:
          </p>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>• Both options open in new tabs/windows for your convenience</p>
            <p>
              • The PDF download requires a PDF viewer (most browsers have this
              built-in)
            </p>
            <p>• The online version works great on mobile devices</p>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="rounded-lg border bg-primary/5 p-6 text-card-foreground">
          <div className="mb-4 flex items-center justify-center">
            <Icons.contact className="h-12 w-12 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Want to Connect?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            After reviewing my resume, feel free to reach out for opportunities
            or collaborations.
          </p>
          <Link
            href="/contact"
            className={cn(buttonVariants({ size: "lg" }))}
            aria-label="Contact Le Thanh Phong"
          >
            <Icons.contact className="mr-2 h-4 w-4" />
            Contact Me
          </Link>
        </div>
      </div>
    </div>
  );
}
