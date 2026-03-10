import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasForumPermission, logModAction } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasForumPermission(me.id, "PIN_THREAD"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const threadId = handler.context.params!.id;

  const thread = await prisma.forumThread.findFirst({
    where: { id: threadId, deleted_at: null },
  });

  if (!thread) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  const updated = await prisma.forumThread.update({
    where: { id: threadId },
    data: { is_pinned: !thread.is_pinned },
    select: { id: true, is_pinned: true },
  });

  await logModAction(me.id, updated.is_pinned ? "PIN_THREAD" : "UNPIN_THREAD", "thread", threadId);

  return updated;
});
