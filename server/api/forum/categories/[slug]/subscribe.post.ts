import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { userCanViewCategory } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  if (!me) {
    throw createError({ status: 401, statusMessage: "Unauthorized" });
  }

  const slug = handler.context.params!.slug;

  const category = await prisma.forumCategory.findUnique({
    where: { slug },
  });

  if (!category) {
    throw createError({ status: 404, statusMessage: "Category not found" });
  }

  const canView = await userCanViewCategory(
    me.id,
    category.id,
    category.is_private
  );

  if (!canView) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  // Toggle subscription
  const existing = await prisma.forumCategorySubscription.findUnique({
    where: {
      category_id_user_id: {
        category_id: category.id,
        user_id: me.id,
      },
    },
  });

  if (existing) {
    await prisma.forumCategorySubscription.delete({
      where: { id: existing.id },
    });
    return { subscribed: false };
  }

  await prisma.forumCategorySubscription.create({
    data: {
      category_id: category.id,
      user_id: me.id,
    },
  });

  return { subscribed: true };
});
