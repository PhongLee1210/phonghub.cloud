import "server-only";

import { ModelAlias, ModelRef, ProviderId } from "./types";
const PROVIDER_IDS: readonly ProviderId[] = [
  "anthropic",
  "openai",
  "google",
  "groq",
  "mistral",
];

// D2 defaults — reviewed defaults from the plan, adopted as-is (see
// implementation-notes.md, Deviations §4). Override per environment via
// LLM_CHAT_MODEL / LLM_CHEAP_MODEL without any code change.
const DEFAULT_MODEL_REFS: Record<ModelAlias, ModelRef> = {
  chat: "anthropic:claude-haiku-4-5",
  cheap: "groq:llama-3.1-8b-instant",
};

const ALIAS_ENV_VAR: Record<ModelAlias, string> = {
  chat: "LLM_CHAT_MODEL",
  cheap: "LLM_CHEAP_MODEL",
};

function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as readonly string[]).includes(value);
}

function parseModelRef(raw: string): ModelRef {
  const separatorIndex = raw.indexOf(":");
  if (separatorIndex <= 0) {
    throw new Error(
      `Invalid model ref "${raw}" — expected "<provider>:<model>", e.g. "anthropic:claude-haiku-4-5".`
    );
  }
  const providerId = raw.slice(0, separatorIndex);
  if (!isProviderId(providerId)) {
    throw new Error(
      `Invalid provider "${providerId}" in model ref "${raw}". Known providers: ${PROVIDER_IDS.join(", ")}.`
    );
  }
  return raw as ModelRef;
}

/** Resolves a role alias ("chat" | "cheap") to a concrete provider:model ref. */
export function resolveModelRef(alias: ModelAlias): ModelRef {
  const override = process.env[ALIAS_ENV_VAR[alias]];
  return parseModelRef(override || DEFAULT_MODEL_REFS[alias]);
}

export function splitModelRef(ref: ModelRef): {
  providerId: ProviderId;
  model: string;
} {
  const separatorIndex = ref.indexOf(":");
  return {
    providerId: ref.slice(0, separatorIndex) as ProviderId,
    model: ref.slice(separatorIndex + 1),
  };
}

/**
 * D8 — ordered fallback chain, off by default. Only used for the "chat"
 * alias (the one user-facing consumer today).
 */
export function resolveFallbackChain(): ModelRef[] {
  const raw = process.env.LLM_CHAT_FALLBACKS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseModelRef);
}

export function envKeyForProvider(providerId: ProviderId): string {
  switch (providerId) {
    case "anthropic":
      return "ANTHROPIC_API_KEY";
    case "openai":
      return "OPENAI_API_KEY";
    case "google":
      return "GOOGLE_GENERATIVE_AI_API_KEY";
    case "groq":
      return "GROQ_API_KEY";
    case "mistral":
      return "MISTRAL_API_KEY";
  }
}

export interface ModelMetadata {
  contextWindowTokens: number;
  maxOutputTokens: number;
}

const CONSERVATIVE_DEFAULT: ModelMetadata = {
  contextWindowTokens: 8_192,
  maxOutputTokens: 4_096,
};

const MODEL_METADATA: Partial<Record<string, ModelMetadata>> = {
  "claude-haiku-4-5": { contextWindowTokens: 200_000, maxOutputTokens: 8_192 },
  "claude-sonnet-4-5": { contextWindowTokens: 200_000, maxOutputTokens: 16_384 },
  "gpt-4o": { contextWindowTokens: 128_000, maxOutputTokens: 16_384 },
  "gpt-4o-mini": { contextWindowTokens: 128_000, maxOutputTokens: 16_384 },
  "gemini-2.0-flash": { contextWindowTokens: 1_000_000, maxOutputTokens: 8_192 },
  "llama-3.1-8b-instant": { contextWindowTokens: 128_000, maxOutputTokens: 8_192 },
  "llama-3.3-70b-versatile": { contextWindowTokens: 128_000, maxOutputTokens: 32_768 },
  "mistral-small-latest": { contextWindowTokens: 32_000, maxOutputTokens: 8_192 },
  "mistral-large-latest": { contextWindowTokens: 128_000, maxOutputTokens: 8_192 },
};

export function getModelMetadata(ref: ModelRef): ModelMetadata {
  const { model } = splitModelRef(ref);
  return MODEL_METADATA[model] ?? CONSERVATIVE_DEFAULT;
}

export function effectiveContextBudget(
  alias: ModelAlias,
  internalBudget: number
): number {
  const ref = resolveModelRef(alias);
  const meta = getModelMetadata(ref);
  const modelInputCeiling = meta.contextWindowTokens - meta.maxOutputTokens;
  return Math.min(internalBudget, modelInputCeiling);
}
