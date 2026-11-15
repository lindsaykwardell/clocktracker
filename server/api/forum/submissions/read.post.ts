import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async event => {
  const userId = event.context.user?.id;
  if (!userId) throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  const body = await readBody(event);
  if (!Array.isArray(body?.ids) || body.ids.length > 100 || body.ids.some((id: unknown) => typeof id !== "string")) {
    throw createError({ statusCode: 400, statusMessage: "Invalid submission IDs" });
  }
  await prisma.forumSubmission.updateMany({
    where: { id: { in: body.ids }, author_id: userId, status: { in: ["PUBLISHED", "REJECTED"] }, decision_seen_at: null },
    data: { decision_seen_at: new Date() },
  });
  return { success: true };
});
