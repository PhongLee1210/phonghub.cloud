"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import { useTheme } from "next-themes";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import * as React from "react";

import { Icons } from "@/components/common/icons";
import { MobileNavSheet } from "@/components/common/mobile-nav-sheet";
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
      type: "spring",
      damping: 28,
      stiffness: 200,
      mass: 0.8,
      delay: 0.1 * i,
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
          item.href === "/list100" && ["animate-pulse text-gradient-animated"]
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
    <>
      <nav
        className="fixed left-0 right-0 top-0 z-[100] px-4 pb-2 pt-[max(12px,var(--safe-top,12px))]"
      >
        <div
          className={cn(
            "nav-material",
            "flex items-center justify-between",
            "rounded-2xl border border-white/[0.12]",
            "bg-background/60 px-4 py-2.5",
            "backdrop-blur-xl backdrop-saturate-[180%]",
            "shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_1px_8px_rgba(0,0,0,0.06)]",
            "dark:border-white/[0.06] dark:bg-background/50"
          )}
        >
          {/* Desktop: left nav items */}
          <nav className="hidden gap-6 md:flex">
            {leftItems.map((item, index) => renderItem(item, index))}
          </nav>

          {/* Desktop: centered logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 28, stiffness: 200 }}
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
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 28, stiffness: 200 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Link href="/contact" aria-label="Contact">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Icons.send className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
            {children}
          </nav>

          {/* Mobile: logo left + hamburger right */}
          <div className="flex w-full items-center justify-between md:hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 28, stiffness: 200 }}
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
              <Link href="/contact" aria-label="Contact">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                  <Icons.send className="h-4 w-4" />
                </span>
              </Link>
              {children}
              <motion.button
                className="flex min-h-[44px] min-w-[44px] items-center justify-center -mr-2"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={showMobileMenu ? "Close menu" : "Open menu"}
                aria-expanded={showMobileMenu}
              >
                {showMobileMenu ? <Icons.close /> : <Icons.menu />}
              </motion.button>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showMobileMenu && (
          <MobileNavSheet
            items={items}
            onClose={() => setShowMobileMenu(false)}
          >
            {children}
          </MobileNavSheet>
        )}
      </AnimatePresence>
    </>
  );
}
