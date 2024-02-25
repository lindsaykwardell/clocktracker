import { LocationType, PrismaClient, WhoCanRegister } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params!.slug;
  const body = await readBody<{
    title: string;
    description: string;
    start: string;
    end: string;
    location: string;
    location_type: LocationType;
    player_count?: number;
    waitlists: {
      id?: number;
      name: string;
      default?: boolean;
    }[];
    who_can_register: WhoCanRegister;
  } | null>(handler);

  if (!me) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const community = await prisma.community.findUnique({
    where: {
      slug,
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

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
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
      community_id: community.id,
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

  return event;
});
