"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

import { pagesConfig } from "@/config/pages";
import { ValidPages } from "@/config/constants";
import { AiToolDefinition } from "@/lib/ai-tools/define";

import { RegisterAiTool } from "./register-ai-tool";

const PATHNAME_TO_PAGE: Record<string, ValidPages> = {
  "/": "home",
  "/skills": "skills",
  "/projects": "projects",
  "/experience": "experience",
  "/contact": "contact",
  "/resume": "resume",
  "/list100": "list100",
  "/blogs": "blogs",
};

interface PageContext {
  route: string;
  title: string;
  description: string;
}

export function PageContextTool() {
  const pathname = usePathname();

  const tool = useMemo<AiToolDefinition<PageContext> | null>(() => {
    const pageKey = PATHNAME_TO_PAGE[pathname];
    if (!pageKey) return null;

    const page = pagesConfig[pageKey];
    const data: PageContext = {
      route: pathname,
      title: page.title,
      description: page.description,
    };

    return {
      description:
        "Get the current page the visitor is viewing, including route, title, and description",
      execute: async () => ({ data }),
    };
  }, [pathname]);

  if (!tool) return null;

  return <RegisterAiTool name="get_page_context" tool={tool} />;
}
