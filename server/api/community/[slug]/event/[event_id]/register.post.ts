import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params!.slug;
  const event_id = handler.context.params!.event_id;
  const body = await readBody<{
    name: string;
  } | null>(handler);

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

  const seat =
    (await prisma.eventAttendee.count({
      where: {
        event_id,
      },
    })) + 1;

  const event = await prisma.event.update({
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
    data: {
      registered_players: {
        create: {
          user_id: me?.id,
          name: body.name || "",
          seat,
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
          seat: true,
          user: {
            select: {
              user_id: true,
              username: true,
              avatar: true,
            },
          },
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