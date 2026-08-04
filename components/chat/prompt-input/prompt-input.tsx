"use client";

import { Paperclip } from "lucide-react";
import { KeyboardEvent, RefObject, useEffect, useRef } from "react";

import { chatConfig } from "@/config/chat";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";

import styles from "./prompt-input.module.css";

interface PromptInputProps {
  disabled: boolean;
  onSubmit: (text: string) => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}

function SendIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

export function PromptInput({ disabled, onSubmit, inputRef }: PromptInputProps) {
  const draft = useChatStore((s) => s.draft);
  const setDraft = useChatStore((s) => s.setDraft);
  const status = useChatStore((s) => s.status);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const localRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = inputRef ?? localRef;

  const isStreaming = status === "streaming";
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
    <div className={styles.wrap}>
      <div className={styles.frame}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={draft}
          maxLength={chatConfig.limits.maxInputChars}
          placeholder="Ask anything about my work…"
          aria-label="Message"
          onChange={(e) => {
            setDraft(e.target.value);
            autoGrow();
          }}
          onKeyDown={handleKeyDown}
          className={styles.field}
        />

        <div className={styles.row}>
          <button
            type="button"
            aria-label="Attach file"
            className={cn(styles.iconBtn, styles.attach)}
          >
            <Paperclip size={14} />
          </button>

          <div className={styles.right}>
            {isStreaming ? (
              <button
                type="button"
                aria-label="Stop generating"
                onClick={stopStreaming}
                className={cn(styles.iconBtn, styles.stop)}
              >
                <StopIcon />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Send"
                disabled={!canSend}
                onClick={submit}
                className={cn(
                  styles.iconBtn,
                  styles.send,
                  canSend && styles.sendActive
                )}
              >
                <SendIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      <p className={styles.footnote}>{chatConfig.footnote}</p>
    </div>
  );
}
