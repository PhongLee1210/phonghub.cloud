"use client";

import { forwardRef } from "react";

import { Icons } from "@/components/common/icons";
import { cn } from "@/lib/utils";

interface ChatLauncherProps {
  isOpen: boolean;
  onClick: () => void;
}

export const ChatLauncher = forwardRef<HTMLButtonElement, ChatLauncherProps>(
  ({ isOpen, onClick }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        aria-expanded={isOpen}
        className={cn(
          "fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-[0_8px_24px_hsl(var(--foreground)/0.18)]",
          "transition-transform hover:scale-[1.06]",
          isOpen && "max-[480px]:hidden"
        )}
      >
        {!isOpen && (
          <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-[2.5px] border-background bg-emerald-500" />
        )}
        <Icons.chatBubble
          className={cn(
            "absolute h-6 w-6 transition-all duration-200",
            isOpen && "rotate-90 scale-50 opacity-0"
          )}
        />
        <Icons.close
          className={cn(
            "absolute h-6 w-6 rotate-[-90deg] scale-50 opacity-0 transition-all duration-200",
            isOpen && "rotate-0 scale-100 opacity-100"
          )}
        />
      </button>
    );
  }
);

ChatLauncher.displayName = "ChatLauncher";
