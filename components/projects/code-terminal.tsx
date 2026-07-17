"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { tokenizeLine } from "@/lib/code-tokenizer";
import { EASE_OUT } from "@/lib/motion";
import type { ProjectSnippet } from "@/config/project-snippets";

interface CodeTerminalProps {
  snippet: ProjectSnippet;
  onComplete?: () => void;
  lineDelayMs?: number;
  className?: string;
}

const TOKEN_COLORS: Record<string, string> = {
  keyword: "text-purple-400",
  string: "text-green-400",
  comment: "text-zinc-500 italic",
  number: "text-blue-300",
  default: "text-zinc-200",
};

export default function CodeTerminal({
  snippet,
  onComplete,
  lineDelayMs = 120,
  className = "",
}: CodeTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();

  const [revealedCount, setRevealedCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [compiled, setCompiled] = useState(false);

  const lines = snippet.rawLines;

  useEffect(() => {
    if (isInView && !started) {
      setStarted(true);
    }
  }, [isInView, started]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setRevealedCount(lines.length);
      setCompiled(true);
      onComplete?.();
      return;
    }

    if (!started) return;

    let count = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const reveal = () => {
      count++;
      setRevealedCount(count);
      if (count < lines.length) {
        const timer = setTimeout(reveal, lineDelayMs);
        timers.push(timer);
      } else {
        const doneTimer = setTimeout(() => {
          setCompiled(true);
          onComplete?.();
        }, 200);
        timers.push(doneTimer);
      }
    };

    const startTimer = setTimeout(reveal, lineDelayMs);
    timers.push(startTimer);

    return () => timers.forEach(clearTimeout);
  }, [started, prefersReducedMotion, lines.length, lineDelayMs, onComplete]);

  return (
    <div
      ref={containerRef}
      className={`rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 font-mono text-sm ${className}`}
    >
      {/* Terminal chrome */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-3 text-zinc-400 text-xs">{snippet.filename}</span>
        </div>
        <div className="flex items-center gap-2">
          {compiled && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="text-green-400 text-xs font-medium"
            >
              ✓ compiled
            </motion.span>
          )}
          <span className="text-zinc-600 text-xs uppercase tracking-widest">
            {snippet.language === "typescript" ? "TypeScript" : "Python"}
          </span>
        </div>
      </div>

      {/* Code lines */}
      <div className="p-4 space-y-0 overflow-x-auto">
        {lines.slice(0, revealedCount).map((line, idx) => (
          <div key={idx} className="flex min-h-[1.5em]">
            <span className="select-none text-zinc-600 w-8 shrink-0 text-right pr-4">
              {idx + 1}
            </span>
            <span className="flex-1 whitespace-pre">
              {tokenizeLine(line, snippet.language).map((token, tIdx) => (
                <span key={tIdx} className={TOKEN_COLORS[token.type]}>
                  {token.text}
                </span>
              ))}
              {/* Blinking cursor on the last revealed line only */}
              {idx === revealedCount - 1 && !compiled && (
                <span className="code-cursor text-zinc-200" aria-hidden />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
