"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { AssistantPanel } from "@/components/chat/assistant-panel";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import { ChatPanel } from "@/components/chat/chat-panel";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";

export const HeroAssistant = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const { isOpen, setOpen, hydrate } = useChatStore();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setIsMounted(true);
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {/* Mobile: launcher + floating panel — the global ChatWidget is suppressed on this route */}
      <div className="md:hidden">
        <ChatLauncher
          ref={launcherRef}
          isOpen={isOpen}
          onClick={() => setOpen(!isOpen)}
        />
        <ChatPanel
          isOpen={isOpen}
          onClose={() => setOpen(false)}
          launcherRef={launcherRef}
        />
      </div>

      {/* Desktop: docked overlay extending upward over the hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0 : 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="fixed bottom-6 right-6 z-40 hidden w-[380px] md:block"
      >
        <div
          className={cn(
            "flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[0_24px_64px_hsl(var(--foreground)/0.18)]",
            isMinimized ? "h-14" : "h-[520px]"
          )}
        >
          {isMinimized ? (
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              aria-label="Expand assistant"
              className="flex h-14 w-full items-center gap-3 px-4 text-left"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-lavender text-sm font-bold text-lavender-foreground">
                A
              </span>
              <span className="text-sm font-medium">Ask me anything</span>
            </button>
          ) : (
            <AssistantPanel onMinimize={() => setIsMinimized(true)} />
          )}
        </div>
      </motion.div>
    </>
  );
};
