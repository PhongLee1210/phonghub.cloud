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
import { runAssertions, runContactAssertions, runLeadCaptureAssertions, runSkillsAssertions, type AssertionResult } from "@/lib/chat/eval-assertions";

const BASE = process.env.EVAL_BASE_URL ?? "http://localhost:3000";
const DELAY_MS = Number(process.env.EVAL_DELAY_MS) || 3000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Mirrors chatConfig.seedSuggestionCards prompts without importing the
 *  chatConfig module (which pulls in React icon imports). */
type EvalCase =
  | { label: string; prompt: string; type: "standard" | "contact" | "skills" }
  | { label: string; messages: { role: "user" | "assistant"; content: string }[]; type: "lead_capture" }
  | { label: string; prompt: string; type: "lead_capture" };

const EVAL_CASES: EvalCase[] = [
  { label: "Work experience", prompt: "What's Phong's work experience?",    type: "standard" },
  { label: "Projects",        prompt: "What projects has Phong worked on?",  type: "standard" },
  { label: "Skills",          prompt: "What are Phong's most confident skills?", type: "skills" },
  { label: "Contact",         prompt: "How can I contact Phong?",            type: "contact"  },
  // Lead capture — single message, explicit hire intent
  {
    label: "Lead: hire intent",
    prompt: "I'm looking to hire Phong for a product build. My name is Alex and my email is alex@example.com. Can you connect us?",
    type: "lead_capture",
  },
  // Lead capture — single message, collaboration intent
  {
    label: "Lead: collab intent",
    prompt: "I want to work with Phong on an automation project. Please help me reach out to him.",
    type: "lead_capture",
  },
  // Lead capture — multi-turn conversation
  {
    label: "Lead: conversation",
    messages: [
      { role: "user", content: "What kind of projects has Phong worked on?" },
      { role: "assistant", content: "Phong has worked on several projects spanning web platforms, automation tools, and AI-powered applications [1]. You can explore his full portfolio at [projects](/projects)." },
      { role: "user", content: "Impressive! I have a product idea and would love to discuss working together. Yes, please help me reach out to Phong." },
    ],
    type: "lead_capture",
  },
];

// ── stream collector ─────────────────────────────────────────────────────────

async function collectStream(
  body: ReadableStream<Uint8Array>
): Promise<{
  text: string;
  doneEvent: DoneEvent | null;
  action: string | undefined;
  actionPayload: Record<string, unknown> | undefined;
}> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let doneEvent: DoneEvent | null = null;
  let action: string | undefined;
  let actionPayload: Record<string, unknown> | undefined;

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
        if (event.type === ChatEventType.Action) {
          action = event.action;
          if ("payload" in event && event.payload) {
            actionPayload = event.payload as unknown as Record<string, unknown>;
          }
        }
      } catch {
        // skip malformed NDJSON lines
      }
    }
  }

  return { text, doneEvent, action, actionPayload };
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
  console.log(`  ${YELLOW}has_lead_capture${RESET}   action="lead_capture" triggered (lead_capture cases)`);
  console.log(`  ${YELLOW}lead_has_topic${RESET}     payload.detectedTopic is a valid lead topic`);
  console.log(`${"─".repeat(58)}\n`);
}

// ── main ─────────────────────────────────────────────────────────────────────

async function runEval() {
  printExpectations();

  let totalPass = 0;
  let totalChecks = 0;
  let promptsPassed = 0;

  for (let i = 0; i < EVAL_CASES.length; i++) {
    const evalCase = EVAL_CASES[i];
    const { label, type } = evalCase;

    const messages =
      "messages" in evalCase
        ? evalCase.messages
        : [{ role: "user" as const, content: evalCase.prompt }];
    const displayPrompt =
      "messages" in evalCase
        ? `[${messages.length}-turn conversation]`
        : evalCase.prompt;

    console.log(`${BOLD}── ${i + 1}/${EVAL_CASES.length}: ${label}${RESET}`);
    console.log(`   ${DIM}"${displayPrompt}"${RESET}\n`);

    const expectedChecks = type === "standard" ? 6 : type === "skills" ? 5 : type === "contact" ? 4 : 5;

    let res: Response;
    try {
      res = await fetch(`${BASE}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages }),
      });
    } catch (err) {
      console.log(`  ${RED}✗ fetch failed — is the server running at ${BASE}?${RESET}`);
      console.log(`    ${String(err)}\n`);
      totalChecks += expectedChecks;
      continue;
    }

    if (!res.ok || !res.body) {
      console.log(`  ${RED}✗ HTTP ${res.status} — skipping${RESET}\n`);
      totalChecks += expectedChecks;
      continue;
    }

    const { text, doneEvent, action, actionPayload } = await collectStream(res.body);
    const citations: AgentCitation[] = doneEvent?.citations ?? [];

    const preview = text.length > 300 ? text.slice(0, 300) + "…" : text;
    console.log(`  ${DIM}Response (${text.length} chars, ${citations.length} citations, action=${action ?? "none"}):${RESET}`);
    console.log(`  ${DIM}"${preview}"${RESET}\n`);

    let results: AssertionResult[];
    if (type === "lead_capture") {
      results = runLeadCaptureAssertions(text, action, actionPayload);
    } else if (type === "contact") {
      results = runContactAssertions(text, action);
    } else if (type === "skills") {
      results = runSkillsAssertions(text, citations);
    } else {
      results = runAssertions(text, citations);
    }

    for (const r of results) {
      printResult(r);
      totalChecks++;
      if (r.pass) totalPass++;
    }

    const casePass = results.every((r) => r.pass);
    if (casePass) promptsPassed++;
    console.log(`\n  ${casePass ? GREEN + "PASS" : RED + "FAIL"}${RESET}\n`);

    if (i < EVAL_CASES.length - 1) {
      console.log(`  ${DIM}⏳ waiting ${DELAY_MS / 1000}s (rate limit cooldown)...${RESET}\n`);
      await sleep(DELAY_MS);
    }
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
