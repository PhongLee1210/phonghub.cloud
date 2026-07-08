"use client";

import { useEffect, useRef, useState } from "react";

import { ChatLauncher } from "@/components/chat/chat-launcher";
import { ChatPanel } from "@/components/chat/chat-panel";
import { useChatStore } from "@/hooks/use-chat-store";

export const ChatWidget = () => {
  const [isMounted, setIsMounted] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const { isOpen, setOpen, hydrate } = useChatStore();

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
      />
    </>
  );
};
