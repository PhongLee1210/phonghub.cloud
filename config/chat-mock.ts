import type { ChatMessage } from "@/types/chat";

import { chatConfig } from "@/config/chat";

/**
 * ┌─────────────────────────────────────────────────────────────┐
 * │  MOCK DATA — TEMPORARY (remove once UI is approved)          │
 * │  Used to preview the chat widget in a rich state during      │
 * │  development without hitting the API. Delete this file and   │
 * │  the swap in chat-message-list.tsx when done.                │
 * └─────────────────────────────────────────────────────────────┘
 */

const now = Date.now();

/** A representative conversation: greeting → user question → assistant answer. */
export const mockMessages: ChatMessage[] = [
  {
    id: "mock-greeting",
    role: "assistant",
    content: chatConfig.greeting,
    createdAt: now - 1000 * 60 * 2,
  },
  {
    id: "mock-user-1",
    role: "user",
    content: "What type of projects do you usually work on?",
    createdAt: now - 1000 * 60,
  },
  {
    id: "mock-assistant-1",
    role: "assistant",
    content:
      "I mostly build AI agents, full-stack web apps with Next.js, and data dashboards. A recent favorite is GymIntelOps — a gym intelligence platform. Want me to walk you through it?",
    action: "star_repo",
    createdAt: now - 1000 * 30,
  },
];

/** When true, the thinking checklist is force-rendered for visual review. */
export const mockShowThinking = true;
