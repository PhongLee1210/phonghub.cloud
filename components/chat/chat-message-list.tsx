"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { StarButton } from "@/components/chat/star-button";
import { ThinkingChecklist } from "@/components/chat/thinking-checklist";
import { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatMessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export const ChatMessageList = ({
  messages,
  isStreaming,
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
      className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.map((message) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.22, ease: "easeOut" }}
          className={cn(
            "flex max-w-[85%] flex-col gap-2",
            message.role === "user" ? "self-end items-end" : "self-start items-start"
          )}
        >
          <div
            className={cn(
              "whitespace-pre-wrap break-words rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
              message.role === "user"
                ? "rounded-br-sm bg-primary text-primary-foreground"
                : "rounded-bl-sm bg-muted text-foreground",
              message.error && "border border-destructive/50"
            )}
          >
            {message.content}
            {isStreaming &&
              message.id === lastMessage?.id &&
              message.role === "assistant" &&
              message.content && (
                <span
                  aria-hidden="true"
                  className="ml-0.5 inline-block h-3.5 w-[7px] animate-pulse bg-foreground/65 align-[-2px]"
                />
              )}
          </div>
          {message.action === "star_repo" && <StarButton variant="inline" />}
        </motion.div>
      ))}

      {showThinkingChecklist && <ThinkingChecklist />}
    </div>
  );
};
