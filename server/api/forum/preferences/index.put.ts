import { prisma } from "~/server/utils/prisma";
export default defineEventHandler(async event => {
  const userId = event.context.user?.id;
  if (!userId) throw createError({ status: 401, statusMessage: "Unauthorized" });
  const body = await readBody(event);
  if (!body || typeof body.targetId !== "string" || body.targetId === userId || !["MUTE", null].includes(body.kind)) throw createError({ status: 400, statusMessage: "Invalid user preference" });
  const target = await prisma.userSettings.findUnique({ where: { user_id: body.targetId }, select: { user_id: true } });
  if (!target) throw createError({ status: 404, statusMessage: "User not found" });
  if (body.kind === null) await prisma.forumUserPreference.deleteMany({ where: { user_id: userId, target_id: body.targetId } });
  else await prisma.forumUserPreference.upsert({ where: { user_id_target_id: { user_id: userId, target_id: body.targetId } }, create: { user_id: userId, target_id: body.targetId, kind: body.kind }, update: { kind: body.kind } });
  return { success: true };
});
