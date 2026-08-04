"use client";

import dynamic from "next/dynamic";

const SkillsGraphLoader = dynamic(
  () => import("./skills-graph"),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4 rounded-xl border bg-background p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-16 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
          <div className="relative aspect-square w-full max-w-xl mx-auto overflow-hidden rounded-lg sm:aspect-[4/3]">
            <div className="absolute inset-0 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border bg-background p-4 sm:p-6">
          <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    ),
  }
);

export { SkillsGraphLoader };
