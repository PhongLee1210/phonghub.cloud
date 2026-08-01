"use client";

import { memo, useDeferredValue, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  CitationFooter,
  CitationMark,
} from "@/components/chat/inline-citations/inline-citations";
import { remarkCite } from "@/lib/chat/remark-cite";
import { cn } from "@/lib/utils";
import { AgentCitation } from "@/types/chat";

interface MessageMarkdownProps {
  content: string;
  className?: string;
  citations?: AgentCitation[];
}

// Plugins are stable — defined once outside the component.
// Cast needed: react-markdown expects a mutable Pluggable[] but the array is const.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REMARK_PLUGINS = [remarkGfm, remarkCite] as any[];

export const MessageMarkdown = memo(function MessageMarkdown({
  content,
  className,
  citations,
}: MessageMarkdownProps) {
  const deferred = useDeferredValue(content);

  // Rebuild component map only when citations change so markdown re-renders
  // as little as possible during streaming.
  const components = useMemo<Components>(
    () => ({
      a({ children, href }) {
        // Intercept #cite:n links emitted by the remarkCite plugin.
        if (href?.startsWith("#cite:")) {
          const n = Number(href.slice(6));
          const citation = citations?.[n - 1];
          return <CitationMark n={n} citation={citation} />;
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            {children}
          </a>
        );
      },
      code({ className: cls, children, ...rest }) {
        const isBlock = /language-([\w-]+)/.test(cls || "");
        if (isBlock) {
          return (
            <code className={cn(cls, "font-mono text-[0.85em]")} {...rest}>
              {children}
            </code>
          );
        }
        return (
          <code
            className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-primary"
            {...rest}
          >
            {children}
          </code>
        );
      },
      pre({ children }) {
        return (
          <pre
            className={cn(
              "my-2 overflow-x-auto rounded-lg border border-chat-border bg-muted p-3",
              "[&>code]:bg-transparent [&>code]:px-0 [&>code]:py-0 [&>code]:text-foreground"
            )}
          >
            {children}
          </pre>
        );
      },
      table({ children }) {
        return (
          <div className="my-2 overflow-x-auto">
            <table className="w-full border-collapse text-left">{children}</table>
          </div>
        );
      },
    }),
    [citations]
  );

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "[--tw-prose-body:hsl(var(--foreground))]",
        "[--tw-prose-headings:hsl(var(--foreground))]",
        "[--tw-prose-lead:hsl(var(--muted-foreground))]",
        "[--tw-prose-links:hsl(var(--primary))]",
        "[--tw-prose-bold:hsl(var(--foreground))]",
        "[--tw-prose-counters:hsl(var(--muted-foreground))]",
        "[--tw-prose-bullets:hsl(var(--muted-foreground))]",
        "[--tw-prose-hr:hsl(var(--chat-border))]",
        "[--tw-prose-quotes:hsl(var(--foreground))]",
        "[--tw-prose-quote-borders:hsl(var(--primary))]",
        "[--tw-prose-captions:hsl(var(--muted-foreground))]",
        "[--tw-prose-code:hsl(var(--primary))]",
        "[--tw-prose-pre-code:hsl(var(--foreground))]",
        "[--tw-prose-pre-bg:hsl(var(--muted))]",
        "[--tw-prose-th-borders:hsl(var(--chat-border))]",
        "[--tw-prose-td-borders:hsl(var(--chat-border))]",
        "prose-headings:font-heading prose-headings:mb-1 prose-headings:mt-2 prose-headings:first:mt-0",
        "prose-p:my-1.5 prose-p:first:mt-0 prose-p:last:mb-0",
        "prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0",
        "prose-strong:font-semibold",
        "prose-blockquote:not-italic prose-blockquote:my-2",
        "prose-code:before:content-none prose-code:after:content-none",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={components}>
        {deferred}
      </ReactMarkdown>
      {citations && citations.length > 0 && (
        <CitationFooter citations={citations} />
      )}
    </div>
  );
});
