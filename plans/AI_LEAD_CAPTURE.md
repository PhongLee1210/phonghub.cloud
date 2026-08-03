# Lead Capture System — Design Plan

## Problem

Current portfolio is view-only. `/contact` page shows profile card with social links but no way for visitors (recruiters OR potential clients) to submit inquiries. AI chat agent can show contact info but can't drive visitors toward lead capture.

## Goal

Convert passive viewers into captured leads via two channels:

1. **Contact form** — on `/contact` page + homepage CTA
2. **AI agent** — captures conversation context, shows approval card, sends lead

---

## Decisions Made

| Decision          | Choice                                                                               |
| ----------------- | ------------------------------------------------------------------------------------ |
| Lead storage      | Email notification only via **Resend**                                               |
| Form placement    | `/contact` page (full form) + homepage CTA section (bottom)                          |
| AI agent behavior | Captures conversation context → shows approval card → user confirms → sends to Phong |
| Form fields       | Name, Email, Topic chips, Message (simplified for conversion)                        |
| Form style        | Minimal card — single column, labels above fields                                    |
| Chat lead card    | Full form embedded in chat with context summary                                      |
| Email service     | Resend (free tier, 100 emails/day)                                                   |

---

## Form Design

### Contact Page Form (`/contact`)

```
+----------------------------------+
|  Start a conversation            |
|  Tell us what you're building    |
|                                  |
|  Full Name                       |
|  [________________________]     |
|                                  |
|  Email Address                   |
|  [________________________]     |
|                                  |
|  What's it about                 |
|  [Product] [AI] [Automation]     |
|  [Advisory] [Hiring] [Other]     |
|                                  |
|  What you need                   |
|  [________________________]     |
|  [________________________]     |
|  [________________________]     |
|                                  |
|         [ Send Message ]         |
+----------------------------------+
```

- Single column layout
- `/contact` page: two-column desktop (ProfileCard left, form right), stacked on mobile
- Uses existing UI primitives: `Input`, `Textarea`, `Button`, `Label`
- Topic chips as toggle buttons
- `react-hook-form` + `zod` validation (both already installed)
- Success: form transforms into "Message sent" confirmation
- Error: toast via existing `Toaster`

### Homepage CTA Section

- Bottom of homepage, after blog section
- Headline + description + CTA button linking to `/contact`
- Uses existing `AnimatedSection` + `AnimatedText`
- No embedded form (keep homepage fast)

---

## AI Agent Lead Capture Flow

### Flow

```
Visitor chats with AI agent
         |
         v
Agent detects hiring/project intent from conversation
         |
         v
Agent suggests: "Want me to help you reach out to Phong?"
         |
         v
+-- Approval Card (in chat) -----------------+
|  Send a message to Phong?                  |
|                                            |
|  Context: "Looking for a developer         |
|  to build an AI automation product.        |
|  Interested in Next.js + AI stack."        |
|                                            |
|  Your Name  [______________]               |
|  Your Email [______________]               |
|                                            |
|  [ Cancel ]        [ Send to Phong ]       |
+---------------------------------------------+
```

### Key Behaviors

- **Context extraction**: Agent summarizes conversation into a short context blurb automatically
- **Approval card**: Shows context summary + name/email fields. Visitor confirms before anything is sent
- **Topic auto-detected**: From conversation context (AI, product, automation, etc.)
- **Message = context summary**: Auto-generated from chat, visitor doesn't need to re-type
- **Same API endpoint**: POSTs to `/api/lead` like the contact form

### Technical Pipeline

1. New `ChatMessageAction`: `LeadCaptureForm` added to `types/chat.ts`
2. New component: `components/chat/lead-capture-card.tsx` (approval card with context + name/email)
3. Wired into `chat-message-list.tsx` via existing action pattern (same as `PreviewCard`)
4. Triggered from `app/api/chat/route.ts` — emits action when agent detects intent
5. Prompt update in `lib/chat/prompt.ts` — instructs agent on when/how to suggest lead capture

### Trigger Mode

**TBD** — Still needs decision:

- Auto-detect intent + gentle suggestion?
- Only on explicit visitor request?
- Both?

---

## Technical Architecture

### Shared Schema — `lib/lead/schema.ts`

```ts
// Zod schema shared between contact form, chat card, and API route
name: string (min 2)
email: string (email format)
topic: "product" | "automation" | "ai" | "advisory" | "hiring" | "other"
message: string (min 10, max 2000)
```

### Topic Config — `config/contact.ts`

```ts
export const LEAD_TOPICS = [
  { value: "product", label: "Product" },
  { value: "automation", label: "Automation" },
  { value: "ai", label: "AI" },
  { value: "advisory", label: "Advisory" },
  { value: "hiring", label: "Hiring" },
  { value: "other", label: "Other" },
] as const;
```

### API Route — `app/api/lead/route.ts`

- `POST /api/lead`
- Validates with Zod schema
- Sends email via Resend to `CONTACT_INFO.email`
- Rate limited (Upstash already configured)
- Env var: `RESEND_API_KEY`

### Email Template — `lib/lead/email-template.tsx`

React component for Resend. Shows name, email, topic, message, timestamp, source (form vs chat).

---

## Files to Create/Modify

| Action | Path                                                            | Priority |
| ------ | --------------------------------------------------------------- | -------- |
| Create | `lib/lead/schema.ts`                                            | P0       |
| Create | `lib/lead/email-template.tsx`                                   | P0       |
| Create | `app/api/lead/route.ts`                                         | P0       |
| Create | `components/contact/contact-form.tsx`                           | P0       |
| Create | `components/chat/lead-capture-card.tsx`                         | P0       |
| Create | `components/home/cta-section.tsx`                               | P1       |
| Modify | `config/contact.ts` — add `LEAD_TOPICS`                         | P0       |
| Modify | `app/(root)/contact/page.tsx` — add form alongside profile card | P0       |
| Modify | `types/chat.ts` — add `LeadCaptureForm` action                  | P0       |
| Modify | `components/chat/chat-message-list.tsx` — render lead card      | P0       |
| Modify | `app/api/chat/route.ts` — emit lead form action                 | P0       |
| Modify | `lib/chat/prompt.ts` — add lead capture guidance                | P1       |
| Modify | `app/(root)/page.tsx` — add CTA section                         | P1       |
| Modify | `config/pages.ts` — update contact page copy                    | P1       |

---

## Existing Infrastructure (Ready to Reuse)

- `components/ui/form.tsx` — full react-hook-form integration
- `components/ui/input.tsx`, `textarea.tsx`, `button.tsx`, `label.tsx` — styled form primitives
- `components/ui/chip.tsx` — base chip component (needs toggle variant)
- `components/ui/toast.tsx` + `toaster.tsx` — error/success notifications
- `components/chat/preview-card.tsx` — existing chat card pattern to follow
- `hooks/use-chat-store.ts` — message action pipeline already handles card rendering
- `@upstash/ratelimit` — rate limiting for API route
- `react-hook-form`, `zod`, `@hookform/resolvers` — all installed

---

## Verification

1. `bun run lint` + `bunx tsc --noEmit` + `bun run test`
2. Manual: `/contact` shows form + profile card, submit works, email received
3. Manual: Chat — hiring intent → approval card appears with context summary, submit works
4. Manual: Homepage bottom CTA visible, links to `/contact`
5. Mobile responsive: form stacks, chat card fits widget width
