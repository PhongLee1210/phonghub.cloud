"use client";

import dynamic from "next/dynamic";

import { PageContextTool } from "@/components/ai/page-context-tool";

const ChatWidget = dynamic(
  () =>
    import("@/components/chat/chat-widget").then((m) => ({
      default: m.ChatWidget,
    })),
  { ssr: false }
);

export function GlobalChatWidgetLoader() {
  return (
    <>
      <PageContextTool />
      <ChatWidget />
    </>
  );
}
