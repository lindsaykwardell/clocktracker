import { PrismaClient, WhoCanRegister } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { fetchEventAndUpdateDiscord } from "~/server/utils/fetchEventAndUpdateDiscord";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params!.slug;
  const event_id = handler.context.params!.event_id;
  const body = await readBody<{
    name: string;
    waitlist_id?: number;
  } | null>(handler);

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const event = await prisma.event.findUnique({
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
        {
          who_can_register: WhoCanRegister.PRIVATE,
        }
      ],
    },
    select: {
      id: true,
      player_count: true,
      registered_players: {
        select: {
          id: true,
        },
      },
      waitlists: {
        select: {
          id: true,
          default: true,
        },
      },
      discord_posts: true,
      community: true,
    },
  });

  if (!event) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // Was a waitlist ID provided?
  if (body.waitlist_id) {
    // Verify that it exists and is associated with the event.
    const waitlist = await prisma.eventWaitlist.findFirst({
      where: {
        id: body.waitlist_id,
        event_id,
      },
    });

    // If it doesn't exist, throw a 400
    if (!waitlist) {
      throw createError({
        status: 400,
        statusMessage: "Bad Request",
      });
    }

    // If it does exist, add the user to the waitlist.
    await prisma.eventWaitlistAttendee.create({
      data: {
        waitlist_id: body.waitlist_id,
        user_id: me?.id || null,
        name: body.name,
      },
    });
  } else if (!event.player_count) {
    // Is there a player count? If not, add the user to the list of registered players.
    await prisma.eventAttendee.create({
      data: {
        event_id: event.id,
        user_id: me?.id || null,
        name: body.name,
      },
    });
  } else if (event.registered_players.length < event.player_count) {
    // Are there already enough players? If not, add the user to the list of registered players.
    await prisma.eventAttendee.create({
      data: {
        event_id: event.id,
        user_id: me?.id || null,
        name: body.name,
      },
    });
  } else if (event.waitlists.find((w) => w.default)) {
    // Is there a default waitlist? If so, add the user to the default waitlist.
    await prisma.eventWaitlistAttendee.create({
      data: {
        waitlist_id: event.waitlists.find((w) => w.default)!.id,
        user_id: me?.id || null,
        name: body.name,
      },
    });
  } else {
    // There is no default waitlist. Add the user to the registered players list.
    await prisma.eventAttendee.create({
      data: {
        event_id: event.id,
        user_id: me?.id || null,
        name: body.name,
      },
    });
  }

  return fetchEventAndUpdateDiscord(event_id);
});
