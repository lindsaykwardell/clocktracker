import {
  requireForumThreadAccess,
  requireForumWriteAccess,
  hasForumPermission,
} from "~/server/utils/forum";
import { hasRestriction } from "~/server/utils/permissions";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const threadId = handler.context.params!.id;
  const accessibleThread = await requireForumThreadAccess(me.id, threadId);
  const body = await readBody<{ title: string } | null>(handler);

  if (typeof body?.title !== "string" || !body.title.trim()) {
    throw createError({ status: 400, statusMessage: "Title is required" });
  }
  if (body.title.trim().length > 200) {
    throw createError({ status: 400, statusMessage: "Title cannot exceed 200 characters" });
  }

  const thread = accessibleThread;

  const isAuthor = thread.author_id === me.id;
  const canEditAny = await hasForumPermission(me.id, "EDIT_ANY_POST");

  if (!isAuthor && !canEditAny) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  await requireForumWriteAccess(me.id, accessibleThread, { moderation: canEditAny });
  if (isAuthor && !canEditAny && await hasRestriction(me.id, "EDIT_OWN_POST")) {
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
