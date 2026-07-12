"use client";

import { Icons } from "@/components/common/icons";
import { useChatStore } from "@/hooks/use-chat-store";
import { cn } from "@/lib/utils";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "just now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface ConversationSidebarProps {
  className?: string;
}

export const ConversationSidebar = ({
  className,
}: ConversationSidebarProps) => {
  const {
    conversations,
    activeConversationId,
    newChat,
    selectConversation,
    deleteConversation,
  } = useChatStore();

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col bg-chat-header",
        className
      )}
    >
      <div className="flex-shrink-0 p-3">
        <button
          type="button"
          onClick={newChat}
          className="flex w-full items-center gap-2 rounded-lg border border-chat-border bg-chat-bg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Icons.add className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {conversations.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No conversations yet
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectConversation(conv.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectConversation(conv.id);
                    }
                  }}
                  className={cn(
                    "group relative flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 transition-colors",
                    isActive
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-left text-[13px]",
                        isActive && "font-medium"
                      )}
                    >
                      {conv.title}
                    </span>
                    <span className="block text-left text-[10px] text-muted-foreground/70">
                      {relativeTime(conv.updatedAt)}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete conversation"
                    title="Delete conversation"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
                  >
                    <Icons.trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
