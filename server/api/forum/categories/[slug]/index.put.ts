import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await hasPermission(me.id, "MANAGE_CATEGORIES"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const slug = handler.context.params!.slug;
  const body = await readBody<{
    name?: string;
    slug?: string;
    description?: string;
    sort_order?: number;
    is_private?: boolean;
    mod_posting_only?: boolean;
    is_announcement?: boolean;
    group_id?: string | null;
  } | null>(handler);

  if (!body) {
    throw createError({ status: 400, statusMessage: "Bad Request" });
  }

  const category = await prisma.forumCategory.findUnique({
    where: { slug },
  });

  if (!category) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  if (body.slug && body.slug !== slug) {
    const existing = await prisma.forumCategory.findUnique({
      where: { slug: body.slug },
    });
    if (existing) {
      throw createError({ status: 409, statusMessage: "A category with that slug already exists" });
    }
  }

  // Only one category can be the announcement category
  if (body.is_announcement) {
    await prisma.forumCategory.updateMany({
      where: { is_announcement: true, id: { not: category.id } },
      data: { is_announcement: false },
    });
  }

  const updated = await prisma.forumCategory.update({
    where: { id: category.id },
    data: {
      name: body.name ?? category.name,
      slug: body.slug ?? category.slug,
      description: body.description !== undefined ? body.description : category.description,
      sort_order: body.sort_order ?? category.sort_order,
      is_private: body.is_private ?? category.is_private,
      mod_posting_only: body.mod_posting_only ?? category.mod_posting_only,
      is_announcement: body.is_announcement ?? category.is_announcement,
      group_id: body.group_id !== undefined ? body.group_id : category.group_id,
    },
  });

  return updated;
});
