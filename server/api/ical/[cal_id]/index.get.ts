import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import * as ics from "ics";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const cal_id = handler.context.params!.cal_id;

  const calendar = await prisma.sharedCalendarLink.findUnique({
    where: {
      id: cal_id,
    },
    select: {
      user_id: true,
    },
  });

  if (!calendar) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  const events = await prisma.event.findMany({
    where: {
      OR: [
        {
          created_by_id: calendar.user_id,
        },
        {
          registered_players: {
            some: {
              user_id: calendar.user_id,
            },
          },
        },
        {
          waitlists: {
            some: {
              users: {
                some: {
                  user_id: calendar.user_id,
                },
              },
            },
          },
        },
      ],
    },
    orderBy: {
      start: "asc",
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
      storytellers: true,
      script: true,
      script_id: true,
      game_link: true,
      community_id: true,
      registered_players: {
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
  });

  const { error, value } = ics.createEvents(
    events.map((event) => {
      const start = dayjs(event.start);
      const end = dayjs(event.end);

      const duration = end.diff(start, "minute");
      const organizer = {
        name: "",
      };

      if (event.community) {
        organizer.name = event.community.name;
      } else if (event.created_by) {
        organizer.name =
          event.created_by.display_name ?? event.created_by.username;
      }

      return {
        title: event.title,
        description: event.description,
        location: event.location,
        url: event.game_link ?? undefined,
        status: "CONFIRMED",
        organizer,
        start: [
          start.year(),
          start.month() + 1,
          start.date(),
          start.hour(),
          start.minute(),
        ],
        duration: { minutes: duration },
      };
    })
  );

  if (error) {
    console.error(error);

    throw createError({
      status: 500,
      statusMessage: "Internal Server Error",
    });
  }

  setResponseHeader(handler, "content-type", "text/calendar; charset=utf-8");
  setResponseHeader(
    handler,
    "content-disposition",
    `attachment; filename=clocktracker-events.ics`
  );

  return value;
});
