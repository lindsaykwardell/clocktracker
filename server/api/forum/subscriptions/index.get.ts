import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { forumUserSelect } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const query = getQuery(handler);
  const unreadOnly = query.unread === "true";

  const subscriptions = await prisma.forumThreadSubscription.findMany({
    where: { user_id: me.id },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      last_read_at: true,
      thread: {
        select: {
          id: true,
          title: true,
          last_post_at: true,
          deleted_at: true,
          category: {
            select: { slug: true },
          },
          author: { select: forumUserSelect },
          _count: { select: { posts: true } },
        },
      },
    },
  });

  const result = subscriptions
    .filter((s) => s.thread.deleted_at === null)
    .map((s) => ({
      id: s.id,
      lastReadAt: s.last_read_at,
      hasUnread: new Date(s.thread.last_post_at) > new Date(s.last_read_at),
      thread: {
        id: s.thread.id,
        title: s.thread.title,
        lastPostAt: s.thread.last_post_at,
        categorySlug: s.thread.category.slug,
        author: s.thread.author,
        postCount: s.thread._count.posts,
      },
    }));

  if (unreadOnly) {
    return result.filter((s) => s.hasUnread);
  }

  return result;
});
