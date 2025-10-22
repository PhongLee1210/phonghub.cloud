"use client";

import { motion, Variants } from "framer-motion";
import { useTheme } from "next-themes";
import { Norican } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import * as React from "react";

import { Icons } from "@/components/common/icons";
import { MobileNav } from "@/components/common/mobile-nav";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface MainNavProps {
  items?: any[];
  children?: React.ReactNode;
}

const norican = Norican({
  weight: ["400"],
  style: ["normal"],
  subsets: ["latin"],
  display: "swap",
});

// Animation variants for the navigation items
const navItemVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 * i,
      duration: 0.5,
      ease: [0.4, 0.0, 0.2, 1],
    },
  }),
};

export function MainNav({ items, children }: MainNavProps) {
  const segment = useSelectedLayoutSegment();
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false);
  const [list100Color, setList100Color] = React.useState<string>(
    "hsl(var(--primary))"
  );
  const pathname = usePathname();
  const { theme } = useTheme();

  React.useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  // Generate random colors for List 100 using design system colors
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
    <div className="flex gap-6 md:gap-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Link href="/" className="hidden items-center space-x-2 md:flex">
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
      </motion.div>
      {items?.length ? (
        <nav className="hidden gap-6 md:flex items-center">
          {items?.map((item, index) => (
            <motion.div
              key={index}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={navItemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href={item.disabled ? "#" : item.href}
                className={cn(
                  "flex items-center text-xl font-medium transition-colors hover:text-foreground/80 sm:text-sm relative",
                  item.href.startsWith(`/${segment}`)
                    ? "text-foreground"
                    : "text-foreground/60",
                  item.disabled && "cursor-not-allowed opacity-80",
                  item.href === "/list100" && [
                    "animate-pulse",
                    "bg-gradient-to-r from-primary via-accent to-destructive bg-clip-text text-transparent",
                    "hover:from-accent hover:via-destructive hover:to-primary",
                  ]
                )}
                style={
                  item.href === "/list100" &&
                  item.href.startsWith(`/${segment}`)
                    ? {
                        backgroundImage: `linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--destructive)), hsl(var(--primary)))`,
                        backgroundSize: "400% 400%",
                        animation: "gradientShift 3s ease infinite",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }
                    : item.href === "/list100"
                      ? {
                          backgroundImage: `linear-gradient(45deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--destructive)), hsl(var(--primary)))`,
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
            </motion.div>
          ))}
        </nav>
      ) : null}
      <motion.button
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {showMobileMenu ? <Icons.close /> : <Icons.menu />}
        <span className="font-bold">Menu</span>
      </motion.button>
      {showMobileMenu && items && (
        <MobileNav items={items}>{children}</MobileNav>
      )}
    </div>
  );
}
