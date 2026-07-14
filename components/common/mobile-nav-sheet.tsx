"use client";

import { AnimatePresence, motion, PanInfo } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";

import { useLockBody } from "@/hooks/use-lock-body";
import { cn } from "@/lib/utils";

interface MobileNavSheetProps {
  items: { title: string; href: string; disabled?: boolean }[];
  onClose: () => void;
  children?: React.ReactNode;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

export function MobileNavSheet({
  items,
  onClose,
  children,
}: MobileNavSheetProps) {
  const pathname = usePathname();
  const sheetRef = React.useRef<HTMLDivElement>(null);
  useLockBody();

  // Escape key dismissal
  React.useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [onClose]);

  // Focus first focusable element on mount
  React.useEffect(() => {
    const first = sheetRef.current?.querySelector<HTMLElement>(
      FOCUSABLE_SELECTOR
    );
    first?.focus();
  }, []);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const shouldDismiss = info.velocity.y > 300 || info.offset.y > 120;
    if (shouldDismiss) onClose();
  };

  const handleTrapTab = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !sheetRef.current) return;
    const focusable = Array.from(
      sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter((el) => !el.hasAttribute("disabled"));
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[49] bg-black/40"
          onClick={onClose}
        />

        {/* Bottom sheet */}
        <motion.div
          ref={sheetRef}
          key="sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          onKeyDown={handleTrapTab}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={handleDragEnd}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{
            type: "spring",
            damping: 32,
            stiffness: 320,
            mass: 0.8,
          }}
          className={cn(
            "mobile-nav-sheet",
            "fixed inset-x-0 bottom-0 z-50 flex flex-col",
            "rounded-t-[28px] bg-background/95 backdrop-blur-xl",
            "pb-[var(--safe-bottom,0px)]",
            "shadow-[0_-4px_32px_rgba(0,0,0,0.15)]"
          )}
        >
          {/* Drag handle */}
          <div className="flex flex-shrink-0 justify-center pb-1 pt-3">
            <div className="h-1 w-10 rounded-full bg-foreground/20" />
          </div>

          <nav className="flex flex-col gap-1 p-4">
            {items.map((item, index) => (
              <Link
                key={index}
                href={item.disabled ? "#" : item.href}
                onClick={!item.disabled ? onClose : undefined}
                className={cn(
                  "flex min-h-[56px] items-center gap-3 rounded-xl px-4 py-4",
                  "text-base font-medium transition-colors",
                  "active:bg-foreground/[0.08]",
                  item.disabled && "cursor-not-allowed opacity-60",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/70",
                  item.href === "/list100" &&
                    "animate-pulse text-gradient-animated"
                )}
              >
                {item.title}
                {item.href === "/list100" && (
                  <span className="ml-1 inline-block h-2 w-2 animate-ping rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          {children && (
            <div className="flex items-center justify-center gap-4 border-t border-border/50 p-4">
              {children}
            </div>
          )}
        </motion.div>
      </>
    </AnimatePresence>
  );
}
