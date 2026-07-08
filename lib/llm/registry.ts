import "server-only";

import { anthropicProvider } from "./providers/anthropic";
import { openaiProvider } from "./providers/openai";
import { googleProvider } from "./providers/google";
import { groqProvider } from "./providers/groq";
import { LLMProvider, ProviderId } from "./types";

const ALL_PROVIDERS: LLMProvider[] = [
  anthropicProvider,
  openaiProvider,
  googleProvider,
  groqProvider,
];

let cache: Map<ProviderId, LLMProvider> | undefined;

/** Providers whose env key is present, built lazily and cached per lambda instance. */
function getRegistry(): Map<ProviderId, LLMProvider> {
  if (!cache) {
    cache = new Map(
      ALL_PROVIDERS.filter((p) => p.isConfigured()).map((p) => [p.id, p])
    );

    // Soft reminder, not an enforced gate (see implementation-notes.md):
    // spend caps are a manual step in each provider's own console — this
    // just makes it visible once per cold start which providers are live.
    console.log(
      JSON.stringify({
        scope: "llm.gateway.startup",
        configuredProviders: Array.from(cache.keys()),
        message:
          "Verify spend caps are set in each provider's console — see lib/llm/README.md",
      })
    );
  }
  return cache;
}

export function getProvider(id: ProviderId): LLMProvider | undefined {
  return getRegistry().get(id);
}

/**
 * Test-only: resets the lazy cache so the next getProvider() call rebuilds
 * the registry (and re-logs the startup reminder). The cache is a
 * process-wide singleton by design (one per lambda instance in prod), so
 * tests need an explicit way to observe "rebuild" behavior in isolation
 * rather than depending on which test file happens to run first.
 */
export function __resetRegistryForTests(): void {
  cache = undefined;
}

/**
 * Test-only: seeds the registry with a fixed set of fake providers,
 * bypassing env-key detection entirely. Preferred over `mock.module` for
 * this module — `mock.module` patches the shared, process-wide module
 * registry and was found (empirically, via a failing cross-file test) to
 * leak between bun:test files in this Bun version even with an afterEach
 * restore. This hook keeps tests fully isolated with no such risk, at the
 * cost of one small test-only export.
 */
export function __setProvidersForTests(providers: LLMProvider[]): void {
  cache = new Map(providers.map((p) => [p.id, p]));
}
