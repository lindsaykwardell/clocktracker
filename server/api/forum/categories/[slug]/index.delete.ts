import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await hasPermission(me.id, "MANAGE_CATEGORIES"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const slug = handler.context.params!.slug;

  const category = await prisma.forumCategory.findUnique({
    where: { slug },
  });

  if (!category) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  await prisma.forumCategory.delete({
    where: { id: category.id },
  });

  return { success: true };
});
