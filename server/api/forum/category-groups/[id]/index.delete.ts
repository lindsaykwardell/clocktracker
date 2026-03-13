import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { isAdmin } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await isAdmin(me.id))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const id = handler.context.params!.id;

  const group = await prisma.forumCategoryGroup.findUnique({ where: { id } });
  if (!group) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  // Ungroup categories rather than deleting them
  await prisma.forumCategory.updateMany({
    where: { group_id: id },
    data: { group_id: null },
  });

  await prisma.forumCategoryGroup.delete({ where: { id } });

  return { success: true };
});
