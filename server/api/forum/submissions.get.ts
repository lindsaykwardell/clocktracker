import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async event => {
  const userId = event.context.user?.id;
  if (!userId) throw createError({ status: 401, statusMessage: "Unauthorized" });
  return prisma.forumSubmission.findMany({
    where: { author_id: userId }, orderBy: { created_at: "desc" }, take: 100,
    select: { id: true, kind: true, status: true, title: true, body: true, reason: true, review_reason: true, created_at: true, reviewed_at: true },
  });
});
