"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { Icons } from "@/components/common/icons";
import { cn } from "@/lib/utils";

const STEPS = ["Searching portfolio", "Reading projects", "Composing answer"];
const STEP_INTERVAL_MS = 200;

export const ThinkingChecklist = () => {
  const reducedMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(
    reducedMotion ? STEPS.length - 1 : 0
  );

  useEffect(() => {
    if (reducedMotion || activeStep >= STEPS.length - 1) return;
    const timer = setTimeout(
      () => setActiveStep((s) => s + 1),
      STEP_INTERVAL_MS
    );
    return () => clearTimeout(timer);
  }, [activeStep, reducedMotion]);

  return (
    <div
      role="status"
      aria-label="Assistant is thinking"
      className="flex w-fit flex-col gap-[8px] self-start rounded-[16px] rounded-bl-sm border border-chat-border bg-chat-thinking px-[14px] py-[12px]"
    >
      <div className="flex items-center gap-1.5 text-lavender-soft-foreground">
        <Icons.aurora className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold tracking-wide">Thinking</span>
      </div>
      {STEPS.map((step, index) => {
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
