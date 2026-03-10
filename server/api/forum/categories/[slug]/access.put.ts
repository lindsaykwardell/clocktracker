import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { isAdmin } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await isAdmin(me.id))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const slug = handler.context.params!.slug;
  const body = await readBody<{
    group_id: string;
    can_view: boolean;
    can_post: boolean;
  } | null>(handler);

  if (!body?.group_id) {
    throw createError({ status: 400, statusMessage: "group_id is required" });
  }

  const category = await prisma.forumCategory.findUnique({
    where: { slug },
  });

  if (!category) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  const access = await prisma.categoryAccess.upsert({
    where: {
      category_id_group_id: {
        category_id: category.id,
        group_id: body.group_id,
      },
    },
    update: {
      can_view: body.can_view,
      can_post: body.can_post,
    },
    create: {
      category_id: category.id,
      group_id: body.group_id,
      can_view: body.can_view,
      can_post: body.can_post,
    },
  });

  return access;
});
