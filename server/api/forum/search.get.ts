import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { forumUserSelect, userCanViewCategory } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const query = getQuery(handler);
  const q = (query.q as string || "").trim();

  if (!q || q.length < 2) {
    throw createError({ status: 400, statusMessage: "Search query too short" });
  }

  const page = Math.max(1, Number(query.page) || 1);
  const perPage = 20;

  // Search posts by body content and threads by title
  const [posts, threads] = await Promise.all([
    prisma.forumPost.findMany({
      where: {
        deleted_at: null,
        body: { contains: q, mode: "insensitive" },
        thread: { deleted_at: null },
      },
      orderBy: { created_at: "desc" },
      take: perPage,
      skip: (page - 1) * perPage,
      select: {
        id: true,
        body: true,
        created_at: true,
        author: { select: forumUserSelect },
        thread: {
          select: {
            id: true,
            title: true,
            category: {
              select: {
                slug: true,
                is_private: true,
                id: true,
              },
            },
          },
        },
      },
    }),
    page === 1
      ? prisma.forumThread.findMany({
          where: {
            deleted_at: null,
            title: { contains: q, mode: "insensitive" },
          },
          orderBy: { last_post_at: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            created_at: true,
            last_post_at: true,
            author: { select: forumUserSelect },
            _count: { select: { posts: true } },
            category: {
              select: {
                slug: true,
                is_private: true,
                id: true,
              },
            },
          },
        })
      : [],
  ]);

  // Filter by visibility
  const visiblePosts = [];
  for (const post of posts) {
    const canView = await userCanViewCategory(
      me?.id ?? null,
      post.thread.category.id,
      post.thread.category.is_private
    );
    if (canView) {
      visiblePosts.push({
        id: post.id,
        body: post.body.length > 300 ? post.body.slice(0, 300) + "..." : post.body,
        created_at: post.created_at,
        author: post.author,
        thread: {
          id: post.thread.id,
          title: post.thread.title,
          categorySlug: post.thread.category.slug,
        },
      });
    }
  }

  const visibleThreads = [];
  for (const thread of threads) {
    const canView = await userCanViewCategory(
      me?.id ?? null,
      thread.category.id,
      thread.category.is_private
    );
    if (canView) {
      visibleThreads.push({
        id: thread.id,
        title: thread.title,
        created_at: thread.created_at,
        last_post_at: thread.last_post_at,
        author: thread.author,
        postCount: thread._count.posts,
        categorySlug: thread.category.slug,
      });
    }
  }

  return { posts: visiblePosts, threads: visibleThreads };
});
