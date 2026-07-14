"use client";

import { useEffect, useRef, useState } from "react";

import { ChatLauncher } from "@/components/chat/chat-launcher";
import { ChatPanel } from "@/components/chat/chat-panel";
import { useAgentBridge } from "@/hooks/use-agent-bridge";
import { useChatStore } from "@/hooks/use-chat-store";

interface ChatWidgetProps {
  isMobile?: boolean;
}

export const ChatWidget = ({ isMobile }: ChatWidgetProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const { isOpen, setOpen, hydrate } = useChatStore();

  useAgentBridge();

  useEffect(() => {
    setIsMounted(true);
    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isMounted) return null;

  return (
    <>
      <ChatLauncher
        ref={launcherRef}
        isOpen={isOpen}
        onClick={() => setOpen(!isOpen)}
      />
      <ChatPanel
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        launcherRef={launcherRef}
        isMobile={isMobile}
      />
    </>
  );
};
