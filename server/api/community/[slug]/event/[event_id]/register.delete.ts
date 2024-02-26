import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params!.slug;
  const event_id = handler.context.params!.event_id;

  if (!me) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const event = await prisma.event.findUnique({
    where: {
      id: event_id,
      community: {
        slug,
        members: {
          some: {
            user_id: me?.id || "",
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (!event) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  await prisma.eventAttendee.deleteMany({
    where: {
      event_id,
      user_id: me.id,
    },
  });

  await prisma.eventWaitlistAttendee.deleteMany({
    where: {
      waitlist: {
        event_id,
      },
      user_id: me.id,
    },
  });

  return prisma.event.findUnique({
    where: {
      id: event_id,
      community: {
        slug,
        members: {
          some: {
            user_id: me?.id || "",
          },
        },
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
      registered_players: {
        select: {
          name: true,
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
              created_at: true,
              name: true,
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
});
