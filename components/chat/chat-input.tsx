"use client";

import { KeyboardEvent, useRef, useState } from "react";

import { Icons } from "@/components/common/icons";
import { chatConfig } from "@/config/chat";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  disabled: boolean;
  onSubmit: (text: string) => void;
}

export const ChatInput = ({ disabled, onSubmit }: ChatInputProps) => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !disabled;

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  };

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setValue("");
    requestAnimationFrame(autoGrow);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex flex-shrink-0 items-end gap-2 border-t border-border px-4 py-3">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        maxLength={chatConfig.limits.maxInputChars}
        placeholder="Ask about Phong's projects, skills…"
        aria-label="Message"
        onChange={(e) => {
          setValue(e.target.value);
          autoGrow();
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "max-h-24 flex-1 resize-none rounded-md border border-border bg-background px-3 py-2.5",
          "text-sm leading-tight outline-none focus:border-primary/60"
        )}
      />
      <button
        type="button"
        aria-label="Send"
        disabled={!canSend}
        onClick={submit}
        className={cn(
          "flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-md",
          "bg-primary text-primary-foreground transition-opacity",
          !canSend && "opacity-40"
        )}
      >
        <Icons.send className="h-4 w-4" />
      </button>
    </div>
  );
};
