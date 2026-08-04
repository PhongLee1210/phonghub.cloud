"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { AssistantPanel } from "@/components/chat/assistant-panel";
import { ChatLauncher } from "@/components/chat/chat-launcher";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Icons } from "@/components/common/icons";
import { useAgentBridge } from "@/hooks/use-agent-bridge";
import { useChatStore } from "@/hooks/use-chat-store";

const HINT_DELAY_MS = 5000;

export const ChatWidget = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const revealedRef = useRef(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const { isOpen, setOpen, hydrate } = useChatStore();
  const reducedMotion = useReducedMotion();

  useAgentBridge();

  useEffect(() => {
    hydrate();

    const mq = window.matchMedia("(max-width: 480px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
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

      {/* Desktop: circle FAB with hint bubble */}
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

      {/* Desktop: floating chat widget with morph animation */}
      <AnimatePresence>
        {isWidgetOpen && (
          <motion.div
            style={{ transformOrigin: "bottom right" }}
            initial={{ opacity: 0, scale: 0.06, borderRadius: "56px" }}
            animate={{ opacity: 1, scale: 1, borderRadius: "28px" }}
            exit={{ opacity: 0, scale: 0.06, borderRadius: "56px" }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { type: "spring", damping: 24, stiffness: 280, mass: 0.9 }
            }
            className="fixed bottom-[110px] right-[60px] z-[58] hidden w-[380px] overflow-hidden bg-chat-bg shadow-[0_24px_64px_hsl(var(--foreground)/0.22)] md:block"
          >
            <div className="relative flex h-[calc(100dvh-190px)] max-h-[640px] min-h-[440px] flex-col overflow-hidden">
              <AssistantPanel onClose={() => setIsWidgetOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
