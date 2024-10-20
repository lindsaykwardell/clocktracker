import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const event_short_code = handler.context.params!.event_short_code;

  const event = await prisma.event.findUnique({
    where: {
      short_link: event_short_code,
      OR: [
        {
          community_id: null,
        },
        {
          community: {
            banned_users: {
              none: {
                user_id: me?.id || "",
              },
            },
            OR: [
              {
                is_private: false,
              },
              {
                members: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
                is_private: true,
              },
            ],
          },
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

  return expandLink(event);
});

function expandLink(event: {
  id: string;
}): string {
  return `/event/${event.id}/`;
}
