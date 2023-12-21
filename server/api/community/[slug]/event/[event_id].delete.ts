import { LocationType, PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const slug = handler.context.params!.slug;
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
      community: {
        slug,
        admins: {
          some: {
            user_id: me.id,
          },
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

  const updatedEvent = await prisma.event.delete({
    where: {
      id: event_id,
    },
  });

  return updatedEvent;
});
