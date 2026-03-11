import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) throw createError({ status: 401, statusMessage: "Unauthorized" });

  if (!(await hasPermission(me.id, "MANAGE_FEATURE_FLAGS"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody<{ name: string; description: string }>(handler);

  if (!body.name?.trim()) {
    throw createError({ status: 400, statusMessage: "name is required" });
  }

  const flag = await prisma.featureFlag.create({
    data: {
      name: body.name.trim(),
      description: body.description?.trim() || "",
      active: false,
    },
    select: {
      id: true,
      name: true,
      description: true,
      active: true,
      enabled_for_supporters: true,
      effective_date: true,
      active_for: {
        select: {
          user_id: true,
          username: true,
          display_name: true,
          avatar: true,
        },
      },
    },
  });

  return flag;
});
