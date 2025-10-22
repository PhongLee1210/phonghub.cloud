import { useTheme } from "next-themes";
import { Norican } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { siteConfig } from "@/config/site";
import { useLockBody } from "@/hooks/use-lock-body";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  items: any[];
  children?: React.ReactNode;
}

const norican = Norican({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

export function MobileNav({ items, children }: MobileNavProps) {
  useLockBody();
  const { theme } = useTheme();
  const [list100Color, setList100Color] = React.useState<string>(
    "hsl(var(--primary))"
  );

  React.useEffect(() => {
    const colors = [
      "hsl(var(--primary))", // Primary color
      "hsl(var(--accent))", // Accent color
      "hsl(var(--destructive))", // Destructive color
      "hsl(var(--muted-foreground))", // Muted foreground
      "#4ecdc4", // Teal (keeping one custom for variety)
      "#feca57", // Yellow (keeping one custom for variety)
    ];

    const interval = setInterval(() => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setList100Color(randomColor);
    }, 3000); // Change color every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-0 top-12 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-top-10 md:hidden"
      )}
    >
      <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src={
              theme === "light"
                ? "/logo/phonghub-grayscale.png"
                : "/logo/phonghub.png"
            }
            alt={siteConfig.authorName}
            width={120}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>
        <nav className="grid grid-flow-row auto-rows-max text-sm">
          {items.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex w-full items-center rounded-md p-2 text-sm font-medium hover:underline relative",
                item.disabled && "cursor-not-allowed opacity-60",
                item.href === "/list100" && "animate-pulse"
              )}
              style={
                item.href === "/list100"
                  ? {
                      background: `linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--destructive)), hsl(var(--primary)))`,
                      backgroundSize: "400% 400%",
                      animation: "gradientShift 3s ease infinite",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }
                  : undefined
              }
            >
              {item.title}
              {item.href === "/list100" && (
                <div
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: list100Color }}
                />
              )}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
