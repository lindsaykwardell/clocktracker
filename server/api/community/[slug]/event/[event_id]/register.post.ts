import { PrismaClient, WhoCanRegister } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params!.slug;
  const event_id = handler.context.params!.event_id;
  const body = await readBody<{
    name: string;
  } | null>(handler);

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const event = await prisma.event.update({
    where: {
      id: event_id,
      community: {
        slug,
      },
      OR: [
        {
          community: {
            members: {
              some: {
                user_id: me?.id || "",
              },
            },
          },
          who_can_register: WhoCanRegister.COMMUNITY_MEMBERS,
        },
        {
          who_can_register: WhoCanRegister.ANYONE,
        },
      ],
    },
    data: {
      registered_players: {
        create: {
          user_id: me?.id,
          name: body.name,
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
