import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasPermission } from "~/server/utils/permissions";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  if (!me || !(await hasPermission(me.id, "MANAGE_CATEGORIES"))) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const body = await readBody<{
    name: string;
    slug: string;
    description?: string;
    sort_order?: number;
    is_private?: boolean;
    mod_posting_only?: boolean;
    is_announcement?: boolean;
    group_id?: string;
  } | null>(handler);

  if (!body?.name || !body?.slug) {
    throw createError({ status: 400, statusMessage: "Name and slug are required" });
  }

  const existing = await prisma.forumCategory.findUnique({
    where: { slug: body.slug },
  });

  if (existing) {
    throw createError({ status: 409, statusMessage: "A category with that slug already exists" });
  }

  const category = await prisma.forumCategory.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description ?? null,
      sort_order: body.sort_order ?? 0,
      is_private: body.is_private ?? false,
      mod_posting_only: body.mod_posting_only ?? false,
      is_announcement: body.is_announcement ?? false,
      group_id: body.group_id ?? null,
    },
  });

  return category;
});
