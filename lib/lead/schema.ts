import { z } from "zod";

export const LEAD_TOPICS = [
  "product",
  "automation",
  "advisory",
  "hiring",
  "other",
] as const;

export type LeadTopic = (typeof LEAD_TOPICS)[number];

export const leadFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  topic: z.enum(LEAD_TOPICS, {
    message: "Please select a topic",
  }),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be under 2000 characters"),
  source: z.enum(["form", "chat"]).default("form"),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;