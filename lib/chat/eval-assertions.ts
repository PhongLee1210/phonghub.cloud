import { AgentCitation } from "@/types/chat";
import { isAllowedRoute } from "./prompt";

export interface AssertionResult {
  name: string;
  pass: boolean;
  detail: string;
}

/** Extract all [n] numbers from text in appearance order. */
function extractMarkers(text: string): number[] {
  return Array.from(text.matchAll(/\[(\d+)\]/g), (m) => Number(m[1]));
}

/** Extract markdown link hrefs that start with "/" — the only way the AI
 *  should surface internal navigation (e.g. [projects](/projects)). */
function extractMarkdownHrefs(text: string): string[] {
  return Array.from(text.matchAll(/\]\((\/[^)#\s]+)\)/g), (m) => m[1]);
}

export function assertNotEmpty(text: string, min = 80): AssertionResult {
  const pass = text.length >= min;
  return {
    name: "not_empty",
    pass,
    detail: `length=${text.length} ${pass ? "≥" : "<"} ${min}`,
  };
}

export function assertNotTooLong(text: string, max = 2000): AssertionResult {
  const pass = text.length <= max;
  return {
    name: "not_too_long",
    pass,
    detail: `length=${text.length} ${pass ? "≤" : ">"} ${max}`,
  };
}

export function assertHasCitations(text: string): AssertionResult {
  const pass = /\[\d+\]/.test(text);
  return {
    name: "has_citations",
    pass,
    detail: pass ? "[n] marker found" : "no [n] marker — AI skipped citation",
  };
}

export function assertSequentialMarkers(text: string): AssertionResult {
  const markers = extractMarkers(text);
  if (markers.length === 0) {
    return { name: "sequential", pass: true, detail: "no markers — skip" };
  }
  const unique = Array.from(new Set(markers)).sort((a, b) => a - b);
  const expected = Array.from({ length: unique.length }, (_, i) => i + 1);
  const pass = JSON.stringify(unique) === JSON.stringify(expected);
  return {
    name: "sequential",
    pass,
    detail: pass
      ? `[${unique.join("][")}] — sequential from 1`
      : `got [${unique.join("][")}] expected [${expected.join("][")}]`,
  };
}

export function assertMarkersMatchCitations(
  text: string,
  citations: AgentCitation[]
): AssertionResult {
  const markers = extractMarkers(text);
  if (markers.length === 0) {
    return { name: "markers_match", pass: true, detail: "no markers — skip" };
  }
  const maxMarker = Math.max(...markers);
  const pass = maxMarker <= citations.length;
  return {
    name: "markers_match",
    pass,
    detail: `max=[${maxMarker}] citations.length=${citations.length}`,
  };
}

export function assertNoInventedRoutes(text: string): AssertionResult {
  const hrefs = extractMarkdownHrefs(text);
  const invented = hrefs.filter((r) => !isAllowedRoute(r));
  const pass = invented.length === 0;
  return {
    name: "no_invented_routes",
    pass,
    detail: pass
      ? hrefs.length === 0
        ? "no route hrefs found"
        : `all valid: ${hrefs.join(", ")}`
      : `invented: ${invented.join(", ")}`,
  };
}

export function runAssertions(
  text: string,
  citations: AgentCitation[]
): AssertionResult[] {
  return [
    assertNotEmpty(text),
    assertNotTooLong(text),
    assertHasCitations(text),
    assertSequentialMarkers(text),
    assertMarkersMatchCitations(text, citations),
    assertNoInventedRoutes(text),
  ];
}
