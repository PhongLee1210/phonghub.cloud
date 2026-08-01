"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Icons } from "@/components/common/icons";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { LEAD_TOPIC_LABELS } from "@/config/contact";
import { LEAD_TOPICS, LeadFormData, leadFormSchema } from "@/lib/lead/schema";
import { cn } from "@/lib/utils";

type FormStatus = "idle" | "submitting" | "submitted";

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      email: "",
      topic: undefined,
      message: "",
      source: "form",
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
      <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border bg-card p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icons.check className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Message sent</h3>
          <p className="text-sm text-muted-foreground">
            Thanks for reaching out. I&apos;ll get back to you within one
            business day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 md:p-8">
      <div className="mb-6 space-y-1">
        <h3 className="text-lg font-semibold">Start a conversation</h3>
        <p className="text-sm text-muted-foreground">
          Tell me what you&apos;re building. I reply within one business day.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What&apos;s it about</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {LEAD_TOPICS.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => field.onChange(topic)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        field.value === topic
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      {LEAD_TOPIC_LABELS[topic]}
                    </button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>What you need</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell me about your project or what you're looking for..."
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={status === "submitting"}
          >
            {status === "submitting" ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Message"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
