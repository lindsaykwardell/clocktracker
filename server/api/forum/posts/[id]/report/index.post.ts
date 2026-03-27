import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const postId = handler.context.params!.id;
  const body = await readBody<{ reason: string }>(handler);

  if (!body.reason?.trim()) {
    throw createError({ status: 400, statusMessage: "Reason is required" });
  }

  if (body.reason.length > 1000) {
    throw createError({ status: 400, statusMessage: "Reason is too long" });
  }

  const post = await prisma.forumPost.findFirst({
    where: { id: postId, deleted_at: null },
  });

  if (!post) {
    throw createError({ status: 404, statusMessage: "Post not found" });
  }

  // Don't allow reporting your own posts
  if (post.author_id === me.id) {
    throw createError({ status: 400, statusMessage: "Cannot report your own post" });
  }

  // Check for existing unresolved report by this user on this post
  const existing = await prisma.forumPostReport.findFirst({
    where: {
      post_id: postId,
      reporter_id: me.id,
      resolved: false,
    },
  });

  if (existing) {
    throw createError({ status: 400, statusMessage: "You have already reported this post" });
  }

  await prisma.forumPostReport.create({
    data: {
      post_id: postId,
      reporter_id: me.id,
      reason: body.reason.trim(),
    },
  });

  return { success: true };
});
