"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { MessageMarkdown } from "@/components/chat/message-markdown";
import { StarButton } from "@/components/chat/star-button";
import { SuggestionList } from "@/components/chat/suggestion-list";
import { ThinkingChecklist } from "@/components/chat/thinking-checklist";
import { Icons } from "@/components/common/icons";
import { chatConfig } from "@/config/chat";
import { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  /** When provided, suggestion cards render inside the greeting bubble. */
  onSuggestionSelect?: (prompt: string) => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export const ChatMessageList = ({
  messages,
  isStreaming,
  onSuggestionSelect,
}: ChatMessageListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const lastMessage = messages[messages.length - 1];
  const showThinkingChecklist =
    isStreaming && lastMessage?.role === "assistant" && !lastMessage.content;

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col gap-[12px] overflow-y-auto p-[16px] pb-[8px]"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.map((message, index) => {
        const isUser = message.role === "user";
        const isGreeting =
          index === 0 &&
          message.role === "assistant" &&
          message.content === chatConfig.greeting;
        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeOut" }}
            className={cn(
              "flex items-end gap-2",
              isUser ? "self-end flex-row-reverse" : "self-start",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
                isUser
                  ? "bg-muted text-muted-foreground"
                  : "bg-lavender text-lavender-foreground",
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
                isUser ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "break-words rounded-[16px] px-[12px] py-[10px] text-[13px] leading-relaxed",
                  isUser
                    ? "whitespace-pre-wrap rounded-br-sm border-2 border-chat-bubble-user-border bg-chat-bubble-user text-foreground"
                    : "rounded-tl-sm border border-chat-border bg-chat-bubble-ai text-foreground",
                  message.error && "border-destructive/50",
                )}
              >
                {isUser ? (
                  message.content
                ) : (
                  <MessageMarkdown content={message.content} />
                )}
                {isStreaming &&
                  message.id === lastMessage?.id &&
                  message.role === "assistant" &&
                  message.content && (
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
              {message.action === "star_repo" && (
                <StarButton variant="inline" />
              )}
              <span className="px-1 text-[0.65rem] text-muted-foreground">
                {relativeTime(message.createdAt)}
              </span>
            </div>
          </motion.div>
        );
      })}

      {showThinkingChecklist && <ThinkingChecklist />}
    </div>
  );
};
