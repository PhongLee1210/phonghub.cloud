"use client";

import { usePathname } from "next/navigation";

import { ChatWidget } from "@/components/chat/chat-widget";

interface GlobalChatWidgetProps {
  isMobile?: boolean;
}

export const GlobalChatWidget = ({ isMobile }: GlobalChatWidgetProps) => {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <ChatWidget isMobile={isMobile} />;
};
