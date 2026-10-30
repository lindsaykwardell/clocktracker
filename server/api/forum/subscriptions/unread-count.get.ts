import { userCanViewCategory } from "~/server/utils/forum";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) {
    return { count: 0 };
  }

  const subscriptions = await prisma.forumThreadSubscription.findMany({
    where: { user_id: me.id },
    select: {
      last_read_at: true,
      thread: {
        select: {
          last_post_at: true,
          deleted_at: true,
          category: { select: { id: true, is_private: true } },
        },
      },
    },
  });

  const visibility = await Promise.all(subscriptions.map(s =>
    userCanViewCategory(me.id, s.thread.category.id, s.thread.category.is_private)
  ));
  const visibleSubscriptions = subscriptions.filter((_, index) => visibility[index]);

  const count = visibleSubscriptions.filter(
    (s) =>
      s.thread.deleted_at === null &&
      new Date(s.thread.last_post_at) > new Date(s.last_read_at)
  ).length;

  return { count };
});
