import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await hasPermission(me.id, "MANAGE_GROUPS"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const groupId = handler.context.params!.id;
  const userId = handler.context.params!.userId;

  const membership = await prisma.userGroupMembership.findUnique({
    where: {
      user_id_group_id: {
        user_id: userId,
        group_id: groupId,
      },
    },
  });

  if (!membership) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  await prisma.userGroupMembership.delete({
    where: { id: membership.id },
  });

  return { success: true };
});
