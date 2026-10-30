import { createError, defineEventHandler, setHeader, type H3Event } from "h3";

export function forumWriteLimit(path: string, method: string) {
  if (method === "POST" && /^\/api\/forum\/categories\/[^/]+\/threads\/?$/.test(path)) return { category: "thread", limit: 1 };
  if (method === "POST" && /^\/api\/forum\/threads\/[^/]+\/posts\/?$/.test(path)) return { category: "post", limit: 5 };
  if (method === "PUT" && /^\/api\/forum\/(posts|threads)\/[^/]+\/?$/.test(path)) return { category: "edit", limit: 5 };
  if (method === "POST" && /^\/api\/forum\/posts\/[^/]+\/report\/?$/.test(path)) return { category: "report", limit: 5 };
  if (method === "POST" && /^\/api\/forum\/posts\/[^/]+\/reactions\/?$/.test(path)) return { category: "reaction", limit: 30 };
  return null;
}

export function createForumRequestGuard(dependencies: {
  enabled: (event: H3Event) => Promise<boolean>;
  newcomer?: (userId: string) => Promise<boolean>;
  consume: (key: string, limit: number) => Promise<{ allowed: boolean; retryAfter: number } | null>;
}) {
  return defineEventHandler(async (event) => {
    const path = event.path.split("?")[0];
    if (event.method === "OPTIONS" || !path.startsWith("/api/forum/")) return;
    setHeader(event, "Cache-Control", "private, no-store");
    if (!(await dependencies.enabled(event))) {
      throw createError({ statusCode: 404, statusMessage: "Not Found" });
    }
    const budget = forumWriteLimit(path, event.method);
    if (!budget) return;
    const userId = event.context.user?.id;
    if (!userId) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    if (["thread", "post", "edit"].includes(budget.category) && await dependencies.newcomer?.(userId)) {
      const allowance = await dependencies.consume(`forum:v1:newcomer:${userId}`, 1);
      if (!allowance) throw createError({ statusCode: 503, statusMessage: "Posting is temporarily unavailable." });
      if (!allowance.allowed) {
        setHeader(event, "Retry-After", allowance.retryAfter);
        throw createError({ statusCode: 429, statusMessage: "New accounts can submit one contribution per minute. Please wait." });
      }
    }
    const result = await dependencies.consume(`forum:v1:${budget.category}:${userId}`, budget.limit);
    if (!result) {
      throw createError({ statusCode: 503, statusMessage: "Posting is temporarily unavailable. Please try again shortly." });
    }
    if (!result.allowed) {
      setHeader(event, "Retry-After", result.retryAfter);
      throw createError({ statusCode: 429, statusMessage: "You are posting too quickly. Please wait a moment.", data: { retryAfter: result.retryAfter } });
    }
  });
}
