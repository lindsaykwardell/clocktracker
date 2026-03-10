import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { isAdmin } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await isAdmin(me.id))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody<{
    name: string;
    sort_order?: number;
  } | null>(handler);

  if (!body?.name?.trim()) {
    throw createError({ status: 400, statusMessage: "Name is required" });
  }

  return await prisma.forumCategoryGroup.create({
    data: {
      name: body.name.trim(),
      sort_order: body.sort_order ?? 0,
    },
  });
});
