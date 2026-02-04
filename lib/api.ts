import { siteConfig } from "@/config/site";

/**
 * Base URL for fetching your app's API (e.g. /api/projects, /api/skills).
 *
 * For fetch to work during `next build` (prerender / generateStaticParams),
 * this must point to a URL that is reachable at build time. During build
 * no local server is running, so localhost would fail with ECONNREFUSED.
 *
 * Set NEXT_PUBLIC_APP_URL in your build environment to your deployed URL:
 * - Vercel: set NEXT_PUBLIC_APP_URL=https://phonghub.cloud (or your staging URL)
 * - Local build: set in .env.production or run with NEXT_PUBLIC_APP_URL=https://phonghub.cloud
 *
 * If unset, falls back to siteConfig.url (your production URL).
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? siteConfig.url;
}
