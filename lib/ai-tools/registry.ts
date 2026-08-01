import { create } from "zustand";

import { SerializedClientTool } from "@/types/chat";

import { AiToolDefinition } from "./define";

export interface ClientToolEntry {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: () => Promise<unknown>;
}

interface AiToolRegistryState {
  tools: Map<string, ClientToolEntry>;
  register: (name: string, tool: AiToolDefinition) => void;
  unregister: (name: string) => void;
  snapshot: () => Promise<SerializedClientTool[]>;
}

export const useAiToolRegistry = create<AiToolRegistryState>((set, get) => ({
  tools: new Map(),

  register: (name, tool) => {
    set((state) => {
      const next = new Map(state.tools);
      next.set(name, {
        name,
        description: tool.description,
        parameters: tool.parameters ?? {},
        execute: async () => {
          const result = await tool.execute();
          return result.data;
        },
      });
      return { tools: next };
    });
  },

  unregister: (name) => {
    set((state) => {
      const next = new Map(state.tools);
      next.delete(name);
      return { tools: next };
    });
  },

  snapshot: async () => {
    const entries = Array.from(get().tools.values());
    const results = await Promise.all(
      entries.map(async (entry) => {
        try {
          const preResolved = await entry.execute();
          return {
            name: entry.name,
            description: entry.description,
            parameters: entry.parameters,
            preResolved,
          };
        } catch (err) {
          console.warn(
            `[ai-tools/registry] snapshot failed for "${entry.name}":`,
            err
          );
          return null;
        }
      })
    );
    return results.filter((r): r is SerializedClientTool => r !== null);
  },
}));
