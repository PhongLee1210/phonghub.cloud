"use client";

import { memo, useDeferredValue } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface MessageMarkdownProps {
  content: string;
  className?: string;
}

const components: Components = {
  a({ children, href, ...rest }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="font-medium text-primary underline-offset-2 hover:underline"
        {...rest}
      >
        {children}
      </a>
    );
  },
  code({ className, children, ...rest }) {
    const isBlock = /language-([\w-]+)/.test(className || "");
    if (isBlock) {
      return (
        <code className={cn(className, "font-mono text-[0.85em]")} {...rest}>
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
          "[&>code]:bg-transparent [&>code]:px-0 [&>code]:py-0 [&>code]:text-foreground",
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
};

export const MessageMarkdown = memo(function MessageMarkdown({
  content,
  className,
}: MessageMarkdownProps) {
  const deferred = useDeferredValue(content);
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none",
        "prose-headings:font-heading prose-headings:text-foreground prose-headings:mb-1 prose-headings:mt-2 prose-headings:first:mt-0",
        "prose-p:my-1.5 prose-p:first:mt-0 prose-p:last:mb-0",
        "prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0",
        "prose-strong:font-semibold prose-strong:text-foreground prose-em:text-foreground",
        "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:not-italic prose-blockquote:my-2",
        "prose-hr:border-chat-border",
        "prose-code:before:content-none prose-code:after:content-none",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {deferred}
      </ReactMarkdown>
    </div>
  );
});
