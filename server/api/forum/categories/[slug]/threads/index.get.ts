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

  // Determine unread and subscribed status per thread
  let readMap = new Map<string, Date>();
  let subscribedSet = new Set<string>();
  let firstVisit: Date | null = null;
  if (me) {
    const [userSettings, ...rest] = await Promise.all([
      prisma.userSettings.findUnique({
        where: { user_id: me.id },
        select: { forum_first_visit_at: true },
      }),
    ]);

    firstVisit = userSettings?.forum_first_visit_at
      ? new Date(userSettings.forum_first_visit_at)
      : null;

    const threadIds = threads.map((t) => t.id);
    if (threadIds.length > 0) {
      const [reads, subscriptions] = await Promise.all([
        prisma.forumThreadRead.findMany({
          where: { user_id: me.id, thread_id: { in: threadIds } },
          select: { thread_id: true, last_read_at: true },
        }),
        prisma.forumThreadSubscription.findMany({
          where: { user_id: me.id, thread_id: { in: threadIds } },
          select: { thread_id: true },
        }),
      ]);

      for (const r of reads) {
        readMap.set(r.thread_id, new Date(r.last_read_at));
      }
      for (const s of subscriptions) {
        subscribedSet.add(s.thread_id);
      }
    }
  }

  const threadsWithUnread = threads.map((t) => {
    if (!me) {
      return { ...t, has_unread: false, is_subscribed: false };
    }
    const lastPostAt = new Date(t.last_post_at);
    // Threads with activity before the user's first forum visit are implicitly read
    if (firstVisit && lastPostAt < firstVisit) {
      return { ...t, has_unread: false, is_subscribed: subscribedSet.has(t.id) };
    }
    const lastRead = readMap.get(t.id);
    const hasUnread = !lastRead || lastPostAt > lastRead;
    return { ...t, has_unread: hasUnread, is_subscribed: subscribedSet.has(t.id) };
  });

  return {
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      is_private: category.is_private,
      mod_posting_only: category.mod_posting_only,
    },
    threads: threadsWithUnread,
    total,
    page,
    perPage,
  };
});
