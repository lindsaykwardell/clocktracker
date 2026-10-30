import { forumVisibility } from "~/server/utils/forumSafety";
import { prisma } from "~/server/utils/prisma";
import { forumUserSelect, userCanViewCategory } from "~/server/utils/forum";

export default defineEventHandler(async (handler) => {
  const category = await prisma.forumCategory.findFirst({
    where: { is_announcement: true },
  });

  if (!category || !(await userCanViewCategory(handler.context.user?.id ?? null, category.id, category.is_private))) return null;

  const visible = await forumVisibility(handler.context.user?.id ?? null);
  const latestThread = await prisma.forumThread.findFirst({
    where: {
      category_id: category.id,
      ...visible,
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      title: true,
      created_at: true,
      author: { select: forumUserSelect },
      posts: {
        where: visible,
        orderBy: { created_at: "asc" },
        take: 1,
        select: {
          id: true,
          body: true,
        },
      },
    },
  });

  if (!latestThread || !latestThread.posts.length) return null;

  return {
    threadId: latestThread.id,
    title: latestThread.title,
    body: latestThread.posts[0].body,
    postId: latestThread.posts[0].id,
    author: latestThread.author,
    createdAt: latestThread.created_at,
    categorySlug: category.slug,
  };
});
