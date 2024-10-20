import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { fetchEventAndUpdateDiscord } from "~/server/utils/fetchEventAndUpdateDiscord";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const event_id = handler.context.params!.event_id;
  const registered_player_id = +handler.context.params!.id;

  if (!me) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const event = await prisma.event.findUnique({
    where: {
      id: event_id,
      OR: [
        {
          community: {
            admins: {
              some: {
                user_id: me.id,
              },
            },
          },
        },
        {
          created_by_id: me.id,
        },
      ],
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
      id: registered_player_id,
    },
  });

  return fetchEventAndUpdateDiscord(event_id);
});
