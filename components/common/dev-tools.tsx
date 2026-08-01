"use client";

import { Agentation } from "agentation";

export function DevTools() {
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <Agentation
      endpoint="http://localhost:9122"
      onSessionCreated={(sessionId) => {
        console.log("Session started:", sessionId);
      }}
    />
  );
}
