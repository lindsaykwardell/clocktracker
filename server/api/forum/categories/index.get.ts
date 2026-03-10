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

  // Compute unread status per category for logged-in users
  if (me && visibleCategories.length > 0) {
    // Get or set the user's first forum visit timestamp
    const userSettings = await prisma.userSettings.findUnique({
      where: { user_id: me.id },
      select: { forum_first_visit_at: true },
    });

    let firstVisit = userSettings?.forum_first_visit_at
      ? new Date(userSettings.forum_first_visit_at)
      : null;

    if (!firstVisit) {
      // First time visiting the forum — set the timestamp and skip unread counts
      firstVisit = new Date();
      await prisma.userSettings.update({
        where: { user_id: me.id },
        data: { forum_first_visit_at: firstVisit },
      });
      // Don't compute unread — everything before now is implicitly "read"
    } else {
      const categoryIds = visibleCategories.map((c) => c.id);

      // Only consider threads with activity after the user's first visit
      const threads = await prisma.forumThread.findMany({
        where: {
          category_id: { in: categoryIds },
          deleted_at: null,
          last_post_at: { gte: firstVisit },
        },
        select: { id: true, category_id: true, last_post_at: true },
      });

      // Get user's read records for these threads
      const threadIds = threads.map((t) => t.id);
      const reads = threadIds.length > 0
        ? await prisma.forumThreadRead.findMany({
            where: { user_id: me.id, thread_id: { in: threadIds } },
            select: { thread_id: true, last_read_at: true },
          })
        : [];

      const readMap = new Map<string, Date>();
      for (const r of reads) {
        readMap.set(r.thread_id, new Date(r.last_read_at));
      }

      // Count unread threads per category
      const unreadByCategory = new Map<string, number>();
      for (const t of threads) {
        const lastRead = readMap.get(t.id);
        if (!lastRead || new Date(t.last_post_at) > lastRead) {
          unreadByCategory.set(
            t.category_id,
            (unreadByCategory.get(t.category_id) || 0) + 1
          );
        }
      }

      for (const cat of visibleCategories) {
        (cat as any).unread_count = unreadByCategory.get(cat.id) || 0;
      }
    }
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
