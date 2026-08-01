"use client";

import dynamic from "next/dynamic";

import { PageContextTool } from "@/components/ai/page-context-tool";

const GlobalChatWidget = dynamic(
  () =>
    import("@/components/chat/global-chat-widget").then((m) => ({
      default: m.GlobalChatWidget,
    })),
  { ssr: false }
);

export function GlobalChatWidgetLoader({
  isMobile,
}: {
  isMobile?: boolean;
}) {
  return (
    <>
      <PageContextTool />
      <GlobalChatWidget isMobile={isMobile} />
    </>
  );
}
