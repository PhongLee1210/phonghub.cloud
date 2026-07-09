# Internal LLM gateway

Server-only module tree providing a single provider-agnostic entry point,
`streamLLM(alias, req)`, to the rest of the app. Nothing outside this folder
should import a provider SDK or `lib/llm/providers/*` directly — that
boundary is enforced by the `no-restricted-imports` rule in `.eslintrc.json`.

## Files

- `index.ts` — **the only file app code imports.** Resolves alias → model →
  provider, applies the fallback chain, normalizes errors, logs usage.
- `types.ts` — `LLMProvider` contract, request/response/error shapes.
- `config.ts` — alias → `provider:model` resolution, fallback chain parsing,
  env key lookup per provider.
- `registry.ts` — builds a `Map<ProviderId, LLMProvider>` of providers whose
  env key is present, at first use, cached per lambda instance.
- `errors.ts` — maps `@ai-sdk/*` errors into the `LLMError` taxonomy.
- `providers/*.ts` — one ~30-line adapter per provider over `@ai-sdk/*`.

## Adding a new provider

1. Add the literal to `ProviderId` in `types.ts`.
2. Drop `providers/<name>.ts` implementing `LLMProvider` (copy an existing
   adapter — they're intentionally near-identical).
3. Add it to `ALL_PROVIDERS` in `registry.ts` and to `envKeyForProvider` in
   `config.ts`.
4. Document its env key below.

No other file changes — `streamLLM` picks it up automatically once its key is
set.

## Env keys (spend cap checklist)

Set a key only for providers you actually use. Set a spend/usage cap in
**every** configured provider's own console before public deploy — this repo
doesn't enforce spend caps itself; rate limiting (`lib/chat/rate-limit.ts`)
only bounds request volume, not $ spend per request.

| Provider  | Env key                          | Console spend cap             |
| --------- | --------------------------------- | ------------------------------ |
| Anthropic | `ANTHROPIC_API_KEY`               | console.anthropic.com → Limits |
| OpenAI    | `OPENAI_API_KEY`                  | platform.openai.com → Limits   |
| Google    | `GOOGLE_GENERATIVE_AI_API_KEY`     | aistudio.google.com / GCP billing budget |
| Groq      | `GROQ_API_KEY`                    | console.groq.com → Limits      |
| Mistral   | `MISTRAL_API_KEY`                 | console.mistral.ai → Limits    |

`registry.ts` logs a one-line reminder (`scope: "llm.gateway.startup"`)
listing configured providers once per lambda cold start — a soft nudge, not
an enforced gate, so a forgotten spend cap doesn't silently take down
production.

**If you set `LLM_CHAT_FALLBACKS`** (see below), the fallback provider's key
is just as exposed to abusive traffic as the primary's — set a spend cap on
it too, not just the primary's provider console. `index.ts` logs the
resolved chain once (`scope: "llm.gateway.fallback_chain"`) as a reminder
when a fallback is actually active.

## Model routing

`LLM_CHAT_MODEL` / `LLM_CHEAP_MODEL` override the alias defaults
(`config.ts`). Format: `provider:model`, e.g. `groq:llama-3.3-70b`.

`LLM_CHAT_FALLBACKS` (comma-separated `provider:model` list) enables the D8
fallback chain for the `"chat"` alias only. Left unset by default — see
`implementation-notes.md` for the rationale. A pre-token 429/5xx on the
primary triggers exactly one retry against the first fallback entry; never
mid-stream.

## Testing without API keys

`bun test` (see root `package.json`'s `test` script — requires the
`--conditions react-server` flag since every file here imports
`"server-only"`, which otherwise throws outside Next's bundler). `index.test.ts`
uses a local `FakeProvider` (implements `LLMProvider`, returns scripted
`LLMStreamChunk`s or throws a scripted `LLMError`), seeded into the registry
via the test-only `__setProvidersForTests()` export in `registry.ts` (plain
injection, not `mock.module` — module mocks were found to leak across
`bun:test` files in this Bun version) — no real API keys or network calls
needed. Covered:

- alias resolves to the right model ref (with/without env override)
- unconfigured provider fails fast with a clear message
- pre-token retryable error → falls back to the next candidate once
- pre-token non-retryable error → never falls back
- mid-stream error → never falls back, propagates immediately
- the `"cheap"` alias never applies the fallback chain
