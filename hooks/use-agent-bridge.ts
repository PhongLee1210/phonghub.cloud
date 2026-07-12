"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useChatStore } from "@/hooks/use-chat-store";

export function useAgentBridge() {
  const router = useRouter();
  const pendingNavigate = useChatStore((s) => s.pendingNavigate);
  const clearNavigate = useChatStore((s) => s.clearNavigate);

  useEffect(() => {
    if (!pendingNavigate) return;
    router.push(pendingNavigate);
    clearNavigate();
  }, [pendingNavigate, router, clearNavigate]);

  return { pendingNavigate };
}
