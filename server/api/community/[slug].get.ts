import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const slug = handler.context.params!.slug;

  const community = await prisma.community.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      members: {
        select: {
          user_id: true,
          username: true,
          display_name: true,
          avatar: true,
          pronouns: true,
          bio: true,
          location: true,
          privacy: true,
          charts: true,
        },
      },
      admins: {
        select: {
          user_id: true,
        },
      },
      posts: {
        select: {
          id: true,
          content: true,
          created_at: true,
          user: {
            select: {
              user_id: true,
              username: true,
              display_name: true,
              avatar: true,
            },
          },
          replies: {
            select: {
              id: true,
              content: true,
              created_at: true,
              user: {
                select: {
                  user_id: true,
                  username: true,
                  display_name: true,
                  avatar: true,
                },
              },
            },
            where: {
              deleted: false,
            },
            orderBy: {
              created_at: "asc",
            },
          },
          _count: {
            select: {
              replies: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        where: {
          deleted: false,
          reply_to_id: {
            equals: null,
          },
        },
      },
    },
  });

  if (!community) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return community;
});
