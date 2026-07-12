"use client";

import { motion, Variants } from "framer-motion";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import * as React from "react";

import { Icons } from "@/components/common/icons";
import { MobileNav } from "@/components/common/mobile-nav";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface MainNavProps {
  items: any[];
  children?: React.ReactNode;
}

const navItemVariants: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 * i,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "light"
      ? "/logo/phonghub-grayscale.png"
      : "/logo/phonghub.png";

  React.useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  React.useEffect(() => {
    const colors = [
      "hsl(var(--primary))",
      "hsl(var(--accent))",
      "hsl(var(--destructive))",
      "hsl(var(--muted-foreground))",
      "#4ecdc4",
      "#feca57",
    ];

    const interval = setInterval(() => {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      setList100Color(randomColor);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!items.length) return null;

  const leftItems = items.slice(0, 3);
  const rightItems = items.slice(3);

  const renderItem = (item: any, index: number) => (
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
          "flex items-center text-sm font-medium transition-colors hover:text-foreground/80 relative",
          item.href.startsWith(`/${segment}`)
            ? "text-foreground"
            : "text-foreground/60",
          item.disabled && "cursor-not-allowed opacity-80",
          item.href === "/list100" && [
            "animate-pulse text-gradient-animated",
          ]
        )}
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
  );

  return (
    <nav className="absolute left-[40px] right-[40px] top-[24px] z-[100] flex items-center justify-between">
      {/* Desktop: left nav items */}
      <nav className="hidden gap-6 md:flex">
        {leftItems.map((item, index) => renderItem(item, index))}
      </nav>

      {/* Desktop: centered logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="absolute left-1/2 hidden -translate-x-1/2 md:block"
      >
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src={logoSrc}
            alt={siteConfig.authorName}
            width={120}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>
      </motion.div>

      {/* Desktop: right nav items + ModeToggle */}
      <nav className="hidden items-center gap-5 md:flex">
        {rightItems.map((item, index) => renderItem(item, index))}
        {children}
      </nav>

      {/* Mobile: logo left + hamburger right */}
      <div className="flex w-full items-center justify-between md:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src={logoSrc}
              alt={siteConfig.authorName}
              width={120}
              height={40}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </motion.div>
        <div className="flex items-center gap-3">
          {children}
          <motion.button
            className="flex items-center space-x-2"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showMobileMenu ? <Icons.close /> : <Icons.menu />}
          </motion.button>
        </div>
      </div>

      {showMobileMenu && <MobileNav items={items}>{children}</MobileNav>}
    </nav>
  );
}
