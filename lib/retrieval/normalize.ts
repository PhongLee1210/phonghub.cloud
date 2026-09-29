/**
 * Term normalization and the curated shorthand table.
 *
 * The search tools receive free text written by a model, which renders the
 * same skill half a dozen ways ("Next.js", "NextJS", "next js"). The config
 * stores exactly one spelling, and the old tools compared raw strings against
 * it — so every other spelling returned nothing and the assistant reported
 * "I couldn't find anything" about work that exists.
 */

/**
 * Lowercases and removes separators and punctuation, leaving letters and
 * digits. "Next.js", "NextJS" and "next js" all become "nextjs".
 */
export function normalizeTerm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Shorthand a visitor might type → the canonical name in config/skills.ts.
 *
 * Only entries that normalization alone cannot bridge belong here: "nextjs"
 * already normalizes onto "Next.js", so it needs no alias, while "ts" and
 * "postgres" share no normalized form with their targets. A test asserts every
 * target here is a real skill name, so a typo cannot quietly point at nothing.
 */
export const SKILL_ALIASES: Record<string, string> = {
  ts: "TypeScript",
  js: "JavaScript",
  ecmascript: "JavaScript",
  py: "Python",
  node: "Node.js",
  nodejs: "Node.js",
  postgres: "PostgreSQL",
  psql: "PostgreSQL",
  pg: "PostgreSQL",
  mongo: "MongoDB",
  gql: "GraphQL",
  rn: "React Native",
  reactnative: "React Native",
  tailwind: "Tailwind CSS",
  mui: "Material UI",
  nest: "Nest.js",
  express: "express.js",
  vue: "Vue.js",
  bun: "Bun.js",
  ai: "Artificial Intelligence (AI)",
  llm: "Artificial Intelligence (AI)",
  ml: "Artificial Intelligence (AI)",
  gcp: "Google Cloud",
  amazonwebservices: "AWS",
  ci: "CI/CD",
  cd: "CI/CD",
  continuousintegration: "CI/CD",
  turborepo: "Turbo Repo",
  nxmonorepo: "Nx Monorepo",
  html: "HTML 5",
  css: "CSS 3",
};

/** The canonical skill name a shorthand stands for, if any. */
export function resolveAlias(term: string): string | undefined {
  const normalized = normalizeTerm(term);
  if (!normalized) return undefined;
  return SKILL_ALIASES[normalized];
}
