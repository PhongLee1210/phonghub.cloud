import { create } from "zustand";

import { chatConfig } from "@/config/chat";
import { streamChat } from "@/lib/chat/client";
import { ChatMessage, Conversation, PersistedChat, PersistedChatV2 } from "@/types/chat";

export type ChatStatus = "idle" | "streaming" | "error";

interface ChatStoreState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  status: ChatStatus;
  isOpen: boolean;
  suggestions: string[];
  thinkingSteps: string[];
  hydrated: boolean;
  errorMessage?: string;
  activeAbort?: () => void;

  hydrate: () => void;
  setOpen: (open: boolean) => void;
  sendMessage: (text: string) => void;
  stopStreaming: () => void;
  reset: () => void;
  newChat: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function greetingMessage(): ChatMessage {
  return {
    id: genId(),
    role: "assistant",
    content: chatConfig.greeting,
    createdAt: Date.now(),
  };
}

function createConversation(): Conversation {
  const now = Date.now();
  return {
    id: genId(),
    title: "New chat",
    messages: [greetingMessage()],
    createdAt: now,
    updatedAt: now,
  };
}

function deriveTitle(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "New chat";
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
}

const STORAGE_KEY_V2 = "phonghub.chat.v2";

function persist(
  conversations: Conversation[],
  activeConversationId: string | null
) {
  if (typeof window === "undefined") return;
  const payload: PersistedChatV2 = {
    version: 2,
    conversations: conversations.slice(-50),
    activeConversationId,
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
  } catch {
    // localStorage can throw in private-browsing/quota-exceeded edge cases
  }
}

function loadPersisted():
  | { conversations: Conversation[]; activeConversationId: string | null }
  | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const rawV2 = window.localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as PersistedChatV2;
      if (parsed.version === 2 && Array.isArray(parsed.conversations)) {
        return {
          conversations: parsed.conversations,
          activeConversationId: parsed.activeConversationId,
        };
      }
    }
    // Migrate from v1
    const rawV1 = window.localStorage.getItem(chatConfig.storageKeys.chat);
    if (rawV1) {
      const parsed = JSON.parse(rawV1) as PersistedChat;
      if (
        parsed.version === 1 &&
        Array.isArray(parsed.messages) &&
        parsed.messages.length > 0
      ) {
        const firstUser = parsed.messages.find((m) => m.role === "user");
        const conv: Conversation = {
          id: genId(),
          title: firstUser ? deriveTitle(firstUser.content) : "New chat",
          messages: parsed.messages,
          createdAt: parsed.messages[0]?.createdAt ?? Date.now(),
          updatedAt: parsed.updatedAt ?? Date.now(),
        };
        return { conversations: [conv], activeConversationId: conv.id };
      }
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function syncMessages(
  conversations: Conversation[],
  activeId: string | null
): ChatMessage[] {
  const active = conversations.find((c) => c.id === activeId);
  return active ? active.messages : [];
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  status: "idle",
  isOpen: false,
  suggestions: [],
  thinkingSteps: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const loaded = loadPersisted();

    if (loaded && loaded.conversations.length > 0) {
      const conversations = loaded.conversations;
      const activeId =
        loaded.activeConversationId &&
        conversations.some((c) => c.id === loaded.activeConversationId)
          ? loaded.activeConversationId
          : conversations[0].id;
      set({
        conversations,
        activeConversationId: activeId,
        messages: syncMessages(conversations, activeId),
        suggestions: [...chatConfig.seedSuggestions],
        hydrated: true,
        isOpen: false,
      });
    } else {
      const conv = createConversation();
      set({
        conversations: [conv],
        activeConversationId: conv.id,
        messages: conv.messages,
        suggestions: [...chatConfig.seedSuggestions],
        hydrated: true,
        isOpen: false,
      });
      persist([conv], conv.id);
    }
  },

  setOpen: (open: boolean) => {
    set({ isOpen: open });
  },

  sendMessage: (text: string) => {
    const trimmed = text.trim().slice(0, chatConfig.limits.maxInputChars);
    if (!trimmed || get().status === "streaming") return;

    const { conversations, activeConversationId } = get();
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    if (!activeConv) return;

    const userMessage: ChatMessage = {
      id: genId(),
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    const assistantMessage: ChatMessage = {
      id: genId(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    const updatedMessages = [...activeConv.messages, userMessage, assistantMessage];
    const shouldRetitle =
      activeConv.messages.length <= 1 &&
      (activeConv.title === "New chat" || !activeConv.title);
    const updatedConv: Conversation = {
      ...activeConv,
      title: shouldRetitle ? deriveTitle(trimmed) : activeConv.title,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };
    const updatedConversations = conversations.map((c) =>
      c.id === activeConv.id ? updatedConv : c
    );

    set({
      conversations: updatedConversations,
      messages: updatedMessages,
      status: "streaming",
      suggestions: [],
      thinkingSteps: [],
      errorMessage: undefined,
    });
    persist(updatedConversations, activeConversationId);

    const wireMessages = [...activeConv.messages, userMessage]
      .slice(-chatConfig.limits.maxHistoryMessages)
      .map((m) => ({ role: m.role, content: m.content }));

    const { abort } = streamChat(
      { messages: wireMessages },
      {
        onToken: (delta) => {
          set((state) => {
            const newMessages = state.messages.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: m.content + delta }
                : m
            );
            const newConversations = state.conversations.map((c) =>
              c.id === activeConversationId
                ? { ...c, messages: newMessages }
                : c
            );
            return {
              messages: newMessages,
              conversations: newConversations,
              ...(state.thinkingSteps.length > 0
                ? { thinkingSteps: [] }
                : {}),
            };
          });
        },
        onThinking: (step) => {
          set((state) => ({
            thinkingSteps: [...state.thinkingSteps, step],
          }));
        },
        onAction: (action) => {
          set((state) => {
            const newMessages = state.messages.map((m) =>
              m.id === assistantMessage.id ? { ...m, action } : m
            );
            const newConversations = state.conversations.map((c) =>
              c.id === activeConversationId
                ? { ...c, messages: newMessages }
                : c
            );
            return { messages: newMessages, conversations: newConversations };
          });
        },
        onDone: (suggestions) => {
          set((state) => {
            const newConversations = state.conversations.map((c) =>
              c.id === activeConversationId
                ? { ...c, messages: state.messages, updatedAt: Date.now() }
                : c
            );
            return {
              status: "idle",
              suggestions: suggestions ?? [...chatConfig.seedSuggestions],
              thinkingSteps: [],
              activeAbort: undefined,
              conversations: newConversations,
            };
          });
          persist(get().conversations, get().activeConversationId);
        },
        onError: (_code, message) => {
          set((state) => {
            const newMessages = state.messages.map((m) =>
              m.id === assistantMessage.id ? { ...m, error: true } : m
            );
            const newConversations = state.conversations.map((c) =>
              c.id === activeConversationId
                ? { ...c, messages: newMessages }
                : c
            );
            return {
              status: "error",
              errorMessage: message,
              thinkingSteps: [],
              activeAbort: undefined,
              messages: newMessages,
              conversations: newConversations,
            };
          });
          persist(get().conversations, get().activeConversationId);
        },
      }
    );

    set({ activeAbort: abort });
  },

  stopStreaming: () => {
    get().activeAbort?.();
    set((state) => {
      const newConversations = state.conversations.map((c) =>
        c.id === state.activeConversationId
          ? { ...c, messages: state.messages, updatedAt: Date.now() }
          : c
      );
      return { status: "idle", thinkingSteps: [], activeAbort: undefined, conversations: newConversations };
    });
    persist(get().conversations, get().activeConversationId);
  },

  reset: () => {
    get().activeAbort?.();
    const { conversations, activeConversationId } = get();
    const greeting = greetingMessage();
    const updatedConversations = conversations.map((c) =>
      c.id === activeConversationId
        ? { ...c, title: "New chat", messages: [greeting], updatedAt: Date.now() }
        : c
    );
    set({
      conversations: updatedConversations,
      messages: [greeting],
      status: "idle",
      suggestions: [...chatConfig.seedSuggestions],
      thinkingSteps: [],
      errorMessage: undefined,
      activeAbort: undefined,
    });
    persist(updatedConversations, activeConversationId);
  },

  newChat: () => {
    get().activeAbort?.();
    const conv = createConversation();
    set((state) => ({
      conversations: [conv, ...state.conversations],
      activeConversationId: conv.id,
      messages: conv.messages,
      status: "idle",
      suggestions: [...chatConfig.seedSuggestions],
      thinkingSteps: [],
      errorMessage: undefined,
      activeAbort: undefined,
    }));
    persist(get().conversations, conv.id);
  },

  selectConversation: (id: string) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    get().activeAbort?.();
    set({
      activeConversationId: id,
      messages: conv.messages,
      status: "idle",
      suggestions: [...chatConfig.seedSuggestions],
      thinkingSteps: [],
      errorMessage: undefined,
      activeAbort: undefined,
    });
  },

  deleteConversation: (id: string) => {
    get().activeAbort?.();
    const { conversations, activeConversationId } = get();
    const remaining = conversations.filter((c) => c.id !== id);

    if (remaining.length === 0) {
      const conv = createConversation();
      set({
        conversations: [conv],
        activeConversationId: conv.id,
        messages: conv.messages,
        status: "idle",
        suggestions: [...chatConfig.seedSuggestions],
        thinkingSteps: [],
        errorMessage: undefined,
        activeAbort: undefined,
      });
      persist([conv], conv.id);
    } else {
      const wasActive = activeConversationId === id;
      const newActiveId = wasActive
        ? remaining[0].id
        : (activeConversationId ?? remaining[0].id);
      set({
        conversations: remaining,
        activeConversationId: newActiveId,
        thinkingSteps: [],
        messages: wasActive
          ? remaining[0].messages
          : syncMessages(remaining, activeConversationId),
      });
      persist(remaining, newActiveId);
    }
  },
}));
