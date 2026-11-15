import { prisma } from "~/server/utils/prisma";
import { forumUserSelect } from "~/server/utils/forum";
export default defineEventHandler(async event => {
  const userId = event.context.user?.id;
  if (!userId) throw createError({ status: 401, statusMessage: "Unauthorized" });
  return prisma.forumUserPreference.findMany({ where: { user_id: userId, kind: "MUTE" }, include: { target: { select: forumUserSelect } }, orderBy: { created_at: "desc" } });
});
