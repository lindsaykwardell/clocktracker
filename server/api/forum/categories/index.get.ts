import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { forumUserSelect, userCanViewCategory } from "~/server/utils/forum";

async function buildCategoryData(
  category: any,
  me: User | null
) {
  const canView = await userCanViewCategory(
    me?.id ?? null,
    category.id,
    category.is_private
  );
  if (!canView) return null;

  const lastPost = await prisma.forumPost.findFirst({
    where: {
      deleted_at: null,
      thread: {
        category_id: category.id,
        deleted_at: null,
      },
    },
    orderBy: { created_at: "desc" },
    select: {
      created_at: true,
      author: { select: forumUserSelect },
      thread: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    is_private: category.is_private,
    mod_posting_only: category.mod_posting_only,
    is_announcement: category.is_announcement,
    group_id: category.group_id,
    threadCount: category._count.threads,
    lastPost: lastPost
      ? {
          threadId: lastPost.thread.id,
          threadTitle: lastPost.thread.title,
          createdAt: lastPost.created_at,
          author: lastPost.author,
        }
      : null,
  };
}

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  const [categories, categoryGroups] = await Promise.all([
    prisma.forumCategory.findMany({
      orderBy: { sort_order: "asc" },
      include: {
        access: true,
        _count: {
          select: {
            threads: { where: { deleted_at: null } },
          },
        },
      },
    }),
    prisma.forumCategoryGroup.findMany({
      orderBy: { sort_order: "asc" },
    }),
  ]);

  const visibleCategories = [];
  for (const category of categories) {
    const data = await buildCategoryData(category, me);
    if (data) visibleCategories.push(data);
  }

  // Split into ungrouped and grouped
  const ungrouped = visibleCategories.filter((c) => !c.group_id);
  const groups = categoryGroups
    .map((group) => ({
      id: group.id,
      name: group.name,
      sort_order: group.sort_order,
      categories: visibleCategories.filter((c) => c.group_id === group.id),
    }))
    .filter((g) => g.categories.length > 0);

  return { ungrouped, groups };
});
