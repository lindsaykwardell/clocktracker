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
import { sendForumNotifications } from "~/server/utils/sendForumNotifications";

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

  const now = new Date();

  const [post] = await prisma.$transaction([
    prisma.forumPost.create({
      data: {
        body: body.body.trim(),
        thread_id: threadId,
        author_id: me.id,
      },
      select: {
        id: true,
        body: true,
        created_at: true,
        edited_at: true,
        author: { select: forumUserSelect },
      },
    }),
    prisma.forumThread.update({
      where: { id: threadId },
      data: { last_post_at: now },
    }),
  ]);

  // Mark thread as read and auto-subscribe replier
  await Promise.all([
    prisma.forumThreadRead.upsert({
      where: {
        thread_id_user_id: { thread_id: threadId, user_id: me.id },
      },
      create: { thread_id: threadId, user_id: me.id, last_read_at: now },
      update: { last_read_at: now },
    }),
    prisma.forumThreadSubscription.upsert({
      where: {
        thread_id_user_id: { thread_id: threadId, user_id: me.id },
      },
      create: { thread_id: threadId, user_id: me.id, last_read_at: now },
      update: { last_read_at: now },
    }),
  ]);

  // Fire-and-forget push notifications to thread subscribers
  void sendForumNotifications({
    threadId,
    posterId: me.id,
    posterDisplayName: post.author.display_name,
    postBody: post.body,
  });

  const [nameColor, badges] = await Promise.all([
    getForumNameColor(me.id),
    getForumBadges([me.id]),
  ]);

  return {
    ...post,
    reactions: [],
    deleted: false,
    author: {
      ...post.author,
      name_color: nameColor,
      badge: badges[me.id] ?? null,
    },
  };
});
