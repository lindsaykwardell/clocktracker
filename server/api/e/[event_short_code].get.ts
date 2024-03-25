import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const event_short_code = handler.context.params!.event_short_code;

  const event = await prisma.event.findUnique({
    where: {
      short_link: event_short_code,
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
    select: {
      id: true,
      community: {
        select: {
          slug: true,
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

  return expandLink(event as any);
});

function expandLink(event: {
  id: string;
  community: { slug: string };
}): string {
  return `/community/${event.community.slug}/event/${event.id}/`;
}
