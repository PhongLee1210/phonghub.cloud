import { ReactNode } from "react";

export interface AiToolDefinition<TResult = unknown> {
  description: string;
  parameters?: Record<string, unknown>;
  execute: () => Promise<{ data: TResult }>;
  render?: (props: { result: { data: TResult } }) => ReactNode;
}

/**
 * Type-safe builder for client-side AI tool definitions.
 * Call with a type parameter to get typed execute/render:
 *
 *   defineAiTool<{ route: string }>()({ description: "...", execute: ... })
 */
export function defineAiTool<TResult = unknown>() {
  return (definition: AiToolDefinition<TResult>) => definition;
}
