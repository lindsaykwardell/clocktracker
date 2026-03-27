import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const postId = handler.context.params!.id;
  const body = await readBody<{ emoji: string }>(handler);

  if (!body.emoji || typeof body.emoji !== "string" || body.emoji.length > 8) {
    throw createError({ status: 400, statusMessage: "Invalid emoji" });
  }

  // Verify post exists and is not deleted
  const post = await prisma.forumPost.findFirst({
    where: { id: postId, deleted_at: null },
  });

  if (!post) {
    throw createError({ status: 404, statusMessage: "Post not found" });
  }

  // Toggle: if reaction exists, remove it; otherwise, add it
  const existing = await prisma.forumPostReaction.findUnique({
    where: {
      post_id_user_id_emoji: {
        post_id: postId,
        user_id: me.id,
        emoji: body.emoji,
      },
    },
  });

  if (existing) {
    await prisma.forumPostReaction.delete({ where: { id: existing.id } });
    return { action: "removed" };
  }

  await prisma.forumPostReaction.create({
    data: {
      post_id: postId,
      user_id: me.id,
      emoji: body.emoji,
    },
  });

  return { action: "added" };
});
