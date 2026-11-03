import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { fetchEventAndUpdateDiscord } from "~/server/utils/fetchEventAndUpdateDiscord";
import { prisma } from "~/server/utils/prisma";
import { sendPushNotifications } from "~/server/utils/sendPushNotifications";

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

      // Notify the promoted player
      if (player.user_id) {
        const eventDetails = await prisma.event.findUnique({
          where: { id: event_id },
          select: { title: true, short_link: true },
        });

        if (eventDetails) {
          const eventUrl = eventDetails.short_link
            ? `/event/${eventDetails.short_link}`
            : `/event/${event_id}`;

          void sendPushNotifications({
            userIds: [player.user_id],
            title: "You're off the waitlist!",
            body: `You've been moved to the registered list for ${eventDetails.title}`,
            url: eventUrl,
          });
        }
      }
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
