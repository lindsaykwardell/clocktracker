import { PrismaClient, WhoCanRegister } from "@prisma/client";
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

  const isPendingMember = !!(await prisma.community.findFirst({
    where: {
      slug,
      join_requests: {
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
      is_private: true,
      discord_server_id: !!isModerator,
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
      join_requests: isPendingMember
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
      events: {
        select: {
          id: true,
          title: true,
          description: true,
          start: true,
          end: true,
          location: true,
          location_type: true,
          player_count: true,
          image: true,
          who_can_register: true,
          storytellers: true,
          script: true,
          script_id: true,
          game_link: true,
          registered_players: {
            select: {
              name: true,
              created_at: true,
              discord_user_id: true,
              user: {
                select: {
                  username: true,
                  avatar: true,
                },
              },
            },
            orderBy: {
              created_at: "asc",
            },
          },
          waitlists: {
            select: {
              id: true,
              name: true,
              default: true,
              created_at: true,
              users: {
                select: {
                  name: true,
                  created_at: true,
                  discord_user_id: true,
                  user: {
                    select: {
                      user_id: true,
                      username: true,
                      avatar: true,
                    },
                  },
                },
                orderBy: {
                  created_at: "asc",
                },
              },
            },
            orderBy: {
              created_at: "asc",
            },
          },
        },
        where: {
          who_can_register: {
            not: WhoCanRegister.PRIVATE,
          },
          end: {
            gte: new Date(),
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

  const isMember = !!community.members.find(
    (member) => member.user_id === (me?.id || "")
  );

  if (isBanned || (community.is_private && !isMember)) {
    community.members = [];
    community.admins = [];
    community.posts = [];
    community.events = [];
  }

  return community;
});
