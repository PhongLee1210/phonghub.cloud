"use client";

import { useEffect, useRef, useState } from "react";

import { Icons } from "@/components/common/icons";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type StarState = "idle" | "loading" | "starred" | "error";

interface StarResponse {
  starred: boolean;
  count?: number;
  alreadyStarred?: boolean;
}

interface StarButtonProps {
  /** "icon" = compact circular button for the chat header. "inline" = labeled pill for in-conversation prompts. */
  variant?: "icon" | "inline";
  className?: string;
}

export const StarButton = ({ variant = "icon", className }: StarButtonProps) => {
  const [state, setState] = useState<StarState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>();
  // Guards against a second click firing while a request is already in
  // flight — state alone isn't enough because setState inside the async
  // handler doesn't take effect until the next render.
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/github/star")
      .then((res) => (res.ok ? (res.json() as Promise<StarResponse>) : undefined))
      .then((data) => {
        if (!cancelled && data?.starred) setState("starred");
      })
      .catch(() => {
        // Silent — the button just falls back to its default "not yet
        // starred" affordance and the user can still trigger a fresh check
        // via POST.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = async () => {
    if (inFlight.current || state === "starred") return;
    inFlight.current = true;
    setState("loading");
    setErrorMessage(undefined);

    try {
      const res = await fetch("/api/github/star", { method: "POST" });
      const data = (await res.json().catch(() => undefined)) as
        | StarResponse
        | { error: string }
        | undefined;

      if (!res.ok) {
        const message =
          (data as { error?: string })?.error ??
          "Couldn't star the repo right now.";
        setErrorMessage(message);
        setState("error");
        return;
      }

      setState("starred");
    } catch {
      setErrorMessage("Network error — please try again.");
      setState("error");
    } finally {
      inFlight.current = false;
    }
  };

  const repoUrl = `https://github.com/${siteConfig.repository.owner}/${siteConfig.repository.name}`;
  const isStarred = state === "starred";
  const isLoading = state === "loading";

  const icon = isLoading ? (
    <Icons.spinner className="h-4 w-4 animate-spin" />
  ) : isStarred ? (
    <Icons.star className="h-4 w-4 text-amber-400" />
  ) : (
    <Icons.starOutline className="h-4 w-4" />
  );

  const label = isStarred
    ? "Starred — thank you!"
    : isLoading
      ? "Starring…"
      : "Star on GitHub";

  if (variant === "icon") {
    return (
      <button
        type="button"
        title={isStarred ? "Starred on GitHub" : "Star this project on GitHub"}
        aria-label={label}
        aria-pressed={isStarred}
        onClick={isStarred ? undefined : handleClick}
        disabled={isLoading}
        className={cn(
          "flex h-[30px] w-[30px] items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-70",
          isStarred && "text-amber-400 hover:text-amber-400",
          className
        )}
      >
        {icon}
      </button>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <button
        type="button"
        aria-pressed={isStarred}
        onClick={isStarred ? undefined : handleClick}
        disabled={isLoading}
        className={cn(
          "flex w-fit items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-70",
          isStarred && "border-amber-400/50 bg-amber-400/10 text-amber-400"
        )}
      >
        {icon}
        {label}
      </button>
      {state === "error" && errorMessage && (
        <p className="text-[0.7rem] text-destructive" role="alert">
          {errorMessage}{" "}
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            Star it directly on GitHub
          </a>
          .
        </p>
      )}
    </div>
  );
};
