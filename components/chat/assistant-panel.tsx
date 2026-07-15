"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { ConversationSidebar } from "@/components/chat/conversation-sidebar";
import { Icons } from "@/components/common/icons";
import { useChatStore } from "@/hooks/use-chat-store";
import { parseEntityId } from "@/lib/chat/protocol";
import { cn } from "@/lib/utils";

const ENTITY_HIGHLIGHT_LABELS: Record<string, string> = {
  project: "project",
  skill: "skill",
  experience: "experience",
  blog: "blog post",
};

interface AssistantPanelProps {
  onMinimize?: () => void;
  onClose?: () => void;
  className?: string;
}

export const AssistantPanel = ({
  onMinimize,
  onClose,
  className,
}: AssistantPanelProps) => {
  const status = useChatStore((s) => s.status);
  const errorMessage = useChatStore((s) => s.errorMessage);
  const activeHighlight = useChatStore((s) => s.activeHighlight);
  const activeFocus = useChatStore((s) => s.activeFocus);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const setDraft = useChatStore((s) => s.setDraft);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const reset = useChatStore((s) => s.reset);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (sidebarOpen) {
          setSidebarOpen(false);
        } else {
          setIsFullscreen(false);
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isFullscreen, sidebarOpen]);

  const retryLastMessage = () => {
    const msgs = useChatStore.getState().messages;
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    if (lastUser) sendMessage(lastUser.content);
  };

  const handleSuggestionSelect = (prompt: string) => {
    setDraft(prompt);
    const el = inputRef.current;
    if (el) {
      el.focus();
      requestAnimationFrame(() => {
        const len = el.value.length;
        el.setSelectionRange(len, len);
      });
    }
  };

  const headerBtnClass =
    "flex h-[28px] w-[28px] items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const messageArea = (
    <>
      <ChatMessageList
        onSuggestionSelect={
          status !== "streaming" ? handleSuggestionSelect : undefined
        }
      />

      {status === "error" && errorMessage && (
        <div className="mx-[14px] mb-2 flex flex-shrink-0 items-center justify-between gap-2 rounded-[12px] border border-destructive/40 bg-destructive/10 px-[12px] py-2 text-xs">
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

      {status === "streaming" && (
        <div className="flex flex-shrink-0 justify-center px-[14px] pb-2">
          <button
            type="button"
            onClick={stopStreaming}
            className="rounded-full border border-[var(--line)] px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Stop generating
          </button>
        </div>
      )}

      {status === "acting" && (activeHighlight || activeFocus) && (
        <div
          role="status"
          aria-live="polite"
          className="mx-[14px] mb-2 flex flex-shrink-0 items-center gap-1.5 rounded-[12px] border border-primary/20 bg-primary/5 px-[12px] py-1.5 text-xs text-muted-foreground"
        >
          <Icons.aurora className="h-3 w-3 animate-pulse text-primary" />
          <span>
            {activeHighlight ? "Highlighting" : "Focusing"} a{" "}
            {ENTITY_HIGHLIGHT_LABELS[
              parseEntityId(activeHighlight ?? activeFocus ?? "")?.kind ?? ""
            ] ?? "section"}{" "}
            on the page
          </span>
        </div>
      )}

      <div className="flex-shrink-0 px-[12px] pb-[12px] pt-1">
        <ChatInput
          disabled={status === "streaming"}
          onSubmit={sendMessage}
          inputRef={inputRef}
        />
      </div>
    </>
  );

  const renderHeader = (fullscreen: boolean) => (
    <header className="flex h-[52px] flex-shrink-0 items-center gap-2 border-b border-chat-border bg-chat-header px-[14px]">
      {fullscreen && (
        <button
          type="button"
          aria-label="Toggle conversations"
          onClick={() => setSidebarOpen(true)}
          className={cn(headerBtnClass, "md:hidden")}
        >
          <Icons.menu className="h-4 w-4" />
        </button>
      )}
      <div className="relative flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-full bg-lavender text-lavender-foreground">
        <Icons.aurora className="h-3.5 w-3.5" />
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-card bg-success" />
      </div>
      <div className="min-w-0 flex-1">
        <strong className="block truncate text-[13px] -mb-1">
          Portfolio Agent
        </strong>
        <span className="text-[11px] text-muted-foreground">
          Phong portfolio assistant
        </span>
      </div>
      <button
        type="button"
        title="Reset conversation"
        aria-label="Reset conversation"
        onClick={reset}
        className={headerBtnClass}
      >
        <Icons.reset className="h-4 w-4" />
      </button>
      <button
        type="button"
        title={fullscreen ? "Exit fullscreen" : "Expand to fullscreen"}
        aria-label={fullscreen ? "Exit fullscreen" : "Expand to fullscreen"}
        onClick={() => setIsFullscreen(!fullscreen)}
        className={headerBtnClass}
      >
        {fullscreen ? (
          <Icons.minimize className="h-4 w-4" />
        ) : (
          <Icons.maximize className="h-4 w-4" />
        )}
      </button>
      {onMinimize && !fullscreen && (
        <button
          type="button"
          title="Minimize"
          aria-label="Minimize assistant"
          onClick={onMinimize}
          className={headerBtnClass}
        >
          <Icons.chevronDown className="h-4 w-4" />
        </button>
      )}
      {onClose && (
        <button
          type="button"
          title="Close"
          aria-label="Close chat"
          onClick={() => {
            if (fullscreen) setIsFullscreen(false);
            onClose();
          }}
          className={headerBtnClass}
        >
          <Icons.close className="h-4 w-4" />
        </button>
      )}
    </header>
  );

  if (isFullscreen && typeof document !== "undefined") {
    return createPortal(
      <div className="fixed inset-0 z-[100] flex bg-chat-bg">
        <aside className="hidden w-[260px] flex-shrink-0 border-r border-chat-border md:block">
          <ConversationSidebar />
        </aside>

        {sidebarOpen && (
          <div
            className="absolute inset-0 z-10 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <aside
              className="absolute left-0 top-0 h-full w-[280px] max-w-[80vw] shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <ConversationSidebar />
            </aside>
          </div>
        )}

        <div className="flex h-full flex-1 flex-col">
          {renderHeader(true)}
          {messageArea}
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className={cn("flex h-full flex-col bg-chat-bg", className)}>
      {renderHeader(false)}
      {messageArea}
    </div>
  );
};
