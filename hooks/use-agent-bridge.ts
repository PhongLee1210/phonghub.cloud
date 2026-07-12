"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useReducedMotion } from "framer-motion";

import { HIGHLIGHT_DURATION_MS } from "@/config/chat";
import { useChatStore } from "@/hooks/use-chat-store";
import { resolveEntity } from "@/lib/chat/entity-dom";

export function useAgentBridge() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const pendingNavigate = useChatStore((s) => s.pendingNavigate);
  const clearNavigate = useChatStore((s) => s.clearNavigate);
  const pendingHighlight = useChatStore((s) => s.pendingHighlight);
  const clearHighlight = useChatStore((s) => s.clearHighlight);
  const setActiveHighlight = useChatStore((s) => s.setActiveHighlight);
  const status = useChatStore((s) => s.status);

  useEffect(() => {
    if (!pendingNavigate) return;
    router.push(pendingNavigate);
    clearNavigate();
  }, [pendingNavigate, router, clearNavigate]);

  useEffect(() => {
    if (!pendingHighlight) return;

    const el = resolveEntity(pendingHighlight);
    if (!el) {
      clearHighlight();
      return;
    }

    setActiveHighlight(pendingHighlight);
    el.classList.add("agent-highlighted");
    el.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "center",
    });

    const timer = setTimeout(() => {
      el.classList.remove("agent-highlighted");
      setActiveHighlight(undefined);
      clearHighlight();
    }, HIGHLIGHT_DURATION_MS);

    return () => {
      clearTimeout(timer);
      el.classList.remove("agent-highlighted");
    };
  }, [pendingHighlight, setActiveHighlight, clearHighlight, reducedMotion]);

  return { pendingNavigate, pendingHighlight, status };
}
