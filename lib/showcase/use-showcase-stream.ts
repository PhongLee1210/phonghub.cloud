"use client";

import { useCallback, useEffect, useRef } from "react";

import type { AiCommandId, ShowcaseSection, TerminalLine } from "./commands";
import { streamShowcasePatch } from "./stream-client";
import { useShowcaseStore } from "./store";

/**
 * useShowcaseStream — wires `AiCommandToolbar`'s `onSelect` callback to
 * the `/api/showcase/patch` endpoint and threads the streamed events
 * into the showcase Zustand store.
 *
 * The hook returns `{ activeAction, onSelect }`. Pass these straight to
 * `<BuilderShowcase onCommandSelect={onSelect} activeCommandId={activeAction}>`.
 *
 * Behaviour:
 *   - Selecting `reset` → calls `useShowcaseStore.reset()` without
 *     hitting the network (per plan T5.5).
 *   - Selecting any other command →
 *       1. `setActiveAction(command.id)` (drives the pulsing ring on the
 *          toolbar button + clears store highlights).
 *       2. `setPhase("coding")` so the editor/terminal know to start
 *          accumulating.
 *       3. POST `/api/showcase/patch` with the section + context.
 *       4. Each `code-delta` event is appended to a per-command buffer
 *          via `onCodeDelta`. The actual editor + terminal wiring lives
 *          in the consuming components (T5.6) — this hook hands them a
 *          callback they can attach to their internal state.
 *       5. `done` event → `setActiveAction(null)` + `setPhase("compiled")`.
 *       6. `error` event → `setActiveAction(null)` + `setPhase("idle")`
 *          and the caller's `onError` is invoked (toast pattern).
 *
 * The hook owns the AbortController so a new command mid-stream
 * cancels the previous one (single in-flight stream at a time).
 */
export interface UseShowcaseStreamArgs {
  section: ShowcaseSection;
  /** Display name (skill name or project name). */
  subjectName: string;
  tags?: readonly string[];
  currentCode?: readonly string[];
  /** Per-command hint (optional, e.g. user-supplied instruction). */
  hint?: string;

  /** Called for each `code-delta` event. Caller appends to editor state. */
  onCodeDelta?: (text: string) => void;
  /** Called for each `terminal` event. Caller appends to terminal state. */
  onTerminal?: (line: TerminalLine) => void;
  /** Optional toast surface for stream errors. */
  onError?: (message: string, code?: string) => void;
}

export interface UseShowcaseStreamResult {
  activeAction: AiCommandId | null;
  onSelect: (id: AiCommandId) => void;
  /** True while a stream is in flight (UI can show a spinner). */
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

  // Keep latest callbacks in refs so the fetch loop doesn't capture
  // stale closures when the parent re-renders. Updated in an effect to
  // satisfy `react-hooks/refs` (refs should not be written during render).
  const cbRef = useRef({ onCodeDelta, onTerminal, onError });
  useEffect(() => {
    cbRef.current = { onCodeDelta, onTerminal, onError };
  }, [onCodeDelta, onTerminal, onError]);

  // Latest abort function from any in-flight stream. Null when idle.
  const abortFnRef = useRef<(() => void) | null>(null);

  // Cancel any in-flight stream on unmount.
  useEffect(() => {
    return () => {
      abortFnRef.current?.();
    };
  }, []);

  const onSelect = useCallback(
    (id: AiCommandId) => {
      // Cancel any prior in-flight stream — single-stream-per-showcase.
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
            ...(tags ? { tags: [...tags] } : {}),
            ...(currentCode ? { currentCode: [...currentCode] } : {}),
            ...(hint ? { hint } : {}),
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
