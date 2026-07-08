import { describe, expect, spyOn, test } from "bun:test";

import { __resetRegistryForTests, getProvider } from "./registry";

describe("registry startup log", () => {
  test("logs the configured-providers reminder exactly once across repeated calls", () => {
    __resetRegistryForTests();
    const logSpy = spyOn(console, "log");

    getProvider("anthropic");
    getProvider("openai");
    getProvider("groq");

    const startupLogs = logSpy.mock.calls.filter(
      (call) =>
        typeof call[0] === "string" && call[0].includes("llm.gateway.startup")
    );
    expect(startupLogs).toHaveLength(1);

    logSpy.mockRestore();
  });
});
