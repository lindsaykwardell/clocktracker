import { prisma } from "~/server/utils/prisma";
import { canReviewForum } from "~/server/utils/forumSafety";
import { hasPermission } from "~/server/utils/permissions";
import { visibleForumCategoryIds } from "~/server/utils/forum";

export default defineEventHandler(async event => {
  const userId = event.context.user?.id;
  if (!userId || !(await hasPermission(userId, "VIEW_REPORTS"))) return { pending: 0, reports: 0 };
  const ids = await visibleForumCategoryIds(userId);
  const [pending, reports] = await Promise.all([
    await canReviewForum(userId) ? prisma.forumSubmission.count({ where: { status: "PENDING", thread: { category_id: { in: ids } } } }) : 0,
    prisma.forumPostReport.count({ where: { resolved: false, post: { thread: { category_id: { in: ids } } } } }),
  ]);
  return { pending, reports };
});
