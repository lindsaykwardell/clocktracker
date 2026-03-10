import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { isAdmin } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await isAdmin(me.id))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody<{
    categoryGroups?: { id: string; sort_order: number }[];
    categories?: { id: string; sort_order: number; group_id: string | null }[];
  } | null>(handler);

  if (!body) {
    throw createError({ status: 400, statusMessage: "Bad Request" });
  }

  const operations: Promise<any>[] = [];

  if (body.categoryGroups) {
    for (const cg of body.categoryGroups) {
      operations.push(
        prisma.forumCategoryGroup.update({
          where: { id: cg.id },
          data: { sort_order: cg.sort_order },
        })
      );
    }
  }

  if (body.categories) {
    for (const cat of body.categories) {
      operations.push(
        prisma.forumCategory.update({
          where: { id: cat.id },
          data: {
            sort_order: cat.sort_order,
            group_id: cat.group_id,
          },
        })
      );
    }
  }

  await Promise.all(operations);

  return { success: true };
});
