"use client";

import { motion, useReducedMotion } from "framer-motion";
import { memo, useEffect, useMemo, useRef } from "react";

import { MessageMarkdown } from "@/components/chat/message-markdown";
import { LeadCaptureCard } from "@/components/chat/lead-capture-card";
import { PreviewCard } from "@/components/chat/preview-card";
import { StarButton } from "@/components/chat/star-button";
import { SuggestionChips } from "@/components/chat/suggestion-chips";
import { SuggestionList } from "@/components/chat/suggestion-list";
import { ThinkingReasoning } from "@/components/chat/thinking-reasoning/thinking-reasoning";
import { Icons } from "@/components/common/icons";
import { chatConfig } from "@/config/chat";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";
import { ChatMessage, ThinkingPhase } from "@/types/chat";

interface ChatMessageListProps {
  onSuggestionSelect?: (prompt: string) => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

interface MessageRowProps {
  message: ChatMessage;
  displayContent: string;
  isStreamingLast: boolean;
  isGreeting: boolean;
  showSuggestions: boolean;
  liveThinkingSteps: string[];
  onSuggestionSelect?: (prompt: string) => void;
}

const MessageRow = memo(function MessageRow({
  message,
  displayContent,
  isStreamingLast,
  isGreeting,
  showSuggestions,
  liveThinkingSteps,
  onSuggestionSelect,
}: MessageRowProps) {
  const reducedMotion = useReducedMotion();
  const isUser = message.role === "user";

  // Pre-content thinking state: show ThinkingReasoning as the whole message row.
  if (isStreamingLast && !displayContent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeOut" }}
        className="flex min-w-0 items-start gap-2 self-start"
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-lavender text-lavender-foreground">
          <Icons.aurora className="h-3.5 w-3.5" />
        </span>
        <div className="flex min-w-0 max-w-[80%] flex-col items-start">
          <ThinkingReasoning phase={ThinkingPhase.Thinking} steps={liveThinkingSteps} />
        </div>
      </motion.div>
    );
  }

  // Detect whether this message has a persisted thinking trace.
  const hasThought =
    !isUser &&
    message.thinkingSteps !== undefined &&
    message.thinkingSteps.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeOut" }}
      className={cn(
        "flex min-w-0 gap-2",
        isUser
          ? "self-end flex-row-reverse items-end"
          : "self-start items-start"
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-muted text-muted-foreground"
            : "bg-lavender text-lavender-foreground"
        )}
      >
        {isUser ? (
          <Icons.user className="h-3.5 w-3.5" />
        ) : (
          <Icons.aurora className="h-3.5 w-3.5" />
        )}
      </span>

      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* "Thought for Xs" — collapsed trace above the message bubble */}
        {hasThought && (
          <ThinkingReasoning
            phase={ThinkingPhase.Done}
            steps={message.thinkingSteps!}
            elapsedMs={message.thinkingElapsedMs}
          />
        )}

        <div
          className={cn(
            "break-words rounded-[16px] px-[12px] py-[10px] text-[13px] leading-relaxed",
            isUser
              ? "whitespace-pre-wrap rounded-br-sm border-2 border-chat-bubble-user-border bg-chat-bubble-user text-foreground dark:text-muted-foreground"
              : "rounded-tl-sm border border-chat-border bg-chat-bubble-ai text-foreground dark:text-muted-foreground",
            message.error && isUser && "border-destructive/70",
            message.error && !isUser && "border-destructive/50"
          )}
        >
          {isUser ? (
            displayContent
          ) : (
            <MessageMarkdown
              className="text-foreground dark:text-muted-foreground"
              content={displayContent}
              citations={message.citations}
            />
          )}
          {isStreamingLast && displayContent && (
            <span
              aria-hidden="true"
              className="ml-0.5 inline-block h-3.5 w-[7px] animate-pulse bg-foreground/65 align-[-2px]"
            />
          )}
          {isGreeting && onSuggestionSelect && (
            <SuggestionList
              onSelect={onSuggestionSelect}
              className="mt-[10px]"
            />
          )}
        </div>

        {showSuggestions && message.suggestions && onSuggestionSelect && (
          <SuggestionChips
            suggestions={message.suggestions}
            onSelect={onSuggestionSelect}
            className="mt-1"
          />
        )}
        {message.action === "star_repo" && <StarButton variant="inline" />}
        {message.action === "contact_card" && <PreviewCard />}
        {message.action === "lead_capture" && (
          <LeadCaptureCard leadContext={message.leadContext} />
        )}
        <span className="px-1 text-[0.65rem] text-muted-foreground">
          {isUser && message.error ? (
            <span className="flex items-center gap-1 text-destructive">
              <Icons.warning className="h-3 w-3" />
              Not sent
            </span>
          ) : (
            relativeTime(message.createdAt)
          )}
        </span>
      </div>
    </motion.div>
  );
});

export const ChatMessageList = ({
  onSuggestionSelect,
}: ChatMessageListProps) => {
  const messages = useChatStore((s) => s.messages);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const thinkingSteps = useChatStore((s) => s.thinkingSteps);
  const status = useChatStore((s) => s.status);
  const isStreaming = status === "streaming";

  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      const el = containerRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, streamingContent]);

  const lastAssistantId = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant")?.id,
    [messages]
  );

  const lastIndex = messages.length - 1;

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="scrollbar-macos flex flex-1 flex-col gap-[12px] overflow-x-hidden overflow-y-auto p-[16px] pb-[8px]"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.map((message, index) => {
        const isLast = index === lastIndex;
        const isStreamingLast =
          isStreaming && isLast && message.role === "assistant";
        const displayContent = isStreamingLast
          ? streamingContent
          : message.content;
        const isGreeting =
          index === 0 &&
          message.role === "assistant" &&
          message.content === chatConfig.greeting;
        const showSuggestions =
          !isStreaming &&
          message.role === "assistant" &&
          message.id === lastAssistantId &&
          !!message.suggestions &&
          message.suggestions.length > 0;

        return (
          <MessageRow
            key={message.id}
            message={message}
            displayContent={displayContent}
            isStreamingLast={isStreamingLast}
            isGreeting={isGreeting}
            showSuggestions={showSuggestions}
            liveThinkingSteps={isStreamingLast ? thinkingSteps : []}
            onSuggestionSelect={onSuggestionSelect}
          />
        );
      })}
    </div>
  );
};
