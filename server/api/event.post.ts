import { LocationType, WhoCanRegister } from "~/server/generated/prisma/client";
import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import { prisma } from "~/server/utils/prisma";
import { hasRestriction } from "~/server/utils/permissions";
import { sendPushNotifications } from "~/server/utils/sendPushNotifications";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;

  const body = await readBody<{
    title: string;
    description: string;
    start: string;
    end: string;
    location: string;
    location_type: LocationType;
    player_count?: number;
    storytellers: string[];
    script: string;
    script_id: number | null;
    game_link: string | null;
    community_id: number | null;
    waitlists: {
      id?: number;
      name: string;
      default?: boolean;
    }[];
    who_can_register: WhoCanRegister;
    image: string | null;
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

  if (await hasRestriction(me.id, "CREATE_EVENT")) {
    throw createError({
      status: 403,
      statusMessage: "Forbidden",
    });
  }

  if (body.community_id) {
    const community = await prisma.community.findUnique({
      where: {
        id: body.community_id,
        admins: {
          some: {
            user_id: me.id,
          },
        },
      },
    });

    if (!community) {
      throw createError({
        status: 404,
        statusMessage: "Not Found",
      });
    }
  }

  const event = await prisma.event.create({
    data: {
      title: body.title,
      description: body.description,
      start: body.start,
      end: body.end,
      location: body.location,
      location_type: body.location_type,
      player_count: body.player_count,
      who_can_register: body.who_can_register,
      image: body.image,
      community_id: body.community_id,
      storytellers: body.storytellers,
      script_id: body.script_id,
      game_link: body.game_link,
      created_by_id: me.id,
      waitlists: {
        createMany: {
          data: body.waitlists.map((waitlist) => ({
            name: waitlist.name,
            default: waitlist.default,
          })),
        },
      },
    },
  });

  // Notify community members about the new event
  if (body.community_id) {
    const members = await prisma.community.findUnique({
      where: { id: body.community_id },
      select: {
        name: true,
        members: { select: { user_id: true } },
      },
    });

    if (members && members.members.length > 0) {
      const startDate = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(body.start));

      void sendPushNotifications({
        userIds: members.members.map((m) => m.user_id),
        excludeUserId: me.id,
        title: `New event in ${members.name}`,
        body: `${body.title} — ${startDate}`,
        url: `/event/${event.id}`,
      });
    }
  }

  return event;
});
