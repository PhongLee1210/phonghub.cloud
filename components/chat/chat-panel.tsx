"use client";

import { AnimatePresence, motion } from "framer-motion";
import { KeyboardEvent as ReactKeyboardEvent, useEffect, useRef } from "react";

import { AssistantPanel } from "@/components/chat/assistant-panel";
import { siteConfig } from "@/config/site";
import { useLockBody } from "@/hooks/use-lock-body";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  launcherRef: React.RefObject<HTMLButtonElement | null>;
  isMobile?: boolean;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

export const ChatPanel = ({
  isOpen,
  onClose,
  launcherRef,
  isMobile = false,
}: ChatPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useLockBody(isOpen && isMobile);

  useEffect(() => {
    if (isOpen) {
      const input = panelRef.current?.querySelector<HTMLTextAreaElement>(
        "textarea"
      );
      input?.focus();
    } else {
      launcherRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [isOpen, onClose]);

  const handleTrapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panelRef.current) return;
    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
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
      {isOpen && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal={isMobile ? "true" : "false"}
          aria-label={`Chat with ${siteConfig.authorName}'s AI assistant`}
          onKeyDown={handleTrapTab}
          initial={isMobile ? { y: "100%" } : { opacity: 0, y: 12, scale: 0.98 }}
          animate={isMobile ? { y: 0 } : { opacity: 1, y: 0, scale: 1 }}
          exit={isMobile ? { y: "100%" } : { opacity: 0, y: 12, scale: 0.98 }}
          transition={
            isMobile
              ? { type: "spring", damping: 32, stiffness: 320, mass: 0.8 }
              : { type: "spring", damping: 28, stiffness: 240 }
          }
          className="fixed inset-x-0 top-[calc(var(--safe-top,0px)+4.5rem)] bottom-[calc(var(--safe-bottom,0px)+4.5rem)] z-[59] flex w-full flex-col overflow-hidden bg-chat-bg text-card-foreground shadow-[0_24px_64px_hsl(var(--foreground)/0.22)] min-[481px]:inset-x-auto min-[481px]:left-auto min-[481px]:top-auto min-[481px]:bottom-20 min-[481px]:right-6 min-[481px]:h-[440px] min-[481px]:max-h-[calc(100vh-6rem)] min-[481px]:w-[300px] min-[481px]:max-w-[calc(100vw-3rem)] min-[481px]:rounded-2xl min-[481px]:border min-[481px]:border-border"
        >
          {isMobile && (
            <div className="flex flex-shrink-0 justify-center pb-1 pt-3">
              <div className="h-1 w-10 rounded-full bg-foreground/20" />
            </div>
          )}
          <AssistantPanel onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
