"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { THINKING_STEP_LABELS } from "@/config/chat";
import { ThinkingPhase } from "@/types/chat";
import { cn } from "@/lib/utils";

import { CheckIcon } from "./check-icon";
import styles from "./thinking-reasoning.module.css";

const ROW_H = 16;
const GAP = 3;
const MAX_H = ROW_H * 5 + GAP * 4;

export interface ThinkingReasoningProps {
  /** Raw step keys (e.g. "search_projects") — mapped via THINKING_STEP_LABELS before display. */
  steps: string[];
  phase: ThinkingPhase;
  elapsedMs?: number;
}

export function ThinkingReasoning({
  steps: rawSteps,
  phase,
  elapsedMs,
}: ThinkingReasoningProps) {
  const reducedMotion = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const traceRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [lineHeight, setLineHeight] = useState(0);

  const steps = rawSteps.map((s) => THINKING_STEP_LABELS[s] ?? s);
  const count = steps.length;
  const elapsedS = elapsedMs ? Math.max(1, Math.round(elapsedMs / 1000)) : null;

  const contentH = count * ROW_H + Math.max(0, count - 1) * GAP;
  const capped = contentH > MAX_H;
  const viewH = Math.min(contentH, MAX_H);

  useEffect(() => {
    if (phase !== ThinkingPhase.Thinking) return;
    const el = viewportRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [count, phase]);

  useLayoutEffect(() => {
    if (traceRef.current) setLineHeight(traceRef.current.offsetHeight);
  }, [steps.length, phase]);

  const mask = capped
    ? "linear-gradient(to bottom, transparent 0, black 8px, black calc(100% - 8px), transparent 100%)"
    : "none";

  if (phase === ThinkingPhase.Thinking && count === 0) {
    return (
      <div
        role="status"
        aria-label="Assistant is thinking"
        className="flex w-fit items-center gap-1 self-start rounded-chat rounded-tl-sm border border-chat-border bg-chat-thinking px-3 py-2.5"
      >
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lavender/60 [animation-delay:-0.3s] motion-reduce:animate-none" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lavender/60 [animation-delay:-0.15s] motion-reduce:animate-none" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-lavender/60 motion-reduce:animate-none" />
      </div>
    );
  }

  if (phase === ThinkingPhase.Thinking) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: reducedMotion ? 0 : 0.32,
          ease: [0.22, 1, 0.36, 1],
        }}
        role="status"
        aria-label="Assistant is thinking"
        className="flex w-full flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="hsl(var(--muted-foreground))"
            aria-hidden="true"
            className={cn("flex-shrink-0", styles.trShiverIcon)}
          >
            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
          </svg>
          <span className={styles.trShimmer}>Thinking…</span>
        </div>

        <div
          ref={viewportRef}
          className={cn(
            "border-l-2 border-lavender/25 pl-2.5 overflow-hidden",
            capped &&
              "overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          )}
          style={{
            height: `${viewH}px`,
            WebkitMaskImage: mask,
            maskImage: mask,
            transition: reducedMotion
              ? "none"
              : "height 360ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div
            className="flex flex-col"
            style={{
              gap: `${GAP}px`,
              transition: reducedMotion
                ? "none"
                : "transform 560ms cubic-bezier(0.22,1,0.36,1)",
              willChange: "transform",
            }}
          >
            {steps.map((step, i) => {
              const isLast = i === count - 1;
              return (
                <motion.div
                  key={`${i}-${step}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.42,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex items-center gap-1.5"
                  style={{ height: `${ROW_H}px` }}
                >
                  {isLast ? (
                    <span className={styles.stepDot} />
                  ) : (
                    <CheckIcon key={`check-${i}`} className={styles.stepCheck} />
                  )}
                  <p className={styles.trSentence}>{step}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: reducedMotion ? 0 : 0.32,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="flex flex-col"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Toggle thought process"
        className="-mx-1.5 flex w-fit cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 transition-colors duration-100 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="hsl(var(--muted-foreground) / 0.45)"
          aria-hidden="true"
          className="flex-shrink-0"
        >
          <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
        </svg>
        <span
          className="whitespace-nowrap text-[13px] font-medium text-muted-foreground"
          style={
            reducedMotion
              ? undefined
              : { animation: "fade-in 350ms ease-out both" }
          }
        >
          Thought{elapsedS ? ` for ${elapsedS}s` : ""}
        </span>
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          aria-hidden="true"
          className="flex-shrink-0 opacity-50"
          style={{
            transition: reducedMotion
              ? "none"
              : "transform 300ms cubic-bezier(0.23,1,0.32,1)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path
            d="M6 9l6 6 6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.4, ease: [0.23, 1, 0.32, 1] }
        }
        style={{ overflow: "hidden" }}
      >
        <div className="relative ml-[5px] pl-4">
          <span
            aria-hidden
            className="absolute left-0.5 w-px"
            style={{
              height: lineHeight ? lineHeight - 2 : 0,
              background: "hsl(var(--lavender) / 0.3)",
              transition: reducedMotion
                ? "none"
                : "height 500ms cubic-bezier(0.23,1,0.32,1)",
            }}
          />
          <div
            ref={traceRef}
            className="flex flex-col"
            style={{ gap: `${GAP}px` }}
          >
            {steps.map((step, i) => (
              <div
                key={`done-${i}`}
                className="flex items-center gap-1.5"
                style={
                  reducedMotion
                    ? undefined
                    : {
                        animation: `fade-up 320ms cubic-bezier(0.23,1,0.32,1) ${i * 80}ms both`,
                      }
                }
              >
                <CheckIcon className={styles.stepCheck} />
                <p className={styles.trSentence}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
