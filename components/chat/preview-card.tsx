"use client";

import Link from "next/link";
import { useState } from "react";

import { Icons } from "@/components/common/icons";
import { CONTACT_INFO } from "@/config/contact";
import { SocialLinks } from "@/config/socials";
import { cn } from "@/lib/utils";

const SOCIAL_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Github: Icons.github,
  LinkedIn: Icons.linkedin,
  Twitter: Icons.twitter,
  Facebook: Icons.facebook,
};

interface PreviewCardProps {
  className?: string;
}

export const PreviewCard = ({ className }: PreviewCardProps) => {
  const [phoneVisible, setPhoneVisible] = useState(false);
  const { name, email, phone } = CONTACT_INFO;

  return (
    <div
      className={cn(
        "group relative mt-2 w-fit min-w-[220px] overflow-hidden rounded-lg border border-border bg-background/60 p-3 text-[12px]",
        className
      )}
    >
      {/* Contact overlay — slides in from outside the right edge on hover */}
      <Link
        href="/contact"
        className="absolute right-3 top-2.5 flex items-center gap-1 rounded-full border border-primary/20 bg-background px-2.5 py-1 text-[10px] font-medium text-primary shadow-sm translate-x-[calc(100%+12px)] opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0 group-hover:opacity-100"
      >
        Contact
        <Icons.arrowRight className="h-2.5 w-2.5" />
      </Link>

      {/* Header */}
      <span className="block font-semibold text-foreground">{name}</span>

      <div className="my-2 border-t border-border/60" />

      {/* Email */}
      <a
        href={`mailto:${email}`}
        className="flex items-center gap-2 rounded-lg px-1 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Icons.gmail className="h-3 w-3 flex-shrink-0" />
        <span>{email}</span>
      </a>

      {/* Phone */}
      <div className="flex items-center gap-2 rounded-lg px-1 py-1 text-muted-foreground">
        <span className="text-[11px] leading-none">{phone.flag}</span>
        <span
          className={cn(
            "transition-all duration-200",
            !phoneVisible && "select-none blur-[3px]"
          )}
        >
          {phoneVisible ? phone.display : phone.masked}
        </span>
        <button
          type="button"
          onClick={() => setPhoneVisible((v) => !v)}
          aria-label={phoneVisible ? "Hide phone number" : "Show phone number"}
          className="ml-auto rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          {phoneVisible ? (
            <Icons.eyeOff className="h-3 w-3" />
          ) : (
            <Icons.eye className="h-3 w-3" />
          )}
        </button>
      </div>

      <div className="my-2 border-t border-border/60" />

      {/* Socials */}
      <div className="flex items-center gap-1.5">
        {SocialLinks.map((social) => {
          const Icon = SOCIAL_ICON_MAP[social.name];
          return (
            <a
              key={social.name}
              href={social.link}
              target="_blank"
              rel="noopener noreferrer"
              title={`${social.name} — ${social.username}`}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground transition-all duration-150 hover:scale-110 hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              {Icon && <Icon className="h-3 w-3" />}
            </a>
          );
        })}
      </div>
    </div>
  );
};
