import { prisma } from "~/server/utils/prisma";
import { canReviewForum } from "~/server/utils/forumSafety";
import { visibleForumCategoryIds, forumUserSelect } from "~/server/utils/forum";

export default defineEventHandler(async event => {
  const userId = event.context.user?.id;
  if (!userId) throw createError({ status: 401, statusMessage: "Unauthorized" });
  if (!(await canReviewForum(userId))) throw createError({ status: 403, statusMessage: "Forbidden" });
  const status = getQuery(event).status === "reviewed" ? { not: "PENDING" } : "PENDING";
  const submissions = await prisma.forumSubmission.findMany({
    where: { status, thread: { category_id: { in: await visibleForumCategoryIds(userId) } } }, orderBy: { created_at: typeof status === "string" ? "asc" : "desc" }, take: 100,
    include: { author: { select: forumUserSelect }, thread: { include: { category: true } }, post: { select: { body: true, deleted_at: true } } },
  });
  return submissions;
});
