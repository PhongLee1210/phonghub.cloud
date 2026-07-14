"use client";

import { BookOpen, Code2, FolderOpen, House, Mail } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", Icon: House },
  { href: "/projects", label: "Projects", Icon: FolderOpen },
  { href: "/skills", label: "Skills", Icon: Code2 },
  { href: "/blogs", label: "Blog", Icon: BookOpen },
  { href: "/contact", label: "Contact", Icon: Mail },
] as const;

export const BottomTabBar = () => {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "bottom-tab-bar",
        "fixed inset-x-0 bottom-0 z-[90] md:hidden",
        "pb-[var(--safe-bottom,0px)]",
        "border-t border-border/50",
        "bg-background/80 backdrop-blur-xl backdrop-saturate-[180%]"
      )}
    >
      <div className="flex items-center justify-around px-2 pb-1 pt-2">
        {TABS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                "flex min-h-[48px] min-w-[48px] flex-col items-center gap-0.5 rounded-xl px-3 py-2",
                "transition-colors active:bg-foreground/[0.08]"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
