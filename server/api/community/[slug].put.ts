import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const community_slug = handler.context.params?.slug;
  const body = await readBody<{
    name?: string;
    description?: string;
    slug?: string;
    icon?: string;
  }>(handler);

  if (!me) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const community = await prisma.community.findUnique({
    where: {
      slug: community_slug,
      admins: {
        some: {
          user_id: me.id,
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

  // Promote the user to moderator

  return await prisma.community.update({
    where: {
      slug: community_slug,
    },
    data: {
      name: body.name || community.name,
      description: body.description || community.description,
      slug: body.slug || community.slug,
      icon: body.icon || community.icon,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
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
        orderBy: {
          display_name: "asc",
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
              replies: {
                where: {
                  deleted: false,
                },
              },
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
});
