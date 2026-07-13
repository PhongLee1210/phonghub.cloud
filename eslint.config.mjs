import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    ignores: ["lib/llm/**", "lib/chat/tools.ts", "lib/chat/tools.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "ai",
              message:
                "The Vercel AI SDK is only used inside lib/llm/providers/*. Import lib/llm instead.",
            },
          ],
          patterns: [
            {
              group: ["@/lib/llm/providers/*", "**/lib/llm/providers/*"],
              message:
                "Import lib/llm (the gateway's public index) instead of a provider adapter directly.",
            },
            {
              group: ["@ai-sdk/*"],
              message:
                "Provider SDKs are only used inside lib/llm/providers/*. Import lib/llm instead.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
