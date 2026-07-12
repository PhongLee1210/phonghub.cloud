"use client";

import { Icons } from "@/components/common/icons";
import { THINKING_STEP_LABELS } from "@/config/chat";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";

export const ThinkingChecklist = () => {
  const serverSteps = useChatStore((s) => s.thinkingSteps);

  if (serverSteps.length === 0) {
    return (
      <div
        role="status"
        aria-label="Assistant is thinking"
        className="flex w-fit items-center gap-1 self-start rounded-chat rounded-bl-sm border border-chat-border bg-chat-thinking px-4 py-4"
      >
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lavender-soft-foreground [animation-delay:-0.3s] motion-reduce:animate-none" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lavender-soft-foreground [animation-delay:-0.15s] motion-reduce:animate-none" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lavender-soft-foreground motion-reduce:animate-none" />
      </div>
    );
  }

  const steps = serverSteps.map((s) => THINKING_STEP_LABELS[s] ?? s);
  const activeStep = steps.length - 1;

  return (
    <div
      role="status"
      aria-label="Assistant is thinking"
      className="flex w-fit flex-col gap-2 self-start rounded-chat rounded-bl-sm border border-chat-border bg-chat-thinking px-3.5 py-3"
    >
      <div className="flex items-center gap-1.5 text-lavender-soft-foreground">
        <Icons.aurora className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold tracking-wide">Thinking</span>
      </div>
      {steps.map((step, index) => {
        const isDone = index < activeStep;
        const isActive = index === activeStep;
        return (
          <div key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
                isDone
                  ? "border-lavender bg-lavender text-lavender-foreground"
                  : "border-border"
              )}
            >
              {isDone && <Icons.check className="h-2.5 w-2.5" />}
            </span>
            <span
              className={cn(
                "text-xs transition-colors duration-200",
                isDone || isActive
                  ? "text-foreground"
                  : "text-muted-foreground/50"
              )}
            >
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
};
