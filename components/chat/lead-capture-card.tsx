"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Icons } from "@/components/common/icons";
import { toast } from "@/components/ui/use-toast";
import { LEAD_TOPIC_LABELS } from "@/config/contact";
import {
  LEAD_TOPICS,
  LeadFormData,
  LeadTopic,
  leadFormSchema,
} from "@/lib/lead/schema";
import { cn } from "@/lib/utils";
import { LeadCapturePayload } from "@/types/chat";

type FormStatus = "idle" | "submitting" | "submitted";

interface LeadCaptureCardProps {
  leadContext?: LeadCapturePayload;
  className?: string;
}

export function LeadCaptureCard({ leadContext, className }: LeadCaptureCardProps) {
  const [status, setStatus] = useState<FormStatus>("idle");

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
      <span className="mb-2 block font-semibold text-foreground">
        Send Phong a message
      </span>

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <input
          {...form.register("name")}
          placeholder="Your name"
          className="rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
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
          className="rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
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
              onClick={() => form.setValue("topic", topic as LeadTopic, { shouldValidate: true })}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
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
          className="resize-none rounded-md border border-border bg-background px-2 py-1.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none"
        />
        {form.formState.errors.message && (
          <span className="text-[11px] text-destructive">
            {form.formState.errors.message.message}
          </span>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {status === "submitting" ? (
            <>
              <Icons.spinner className="h-3 w-3 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Icons.send className="h-3 w-3" />
              Send
            </>
          )}
        </button>
      </form>
    </div>
  );
}
