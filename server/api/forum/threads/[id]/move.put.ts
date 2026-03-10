import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasForumPermission, logModAction } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  // Require LOCK_THREAD or admin — moving is a moderation action
  if (!(await hasForumPermission(me.id, "LOCK_THREAD"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const threadId = handler.context.params!.id;
  const body = await readBody<{ category_id: string } | null>(handler);

  if (!body?.category_id) {
    throw createError({ status: 400, statusMessage: "category_id is required" });
  }

  const thread = await prisma.forumThread.findFirst({
    where: { id: threadId, deleted_at: null },
    select: { id: true, title: true, category_id: true },
  });

  if (!thread) {
    throw createError({ status: 404, statusMessage: "Thread not found" });
  }

  if (thread.category_id === body.category_id) {
    throw createError({ status: 400, statusMessage: "Thread is already in this category" });
  }

  const targetCategory = await prisma.forumCategory.findUnique({
    where: { id: body.category_id },
    select: { id: true, name: true, slug: true },
  });

  if (!targetCategory) {
    throw createError({ status: 404, statusMessage: "Target category not found" });
  }

  const updated = await prisma.forumThread.update({
    where: { id: threadId },
    data: { category_id: body.category_id },
    select: {
      id: true,
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  await logModAction(
    me.id,
    "MOVE_THREAD",
    "thread",
    threadId,
    `Moved to ${targetCategory.name}`
  );

  return {
    id: updated.id,
    category: updated.category,
  };
});
