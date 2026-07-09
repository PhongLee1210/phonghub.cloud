"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { StarButton } from "@/components/chat/star-button";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import { Icons } from "@/components/common/icons";
import { chatConfig } from "@/config/chat";
import { useChatStore } from "@/hooks/use-chat-store";
import { useLockBody } from "@/hooks/use-lock-body";
import { siteConfig } from "@/config/site";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  launcherRef: React.RefObject<HTMLButtonElement | null>;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])';

export const ChatPanel = ({ isOpen, onClose, launcherRef }: ChatPanelProps) => {
  const {
    messages,
    status,
    suggestions,
    errorMessage,
    sendMessage,
    stopStreaming,
    reset,
  } = useChatStore();

  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 480px)");
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

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

  const retryLastMessage = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) sendMessage(lastUser.content);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={`Chat with ${siteConfig.authorName}'s AI assistant`}
          onKeyDown={handleTrapTab}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed bottom-0 right-0 z-[59] flex h-[100dvh] w-full flex-col overflow-hidden border-border bg-card text-card-foreground shadow-[0_24px_64px_hsl(var(--foreground)/0.22)] min-[481px]:bottom-24 min-[481px]:right-6 min-[481px]:h-[560px] min-[481px]:max-h-[calc(100vh-8rem)] min-[481px]:w-[380px] min-[481px]:max-w-[calc(100vw-3rem)] min-[481px]:rounded-2xl min-[481px]:border"
        >
          <header className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-3.5">
            <div className="relative flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {siteConfig.authorName.charAt(0)}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <strong className="block truncate text-sm">
                {siteConfig.authorName.split(" ")[0]}&rsquo;s AI assistant
              </strong>
              <span className="text-xs text-muted-foreground">
                Ask me anything about his work
              </span>
            </div>
            <StarButton variant="icon" />
            <button
              type="button"
              title="Reset conversation"
              aria-label="Reset conversation"
              onClick={reset}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icons.reset className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Close"
              aria-label="Close chat"
              onClick={onClose}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icons.close className="h-4 w-4" />
            </button>
          </header>

          <ChatMessageList
            messages={messages}
            isStreaming={status === "streaming"}
          />

          {status === "error" && errorMessage && (
            <div className="mx-4 mb-2 flex flex-shrink-0 items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs">
              <span className="text-foreground">{errorMessage}</span>
              <button
                type="button"
                onClick={retryLastMessage}
                className="flex-shrink-0 font-semibold text-foreground underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {status === "streaming" ? (
            <div className="flex flex-shrink-0 justify-center px-4 pb-3">
              <button
                type="button"
                onClick={stopStreaming}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Stop generating
              </button>
            </div>
          ) : (
            <SuggestionChips suggestions={suggestions} onSelect={sendMessage} />
          )}

          <ChatInput
            disabled={status === "streaming"}
            onSubmit={sendMessage}
          />

          <p className="flex-shrink-0 pb-2.5 text-center text-[0.65rem] text-muted-foreground">
            {chatConfig.footnote}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
