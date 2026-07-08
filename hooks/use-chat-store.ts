import { create } from "zustand";

import { chatConfig } from "@/config/chat";
import { streamChat } from "@/lib/chat/client";
import { ChatMessage, PersistedChat } from "@/types/chat";

export type ChatStatus = "idle" | "streaming" | "error";

interface ChatStoreState {
  messages: ChatMessage[];
  status: ChatStatus;
  isOpen: boolean;
  suggestions: string[];
  hydrated: boolean;
  errorMessage?: string;
  activeAbort?: () => void;

  hydrate: () => void;
  setOpen: (open: boolean) => void;
  sendMessage: (text: string) => void;
  stopStreaming: () => void;
  reset: () => void;
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

function persist(messages: ChatMessage[]) {
  if (typeof window === "undefined") return;
  const trimmed = messages.slice(-chatConfig.limits.maxPersistedMessages);
  const payload: PersistedChat = {
    version: 1,
    messages: trimmed,
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(
      chatConfig.storageKeys.chat,
      JSON.stringify(payload)
    );
  } catch {
    // localStorage can throw in private-browsing/quota-exceeded edge cases;
    // conversation just won't persist across reloads in that case.
  }
}

function loadPersisted(): ChatMessage[] | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(chatConfig.storageKeys.chat);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PersistedChat;
    if (parsed.version !== 1 || !Array.isArray(parsed.messages)) {
      return undefined; // stale schema — never migrated, per plan §2
    }
    return parsed.messages;
  } catch {
    return undefined;
  }
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],
  status: "idle",
  isOpen: false,
  suggestions: [],
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const persisted = loadPersisted();
    const isOpen =
      typeof window !== "undefined" &&
      window.localStorage.getItem(chatConfig.storageKeys.open) === "1";

    if (persisted && persisted.length > 0) {
      const lastMessage = persisted[persisted.length - 1];
      // Resuming an existing conversation: re-seed the default suggestions
      // unless the assistant is mid-stream (empty trailing assistant
      // message) — contextual suggestions from the last `done` event
      // aren't persisted (plan §2: provider/model info is deliberately not
      // persisted; suggestions are the same kind of ephemeral ops detail).
      const resumedSuggestions =
        lastMessage?.role === "assistant" && !lastMessage.content
          ? []
          : [...chatConfig.seedSuggestions];
      set({
        messages: persisted,
        suggestions: resumedSuggestions,
        hydrated: true,
        isOpen,
      });
    } else {
      const greeting = greetingMessage();
      set({
        messages: [greeting],
        suggestions: [...chatConfig.seedSuggestions],
        hydrated: true,
        isOpen,
      });
      persist([greeting]);
    }
  },

  setOpen: (open: boolean) => {
    set({ isOpen: open });
    if (typeof window !== "undefined") {
      if (open) window.localStorage.setItem(chatConfig.storageKeys.open, "1");
      else window.localStorage.removeItem(chatConfig.storageKeys.open);
    }
  },

  sendMessage: (text: string) => {
    const trimmed = text.trim().slice(0, chatConfig.limits.maxInputChars);
    if (!trimmed || get().status === "streaming") return;

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

    const history = [...get().messages, userMessage];
    set({
      messages: [...history, assistantMessage],
      status: "streaming",
      suggestions: [],
      errorMessage: undefined,
    });
    persist([...history, assistantMessage]);

    const wireMessages = history
      .slice(-chatConfig.limits.maxHistoryMessages)
      .map((m) => ({ role: m.role, content: m.content }));

    const { abort } = streamChat(
      { messages: wireMessages },
      {
        onToken: (delta) => {
          set((state) => {
            const messages = state.messages.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: m.content + delta }
                : m
            );
            return { messages };
          });
        },
        onDone: (suggestions) => {
          set({
            status: "idle",
            suggestions: suggestions ?? [...chatConfig.seedSuggestions],
            activeAbort: undefined,
          });
          persist(get().messages);
        },
        onError: (_code, message) => {
          set((state) => ({
            status: "error",
            errorMessage: message,
            activeAbort: undefined,
            messages: state.messages.map((m) =>
              m.id === assistantMessage.id ? { ...m, error: true } : m
            ),
          }));
          persist(get().messages);
        },
      }
    );

    set({ activeAbort: abort });
  },

  stopStreaming: () => {
    get().activeAbort?.();
    set({ status: "idle", activeAbort: undefined });
    persist(get().messages);
  },

  reset: () => {
    get().activeAbort?.();
    const greeting = greetingMessage();
    set({
      messages: [greeting],
      status: "idle",
      suggestions: [...chatConfig.seedSuggestions],
      errorMessage: undefined,
      activeAbort: undefined,
    });
    persist([greeting]);
  },
}));
