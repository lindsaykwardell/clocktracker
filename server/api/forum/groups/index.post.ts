import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await hasPermission(me.id, "MANAGE_GROUPS"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody<{
    name: string;
    permissions: string[];
    color?: string | null;
  } | null>(handler);

  if (!body?.name?.trim()) {
    throw createError({ status: 400, statusMessage: "Name is required" });
  }

  const group = await prisma.userGroup.create({
    data: {
      name: body.name.trim(),
      permissions: body.permissions ?? [],
      color: body.color || null,
    },
  });

  return group;
});
