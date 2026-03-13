import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await hasPermission(me.id, "MANAGE_GROUPS"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const groups = await prisma.userGroup.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { members: true } },
      members: {
        include: {
          user: {
            select: {
              user_id: true,
              username: true,
              display_name: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  return groups;
});
