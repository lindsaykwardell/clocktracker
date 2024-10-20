import { LocationType, PrismaClient, WhoCanRegister } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const event_id = handler.context.params!.event_id;
  const body = await readBody<{
    title: string;
    description: string;
    start: string;
    end: string;
    location: string;
    location_type: LocationType;
    player_count?: number;
    who_can_register: WhoCanRegister;
    image: string | null;
    storytellers: string[];
    script: string;
    script_id: number | null;
    game_link: string | null;
    community_id: number;
    waitlists: {
      id?: number;
      name: string;
      default?: boolean;
    }[];
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
            id: body.community_id,
            admins: {
              some: {
                user_id: me.id,
              },
            },
          },
        },
        {
          created_by_id: me.id,
        }
      ],
    },
  });

  if (!event) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  const updatedEvent = await prisma.event.update({
    where: {
      id: event_id,
    },
    data: {
      title: body.title,
      description: body.description,
      start: body.start,
      end: body.end,
      location: body.location,
      location_type: body.location_type,
      player_count: body.player_count,
      who_can_register: body.who_can_register,
      storytellers: body.storytellers.filter((s) => s.length > 0),
      script: body.script,
      script_id: body.script_id,
      game_link: body.game_link,
      image: body.image,
      waitlists: {
        deleteMany: {
          id: {
            notIn: body.waitlists
              .filter((waitlist) => !!waitlist.id)
              .map((waitlist) => waitlist.id!),
          },
        },
        create: body.waitlists
          .filter((waitlist) => !waitlist.id)
          .map((waitlist) => ({
            name: waitlist.name,
            default: waitlist.default,
          })),
        update: body.waitlists
          .filter((waitlist) => waitlist.id)
          .map((waitlist) => ({
            where: {
              id: waitlist.id!,
            },
            data: {
              name: waitlist.name,
              default: waitlist.default,
            },
          })),
      },
    },
  });

  return fetchEventAndUpdateDiscord(updatedEvent.id);
});
