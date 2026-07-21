/**
 * Skill code snippets — short, idiomatic samples keyed by `ISkill.key`
 * (see `config/skills.ts`). Rendered in the Skills showcase composition's
 * code editor panel.
 *
 * Schema mirrors `config/project-snippets.ts`. Each snippet is 8–14 lines
 * of valid syntax in its declared language.
 */
export interface SkillSnippet {
  /** Must match an `ISkill.key` from `config/skills.ts`. */
  skillKey: string;
  filename: string;
  language: "typescript" | "python";
  rawLines: string[];
}

export const SKILL_SNIPPETS: readonly SkillSnippet[] = [
  {
    skillKey: "typescript",
    filename: "lib/types/guard.ts",
    language: "typescript",
    rawLines: [
      "// Generic constraint — narrow without losing inference",
      "function pickBy<T extends Record<string, unknown>>(",
      "  obj: T,",
      "  keys: readonly (keyof T)[],",
      "): Pick<T, (typeof keys)[number]> {",
      "  return Object.fromEntries(",
      "    keys.map((k) => [k, obj[k]] as const),",
      "  ) as Pick<T, (typeof keys)[number]>;",
      "}",
      "",
      "const user = pickBy({ id: 1, name: 'Phong', role: 'dev' }, ['id', 'name']);",
    ],
  },
  {
    skillKey: "react",
    filename: "hooks/use-debounced-value.ts",
    language: "typescript",
    rawLines: [
      "import { useEffect, useState } from 'react';",
      "",
      "export function useDebouncedValue<T>(value: T, delay = 250): T {",
      "  const [debounced, setDebounced] = useState(value);",
      "",
      "  useEffect(() => {",
      "    const id = setTimeout(() => setDebounced(value), delay);",
      "    return () => clearTimeout(id); // cleanup on every change",
      "  }, [value, delay]);",
      "",
      "  return debounced;",
      "}",
    ],
  },
  {
    skillKey: "nextjs",
    filename: "app/api/health/route.ts",
    language: "typescript",
    rawLines: [
      "// App Router route handler — streaming JSON response",
      "import { NextResponse } from 'next/server';",
      "",
      "export const dynamic = 'force-dynamic';",
      "",
      "export async function GET() {",
      "  return NextResponse.json(",
      "    { status: 'ok', uptime: process.uptime() },",
      "    { headers: { 'cache-control': 'no-store' } },",
      "  );",
      "}",
    ],
  },
  {
    skillKey: "nodejs",
    filename: "server/middleware/request-logger.ts",
    language: "typescript",
    rawLines: [
      "import type { RequestHandler } from 'express';",
      "",
      "export const requestLogger: RequestHandler = (req, res, next) => {",
      "  const start = Date.now();",
      "  res.on('finish', () => {",
      "    console.info(",
      "      `${req.method} ${req.path} → ${res.statusCode} (${Date.now() - start}ms)`,",
      "    );",
      "  });",
      "  next();",
      "};",
    ],
  },
  {
    skillKey: "python",
    filename: "app/models/enrollment.py",
    language: "python",
    rawLines: [
      "from dataclasses import dataclass",
      "from datetime import datetime",
      "from typing import Literal",
      "",
      "@dataclass(slots=True)",
      "class Enrollment:",
      '    """Type-safe enrollment record."""',
      "    student_id: str",
      "    course_id: str",
      "    status: Literal['pending', 'confirmed', 'cancelled']",
      "    created_at: datetime",
    ],
  },
  {
    skillKey: "graphql",
    filename: "schema/enrollment.graphql",
    language: "typescript",
    rawLines: [
      "type Enrollment {",
      "  id: ID!",
      "  studentId: ID!",
      "  courseId: ID!",
      "  status: EnrollmentStatus!",
      "}",
      "",
      "type Query { enrollment(id: ID!): Enrollment }",
      "type Mutation { cancelEnrollment(id: ID!): Enrollment! }",
    ],
  },
  {
    skillKey: "tailwindcss",
    filename: "components/ui/button.ts",
    language: "typescript",
    rawLines: [
      "import { cva } from 'class-variance-authority';",
      "",
      "export const buttonVariants = cva(",
      "  'inline-flex items-center justify-center rounded-md font-medium',",
      "  {",
      "    variants: {",
      "      variant: { primary: 'bg-primary text-primary-foreground', ghost: 'hover:bg-muted' },",
      "      size: { sm: 'h-8 px-3', md: 'h-10 px-4' },",
      "    },",
      "    defaultVariants: { variant: 'primary', size: 'md' },",
      "  },",
      ");",
    ],
  },
  {
    skillKey: "postgresql",
    filename: "db/queries/find-members.sql.ts",
    language: "typescript",
    rawLines: [
      "// Parameterized query — safe from SQL injection",
      "import { pool } from '@/lib/db';",
      "",
      "export async function findMembersByGym(gymId: string, limit = 50) {",
      "  const { rows } = await pool.query(",
      "    `SELECT id, name, email",
      "     FROM members",
      "     WHERE gym_id = $1",
      "     ORDER BY created_at DESC",
      "     LIMIT $2`,",
      "    [gymId, limit],",
      "  );",
      "  return rows;",
      "}",
    ],
  },
];
