"use client";

import { KeyboardEvent, RefObject, useEffect, useRef } from "react";

import { Icons } from "@/components/common/icons";
import { chatConfig } from "@/config/chat";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  disabled: boolean;
  onSubmit: (text: string) => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}

export const ChatInput = ({ disabled, onSubmit, inputRef }: ChatInputProps) => {
  const draft = useChatStore((s) => s.draft);
  const setDraft = useChatStore((s) => s.setDraft);
  const localRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? localRef;

  const canSend = draft.trim().length > 0 && !disabled;

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [draft, textareaRef]);

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    requestAnimationFrame(autoGrow);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 rounded-chat-lg border border-chat-border bg-chat-input px-2.5 py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-shadow focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
        {/* LEFT: attachment / file button */}
        <button
          type="button"
          aria-label="Attach file"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Icons.paperclip className="h-[15px] w-[15px]" />
        </button>

        {/* MIDDLE: textarea */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={draft}
          maxLength={chatConfig.limits.maxInputChars}
          placeholder="Ask anything about my work.."
          aria-label="Message"
          onChange={(e) => {
            setDraft(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
          className="max-h-24 flex-1 resize-none bg-transparent text-[13px] leading-tight text-foreground outline-none placeholder:text-chat-placeholder"
        />

        {/* RIGHT: mic + send */}
        <button
          type="button"
          aria-label="Voice input"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Icons.mic className="h-[15px] w-[15px]" />
        </button>
        <button
          type="button"
          aria-label="Send"
          disabled={!canSend}
          onClick={submit}
          className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
            "bg-lavender text-lavender-foreground transition-all duration-200",
            "hover:scale-[1.05] active:scale-[0.95]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            !canSend &&
              "cursor-not-allowed opacity-40 hover:scale-100 active:scale-100"
          )}
        >
          <Icons.send className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Footnote BELOW the input — not inside */}
      <p className="text-center text-[0.65rem] leading-tight text-muted-foreground/80">
        {chatConfig.footnote}
      </p>
    </div>
  );
};
