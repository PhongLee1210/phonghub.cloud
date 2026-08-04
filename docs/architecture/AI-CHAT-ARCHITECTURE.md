# Phong AI Portfolio — Architecture Overview

_Last updated: 2026-08-02_

## What It Is

A chat widget (bottom-right corner) that lets visitors ask questions about Phong's work, plus an in-chat lead-capture flow. The assistant answers only from live tool results — it has **no pre-loaded author data** (the lone exception is the client-side `get_page_context` tool, which injects the current page's title/description). Every answer is grounded, citable, and bounded to a small response format.

---

## Request-to-Response Flow

```
Visitor types message
        │
        ▼
POST /api/chat
        │
        ├─ 1. Guard checks (HTTP, before stream opens)
        │     • Rate limit (IP, sliding window via Upstash Redis)
        │     • Concurrency slot (max 2 in-flight per IP)
        │     • Daily token quota (per IP, resets UTC midnight)
        │
        ├─ 2. History trim (token budget) — trimHistoryToBudget()
        │
        ├─ 3. Build system prompt (cached per lambda instance)
        │     buildSystemPrompt() → persona + GUARDRAILS
        │     NO author data injected here.
        │
        ├─ 4. Budget check — model-aware context window
        │     effectiveContextBudget() clamps the combined budget to the
        │     resolved model's context window.
        │
        └─ 5. Open NDJSON stream → emit events as they arrive
```

---

## LLM Dispatch & Tool Loop

```
streamLLM("chat", { messages, tools: allTools, ... })
        │
        ▼
 ┌──────────────────────────────────────────────────────┐
 │  LLM receives:                                       │
 │  • system: persona + guardrails                      │
 │  • history: trimmed conversation messages            │
 │  • tools: 13 CHAT_TOOLS + any pre-resolved client    │
 │           tools (e.g. get_page_context)              │
 └──────────────────────────────────────────────────────┘
        │
        ▼
  chunk.type === "tool_call"   → emit Thinking event (tool name in UI spinner)
        │
        ▼
  chunk.type === "tool_result"
        │  → search tools:          extract agentIds → citationTargets Set
        │  → highlight/focus/       emit ToolEffect mid-turn + capture target
        │    select_skill/open_modal
        │  → navigate_to:           emit ToolEffect.navigate
        │  → search_contact:        emit Action { action: "contact_card" }
        │  → capture_lead:          emit Action { action: "lead_capture", payload }
        │
        ▼
  chunk.type === "text"        → buffer text (cited later, see Citation Pipeline)
        │
        ▼
  chunk.type === "done"
        │  → record token usage
        │  → star-intent?  → emit Action { action: "star_repo" }
        │  → normalizeCitationMarkers(textBuffer, targets)
        │       agentId markers ([skill:react]) → sequential [1][2]…
        │  → emit Token (normalized text)
        │  → resolveCitations(orderedTargets)  ┐ Promise.all
        │  → getSuggestions() (parallel cheap) ┘
        │  → emit Done { citations, suggestions, highlight, focus,
        │                skillSelect, openModal, navigate }
```

Text is buffered (not streamed token-by-token) so agentId citation markers can be deterministically renumbered at done time.

---

## System Prompt Context (Current State)

The LLM **only** receives:

| What | Source | Size |
|------|--------|------|
| Persona | `buildPersona()` in `lib/chat/prompt.ts` | ~1.2k tokens |
| Guardrails | `GUARDRAILS` constant in `lib/chat/prompt.ts` | ~200 tokens |
| **Author data** | **None — tools only** | 0 tokens |

The persona defines:
- Tool-first instruction: "You have no pre-loaded data. Always call the appropriate search tool before answering."
- Per-tool usage guidance, including `search_contact` (auto-shows a contact card) and `capture_lead` (opens a lead form; once per chat).
- Voice & tone rules (conversational, concise, no hedging, varied sentences).
- Response format contract: Opening (1–2 sentences) + Detail (≤3 bullets, optional) + Link (one markdown link) — prose cap 450 chars.
- Citation style: emit the resource's **agentId** inline (e.g. `[project:enrollment-platform]`), placed after the referenced name. Renumbering to `[n]` happens server-side at done time.
- Lead-capture rules: explicit request → call `capture_lead` immediately; inferred intent → ask confirmation first; pass `detected_topic` (one of product/automation/advisory/hiring/other).
- Scope constraint: stay on topic about Phong and this site.

---

## CHAT_TOOLS (13)

**Search tools** — retrieve author data at query time, each capped at 5 results:

| Tool | Returns | Data source |
|------|---------|-------------|
| `search_projects` | `{ agentId, title, summary }[]` | `config/projects.ts` via `lib/data/projects` |
| `search_experiences` | `{ agentId, title, summary }[]` | `config/experience.ts` via `lib/data/experience` |
| `search_skills` | `{ agentId, title, summary }[]` | `config/skills.ts` via `lib/data/skills` |
| `search_resume` | `{ agentId, title, summary }[]` | `config/resume.ts` |
| `search_blog` | `{ agentId, title, summary }[]` | `content/blog/*.md` |
| `search_contact` | contact info, availability, social profiles | `config/contact.ts` — **also emits a `contact_card` action** |

**UI tools** — drive client-side interactions, emit `tool_effect` mid-turn:

| Tool | Effect |
|------|--------|
| `highlight_resource` | Scroll + visually highlight a card |
| `focus` | Quiet focus (no scroll) |
| `select_skill` | Recenter the home skills graph on a skill |
| `open_modal` / `expand_section` | Open a detail modal (shared execute) |
| `navigate_to` | Navigate to a site page (ALLOWED_ROUTES only) |

**Action tool** — surfaces a form in chat:

| Tool | Effect |
|------|--------|
| `capture_lead` | Opens the in-chat lead form; carries `detected_topic` + optional name/email |

Tool payloads are lean (`{ agentId, title, summary }`) — full data is resolved separately for citation chips.

### Client-side tools (pre-resolved)

Components register client tools via `lib/ai-tools/` (`RegisterAiTool` component → zustand `useAiToolRegistry`). Their `execute()` runs in the browser; the snapshot is sent in `ChatRequestBody.clientTools` and merged into the LLM toolset by `buildClientTools()`. Names colliding with CHAT_TOOLS are dropped server-side.

- `get_page_context` (`components/ai/page-context-tool.tsx`) — current route/title/description. Currently the only client tool.

---

## Citation Pipeline

The model emits **agentId markers** (e.g. `[skill:react]`); they are rewritten to sequential `[n]` deterministically at done time — the model never has to manage numbering.

```
search_tool returns → agentId (e.g. "project:enrollment-platform")
        │
        ▼
citationTargets: Set<CitationTarget>   (collected during LLM stream)
        │
        ▼
normalizeCitationMarkers(textBuffer, targets)   (lib/chat/citation-postprocess.ts)
  → rewrites [agentId] → [n] in first-mention order
  → returns { normalizedText, orderedTargets }
  → invalid/unknown markers are stripped; no markers → Set-based fallback
        │
        ▼
resolveCitationsOrdered(orderedTargets)
  → looks up PROJECTS / EXPERIENCES / SKILLS / blog posts / resume by id
  → returns AgentCitation[] { id, type, title, description, href }
  → failed lookups skipped (hallucinated/stale ids), not fatal
        │
        ▼
DoneEvent.citations → client renders citation chips below the message
```

The client maps each `[n]` marker position to `citations[n-1]`.

---

## Lead Capture Flow

Two entry points converge on the same backend:

```
A) Contact page form (components/contact/contact-form.tsx)
B) In-chat capture_lead tool → ChatMessageAction.LeadCapture event
          → components/chat/lead-capture-card.tsx (in-chat form)
                              │
                              ▼
                  POST /api/lead  (app/api/lead/route.ts)
                    • rate limit: 3 / 5min sliding window (Upstash)
                    • zod validate (lib/lead/schema.ts): name, email,
                      topic ∈ {product,automation,advisory,hiring,other},
                      message, source ∈ {form,chat}
                    • render LeadEmail (@react-email) → Resend
                    • delivers to CONTACT_INFO.email, replyTo = visitor
```

Requires `RESEND_API_KEY`. Rate limiting follows the same dev/prod split behavior as chat (unconfigured → reject in prod, allow in dev).

---

## Stream Protocol (NDJSON)

All events are newline-delimited JSON (`application/x-ndjson`):

| Event type | When emitted | Key fields |
|------------|-------------|------------|
| `thinking` | Before LLM call, during tool calls | `step: "preparing" \| "thinking" \| <tool_name>` |
| `token` | Normalized assistant text (at done time) | `text: string` |
| `tool_effect` | Per UI tool call, mid-turn (exactly one field set) | `highlight \| focus \| skillSelect \| openModal(resolved) \| navigate` |
| `action` | Contact card, lead capture, or star intent | `action: "contact_card" \| "lead_capture" \| "star_repo"`, optional `payload: LeadCapturePayload` |
| `card` | Legacy project card | `card: ProjectCardPayload` |
| `navigate` | Legacy navigate | `href: InternalRoute` |
| `done` | Stream complete | `citations, suggestions, highlight, focus, skillSelect, openModal, navigate` |
| `error` | Any failure | `code, message` |

---

## Key Files

| File | Role |
|------|------|
| `app/api/chat/route.ts` | POST handler — guards, stream lifecycle, tool dispatch, citation assembly |
| `app/api/lead/route.ts` | Lead capture POST — rate limit, zod, Resend |
| `lib/chat/context.ts` | `buildSystemPrompt()` — lean prompt (cached) |
| `lib/chat/prompt.ts` | Persona, GUARDRAILS, ALLOWED_ROUTES, `isAllowedRoute()` |
| `lib/chat/tools.ts` | `CHAT_TOOLS` (13), `buildClientTools()` |
| `lib/chat/citation-postprocess.ts` | `normalizeCitationMarkers()` — agentId → `[n]` |
| `lib/chat/resources.ts` | `resolveCitation()` — agentId → AgentCitation |
| `lib/chat/client.ts` | `streamChat()` — client NDJSON reader + dispatcher |
| `lib/chat/entity-dom.ts` | Client highlight/focus/modal DOM wiring |
| `lib/chat/remark-cite.ts` | Markdown remark plugin for citation rendering |
| `lib/chat/redis.ts` | Shared Upstash client + `allowWhenUnconfigured()` |
| `lib/chat/token-budget.ts` | History trimming, token estimation, combined budget |
| `lib/chat/token-quota.ts` | Daily token budget per IP |
| `lib/chat/concurrency-limiter.ts` | Max 2 in-flight per IP |
| `lib/chat/rate-limit.ts` | IP rate limit (Upstash) |
| `lib/chat/suggestion-worker.ts` | Concurrent follow-up generation (cheap model) |
| `lib/chat/eval-assertions.ts` | Structural assertions + 4 assertion sets |
| `lib/ai-tools/` | Client tool registry (define/registry) + zustand store |
| `lib/lead/` | Lead schema, email template, lead rate limit |
| `lib/data/` | Query helpers over config (projects/experience/skills) |
| `lib/content/` | Normalizers aggregating all content into `ContentItem[]` |
| `scripts/eval-chat.ts` | Live eval against running server |
| `config/chat.ts` | Limits, rate limits, concurrency, context budgets, thinking labels |

---

## Eval Pipeline

Two layers:

1. **Unit assertions** (`bun run test`) — **210 tests across 27 files** (319 expect calls). Pure functions, no LLM calls. Covers `lib/llm/*`, `lib/chat/*`, `lib/ai-tools/*`, `lib/data/*`, `lib/content/*`, `lib/device`, `lib/physics`. Uses a local `FakeProvider` injected via `__setProvidersForTests()`; no real API keys or network.
2. **Live eval** (`bun run eval`, requires dev server) — sends **7 prompts** spanning 4 assertion sets.

Assertion functions in `lib/chat/eval-assertions.ts`:

| Function | Checks |
|----------|--------|
| `assertNotEmpty` | length ≥ 80 chars (lead cases: ≥ 20) |
| `assertNotTooLong` | length ≤ 2000 chars |
| `assertHasCitations` | ≥1 `[n]` marker |
| `assertSequentialMarkers` | `[1][2][3]…` no gaps |
| `assertMarkersMatchCitations` | max `[n]` ≤ citations.length |
| `assertNoInventedRoutes` | markdown hrefs only from ALLOWED_ROUTES |
| `assertHasContactAction` | action === `contact_card` |
| `assertHasLeadCaptureAction` | action === `lead_capture` |
| `assertLeadPayloadHasTopic` | payload.detectedTopic is a valid topic |

Assertion sets: `runAssertions` (standard: 6), `runSkillsAssertions` (5, citations optional), `runContactAssertions` (4), `runLeadCaptureAssertions` (5).
