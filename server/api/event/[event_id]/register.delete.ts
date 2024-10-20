import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { fetchEventAndUpdateDiscord } from "~/server/utils/fetchEventAndUpdateDiscord";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
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
      OR: [
        {
          community: {
            members: {
              some: {
                user_id: me.id,
              },
            },
          },
        },
        {
          community_id: null,
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

  return fetchEventAndUpdateDiscord(event_id);
});
