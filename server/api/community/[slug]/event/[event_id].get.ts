import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params!.slug;
  const event_id = handler.context.params!.event_id;

  const event = await prisma.event.findUnique({
    where: {
      id: event_id,
      community: {
        slug,
        banned_users: {
          none: {
            user_id: me?.id || "",
          },
        },
        OR: [
          {
            is_private: false,
          },
          {
            members: {
              some: {
                user_id: me?.id || "",
              },
            },
            is_private: true,
          },
        ],
      },
    },
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
      registered_players: {
        select: {
          id: true,
          name: true,
          discord_user_id: true,
          created_at: true,
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
      waitlists: {
        select: {
          id: true,
          name: true,
          default: true,
          created_at: true,
          users: {
            select: {
              id: true,
              name: true,
              discord_user_id: true,
              created_at: true,
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
          name: true,
        },
      },
    },
  });

  if (!event) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return event;
});
