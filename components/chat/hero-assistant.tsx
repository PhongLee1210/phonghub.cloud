"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { AssistantPanel } from "@/components/chat/assistant-panel";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Icons } from "@/components/common/icons";
import { useChatStore } from "@/hooks/use-chat-store";

const HINT_DELAY_MS = 5000;

interface HeroAssistantProps {
  isMobile?: boolean;
}

export const HeroAssistant = ({ isMobile }: HeroAssistantProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const revealedRef = useRef(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const { isOpen, setOpen, hydrate } = useChatStore();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    setIsMounted(true);
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isWidgetOpen || revealedRef.current) return;

    const timer = setTimeout(() => {
      revealedRef.current = true;
      setShowHint(true);
    }, HINT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isWidgetOpen]);

  if (!isMounted) return null;

  return (
    <>
      {/* Mobile: launcher + floating panel */}
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
          isMobile={isMobile}
        />
      </div>

      {/* Desktop: circle FAB toggles the widget */}
      {!isWidgetOpen && (
        <div className="fixed bottom-[max(42px,calc(var(--safe-bottom,0px)+24px))] right-[48px] z-30 hidden items-center gap-3 md:flex">
          <AnimatePresence>
            {showHint && (
              <motion.button
                type="button"
                onClick={() => {
                  setShowHint(false);
                  setIsWidgetOpen(true);
                }}
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
          <motion.button
            type="button"
            aria-label="Open AI chat"
            onClick={() => {
              setShowHint(false);
              setIsWidgetOpen(true);
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", damping: 28, stiffness: 200, mass: 0.8 }
            }
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-chat-launcher text-foreground shadow-lavender-glow transition-transform active:scale-[0.94] hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="relative flex h-5 w-5 items-center justify-center">
              <Icons.chatBubble className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-[1.5px] border-background bg-success" />
            </span>
          </motion.button>
        </div>
      )}

      {/* Desktop: floating chat widget inside hero */}
      {isWidgetOpen && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", damping: 28, stiffness: 200, mass: 0.8 }
          }
          className="fixed right-[60px] top-[80px] z-20 hidden w-[380px] md:block"
        >
          <div className="relative flex h-[calc(100dvh-120px)] max-h-[640px] min-h-[440px] flex-col overflow-hidden rounded-[28px] bg-chat-bg shadow-large">
            <AssistantPanel onClose={() => setIsWidgetOpen(false)} />
          </div>
        </motion.div>
      )}
    </>
  );
};
