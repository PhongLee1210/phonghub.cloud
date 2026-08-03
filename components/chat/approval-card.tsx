"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Icons } from "@/components/common/icons";
import { toast } from "@/components/ui/use-toast";
import { LEAD_TOPIC_LABELS } from "@/config/contact";
import { useChatStore } from "@/hooks/use-chat-store";
import {
  LEAD_TOPICS,
  LeadFormData,
  LeadTopic,
  leadFormSchema,
} from "@/lib/lead/schema";
import { cn } from "@/lib/utils";
import { LeadCapturePayload } from "@/types/chat";

type FormStatus = "idle" | "submitting" | "submitted";

interface ApprovalCardProps {
  leadContext?: LeadCapturePayload;
  onDismiss?: () => void;
  className?: string;
}

export function ApprovalCard({
  leadContext,
  onDismiss,
  className,
}: ApprovalCardProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const sendMessage = useChatStore((s) => s.sendMessage);
  const disabled = status === "submitting";

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: leadContext?.visitorName ?? "",
      email: leadContext?.visitorEmail ?? "",
      topic: leadContext?.detectedTopic,
      message: "",
      source: "chat",
    },
  });

  async function onSubmit(data: LeadFormData) {
    setStatus("submitting");

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Something went wrong");
      }

      setStatus("submitted");
      sendMessage(
        `[The visitor just submitted a contact form about "${LEAD_TOPIC_LABELS[data.topic as LeadTopic]}". Acknowledge it warmly and let them know Phong will follow up.]`
      );
    } catch (error) {
      setStatus("idle");
      toast({
        variant: "destructive",
        title: "Failed to send",
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    }
  }

  if (status === "submitted") {
    return (
      <div
        className={cn(
          "mt-2 flex w-fit min-w-[220px] flex-col items-center gap-2 rounded-lg border border-border bg-background/60 p-4 text-[12px]",
          className
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Icons.check className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold text-foreground">Message sent</span>
        <span className="text-center text-muted-foreground">
          Phong will get back to you within one business day.
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-2 w-fit min-w-[220px] max-w-[320px] rounded-lg border border-border bg-background/60 p-3 text-[12px]",
        className
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="font-semibold text-foreground">
          Send Phong a message?
        </span>
        {onDismiss && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismiss}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icons.close className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {leadContext && (
        <p className="mb-2 text-[11px] text-muted-foreground">
          Detected interest:{" "}
          <span className="font-medium text-foreground">
            {LEAD_TOPIC_LABELS[leadContext.detectedTopic]}
          </span>
        </p>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <input
          {...form.register("name")}
          placeholder="Your name"
          disabled={disabled}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none disabled:opacity-60"
        />
        {form.formState.errors.name && (
          <span className="text-[11px] text-destructive">
            {form.formState.errors.name.message}
          </span>
        )}

        <input
          {...form.register("email")}
          type="email"
          placeholder="you@example.com"
          disabled={disabled}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none disabled:opacity-60"
        />
        {form.formState.errors.email && (
          <span className="text-[11px] text-destructive">
            {form.formState.errors.email.message}
          </span>
        )}

        <div className="flex flex-wrap gap-1">
          {LEAD_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              disabled={disabled}
              onClick={() => {
                form.setValue("topic", topic as LeadTopic);
                form.clearErrors("topic");
              }
              }
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-60",
                form.watch("topic") === topic
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              {LEAD_TOPIC_LABELS[topic]}
            </button>
          ))}
        </div>
        {form.formState.errors.topic && (
          <span className="text-[11px] text-destructive">
            {form.formState.errors.topic.message}
          </span>
        )}

        <textarea
          {...form.register("message")}
          placeholder="What are you looking for?"
          rows={2}
          disabled={disabled}
          className="resize-none rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none disabled:opacity-60"
        />
        {form.formState.errors.message && (
          <span className="text-[11px] text-destructive">
            {form.formState.errors.message.message}
          </span>
        )}

        <div className="flex items-center justify-end gap-2">
          {onDismiss && (
            <button
              type="button"
              disabled={disabled}
              onClick={onDismiss}
              className="rounded-md px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={disabled}
            className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {disabled ? (
              <>
                <Icons.spinner className="h-3 w-3 animate-spin" />
                Please wait...
              </>
            ) : (
              <>
                <Icons.send className="h-3 w-3" />
                Send
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
