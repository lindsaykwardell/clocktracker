import { PrismaClient } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const event_id = handler.context.params!.event_id;

  const event = await prisma.event.findUnique({
    where: {
      id: event_id,
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
      short_link: true,
    },
  });

  if (!event) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  if (event.short_link) {
    return shortCodeToLink(event.short_link);
  }

  const { short_link } = await prisma.event.update({
    where: {
      id: event.id,
    },
    data: {
      short_link: nanoid(8),
    },
    select: {
      short_link: true,
    },
  });

  return shortCodeToLink(short_link!);
});

function shortCodeToLink(shortCode: string): string {
  return process.env.NODE_ENV === "production"
    ? `https://clocktracker.app/e/${shortCode}`
    : `http://localhost:3000/e/${shortCode}`;
}
