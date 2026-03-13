import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await hasPermission(me.id, "MANAGE_GROUPS"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const groupId = handler.context.params!.id;
  const body = await readBody<{
    name?: string;
    permissions?: string[];
    restrictions?: string[];
    color?: string | null;
  } | null>(handler);

  if (!body) {
    throw createError({ status: 400, statusMessage: "Bad Request" });
  }

  const group = await prisma.userGroup.findUnique({
    where: { id: groupId },
  });

  if (!group) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  const updated = await prisma.userGroup.update({
    where: { id: groupId },
    data: {
      name: body.name?.trim() ?? group.name,
      permissions: body.permissions ?? group.permissions,
      restrictions: body.restrictions ?? group.restrictions,
      color: body.color !== undefined ? (body.color || null) : group.color,
    },
  });

  return updated;
});
