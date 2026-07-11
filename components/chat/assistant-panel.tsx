"use client";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { StarButton } from "@/components/chat/star-button";
import { SuggestionList } from "@/components/chat/suggestion-list";
import { Icons } from "@/components/common/icons";
import { chatConfig } from "@/config/chat";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";

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
  const { messages, status, errorMessage, sendMessage, stopStreaming, reset } =
    useChatStore();

  const retryLastMessage = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) sendMessage(lastUser.content);
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-border px-4 py-3.5">
        <div className="relative flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full bg-lavender text-sm font-bold text-lavender-foreground">
          A
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <strong className="block truncate text-sm">AI Agent</strong>
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
        {onMinimize && (
          <button
            type="button"
            title="Minimize"
            aria-label="Minimize assistant"
            onClick={onMinimize}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icons.chevronDown className="h-4 w-4" />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            title="Close"
            aria-label="Close chat"
            onClick={onClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        )}
      </header>

      <ChatMessageList messages={messages} isStreaming={status === "streaming"} />

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
        <SuggestionList onSelect={sendMessage} />
      )}

      <ChatInput disabled={status === "streaming"} onSubmit={sendMessage} />

      <p className="flex-shrink-0 pb-2.5 text-center text-[0.65rem] text-muted-foreground">
        {chatConfig.footnote}
      </p>
    </div>
  );
};
