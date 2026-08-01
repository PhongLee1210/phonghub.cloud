#!/usr/bin/env bun
/**
 * Chat eval script — Technique 2: structural assertions on live AI responses.
 *
 * Requires a running dev/prod server and a valid API key in env.
 * Run: EVAL_BASE_URL=http://localhost:3000 bun run eval
 *
 * Does NOT use bun:test — LLM calls are non-deterministic and slow.
 * The assertion logic is unit-tested separately in eval-assertions.test.ts.
 */

import type {
  AgentCitation,
  ChatStreamEvent,
  DoneEvent,
} from "@/types/chat";
import { ChatEventType } from "@/types/chat";
import { runAssertions, runContactAssertions, type AssertionResult } from "@/lib/chat/eval-assertions";

const BASE = process.env.EVAL_BASE_URL ?? "http://localhost:3000";

/** Mirrors chatConfig.seedSuggestionCards prompts without importing the
 *  chatConfig module (which pulls in React icon imports). */
const EVAL_CASES = [
  { label: "Work experience", prompt: "What's Phong's work experience?",    type: "standard" },
  { label: "Projects",        prompt: "What projects has Phong worked on?",  type: "standard" },
  { label: "Skills",          prompt: "What are Phong's most confident skills?", type: "standard" },
  { label: "Contact",         prompt: "How can I contact Phong?",            type: "contact"  },
] as const;

// ── stream collector ─────────────────────────────────────────────────────────

async function collectStream(
  body: ReadableStream<Uint8Array>
): Promise<{ text: string; doneEvent: DoneEvent | null; action: string | undefined }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let doneEvent: DoneEvent | null = null;
  let action: string | undefined;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line) as ChatStreamEvent;
        if (event.type === ChatEventType.Token) text += event.text;
        if (event.type === ChatEventType.Done) doneEvent = event;
        if (event.type === ChatEventType.Action) action = event.action;
      } catch {
        // skip malformed NDJSON lines
      }
    }
  }

  return { text, doneEvent, action };
}

// ── display helpers ──────────────────────────────────────────────────────────

const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET  = "\x1b[0m";
const DIM    = "\x1b[2m";
const BOLD   = "\x1b[1m";

function icon(pass: boolean) {
  return pass ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
}

function printResult(r: AssertionResult) {
  const name = r.name.padEnd(22);
  console.log(`    ${icon(r.pass)} ${name}${DIM}${r.detail}${RESET}`);
}

function printExpectations() {
  console.log(`\n${BOLD}══ EVAL EXPECTATIONS ════════════════════════════════════${RESET}`);
  console.log(`  ${DIM}These are the structural rules every AI response must pass.${RESET}`);
  console.log(`  ${YELLOW}not_empty${RESET}          length ≥ 80 chars`);
  console.log(`  ${YELLOW}not_too_long${RESET}       length ≤ 2000 chars  ${DIM}← key quality gate: no walls of text${RESET}`);
  console.log(`  ${YELLOW}has_citations${RESET}      ≥1 [n] marker inline when mentioning a resource`);
  console.log(`  ${YELLOW}sequential${RESET}         [1][2][3]… no gaps, starting from [1]`);
  console.log(`  ${YELLOW}markers_match${RESET}      max [n] ≤ done.citations.length (no orphan markers)`);
  console.log(`  ${YELLOW}no_invented_routes${RESET} markdown link hrefs only from ALLOWED_ROUTES`);
  console.log(`${"─".repeat(58)}\n`);
}

// ── main ─────────────────────────────────────────────────────────────────────

async function runEval() {
  printExpectations();

  let totalPass = 0;
  let totalChecks = 0;
  let promptsPassed = 0;

  for (let i = 0; i < EVAL_CASES.length; i++) {
    const { label, prompt } = EVAL_CASES[i];
    console.log(`${BOLD}── ${i + 1}/${EVAL_CASES.length}: ${label}${RESET}`);
    console.log(`   ${DIM}"${prompt}"${RESET}\n`);

    let res: Response;
    try {
      res = await fetch(`${BASE}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
        }),
      });
    } catch (err) {
      console.log(`  ${RED}✗ fetch failed — is the server running at ${BASE}?${RESET}`);
      console.log(`    ${String(err)}\n`);
      totalChecks += EVAL_CASES[i].type === "contact" ? 4 : 6;
      continue;
    }

    if (!res.ok || !res.body) {
      console.log(`  ${RED}✗ HTTP ${res.status} — skipping${RESET}\n`);
      totalChecks += EVAL_CASES[i].type === "contact" ? 4 : 6;
      continue;
    }

    const { text, doneEvent, action } = await collectStream(res.body);
    const citations: AgentCitation[] = doneEvent?.citations ?? [];
    const isContact = EVAL_CASES[i].type === "contact";

    // Show preview of first 300 chars
    const preview = text.length > 300 ? text.slice(0, 300) + "…" : text;
    console.log(`  ${DIM}Response (${text.length} chars, ${citations.length} citations, action=${action ?? "none"}):${RESET}`);
    console.log(`  ${DIM}"${preview}"${RESET}\n`);

    const results = isContact
      ? runContactAssertions(text, action)
      : runAssertions(text, citations);
    for (const r of results) {
      printResult(r);
      totalChecks++;
      if (r.pass) totalPass++;
    }

    const casePass = results.every((r) => r.pass);
    if (casePass) promptsPassed++;
    console.log(`\n  ${casePass ? GREEN + "PASS" : RED + "FAIL"}${RESET}\n`);
  }

  console.log(`${"═".repeat(58)}`);
  const allPassed = promptsPassed === EVAL_CASES.length;
  console.log(
    `${BOLD}RESULTS: ${allPassed ? GREEN : RED}${promptsPassed}/${EVAL_CASES.length} prompts  ${totalPass}/${totalChecks} checks${RESET}`
  );
  console.log(`${"═".repeat(58)}\n`);

  if (!allPassed) process.exit(1);
}

runEval().catch((err) => {
  console.error("Eval script crashed:", err);
  process.exit(1);
});
