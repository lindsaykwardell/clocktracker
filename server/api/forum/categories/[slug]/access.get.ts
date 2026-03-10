import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { isAdmin } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await isAdmin(me.id))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const slug = handler.context.params!.slug;

  const category = await prisma.forumCategory.findUnique({
    where: { slug },
    include: {
      access: {
        include: {
          group: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!category) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  return category.access;
});
