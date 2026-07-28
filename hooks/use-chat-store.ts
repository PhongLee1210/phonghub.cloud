import { create } from "zustand";

import { chatConfig } from "@/config/chat";
import { SKILLS, SkillCategoryEnum } from "@/config/skills";
import { streamChat } from "@/lib/chat/client";
import { findCitation } from "@/lib/chat/entity-dom";
import { pickRandom } from "@/lib/utils";
import {
  AgentCitation,
  AgentEntityId,
  ChatMessage,
  ChatRole,
  Conversation,
  InternalRoute,
  PersistedChat,
  ToolEffectEvent,
} from "@/types/chat";

/** Every field ToolEffectEvent/DoneEvent can deliver a UI effect for. */
type ToolEffectField = keyof Omit<ToolEffectEvent, "type">;

export type GraphCategoryFilter = SkillCategoryEnum | "all";

function firstSkillKeyInCategory(category: GraphCategoryFilter): string | null {
  const pool =
    category === "all"
      ? SKILLS
      : SKILLS.filter((skill) => skill.category === category);
  return pool[0]?.key ?? null;
}

export const ChatStatus = {
  Idle: "idle",
  Streaming: "streaming",
  Acting: "acting",
  Error: "error",
} as const;
export type ChatStatus = (typeof ChatStatus)[keyof typeof ChatStatus];

const NEW_CHAT_TITLE = "New chat";

interface ChatStoreState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  status: ChatStatus;
  isOpen: boolean;
  suggestions: string[];
  thinkingSteps: string[];
  streamingContent: string;
  draft: string;
  pendingNavigate?: InternalRoute;
  pendingHighlight?: AgentEntityId;
  activeHighlight?: AgentEntityId;
  pendingFocus?: AgentEntityId;
  activeFocus?: AgentEntityId;
  pendingOpenModal?: AgentCitation;
  /** Skills graph selection — persistent UI state, not reset on chat reset/newChat. */
  graphActiveCategory: GraphCategoryFilter;
  graphCenterSkillKey: string | null;
  pendingSkillSelect?: AgentEntityId;
  hydrated: boolean;
  errorMessage?: string;
  activeAbort?: () => void;

  hydrate: () => void;
  setOpen: (open: boolean) => void;
  setDraft: (text: string) => void;
  clearNavigate: () => void;
  clearHighlight: () => void;
  setActiveHighlight: (id: AgentEntityId | undefined) => void;
  clearFocus: () => void;
  setActiveFocus: (id: AgentEntityId | undefined) => void;
  clearOpenModal: () => void;
  setGraphCategory: (category: GraphCategoryFilter) => void;
  setGraphCenterSkill: (key: string, category?: SkillCategoryEnum) => void;
  clearSkillSelect: () => void;
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
    role: ChatRole.Assistant,
    content: chatConfig.greeting,
    createdAt: Date.now(),
  };
}

function createConversation(): Conversation {
  const now = Date.now();
  return {
    id: genId(),
    title: NEW_CHAT_TITLE,
    messages: [greetingMessage()],
    createdAt: now,
    updatedAt: now,
  };
}

function deriveTitle(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return NEW_CHAT_TITLE;
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed;
}

function persist(
  conversations: Conversation[],
  activeConversationId: string | null
) {
  if (typeof window === "undefined") return;
  const payload: PersistedChat = {
    conversations: conversations.slice(-50),
    activeConversationId,
    updatedAt: Date.now(),
  };
  try {
    window.localStorage.setItem(
      chatConfig.storageKeys.chat,
      JSON.stringify(payload)
    );
  } catch {
    // localStorage can throw in private-browsing/quota-exceeded edge cases
  }
}

function loadPersisted():
  | { conversations: Conversation[]; activeConversationId: string | null }
  | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(chatConfig.storageKeys.chat);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedChat;
      if (Array.isArray(parsed.conversations)) {
        return {
          conversations: parsed.conversations,
          activeConversationId: parsed.activeConversationId,
        };
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
  status: ChatStatus.Idle,
  isOpen: false,
  suggestions: [],
  thinkingSteps: [],
  streamingContent: "",
  draft: "",
  pendingNavigate: undefined,
  pendingHighlight: undefined,
  activeHighlight: undefined,
  pendingFocus: undefined,
  activeFocus: undefined,
  pendingOpenModal: undefined,
  graphActiveCategory: "all",
  graphCenterSkillKey: null,
  pendingSkillSelect: undefined,
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
        suggestions: pickRandom(chatConfig.seedSuggestions, 3),
        draft: "",
        hydrated: true,
        isOpen: false,
      });
    } else {
      const conv = createConversation();
      set({
        conversations: [conv],
        activeConversationId: conv.id,
        messages: conv.messages,
        suggestions: pickRandom(chatConfig.seedSuggestions, 3),
        draft: "",
        hydrated: true,
        isOpen: false,
      });
      persist([conv], conv.id);
    }
  },

  setOpen: (open: boolean) => {
    set({ isOpen: open });
  },

  setDraft: (text: string) => {
    set({ draft: text });
  },

  clearNavigate: () => {
    set({ pendingNavigate: undefined });
  },

  clearHighlight: () => {
    set({ pendingHighlight: undefined, activeHighlight: undefined });
  },

  setActiveHighlight: (id: AgentEntityId | undefined) => {
    set({ activeHighlight: id });
  },

  clearFocus: () => {
    set({ pendingFocus: undefined, activeFocus: undefined });
  },

  setActiveFocus: (id: AgentEntityId | undefined) => {
    set({ activeFocus: id });
  },

  clearOpenModal: () => {
    set({ pendingOpenModal: undefined });
  },

  setGraphCategory: (category: GraphCategoryFilter) => {
    set({
      graphActiveCategory: category,
      graphCenterSkillKey: firstSkillKeyInCategory(category),
    });
  },

  setGraphCenterSkill: (key: string, category?: SkillCategoryEnum) => {
    set((state) => ({
      graphCenterSkillKey: key,
      graphActiveCategory: category ?? state.graphActiveCategory,
    }));
  },

  clearSkillSelect: () => {
    set({ pendingSkillSelect: undefined });
  },

  sendMessage: (text: string) => {
    const trimmed = text.trim().slice(0, chatConfig.limits.maxInputChars);
    if (!trimmed || get().status === ChatStatus.Streaming) return;

    const { conversations, activeConversationId } = get();
    const activeConv = conversations.find((c) => c.id === activeConversationId);
    if (!activeConv) return;

    const userMessage: ChatMessage = {
      id: genId(),
      role: ChatRole.User,
      content: trimmed,
      createdAt: Date.now(),
    };
    const assistantMessage: ChatMessage = {
      id: genId(),
      role: ChatRole.Assistant,
      content: "",
      createdAt: Date.now(),
    };

    const updatedMessages = [
      ...activeConv.messages,
      userMessage,
      assistantMessage,
    ];
    const shouldRetitle =
      activeConv.messages.length <= 1 &&
      (activeConv.title === NEW_CHAT_TITLE || !activeConv.title);
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
      status: ChatStatus.Streaming,
      suggestions: [],
      thinkingSteps: [],
      streamingContent: "",
      draft: "",
      pendingHighlight: undefined,
      activeHighlight: undefined,
      pendingFocus: undefined,
      activeFocus: undefined,
      pendingOpenModal: undefined,
      pendingSkillSelect: undefined,
      errorMessage: undefined,
    });
    persist(updatedConversations, activeConversationId);

    const wireMessages = [...activeConv.messages, userMessage]
      .slice(-chatConfig.limits.maxHistoryMessages)
      .map((m) => ({ role: m.role, content: m.content }));

    let tokenBuffer = "";
    let rafId: number | null = null;
    const deliveredEffects = new Set<ToolEffectField>();

    const cancelRaf = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const flushTokens = () => {
      rafId = null;
      if (!tokenBuffer) return;
      const delta = tokenBuffer;
      tokenBuffer = "";
      set((s) => ({
        streamingContent: s.streamingContent + delta,
        ...(s.thinkingSteps.length > 0 ? { thinkingSteps: [] } : {}),
      }));
    };

    const { abort } = streamChat(
      { messages: wireMessages },
      {
        onNavigate: (href) => {
          set({ pendingNavigate: href });
        },
        onToken: (delta) => {
          tokenBuffer += delta;
          if (rafId === null) {
            rafId = requestAnimationFrame(flushTokens);
          }
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
        onToolEffect: (effect) => {
          if (get().status !== ChatStatus.Streaming) return;

          set(() => {
            const patch: Partial<ChatStoreState> = {};
            if (effect.highlight !== undefined) {
              deliveredEffects.add("highlight");
              patch.pendingHighlight = effect.highlight;
            }
            if (effect.focus !== undefined) {
              deliveredEffects.add("focus");
              patch.pendingFocus = effect.focus;
            }
            if (effect.openModal !== undefined) {
              deliveredEffects.add("openModal");
              patch.pendingOpenModal = effect.openModal;
            }
            if (effect.navigate !== undefined) {
              deliveredEffects.add("navigate");
              patch.pendingNavigate = effect.navigate;
            }
            if (effect.skillSelect !== undefined) {
              deliveredEffects.add("skillSelect");
              patch.pendingSkillSelect = effect.skillSelect;
            }
            return patch;
          });
        },
        onDone: (done) => {
          if (get().status !== ChatStatus.Streaming) return;

          cancelRaf();
          const finalContent = get().streamingContent + tokenBuffer;
          tokenBuffer = "";

          const resolved = done.suggestions;
          const openModalCitation = findCitation(
            done.citations,
            done.openModal
          );
          const hasCommand = Boolean(
            done.highlight ||
              done.focus ||
              openModalCitation ||
              done.navigate ||
              done.skillSelect
          );
          set((state) => {
            const messages = state.messages.map((m) =>
              m.id === assistantMessage.id
                ? {
                    ...m,
                    content: finalContent,
                    suggestions: resolved,
                    citations: done.citations,
                  }
                : m
            );
            const newConversations = state.conversations.map((c) =>
              c.id === activeConversationId
                ? { ...c, messages, updatedAt: Date.now() }
                : c
            );
            return {
              status: hasCommand ? ChatStatus.Acting : ChatStatus.Idle,
              suggestions: resolved,
              thinkingSteps: [],
              streamingContent: "",
              activeAbort: undefined,
              messages,
              conversations: newConversations,
              pendingHighlight: deliveredEffects.has("highlight")
                ? state.pendingHighlight
                : done.highlight,
              pendingFocus: deliveredEffects.has("focus")
                ? state.pendingFocus
                : done.focus,
              pendingOpenModal: deliveredEffects.has("openModal")
                ? state.pendingOpenModal
                : openModalCitation,
              pendingNavigate: deliveredEffects.has("navigate")
                ? state.pendingNavigate
                : (done.navigate ?? state.pendingNavigate),
              pendingSkillSelect: deliveredEffects.has("skillSelect")
                ? state.pendingSkillSelect
                : done.skillSelect,
            };
          });
          persist(get().conversations, get().activeConversationId);
        },
        onError: (_code, message) => {
          if (get().status !== ChatStatus.Streaming) return;

          cancelRaf();
          const partialContent = get().streamingContent + tokenBuffer;
          tokenBuffer = "";

          set((state) => {
            let newMessages: ChatMessage[];
            if (!partialContent) {
              // No content streamed — drop empty assistant bubble, mark user message as failed
              newMessages = state.messages
                .filter((m) => m.id !== assistantMessage.id)
                .map((m) =>
                  m.id === userMessage.id ? { ...m, error: true } : m
                );
            } else {
              // Partial content streamed — keep assistant bubble with error styling
              newMessages = state.messages.map((m) =>
                m.id === assistantMessage.id
                  ? { ...m, content: partialContent, error: true }
                  : m
              );
            }
            const newConversations = state.conversations.map((c) =>
              c.id === activeConversationId
                ? { ...c, messages: newMessages }
                : c
            );
            return {
              status: ChatStatus.Error,
              errorMessage: message,
              thinkingSteps: [],
              streamingContent: "",
              activeAbort: undefined,
              messages: newMessages,
              conversations: newConversations,
            };
          });
          persist(get().conversations, get().activeConversationId);
        },
      }
    );

    set({
      activeAbort: () => {
        cancelRaf();
        abort();
      },
    });
  },

  stopStreaming: () => {
    get().activeAbort?.();
    set((state) => {
      const partial = state.streamingContent;
      const lastIdx = state.messages.length - 1;
      const newMessages =
        partial && lastIdx >= 0 && state.messages[lastIdx].role === "assistant"
          ? state.messages.map((m, i) =>
              i === lastIdx ? { ...m, content: partial } : m
            )
          : state.messages;
      const newConversations = state.conversations.map((c) =>
        c.id === state.activeConversationId
          ? { ...c, messages: newMessages, updatedAt: Date.now() }
          : c
      );
      return {
        status: ChatStatus.Idle,
        thinkingSteps: [],
        streamingContent: "",
        activeAbort: undefined,
        messages: newMessages,
        conversations: newConversations,
      };
    });
    persist(get().conversations, get().activeConversationId);
  },

  reset: () => {
    get().activeAbort?.();
    const { conversations, activeConversationId } = get();
    const greeting = greetingMessage();
    const updatedConversations = conversations.map((c) =>
      c.id === activeConversationId
        ? {
            ...c,
            title: NEW_CHAT_TITLE,
            messages: [greeting],
            updatedAt: Date.now(),
          }
        : c
    );
    set({
      conversations: updatedConversations,
      messages: [greeting],
      status: ChatStatus.Idle,
      suggestions: pickRandom(chatConfig.seedSuggestions, 3),
      thinkingSteps: [],
      streamingContent: "",
      draft: "",
      pendingNavigate: undefined,
      pendingHighlight: undefined,
      activeHighlight: undefined,
      pendingFocus: undefined,
      activeFocus: undefined,
      pendingOpenModal: undefined,
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
      status: ChatStatus.Idle,
      suggestions: pickRandom(chatConfig.seedSuggestions, 3),
      thinkingSteps: [],
      streamingContent: "",
      draft: "",
      pendingNavigate: undefined,
      pendingHighlight: undefined,
      activeHighlight: undefined,
      pendingFocus: undefined,
      activeFocus: undefined,
      pendingOpenModal: undefined,
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
      status: ChatStatus.Idle,
      suggestions: pickRandom(chatConfig.seedSuggestions, 3),
      thinkingSteps: [],
      streamingContent: "",
      draft: "",
      pendingNavigate: undefined,
      pendingHighlight: undefined,
      activeHighlight: undefined,
      pendingFocus: undefined,
      activeFocus: undefined,
      pendingOpenModal: undefined,
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
        status: ChatStatus.Idle,
        suggestions: pickRandom(chatConfig.seedSuggestions, 3),
        thinkingSteps: [],
        streamingContent: "",
        draft: "",
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
        streamingContent: "",
        draft: "",
        messages: wasActive
          ? remaining[0].messages
          : syncMessages(remaining, activeConversationId),
      });
      persist(remaining, newActiveId);
    }
  },
}));
