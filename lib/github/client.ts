import "server-only";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

export type GitHubClientErrorCode =
  | "not_configured"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "rate_limited"
  | "network_error";

export class GitHubClientError extends Error {
  code: GitHubClientErrorCode;
  retryAfterSeconds?: number;

  constructor(
    code: GitHubClientErrorCode,
    message: string,
    retryAfterSeconds?: number
  ) {
    super(message);
    this.name = "GitHubClientError";
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new GitHubClientError(
      "not_configured",
      "GITHUB_TOKEN is not set — see .env.example."
    );
  }
  return token;
}

function baseHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getToken()}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
    "User-Agent": "phonghub.cloud",
  };
}

/** Maps a non-2xx GitHub response to a typed, safe-to-log error. */
function toClientError(status: number, res: Response): GitHubClientError {
  if (status === 401) {
    return new GitHubClientError(
      "unauthorized",
      "GitHub rejected the configured token (expired, revoked, or invalid)."
    );
  }
  if (status === 403) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      const resetHeader = res.headers.get("x-ratelimit-reset");
      const resetEpochSeconds = resetHeader ? Number(resetHeader) : undefined;
      const retryAfterSeconds = resetEpochSeconds
        ? Math.max(1, resetEpochSeconds - Math.floor(Date.now() / 1000))
        : 60;
      return new GitHubClientError(
        "rate_limited",
        "GitHub API rate limit exceeded for the configured token.",
        retryAfterSeconds
      );
    }
    return new GitHubClientError(
      "forbidden",
      "GitHub rejected the request (insufficient token scope, SSO not authorized, or org restrictions)."
    );
  }
  if (status === 404) {
    return new GitHubClientError(
      "not_found",
      "Repository not found or not visible to the configured token."
    );
  }
  return new GitHubClientError(
    "network_error",
    `Unexpected GitHub API response: ${status}`
  );
}

async function githubFetch(path: string, init?: RequestInit): Promise<Response> {
  // Built outside the try block below — getToken() throws a typed
  // "not_configured" GitHubClientError that must propagate as-is, not get
  // relabeled as "network_error" by the fetch-failure catch below.
  const headers = { ...baseHeaders(), ...init?.headers };

  let res: Response;
  try {
    res = await fetch(`${GITHUB_API_BASE}${path}`, { ...init, headers });
  } catch (err) {
    throw new GitHubClientError(
      "network_error",
      err instanceof Error ? err.message : "Network error calling GitHub API."
    );
  }
  return res;
}

export interface StarStatus {
  starred: boolean;
  count: number;
}

/**
 * Combines the authenticated star-status check with the public star count
 * in one round trip pair — cheaper than three separate calls, and lets the
 * caller show both "already starred" state and a count in one response.
 */
export async function getStarStatus(
  owner: string,
  repo: string
): Promise<StarStatus> {
  const [starredRes, repoRes] = await Promise.all([
    githubFetch(`/user/starred/${owner}/${repo}`),
    githubFetch(`/repos/${owner}/${repo}`),
  ]);

  if (!repoRes.ok) throw toClientError(repoRes.status, repoRes);
  const repoData = (await repoRes.json()) as { stargazers_count: number };

  // GitHub returns 204 (starred) or 404 (not starred) here — 404 is not an
  // error in this context, so it's handled explicitly rather than via
  // toClientError.
  if (starredRes.status === 204) {
    return { starred: true, count: repoData.stargazers_count };
  }
  if (starredRes.status === 404) {
    return { starred: false, count: repoData.stargazers_count };
  }
  throw toClientError(starredRes.status, starredRes);
}

/** Idempotent: starring an already-starred repo is a no-op success on GitHub's side. */
export async function starRepository(owner: string, repo: string): Promise<void> {
  const res = await githubFetch(`/user/starred/${owner}/${repo}`, {
    method: "PUT",
    headers: { "Content-Length": "0" },
  });
  if (res.status !== 204) throw toClientError(res.status, res);
}
