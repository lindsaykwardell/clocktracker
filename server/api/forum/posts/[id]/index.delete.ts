import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasForumPermission, logModAction } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const postId = handler.context.params!.id;

  const post = await prisma.forumPost.findFirst({
    where: { id: postId, deleted_at: null },
    include: {
      thread: {
        select: {
          id: true,
          _count: { select: { posts: { where: { deleted_at: null } } } },
        },
      },
    },
  });

  if (!post) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  const isAuthor = post.author_id === me.id;
  const canDeleteOwn =
    isAuthor && (await hasForumPermission(me.id, "DELETE_OWN_POST"));
  const canDeleteAny = await hasForumPermission(me.id, "DELETE_ANY_POST");

  if (!canDeleteOwn && !canDeleteAny) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const now = new Date();

  // Check if this is the first post and the only remaining post
  const firstPost = await prisma.forumPost.findFirst({
    where: { thread_id: post.thread.id, deleted_at: null },
    orderBy: { created_at: "asc" },
    select: { id: true },
  });

  const isFirstPost = firstPost?.id === postId;
  const isOnlyPost = post.thread._count.posts <= 1;

  if (isFirstPost && isOnlyPost) {
    // Delete the entire thread if this is the only post
    await prisma.$transaction([
      prisma.forumPost.update({
        where: { id: postId },
        data: { deleted_at: now },
      }),
      prisma.forumThread.update({
        where: { id: post.thread.id },
        data: { deleted_at: now },
      }),
    ]);

    await logModAction(me.id, "DELETE_POST", "post", postId, "Thread also deleted");
    return { success: true, threadDeleted: true };
  }

  // Otherwise just soft-delete the post
  await prisma.forumPost.update({
    where: { id: postId },
    data: { deleted_at: now },
  });

  await logModAction(me.id, "DELETE_POST", "post", postId);

  return { success: true, threadDeleted: false };
});
