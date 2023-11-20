import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params!.slug;

  const isModerator = !!(await prisma.community.findFirst({
    where: {
      slug,
      admins: {
        some: {
          user_id: me?.id || "",
        },
      },
    },
  }));

  const isBanned = !!(await prisma.community.findFirst({
    where: {
      slug,
      banned_users: {
        some: {
          user_id: me?.id || "",
        },
      },
    },
  }));

  const community = await prisma.community.findUnique({
    where: {
      slug,
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
      banned_users: isBanned
        ? {
            where: {
              user_id: me!.id,
            },
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
          }
        : isModerator
        ? {
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
          }
        : false,
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

  if (!community) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  if (isBanned) {
    community.members = [];
    community.admins = [];
    community.posts = [];
  }

  return community;
});
