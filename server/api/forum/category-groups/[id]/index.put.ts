import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { isAdmin } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await isAdmin(me.id))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const id = handler.context.params!.id;
  const body = await readBody<{
    name?: string;
    sort_order?: number;
  } | null>(handler);

  if (!body) {
    throw createError({ status: 400, statusMessage: "Bad Request" });
  }

  const group = await prisma.forumCategoryGroup.findUnique({ where: { id } });
  if (!group) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  return await prisma.forumCategoryGroup.update({
    where: { id },
    data: {
      name: body.name?.trim() ?? group.name,
      sort_order: body.sort_order ?? group.sort_order,
    },
  });
});
