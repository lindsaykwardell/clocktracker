import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasForumPermission } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await hasForumPermission(me.id, "BAN_USER"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const banId = handler.context.params!.id;

  const ban = await prisma.forumBan.findUnique({
    where: { id: banId },
  });

  if (!ban) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  await prisma.forumBan.delete({
    where: { id: banId },
  });

  return { success: true };
});
