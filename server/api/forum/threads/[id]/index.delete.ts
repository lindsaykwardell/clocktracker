import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasForumPermission, logModAction } from "~/server/utils/forum";

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
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  const isAuthor = thread.author_id === me.id;
  const canDeleteAny = await hasForumPermission(me.id, "DELETE_ANY_POST");

  if (!isAuthor && !canDeleteAny) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const now = new Date();

  // Soft delete the thread and all its posts
  await prisma.$transaction([
    prisma.forumThread.update({
      where: { id: threadId },
      data: { deleted_at: now },
    }),
    prisma.forumPost.updateMany({
      where: { thread_id: threadId, deleted_at: null },
      data: { deleted_at: now },
    }),
  ]);

  await logModAction(me.id, "DELETE_THREAD", "thread", threadId, thread.title);

  return { success: true };
});
