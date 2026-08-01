"use client";

import { useEffect } from "react";

import { AiToolDefinition } from "@/lib/ai-tools/define";
import { useAiToolRegistry } from "@/lib/ai-tools/registry";

interface RegisterAiToolProps<TResult = unknown> {
  name: string;
  tool: AiToolDefinition<TResult>;
}

export function RegisterAiTool<TResult>({
  name,
  tool,
}: RegisterAiToolProps<TResult>) {
  const register = useAiToolRegistry((s) => s.register);
  const unregister = useAiToolRegistry((s) => s.unregister);

  useEffect(() => {
    register(name, tool as AiToolDefinition);
    return () => unregister(name);
  }, [name, tool, register, unregister]);

  return null;
}
