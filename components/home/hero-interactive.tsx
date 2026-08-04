"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

import smileIcon from "@/assets/icons/smile-icon.svg";
import { Icons } from "@/components/common/icons";
import { SocialButton } from "@/components/common/social-button";
import { exploringTopics, heroCopy } from "@/config/home";
import { SocialLinks } from "@/config/socials";

export const HeroInteractive = () => {
  const reducedMotion = useReducedMotion();

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: reducedMotion
      ? { duration: 0 }
      : {
          type: "spring" as const,
          damping: 28,
          stiffness: 200,
          mass: 0.8,
          delay,
        },
  });

  return (
    <div
      className="
        relative z-[2] flex flex-col gap-5 px-5
        pt-[calc(var(--safe-top,0px)+5rem)]
        pb-8
        lg:absolute lg:left-[72px] lg:top-[140px] lg:w-[420px]
        lg:px-0 lg:pt-0 lg:pb-0
      "
    >
      <motion.p
        {...fadeUp(0)}
        className="font-karla text-base font-bold tracking-tight text-[#b7b9cb] dark:text-muted-foreground"
      >
        {heroCopy.greeting}
      </motion.p>

      <motion.h1
        {...fadeUp(0.05)}
        className="relative w-fit font-name text-[clamp(2.75rem,9vw,5.25rem)] font-normal leading-[0.95] tracking-[-0.02em] text-[#393f53] dark:text-foreground"
      >
        {heroCopy.name}
        <Image
          src={smileIcon}
          alt=""
          width={20}
          height={14}
          unoptimized
          aria-hidden
          className="pointer-events-none absolute -right-[0.665em] top-[-0.1em] h-[0.35em] w-[0.5em] shrink-0 -rotate-12"
        />
      </motion.h1>

      <motion.p
        {...fadeUp(0.1)}
        className="max-w-[500px] text-[17px] leading-[1.6] text-[#8a8d98] md:text-[18px] dark:text-muted-foreground lg:max-w-[340px]"
      >
        {heroCopy.intro}
      </motion.p>

      <motion.div {...fadeUp(0.15)}>
        <Link
          href="#projects"
          className="inline-flex items-center gap-2 rounded-full bg-[#ebebf0] px-6 py-3 text-sm font-medium text-[#888b9a] transition-[transform,opacity] duration-75 ease-out hover:-translate-y-0.5 hover:bg-[#e1e1ea] active:scale-[0.96] active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-white/10 dark:text-muted-foreground dark:hover:bg-white/15"
        >
          View my work
          <Icons.arrowRight className="h-4 w-4" />
        </Link>
      </motion.div>

      <motion.div {...fadeUp(0.2)} className="flex flex-col gap-[18px] pt-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Exploring
        </span>
        <ul className="flex flex-col gap-[18px]">
          {exploringTopics.map((topic) => {
            const Icon = Icons[topic.icon];
            return (
              <li key={topic.label}>
                <span className="flex items-center gap-2 text-sm text-foreground/80 transition-opacity hover:opacity-70">
                  <Icon className="h-4 w-4" />
                  {topic.label}
                </span>
              </li>
            );
          })}
        </ul>
      </motion.div>

      <motion.div {...fadeUp(0.25)} className="-ml-1.5 flex gap-[18px] pt-2">
        {SocialLinks.map((social) => (
          <SocialButton
            key={social.name}
            href={social.link}
            icon={social.icon}
            aria-label={social.name}
            external
          />
        ))}
        <SocialButton href="/contact" aria-label="Contact" icon={Icons.gmail} />
      </motion.div>
    </div>
  );
};
