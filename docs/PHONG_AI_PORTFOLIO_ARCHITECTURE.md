# Phong AI Portfolio — Architecture Overview

_Last updated: 2026-08-01_

## What It Is

A chat widget (bottom-right corner) that lets visitors ask questions about Phong's work. The assistant answers only from live tool results — it has **no pre-loaded author data**. Every answer is grounded, citable, and bounded to a small response format.

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
        │     • Concurrency slot (1 in-flight per IP)
        │     • Daily token quota (per IP, resets UTC midnight)
        │
        ├─ 2. History trim (token budget)
        │     trimHistoryToBudget() — drops oldest messages if over limit
        │
        ├─ 3. Build system prompt (cached per lambda instance)
        │     buildSystemPrompt() → persona + GUARDRAILS (~1–2k tokens)
        │     NO author data injected here.
        │
        ├─ 4. Budget check
        │     systemPrompt tokens + history tokens < hard combined budget
        │
        └─ 5. Open NDJSON stream → emit events as they arrive
```

---

## LLM Dispatch & Tool Loop

```
streamLLM("chat", { messages, tools: CHAT_TOOLS, ... })
        │
        ▼
 ┌─────────────────────────────────────────────┐
 │  LLM receives:                              │
 │  • system: persona + guardrails             │
 │  • history: trimmed conversation messages   │
 │  • tools: 10 CHAT_TOOLS (see below)         │
 └─────────────────────────────────────────────┘
        │
        ▼
  chunk.type === "tool_call"
        │  → emit Thinking event (tool name shown in UI spinner)
        │
        ▼
  chunk.type === "tool_result"
        │  → search tools: extract agentIds → citationTargets Set
        │  → UI tools: extract highlight/focus/modal/navigate targets
        │
        ▼
  chunk.type === "text"
        │  → emit Token event (streams to chat bubble)
        │
        ▼
  chunk.type === "done"
        │  → record token usage
        │  → resolveCitations(citationTargets) → AgentCitation[]
        │  → getSuggestions() (parallel, cheap model)
        │  → emit Done event { citations, suggestions, highlight, navigate, ... }
```

---

## System Prompt Context (Current State)

The LLM **only** receives:

| What | Source | Size |
|------|--------|------|
| Persona | `buildPersona()` in `lib/chat/prompt.ts` | ~1k tokens |
| Guardrails | `GUARDRAILS` constant in `lib/chat/prompt.ts` | ~200 tokens |
| **Author data** | **None — tools only** | 0 tokens |

The persona defines:
- Tool-first instruction: "You have no pre-loaded data. Always call the appropriate search tool before answering."
- Voice & tone rules (conversational, concise, no hedging, varied sentences)
- Response format contract: Opening (1–2 sentences) + Detail (≤3 bullets, optional) + Link (one markdown link) — prose cap 450 chars
- Citation style: `[n]` inline markers, sequential from `[1]`
- Scope constraint: stay on topic about Phong and this site

---

## CHAT_TOOLS

**Search tools** — retrieve author data at query time:

| Tool | Returns | Data source |
|------|---------|-------------|
| `search_projects` | `{ agentId, title, summary }[]` | `config/projects.ts` |
| `search_experiences` | `{ agentId, title, summary }[]` | `config/experience.ts` |
| `search_skills` | `{ agentId, title, summary }[]` | `config/skills.ts` |
| `search_resume` | `{ agentId, title, summary }[]` | `config/resume.ts` |
| `search_blog` | `{ agentId, title, summary }[]` | `content/blog/*.md` |

**UI tools** — drive client-side interactions:

| Tool | Effect |
|------|--------|
| `highlight_resource` | Scroll + visually highlight a card |
| `focus` | Quiet focus (no scroll) |
| `open_modal` / `expand_section` | Open detail modal |
| `navigate_to` | Navigate to a site page (ALLOWED_ROUTES only) |

Max 5 results per search tool call. Tool payload is lean (`{ agentId, title, summary }`) — full data is resolved separately for citation chips.

---

## Citation Pipeline

```
search_tool returns → agentId (e.g. "project:enrollment-platform")
        │
        ▼
citationTargets: Set<CitationTarget>   (collected during LLM stream)
        │
        ▼
resolveCitations(targets)
  → looks up PROJECTS / EXPERIENCES / SKILLS / blog posts by id
  → returns AgentCitation[] { id, type, title, description, href }
        │
        ▼
DoneEvent.citations → client renders citation chips below the message
```

The LLM cites with `[n]` markers in text. The client maps marker position to `citations[n-1]`.

---

## Stream Protocol (NDJSON)

All events are newline-delimited JSON (`application/x-ndjson`):

| Event type | When emitted | Key fields |
|------------|-------------|------------|
| `thinking` | Before LLM call, during tool calls | `step: "preparing" \| "thinking" \| <tool_name>` |
| `token` | Each text chunk from LLM | `text: string` |
| `action` | Star-repo intent detected | `action: "star_repo"` |
| `done` | Stream complete | `citations, suggestions, highlight, focus, openModal, navigate` |
| `error` | Any failure | `code, message` |

---

## Key Files

| File | Role |
|------|------|
| `app/api/chat/route.ts` | POST handler — guards, stream lifecycle, citation assembly |
| `lib/chat/context.ts` | `buildSystemPrompt()` — lean prompt (cached) |
| `lib/chat/prompt.ts` | Persona text, GUARDRAILS, ALLOWED_ROUTES, `isAllowedRoute()` |
| `lib/chat/tools.ts` | `CHAT_TOOLS` — all 10 tools with execute() |
| `lib/chat/resources.ts` | `resolveCitation()` — agentId → AgentCitation |
| `lib/chat/protocol.ts` | `encodeEvent()`, `buildEntityId()`, `parseEntityId()` |
| `lib/chat/token-budget.ts` | History trimming, token estimation |
| `lib/chat/rate-limit.ts` | IP-based rate limit (Upstash) |
| `lib/chat/concurrency-limiter.ts` | 1 in-flight per IP |
| `lib/chat/token-quota.ts` | Daily token budget per IP |
| `lib/chat/eval-assertions.ts` | 6 structural assertions (pure, unit-tested) |
| `scripts/eval-chat.ts` | Live eval against running server |
| `config/chat.ts` | Limits: maxOutputTokens=960, temperature, budgets |

---

## Eval Pipeline

Two layers:

1. **Unit assertions** (`bun run test`) — 86 tests in `eval-assertions.test.ts`. Pure functions, no LLM calls.
2. **Live eval** (`bun run eval`, requires dev server) — sends 3 real prompts, runs all 6 assertions on live responses.

Assertions checked on every response:
- `not_empty` — ≥80 chars
- `not_too_long` — ≤2000 chars
- `has_citations` — at least one `[n]` marker
- `sequential` — markers start at `[1]`, no gaps
- `markers_match` — max `[n]` ≤ `citations.length`
- `no_invented_routes` — markdown hrefs only from `ALLOWED_ROUTES`

> **Known limit:** Mistral testing API key is rate-limited. Sequential eval requests (2nd/3rd) may return 0-char responses — external limit, not a code bug.
