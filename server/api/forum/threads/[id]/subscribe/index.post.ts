import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const threadId = handler.context.params!.id;

  const thread = await prisma.forumThread.findFirst({
    where: { id: threadId, deleted_at: null },
  });

  if (!thread) {
    throw createError({ status: 404, statusMessage: "Thread not found" });
  }

  // Toggle subscription
  const existing = await prisma.forumThreadSubscription.findUnique({
    where: {
      thread_id_user_id: {
        thread_id: threadId,
        user_id: me.id,
      },
    },
  });

  if (existing) {
    await prisma.forumThreadSubscription.delete({ where: { id: existing.id } });
    return { subscribed: false };
  }

  await prisma.forumThreadSubscription.create({
    data: {
      thread_id: threadId,
      user_id: me.id,
      last_read_at: new Date(),
    },
  });

  return { subscribed: true };
});
