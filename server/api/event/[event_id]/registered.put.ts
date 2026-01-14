import { User } from "@supabase/supabase-js";
import { fetchEventAndUpdateDiscord } from "~/server/utils/fetchEventAndUpdateDiscord";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const event_id = handler.context.params!.event_id;
  const body = await readBody<{
    player_id: number;
    from: "registered" | number;
    to: "registered" | number;
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

  if (body.from === "registered") {
    // The player is currently registered, and is being moved to a waitlist.
    const player = await prisma.eventAttendee.findUnique({
      where: {
        id: body.player_id,
      },
    });

    if (!player) {
      throw createError({
        status: 400,
        statusMessage: "Bad Request",
      });
    }

    await prisma.eventWaitlistAttendee.create({
      data: {
        waitlist_id: body.to as number,
        name: player.name,
        user_id: player.user_id,
        discord_user_id: player.discord_user_id,
      },
    });

    await prisma.eventAttendee.delete({
      where: {
        id: player.id,
      },
    });
  } else {
    // A player is being moved from a waitlist.
    const player = await prisma.eventWaitlistAttendee.findUnique({
      where: {
        id: body.player_id,
      },
    });

    if (!player) {
      throw createError({
        status: 400,
        statusMessage: "Bad Request",
      });
    }

    if (body.to === "registered") {
      await prisma.eventAttendee.create({
        data: {
          event_id,
          user_id: player.user_id,
          name: player.name,
          discord_user_id: player.discord_user_id,
        },
      });

      await prisma.eventWaitlistAttendee.delete({
        where: {
          id: player.id,
        },
      });
    } else {
      await prisma.eventWaitlistAttendee.update({
        where: {
          id: player.id,
        },
        data: {
          waitlist_id: body.to as number,
        },
      });
    }
  }

  return fetchEventAndUpdateDiscord(event_id);
});
