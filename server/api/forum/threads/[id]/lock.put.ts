import {
  requireForumThreadAccess,
  hasForumPermission,
  logModAction,
  modLogNote,
  getThreadLockInfo,
} from "~/server/utils/forum";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  if (!(await hasForumPermission(me.id, "LOCK_THREAD"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const threadId = handler.context.params!.id;
  const thread = await requireForumThreadAccess(me.id, threadId);
  const body = (await readBody(handler).catch(() => null)) ?? {};
  const note = modLogNote(body.note);

  const updated = await prisma.forumThread.update({
    where: { id: threadId },
    data: { is_locked: !thread.is_locked },
    select: { id: true, is_locked: true },
  });

  await logModAction(me.id, updated.is_locked ? "LOCK_THREAD" : "UNLOCK_THREAD", "thread", threadId, note);

  return {
    ...updated,
    lock_info: updated.is_locked ? await getThreadLockInfo(threadId) : null,
  };
});
