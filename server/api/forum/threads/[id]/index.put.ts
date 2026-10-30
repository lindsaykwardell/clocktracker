import { assessForumSubmission } from "~/server/utils/forumSafety";
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

  const existing = await prisma.forumSubmission.findFirst({ where: { thread_id: threadId, kind: "EDIT_TITLE", status: "PENDING" } });
  if (existing) throw createError({ status: 409, statusMessage: "A title edit is already awaiting review." });
  const reason = await assessForumSubmission(me.id, body.title.trim());
  if (reason) {
    await prisma.forumSubmission.create({ data: {
      author_id: me.id, thread_id: threadId, kind: "EDIT_TITLE", title: body.title.trim(),
      body: body.title.trim(), base_title: thread.title, reason,
    } });
    return { id: threadId, title: thread.title, pending: true };
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
