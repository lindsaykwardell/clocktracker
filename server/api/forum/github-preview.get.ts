import { getCachedGitHubPreview } from "~/server/utils/github";
import { prisma } from "~/server/utils/prisma";

// IP-based rate limiting for anonymous users
const anonRateLimit = new Map<string, { count: number; resetAt: number }>();
const ANON_RATE_LIMIT = 30; // requests per window
const ANON_RATE_WINDOW = 60 * 1000; // 1 minute

// Cache of verified GitHub URLs that exist in forum content
const verifiedUrls = new Map<string, number>(); // url -> timestamp
const VERIFIED_URL_TTL = 10 * 60 * 1000; // 10 minutes

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  const query = getQuery(handler);
  const owner = query.owner as string;
  const repo = query.repo as string;
  const type = query.type as "issues" | "pulls";
  const number = parseInt(query.number as string, 10);

  if (!owner || !repo || !type || isNaN(number)) {
    throw createError({ status: 400, statusMessage: "Missing parameters" });
  }

  if (!["issues", "pulls"].includes(type)) {
    throw createError({ status: 400, statusMessage: "Invalid type" });
  }

  // Rate limit anonymous users by IP
  if (!me) {
    const ip = getRequestIP(handler, { xForwardedFor: true }) || "unknown";
    const now = Date.now();
    const entry = anonRateLimit.get(ip);

    if (entry && now < entry.resetAt) {
      if (entry.count >= ANON_RATE_LIMIT) {
        throw createError({ status: 429, statusMessage: "Too many requests" });
      }
      entry.count++;
    } else {
      anonRateLimit.set(ip, { count: 1, resetAt: now + ANON_RATE_WINDOW });
    }

    // Evict stale entries periodically
    if (anonRateLimit.size > 1000) {
      for (const [k, v] of anonRateLimit) {
        if (now > v.resetAt) anonRateLimit.delete(k);
      }
    }
  }

  // Verify this GitHub URL actually appears in forum content
  const ghType = type === "pulls" ? "pull" : "issues";
  const githubUrl = `github.com/${owner}/${repo}/${ghType}/${number}`;

  const config = useRuntimeConfig();
  const isConfiguredRepo =
    owner === config.githubRepoOwner && repo === config.githubRepoName;

  if (!isConfiguredRepo) {
    const cachedAt = verifiedUrls.get(githubUrl);
    if (!cachedAt || Date.now() - cachedAt > VERIFIED_URL_TTL) {
      // Check if this URL exists in any forum post or as a thread's github_issue_url
      const [postMatch, threadMatch] = await Promise.all([
        prisma.forumPost.findFirst({
          where: { body: { contains: githubUrl }, deleted_at: null },
          select: { id: true },
        }),
        prisma.forumThread.findFirst({
          where: { github_issue_url: { contains: githubUrl }, deleted_at: null },
          select: { id: true },
        }),
      ]);

      if (!postMatch && !threadMatch) {
        throw createError({
          status: 403,
          statusMessage: "This GitHub URL is not referenced in any forum content",
        });
      }

      verifiedUrls.set(githubUrl, Date.now());
    }
  }

  try {
    const preview = await getCachedGitHubPreview(owner, repo, type, number);
    return preview;
  } catch {
    throw createError({
      status: 502,
      statusMessage: "Failed to fetch GitHub preview",
    });
  }
});
