import type { User } from "@supabase/supabase-js";
import { WhoCanRegister } from "@prisma/client";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const community_slug = handler.context.params?.slug;
  const body = await readBody<{
    name?: string;
    description?: string;
    slug?: string;
    icon?: string;
    is_private?: boolean;
    discord_server_id?: string;
    time_zone?: string;
    links?: string[];
    location?: string;
    city_id?: string;
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
      name: body.name ?? community.name,
      description: body.description ?? community.description,
      slug: body.slug ?? community.slug,
      icon: body.icon ?? community.icon,
      is_private: body.is_private ?? community.is_private,
      discord_server_id: body.discord_server_id ?? community.discord_server_id,
      time_zone: body.time_zone ?? community.time_zone,
      links: body.links ?? community.links,
      location: body.location ?? community.location,
      city_id: body.city_id ?? community.city_id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      is_private: true,
      discord_server_id: true,
      time_zone: true,
      location: true,
      city_id: true,
      links: true,
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
      banned_users: {
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
      join_requests: {
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
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              icon: true,
            },
          },
          created_by: {
            select: {
              user_id: true,
              username: true,
              display_name: true,
              avatar: true,
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
        orderBy: {
          start: "asc",
        },
      },
    },
  });
});
