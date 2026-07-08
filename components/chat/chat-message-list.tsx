"use client";

import { useEffect, useRef } from "react";

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

  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator =
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
        <div
          key={message.id}
          className={cn(
            "max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
            message.role === "user"
              ? "self-end rounded-br-sm bg-primary text-primary-foreground"
              : "self-start rounded-bl-sm bg-muted text-foreground",
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
      ))}

      {showTypingIndicator && (
        <div className="flex w-fit items-center gap-1 self-start rounded-lg rounded-bl-sm bg-muted px-3.5 py-3">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
