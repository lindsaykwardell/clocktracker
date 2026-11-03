import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";
import { forumUserSelect } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasPermission(me.id, "VIEW_MOD_LOG"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const query = getQuery(handler);
  const page = Math.max(1, Number(query.page) || 1);
  const perPage = 50;

  const [logs, total] = await Promise.all([
    prisma.forumModLog.findMany({
      orderBy: { created_at: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        action: true,
        target_type: true,
        target_id: true,
        details: true,
        created_at: true,
        actor: { select: forumUserSelect },
      },
    }),
    prisma.forumModLog.count(),
  ]);

  // Resolve targets to readable info
  const enriched = await Promise.all(
    logs.map(async (log) => {
      const target = await resolveTarget(log.target_type, log.target_id);
      return { ...log, target };
    })
  );

  return { logs: enriched, total, page, perPage };
});

type ResolvedTarget = {
  label: string;
  link: string | null;
};

async function resolveTarget(
  targetType: string,
  targetId: string
): Promise<ResolvedTarget> {
  try {
    switch (targetType) {
      case "thread": {
        const thread = await prisma.forumThread.findUnique({
          where: { id: targetId },
          select: {
            title: true,
            category: { select: { slug: true } },
          },
        });
        if (thread) {
          return {
            label: thread.title,
            link: `/forum/${thread.category.slug}/${targetId}`,
          };
        }
        break;
      }
      case "post": {
        const post = await prisma.forumPost.findUnique({
          where: { id: targetId },
          select: {
            body: true,
            created_at: true,
            thread_id: true,
            thread: {
              select: {
                title: true,
                category: { select: { slug: true } },
              },
            },
          },
        });
        if (post) {
          const postIndex = await prisma.forumPost.count({
            where: {
              thread_id: post.thread_id,
              created_at: { lt: post.created_at },
            },
          });
          const page = Math.floor(postIndex / 25) + 1;
          const snippet =
            post.body.length > 80
              ? post.body.slice(0, 80) + "..."
              : post.body;
          return {
            label: `"${snippet}" in ${post.thread.title}`,
            link: `/forum/${post.thread.category.slug}/${post.thread_id}?page=${page}#post-${targetId}`,
          };
        }
        break;
      }
      case "user": {
        const user = await prisma.userSettings.findUnique({
          where: { user_id: targetId },
          select: { username: true, display_name: true },
        });
        if (user) {
          return {
            label: user.display_name,
            link: `/@${user.username}`,
          };
        }
        break;
      }
      case "report": {
        const report = await prisma.forumPostReport.findUnique({
          where: { id: targetId },
          select: {
            reason: true,
            post: {
              select: {
                thread: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        });
        if (report) {
          return {
            label: `"${report.reason}" on thread "${report.post.thread.title}"`,
            link: "/admin/forum/reports",
          };
        }
        break;
      }
    }
  } catch {}

  return { label: targetId.slice(0, 8) + "...", link: null };
}
