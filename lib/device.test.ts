import { describe, expect, test } from "bun:test";

import { detectDevice } from "./device";

describe("detectDevice", () => {
  test("iPhone UA → isMobile true, isIOS true, isTablet false", () => {
    const result = detectDevice(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
    );
    expect(result.isMobile).toBe(true);
    expect(result.isIOS).toBe(true);
    expect(result.isTablet).toBe(false);
  });

  test("Android Mobile UA → isMobile true, isIOS false, isTablet false", () => {
    const result = detectDevice(
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile"
    );
    expect(result.isMobile).toBe(true);
    expect(result.isIOS).toBe(false);
    expect(result.isTablet).toBe(false);
  });

  test("iPad UA → isTablet true, isMobile false, isIOS true", () => {
    const result = detectDevice(
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)"
    );
    expect(result.isTablet).toBe(true);
    expect(result.isMobile).toBe(false);
    expect(result.isIOS).toBe(true);
  });

  test("Desktop Chrome → all false", () => {
    const result = detectDevice(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/120"
    );
    expect(result.isMobile).toBe(false);
    expect(result.isIOS).toBe(false);
    expect(result.isTablet).toBe(false);
  });

  test("empty string UA → all false, no throw", () => {
    const result = detectDevice("");
    expect(result.isMobile).toBe(false);
    expect(result.isIOS).toBe(false);
    expect(result.isTablet).toBe(false);
  });
});
