import { describe, expect, test } from "bun:test";

import type { AgentCitation } from "@/types/chat";

import {
  assertHasCitations,
  assertHasContactAction,
  assertHasLeadCaptureAction,
  assertLeadPayloadHasTopic,
  assertMarkersMatchCitations,
  assertNoInventedRoutes,
  assertNotEmpty,
  assertNotTooLong,
  assertSequentialMarkers,
} from "./eval-assertions";

const makeCitation = (n: number): AgentCitation => ({
  id: `res-${n}`,
  type: "project",
  title: `Resource ${n}`,
  description: "",
  href: `/projects/res-${n}`,
});

// ── assertNotEmpty ────────────────────────────────────────────────

describe("assertNotEmpty", () => {
  test("passes at 80 chars", () => {
    expect(assertNotEmpty("a".repeat(80)).pass).toBe(true);
  });
  test("fails below 80 chars", () => {
    expect(assertNotEmpty("short").pass).toBe(false);
  });
});

// ── assertNotTooLong ─────────────────────────────────────────────

describe("assertNotTooLong", () => {
  test("passes at 2000 chars", () => {
    expect(assertNotTooLong("a".repeat(2000)).pass).toBe(true);
  });
  test("fails at 2001 chars", () => {
    expect(assertNotTooLong("a".repeat(2001)).pass).toBe(false);
  });
});

// ── assertHasCitations ───────────────────────────────────────────

describe("assertHasCitations", () => {
  test("passes when [1] present", () => {
    expect(assertHasCitations("Phong worked at Acme [1] and built X [2].").pass).toBe(true);
  });
  test("fails with no markers", () => {
    expect(assertHasCitations("Phong worked at Acme.").pass).toBe(false);
  });
});

// ── assertSequentialMarkers ──────────────────────────────────────

describe("assertSequentialMarkers", () => {
  test("passes with no markers", () => {
    expect(assertSequentialMarkers("no markers here").pass).toBe(true);
  });
  test("passes with [1][2][3]", () => {
    expect(assertSequentialMarkers("X [1] Y [2] Z [3]").pass).toBe(true);
  });
  test("passes when same marker reused — unique set is sequential", () => {
    expect(assertSequentialMarkers("X [1] Y [2] X [1]").pass).toBe(true);
  });
  test("fails with gap [1][3]", () => {
    expect(assertSequentialMarkers("X [1] Y [3]").pass).toBe(false);
  });
  test("fails when numbering starts at [2]", () => {
    expect(assertSequentialMarkers("X [2] Y [3]").pass).toBe(false);
  });
});

// ── assertMarkersMatchCitations ──────────────────────────────────

describe("assertMarkersMatchCitations", () => {
  test("passes when max marker equals citations count", () => {
    const r = assertMarkersMatchCitations(
      "X [1] Y [2]",
      [makeCitation(1), makeCitation(2)]
    );
    expect(r.pass).toBe(true);
  });
  test("fails when marker exceeds citations count", () => {
    const r = assertMarkersMatchCitations("X [1] Y [3]", [makeCitation(1)]);
    expect(r.pass).toBe(false);
  });
  test("passes with no markers", () => {
    expect(assertMarkersMatchCitations("no markers", []).pass).toBe(true);
  });
});

// ── assertHasContactAction ───────────────────────────────────────

describe("assertHasContactAction", () => {
  test("passes with contact_card action", () => {
    expect(assertHasContactAction("contact_card").pass).toBe(true);
  });
  test("fails with undefined action", () => {
    expect(assertHasContactAction(undefined).pass).toBe(false);
  });
  test("fails with different action", () => {
    expect(assertHasContactAction("star_repo").pass).toBe(false);
  });
});

// ── assertHasLeadCaptureAction ───────────────────────────────────

describe("assertHasLeadCaptureAction", () => {
  test("passes with lead_capture action", () => {
    expect(assertHasLeadCaptureAction("lead_capture").pass).toBe(true);
  });
  test("fails with undefined action", () => {
    expect(assertHasLeadCaptureAction(undefined).pass).toBe(false);
  });
  test("fails with contact_card action", () => {
    expect(assertHasLeadCaptureAction("contact_card").pass).toBe(false);
  });
});

// ── assertLeadPayloadHasTopic ───────────────────────────────────

describe("assertLeadPayloadHasTopic", () => {
  test("passes with valid topic 'hiring'", () => {
    expect(assertLeadPayloadHasTopic({ detectedTopic: "hiring" }).pass).toBe(true);
  });
  test("passes with valid topic 'product'", () => {
    expect(assertLeadPayloadHasTopic({ detectedTopic: "product" }).pass).toBe(true);
  });
  test("passes with valid topic 'automation'", () => {
    expect(assertLeadPayloadHasTopic({ detectedTopic: "automation" }).pass).toBe(true);
  });
  test("passes with valid topic 'advisory'", () => {
    expect(assertLeadPayloadHasTopic({ detectedTopic: "advisory" }).pass).toBe(true);
  });
  test("passes with valid topic 'other'", () => {
    expect(assertLeadPayloadHasTopic({ detectedTopic: "other" }).pass).toBe(true);
  });
  test("fails with undefined payload", () => {
    expect(assertLeadPayloadHasTopic(undefined).pass).toBe(false);
  });
  test("fails with missing topic", () => {
    expect(assertLeadPayloadHasTopic({}).pass).toBe(false);
  });
  test("fails with invalid topic", () => {
    expect(assertLeadPayloadHasTopic({ detectedTopic: "ai" }).pass).toBe(false);
  });
});

// ── assertNoInventedRoutes ───────────────────────────────────────

describe("assertNoInventedRoutes", () => {
  test("passes with known route in markdown link", () => {
    expect(
      assertNoInventedRoutes("See [projects](/projects) for more.").pass
    ).toBe(true);
  });
  test("passes with parameterized project route", () => {
    expect(
      assertNoInventedRoutes("See [this](/projects/enrollment-platform).").pass
    ).toBe(true);
  });
  test("passes with parameterized blog route", () => {
    expect(
      assertNoInventedRoutes("Read [post](/blogs/my-post).").pass
    ).toBe(true);
  });
  test("fails with invented route", () => {
    expect(
      assertNoInventedRoutes("See [admin](/admin/dashboard).").pass
    ).toBe(false);
  });
  test("passes when no routes in text", () => {
    expect(assertNoInventedRoutes("Phong worked at Acme.").pass).toBe(true);
  });
  test("passes with /resume route", () => {
    expect(
      assertNoInventedRoutes("Download [resume](/resume).").pass
    ).toBe(true);
  });
});
