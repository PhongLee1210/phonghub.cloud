import "server-only";

import { streamLLM } from "@/lib/llm";
import { LLMMessage } from "@/lib/llm/types";

/**
 * Few-shot prompt for the suggestion worker.
 * seedSuggestions from config/chat.ts define the short, punchy question style —
 * the examples below reflect that format. Seeds are NOT used as UI fallback chips.
 *
 * Edge cases covered: complete/closed answer (→ []), off-topic (→ []),
 * broad overview (→ 3 questions), specific topic (→ 2 questions).
 */
const SYSTEM_PROMPT = `You suggest follow-up questions a portfolio visitor might ask next.
Return a JSON array of 2-3 short, punchy questions in the visitor's voice.
Return [] when no natural follow-up exists.

<examples>
  <example>
    <conversation>Visitor asked about work experience. Assistant described roles at HiliosAI, LTV, FPT Telecom.</conversation>
    <output>["HiliosAI projects?", "LTV tech stack?", "FPT role details?"]</output>
  </example>
  <example>
    <conversation>Visitor asked about strongest skills. Assistant listed React, TypeScript, Python, FastAPI.</conversation>
    <output>["Main frameworks?", "Backend experience?", "AI/LLM work?"]</output>
  </example>
  <example>
    <conversation>Visitor asked to see all projects. Assistant gave an overview of 5 builds.</conversation>
    <output>["Most complex project?", "Open source work?", "Recent projects?"]</output>
  </example>
  <example>
    <conversation>Visitor asked where to download the resume. Assistant gave a direct download link.</conversation>
    <output>[]</output>
  </example>
  <example>
    <conversation>Visitor asked about hobbies and personal life.</conversation>
    <output>[]</output>
  </example>
</examples>

Reply with only the JSON array. No explanation.`;

function formatHistory(messages: LLMMessage[]): string {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.content}`)
    .join("\n");
}

/**
 * Runs concurrently with the main LLM stream. Passes conversation history to
 * a cheap/fast model with XML few-shot examples to generate 0-3 contextual
 * follow-up question chips. Returns undefined on parse error or empty result.
 */
export async function getSuggestions(
  history: LLMMessage[]
): Promise<string[] | undefined> {
  const conversationText = formatHistory(history);
  if (!conversationText) return undefined;

  const messages: LLMMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `<conversation>\n${conversationText}\n</conversation>`,
    },
  ];

  let text = "";
  try {
    for await (const chunk of streamLLM("cheap", {
      messages,
      maxTokens: 100,
      temperature: 0,
    })) {
      if (chunk.type === "text") text += chunk.text;
    }

    const parsed: unknown = JSON.parse(text.trim());
    if (!Array.isArray(parsed)) return undefined;
    const cleaned = parsed.filter(
      (q): q is string => typeof q === "string" && q.length > 0
    );
    return cleaned.length > 0 ? cleaned : undefined;
  } catch {
    return undefined;
  }
}
