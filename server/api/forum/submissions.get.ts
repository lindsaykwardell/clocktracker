import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async event => {
  const userId = event.context.user?.id;
  const decision = getQuery(event).decision;
  if (!userId) throw createError({ status: 401, statusMessage: "Unauthorized" });
  return prisma.forumSubmission.findMany({
    where: { author_id: userId, ...(typeof decision === 'string' ? { id: decision } : {}) }, orderBy: { created_at: "desc" }, take: 100,
    select: { id: true, kind: true, status: true, title: true, body: true, reason: true, review_reason: true, created_at: true, reviewed_at: true, decision_seen_at: true },
  });
});
