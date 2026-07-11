"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

import { HeroAssistant } from "@/components/chat/hero-assistant";
import { PhotoCollage } from "@/components/home/photo-collage";
import { Icons } from "@/components/common/icons";
import { buttonVariants } from "@/components/ui/button";
import { exploringTopics, heroCopy } from "@/config/home";
import { SocialLinks } from "@/config/socials";
import { cn } from "@/lib/utils";

export const Hero = () => {
  const reducedMotion = useReducedMotion();

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reducedMotion ? 0 : 0.5,
      delay: reducedMotion ? 0 : delay,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  });

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div className="container grid gap-12 py-24 md:py-32 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col items-start gap-6 text-left">
          <motion.p
            {...fadeUp(0)}
            className="text-sm font-medium text-muted-foreground"
          >
            {heroCopy.greeting}
          </motion.p>

          <motion.h1
            {...fadeUp(0.05)}
            className="font-heading text-4xl leading-tight sm:text-5xl md:text-6xl"
          >
            {heroCopy.name}
          </motion.h1>

          <motion.p
            {...fadeUp(0.1)}
            className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            {heroCopy.intro}
          </motion.p>

          <motion.div {...fadeUp(0.15)}>
            <Link
              href="#projects"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-lavender text-lavender-foreground hover:bg-lavender/90"
              )}
            >
              View my work
            </Link>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="flex flex-col gap-2 pt-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Exploring
            </span>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {exploringTopics.map((topic) => {
                const Icon = Icons[topic.icon];
                return (
                  <li key={topic.label}>
                    <span className="flex items-center gap-1.5 text-sm text-foreground/80 transition-opacity hover:opacity-70">
                      <Icon className="h-4 w-4" />
                      {topic.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          <motion.div {...fadeUp(0.25)} className="flex gap-4 pt-2">
            {SocialLinks.map((social) => (
              <Link
                key={social.name}
                href={social.link}
                target="_blank"
                rel="noreferrer"
                aria-label={social.name}
                className="rounded-sm text-muted-foreground transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <social.icon className="h-5 w-5" />
              </Link>
            ))}
            <Link
              href="/contact"
              aria-label="Contact"
              className="rounded-sm text-muted-foreground transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icons.gmail className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>

        <PhotoCollage />
      </div>

      <HeroAssistant />
    </section>
  );
};
