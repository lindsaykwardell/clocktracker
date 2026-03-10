import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { isAdmin } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await isAdmin(me.id))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const slug = handler.context.params!.slug;
  const body = await readBody<{ group_id: string } | null>(handler);

  if (!body?.group_id) {
    throw createError({ status: 400, statusMessage: "group_id is required" });
  }

  const category = await prisma.forumCategory.findUnique({
    where: { slug },
  });

  if (!category) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  await prisma.categoryAccess.deleteMany({
    where: {
      category_id: category.id,
      group_id: body.group_id,
    },
  });

  return { success: true };
});
