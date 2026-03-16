import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import {
  forumUserSelect,
  userCanPostInCategory,
  checkForumBan,
  isRateLimited,
  checkPostLength,
} from "~/server/utils/forum";
import { hasRestriction } from "~/server/utils/permissions";
import { sendAnnouncementNotifications } from "~/server/utils/sendForumNotifications";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const slug = handler.context.params!.slug;
  const body = await readBody<{ title: string; body: string } | null>(handler);

  if (!body?.title?.trim() || !body?.body?.trim()) {
    throw createError({
      status: 400,
      statusMessage: "Title and body are required",
    });
  }

  const category = await prisma.forumCategory.findUnique({
    where: { slug },
  });

  if (!category) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  if (await hasRestriction(me.id, "CREATE_THREAD")) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const canPost = await userCanPostInCategory(
    me.id,
    category.id,
    category.is_private,
    category.mod_posting_only
  );

  if (!canPost) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  if (await checkForumBan(me.id, category.id)) {
    throw createError({
      status: 403,
      statusMessage: "You are banned from posting",
    });
  }

  await checkPostLength(me.id, body.body.trim());

  if (await isRateLimited(me.id, "thread")) {
    throw createError({
      status: 429,
      statusMessage: "You are creating threads too quickly. Please wait a moment.",
    });
  }

  const now = new Date();

  const thread = await prisma.forumThread.create({
    data: {
      title: body.title.trim(),
      category_id: category.id,
      author_id: me.id,
      last_post_at: now,
      posts: {
        create: {
          body: body.body.trim(),
          author_id: me.id,
        },
      },
    },
    select: {
      id: true,
      title: true,
      is_pinned: true,
      is_locked: true,
      created_at: true,
      last_post_at: true,
      author: { select: forumUserSelect },
      _count: { select: { posts: true } },
    },
  });

  // Mark as read and auto-subscribe thread author
  await Promise.all([
    prisma.forumThreadRead.create({
      data: { thread_id: thread.id, user_id: me.id, last_read_at: now },
    }),
    prisma.forumThreadSubscription.create({
      data: { thread_id: thread.id, user_id: me.id, last_read_at: now },
    }),
  ]);

  // Send push notifications if this is an announcement category
  if (category.is_announcement) {
    void sendAnnouncementNotifications({
      threadId: thread.id,
      threadTitle: thread.title,
      categorySlug: slug,
      postBody: body.body.trim(),
    });
  }

  return thread;
});
