import { prisma } from "~/server/utils/prisma";
import { requireForumPostAccess, requireForumThreadAccess } from "~/server/utils/forum";

export default defineEventHandler(async event => {
  const userId = event.context.user?.id;
  if (!userId) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const submission = await prisma.forumSubmission.findFirst({
    where: { id: event.context.params!.id, author_id: userId, status: "PUBLISHED" },
  });
  if (!submission) throw createError({ statusCode: 404, statusMessage: "Published submission not found" });
  const thread = await requireForumThreadAccess(userId, submission.thread_id);
  if (!submission.post_id) return { url: `/forum/${thread.category.slug}/${thread.id}` };
  const { post } = await requireForumPostAccess(userId, submission.post_id);
  const before = await prisma.forumPost.count({
    where: { thread_id: thread.id, published: true, created_at: { lt: post.created_at } },
  });
  return { url: `/forum/${thread.category.slug}/${thread.id}?page=${Math.floor(before / 25) + 1}#post-${post.id}` };
});
