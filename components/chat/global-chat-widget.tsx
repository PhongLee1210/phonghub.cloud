"use client";

import { usePathname } from "next/navigation";

import { ChatWidget } from "@/components/chat/chat-widget";

export const GlobalChatWidget = () => {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <ChatWidget />;
};
