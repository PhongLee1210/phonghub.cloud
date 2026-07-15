"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Icons } from "@/components/common/icons";
import { cn } from "@/lib/utils";

const HINT_DELAY_MS = 5000;

interface ChatLauncherProps {
  isOpen: boolean;
  onClick: () => void;
}

export const ChatLauncher = forwardRef<HTMLButtonElement, ChatLauncherProps>(
  ({ isOpen, onClick }, ref) => {
    const [showHint, setShowHint] = useState(false);
    const revealedRef = useRef(false);
    const reducedMotion = useReducedMotion();

    useEffect(() => {
      if (isOpen || revealedRef.current) return;

      const timer = setTimeout(() => {
        revealedRef.current = true;
        setShowHint(true);
      }, HINT_DELAY_MS);

      return () => clearTimeout(timer);
    }, [isOpen]);

    return (
      <div className="fixed bottom-[calc(var(--safe-bottom,0px)+5rem)] right-4 z-[60] flex items-center gap-3 md:bottom-[max(1.5rem,calc(var(--safe-bottom,0px)+0.75rem))] md:right-6">
        <AnimatePresence>
          {showHint && !isOpen && (
            <motion.button
              type="button"
              onClick={onClick}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : { type: "spring", damping: 28, stiffness: 200, mass: 0.8 }
              }
              className="cursor-pointer whitespace-nowrap rounded-full bg-card px-4 py-2 text-sm font-medium text-foreground shadow-md"
            >
              Ask me anything
            </motion.button>
          )}
        </AnimatePresence>
        <button
          ref={ref}
          type="button"
          onClick={onClick}
          aria-label={isOpen ? "Close chat" : "Open chat"}
          aria-expanded={isOpen}
          className={cn(
            "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
            "bg-chat-launcher text-foreground",
            "shadow-[0_4px_16px_hsl(var(--foreground)/0.10)]",
            "transition-transform active:scale-[0.94] hover:scale-[1.05]",
            isOpen && "max-[480px]:hidden"
          )}
        >
          {!isOpen ? (
            <span className="relative flex h-5 w-5 items-center justify-center">
              <Icons.chatBubble className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-[1.5px] border-background bg-success" />
            </span>
          ) : (
            <Icons.close className="h-5 w-5" />
          )}
        </button>
      </div>
    );
  }
);

ChatLauncher.displayName = "ChatLauncher";
