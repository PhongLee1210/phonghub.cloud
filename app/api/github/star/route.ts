import { NextRequest, NextResponse } from "next/server";

import { siteConfig } from "@/config/site";
import { getRedisClient } from "@/lib/chat/redis";
import { GitHubClientError, getStarStatus, starRepository } from "@/lib/github/client";
import { checkStarRateLimit } from "@/lib/github/rate-limit";

export const runtime = "nodejs";

const STATUS_CACHE_KEY = "phonghub:github:star:status";
const STATUS_CACHE_TTL_SECONDS = 60;

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Maps a GitHubClientError to an HTTP response. Every code here reflects a
 * server-side misconfiguration or upstream condition, never something the
 * visitor did wrong, so client-facing messages stay generic while the
 * specifics go to the server log for whoever owns GITHUB_TOKEN.
 */
function errorResponse(err: unknown): NextResponse {
  if (err instanceof GitHubClientError) {
    console.error(
      `ERROR: GitHub API call failed in app/api/github/star/route.ts\n` +
        `WHY: ${err.code} — ${err.message}\n` +
        `FIX: ${
          err.code === "not_configured" || err.code === "unauthorized"
            ? "Check GITHUB_TOKEN in the deployment environment (see .env.example)."
            : err.code === "forbidden"
              ? "Confirm the token has starring/public_repo scope and, if the repo is in an org, that SSO is authorized."
              : err.code === "not_found"
                ? `Confirm ${siteConfig.repository.owner}/${siteConfig.repository.name} exists and is visible to the token.`
                : "Check GitHub API status and retry."
        }`
    );

    switch (err.code) {
      case "rate_limited":
        return NextResponse.json(
          { error: "GitHub API rate limit reached. Please try again shortly." },
          {
            status: 429,
            headers: err.retryAfterSeconds
              ? { "Retry-After": String(err.retryAfterSeconds) }
              : undefined,
          }
        );
      case "network_error":
        return NextResponse.json(
          { error: "Couldn't reach GitHub right now. Please try again." },
          { status: 502 }
        );
      default:
        // not_configured / unauthorized / forbidden / not_found are all
        // operator-side problems — surface as a generic 500.
        return NextResponse.json(
          { error: "GitHub integration is temporarily unavailable." },
          { status: 500 }
        );
    }
  }

  console.error("ERROR: Unexpected failure in app/api/github/star/route.ts", err);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}

export async function GET() {
  const { owner, name } = siteConfig.repository;
  const redis = getRedisClient();

  if (redis) {
    const cached = await redis.get<{ starred: boolean; count: number }>(
      STATUS_CACHE_KEY
    );
    if (cached) return NextResponse.json(cached);
  }

  try {
    const status = await getStarStatus(owner, name);
    if (redis) {
      await redis.set(STATUS_CACHE_KEY, status, { ex: STATUS_CACHE_TTL_SECONDS });
    }
    return NextResponse.json(status);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkStarRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: rateLimit.retryAfterSeconds
          ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  const { owner, name } = siteConfig.repository;

  try {
    // Check first so an already-starred repo short-circuits without a
    // redundant write call, and so the response can say "already starred"
    // instead of a generic success — this is what makes repeated clicks
    // (double-click, multiple browser tabs) safe no-ops.
    const before = await getStarStatus(owner, name);
    if (before.starred) {
      return NextResponse.json({ starred: true, alreadyStarred: true, count: before.count });
    }

    await starRepository(owner, name);

    const redis = getRedisClient();
    if (redis) await redis.del(STATUS_CACHE_KEY);

    return NextResponse.json({
      starred: true,
      alreadyStarred: false,
      count: before.count + 1,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
