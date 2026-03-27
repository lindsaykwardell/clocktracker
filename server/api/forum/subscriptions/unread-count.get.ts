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
        },
      },
    },
  });

  const count = subscriptions.filter(
    (s) =>
      s.thread.deleted_at === null &&
      new Date(s.thread.last_post_at) > new Date(s.last_read_at)
  ).length;

  return { count };
});
