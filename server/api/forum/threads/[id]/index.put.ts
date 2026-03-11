import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasForumPermission } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const threadId = handler.context.params!.id;
  const body = await readBody<{ title: string } | null>(handler);

  if (!body?.title?.trim()) {
    throw createError({ status: 400, statusMessage: "Title is required" });
  }

  const thread = await prisma.forumThread.findFirst({
    where: { id: threadId, deleted_at: null },
  });

  if (!thread) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  const isAuthor = thread.author_id === me.id;
  const canEditAny = await hasForumPermission(me.id, "EDIT_ANY_POST");

  if (!isAuthor && !canEditAny) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const updated = await prisma.forumThread.update({
    where: { id: threadId },
    data: { title: body.title.trim() },
    select: {
      id: true,
      title: true,
    },
  });

  return updated;
});
