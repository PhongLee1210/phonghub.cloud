"use client";

import { useCallback, useEffect, useRef } from "react";

import type { AiCommandId, ShowcaseSection, TerminalLine } from "./commands";
import { streamShowcasePatch } from "./stream-client";
import { useShowcaseStore } from "./store";

/**
 * useShowcaseStream — wires `AiCommandToolbar`'s `onSelect` callback to
 * the `/api/showcase/patch` endpoint and threads the streamed events
 * into the showcase Zustand store. Selecting `reset` clears the store
 * without hitting the network; any other command opens an NDJSON
 * stream and dispatches `code-delta` / `terminal` / `done` / `error`
 * events to the caller's callbacks.
 */
export interface UseShowcaseStreamArgs {
  section: ShowcaseSection;
  subjectName: string;
  tags?: readonly string[];
  currentCode?: readonly string[];
  hint?: string;

  onCodeDelta?: (text: string) => void;
  onTerminal?: (line: TerminalLine) => void;
  onError?: (message: string, code?: string) => void;
}

export interface UseShowcaseStreamResult {
  activeAction: AiCommandId | null;
  onSelect: (id: AiCommandId) => void;
  isStreaming: boolean;
}

export function useShowcaseStream({
  section,
  subjectName,
  tags,
  currentCode,
  hint,
  onCodeDelta,
  onTerminal,
  onError,
}: UseShowcaseStreamArgs): UseShowcaseStreamResult {
  const activeAction = useShowcaseStore((s) => s.activeAction);
  const setActiveAction = useShowcaseStore((s) => s.setActiveAction);
  const setPhase = useShowcaseStore((s) => s.setPhase);
  const reset = useShowcaseStore((s) => s.reset);

  // Keep latest callbacks in a ref so the fetch loop doesn't capture
  // stale closures. Written in an effect to satisfy `react-hooks/refs`.
  const cbRef = useRef({ onCodeDelta, onTerminal, onError });
  useEffect(() => {
    cbRef.current = { onCodeDelta, onTerminal, onError };
  }, [onCodeDelta, onTerminal, onError]);

  const abortFnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      abortFnRef.current?.();
    };
  }, []);

  const onSelect = useCallback(
    (id: AiCommandId) => {
      abortFnRef.current?.();
      abortFnRef.current = null;

      if (id === "reset") {
        reset();
        return;
      }

      setActiveAction(id);
      setPhase("coding");

      const { abort } = streamShowcasePatch(
        {
          section,
          command: id,
          context: {
            subjectName,
            tags: tags ? [...tags] : undefined,
            currentCode: currentCode ? [...currentCode] : undefined,
            hint,
          },
        },
        {
          onCodeDelta: (text) => cbRef.current.onCodeDelta?.(text),
          onTerminal: (line) => cbRef.current.onTerminal?.(line),
          onDone: () => {
            setActiveAction(null);
            setPhase("compiled");
            abortFnRef.current = null;
          },
          onError: (message, code) => {
            setActiveAction(null);
            setPhase("idle");
            abortFnRef.current = null;
            cbRef.current.onError?.(message, code);
          },
        },
      );

      abortFnRef.current = abort;
    },
    [
      section,
      subjectName,
      tags,
      currentCode,
      hint,
      setActiveAction,
      setPhase,
      reset,
    ],
  );

  return {
    activeAction,
    onSelect,
    isStreaming: activeAction !== null,
  };
}
