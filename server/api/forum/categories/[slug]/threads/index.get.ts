import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { forumUserSelect, userCanViewCategory } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params!.slug;
  const query = getQuery(handler);
  const page = Math.max(1, Number(query.page) || 1);
  const perPage = 25;

  const category = await prisma.forumCategory.findUnique({
    where: { slug },
  });

  if (!category) {
    throw createError({ status: 404, statusMessage: "Not Found" });
  }

  const canView = await userCanViewCategory(
    me?.id ?? null,
    category.id,
    category.is_private
  );

  if (!canView) {
    throw createError({ status: 403, statusMessage: "Forbidden" });
  }

  const where = {
    category_id: category.id,
    deleted_at: null,
  };

  const [threads, total] = await Promise.all([
    prisma.forumThread.findMany({
      where,
      orderBy: [{ is_pinned: "desc" }, { last_post_at: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        title: true,
        is_pinned: true,
        is_locked: true,
        created_at: true,
        last_post_at: true,
        author: { select: forumUserSelect },
        _count: {
          select: {
            posts: { where: { deleted_at: null } },
          },
        },
      },
    }),
    prisma.forumThread.count({ where }),
  ]);

  return {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      is_private: category.is_private,
      mod_posting_only: category.mod_posting_only,
    },
    threads,
    total,
    page,
    perPage,
  };
});
