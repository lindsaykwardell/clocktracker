import {
  requireForumThreadAccess,
  requireForumWriteAccess,
  forumUserSelect,
  checkPostLength,
  getForumNameColor,
  getForumBadges,
} from "~/server/utils/forum";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { assessForumSubmission } from "~/server/utils/forumSafety";
import { notifyForumPublication } from "~/server/utils/forumPublication";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const threadId = handler.context.params!.id;
  const accessibleThread = await requireForumThreadAccess(me.id, threadId);
  await requireForumWriteAccess(me.id, accessibleThread);
  const body = await readBody<{ body: string } | null>(handler);

  if (typeof body?.body !== "string" || !body.body.trim()) {
    throw createError({ status: 400, statusMessage: "Post body is required" });
  }

  await checkPostLength(me.id, body.body.trim());

  const reason = await assessForumSubmission(me.id, body.body.trim());
  const post = await prisma.$transaction(async tx => {
    const created = await tx.forumPost.create({
      data: { body: body.body.trim(), thread_id: threadId, author_id: me.id, published: !reason },
      include: { author: { select: forumUserSelect } },
    });
    if (reason) {
      await tx.forumSubmission.create({ data: { author_id: me.id, thread_id: threadId, post_id: created.id, kind: "POST", body: created.body, reason } });
    } else {
      await tx.forumThread.update({ where: { id: threadId }, data: { last_post_at: new Date() } });
    }
    return created;
  });
  if (!reason) await notifyForumPublication(threadId, post.id, false);
  const [nameColor, badges] = await Promise.all([getForumNameColor(me.id), getForumBadges([me.id])]);
  return { ...post, pending: !!reason, reactions: [], deleted: false, author: { ...post.author, name_color: nameColor, badge: badges[me.id] ?? null } };
});
