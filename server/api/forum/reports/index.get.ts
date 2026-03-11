import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission, forumUserSelect } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasPermission(me.id, "VIEW_REPORTS"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const query = getQuery(handler);
  const showResolved = query.resolved === "true";

  const reports = await prisma.forumPostReport.findMany({
    where: { resolved: showResolved },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      reason: true,
      resolved: true,
      resolved_at: true,
      created_at: true,
      reporter: { select: forumUserSelect },
      resolver: { select: forumUserSelect },
      post: {
        select: {
          id: true,
          body: true,
          created_at: true,
          deleted_at: true,
          author: { select: forumUserSelect },
          thread_id: true,
          thread: {
            select: {
              id: true,
              title: true,
              category: {
                select: { slug: true },
              },
            },
          },
        },
      },
    },
  });

  // Compute post_index for each report (position within the thread)
  const perPage = 25;
  const enriched = await Promise.all(
    reports.map(async (report) => {
      const postIndex = await prisma.forumPost.count({
        where: {
          thread_id: report.post.thread_id,
          created_at: { lt: report.post.created_at },
        },
      });
      return {
        ...report,
        post: {
          ...report.post,
          page: Math.floor(postIndex / perPage) + 1,
        },
      };
    })
  );

  return enriched;
});
