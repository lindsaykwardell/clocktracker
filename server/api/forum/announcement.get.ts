import { prisma } from "~/server/utils/prisma";
import { forumUserSelect } from "~/server/utils/forum";

export default defineEventHandler(async () => {
  const category = await prisma.forumCategory.findFirst({
    where: { is_announcement: true },
  });

  if (!category) return null;

  const latestThread = await prisma.forumThread.findFirst({
    where: {
      category_id: category.id,
      deleted_at: null,
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      title: true,
      created_at: true,
      author: { select: forumUserSelect },
      posts: {
        where: { deleted_at: null },
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
