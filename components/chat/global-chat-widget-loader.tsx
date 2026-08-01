"use client";

import dynamic from "next/dynamic";

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
  return <GlobalChatWidget isMobile={isMobile} />;
}
