import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async event => {
  const userId = event.context.user?.id;
  if (!userId) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const count = await prisma.forumSubmission.count({
    where: { author_id: userId, status: { in: ["PUBLISHED", "REJECTED"] }, decision_seen_at: null },
  });
  return { count };
});
