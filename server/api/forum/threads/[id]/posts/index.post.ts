import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import {
  forumUserSelect,
  userCanPostInCategory,
  checkForumBan,
  isRateLimited,
  checkPostLength,
  getForumNameColor,
  getForumBadges,
} from "~/server/utils/forum";
import { sendForumNotifications } from "~/server/utils/sendForumNotifications";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const threadId = handler.context.params!.id;
  const body = await readBody<{ body: string } | null>(handler);

  if (!body?.body?.trim()) {
    throw createError({ status: 400, statusMessage: "Post body is required" });
  }

  const thread = await prisma.forumThread.findFirst({
    where: { id: threadId, deleted_at: null },
    include: {
      category: { select: { id: true, is_private: true } },
    },
  });

  if (!thread) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  if (thread.is_locked) {
    throw createError({
      status: 403,
      statusMessage: "This thread is locked",
    });
  }

  const canPost = await userCanPostInCategory(
    me.id,
    thread.category.id,
    thread.category.is_private
  );

  if (!canPost) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  if (await checkForumBan(me.id, thread.category.id)) {
    throw createError({
      status: 403,
      statusMessage: "You are banned from posting",
    });
  }

  await checkPostLength(me.id, body.body.trim());

  if (await isRateLimited(me.id, "post")) {
    throw createError({
      status: 429,
      statusMessage: "You are posting too quickly. Please wait a moment.",
    });
  }

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
