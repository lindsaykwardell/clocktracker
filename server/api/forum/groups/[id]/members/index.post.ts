import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { isAdmin } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await isAdmin(me.id))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const groupId = handler.context.params!.id;
  const body = await readBody<{ user_id: string } | null>(handler);

  if (!body?.user_id) {
    throw createError({ status: 400, statusMessage: "user_id is required" });
  }

  const group = await prisma.userGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw createError({ status: 404, statusMessage: "Group not found" });
  }

  const user = await prisma.userSettings.findUnique({
    where: { user_id: body.user_id },
  });

  if (!user) {
    throw createError({ status: 404, statusMessage: "User not found" });
  }

  const existing = await prisma.userGroupMembership.findUnique({
    where: {
      user_id_group_id: {
        user_id: body.user_id,
        group_id: groupId,
      },
    },
  });

  if (existing) {
    throw createError({
      status: 409,
      statusMessage: "User is already in this group",
    });
  }

  const membership = await prisma.userGroupMembership.create({
    data: {
      user_id: body.user_id,
      group_id: groupId,
    },
  });

  return membership;
});
