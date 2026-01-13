import { User } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      message: "Unauthorized",
    });
  }

  const calendar = await prisma.sharedCalendarLink.findUnique({
    where: {
      user_id: user.id,
    },
    select: {
      id: true,
    },
  });

  if (calendar) {
    return shortCodeToLink(calendar.id);
  }

  const id = nanoid(8);

  await prisma.sharedCalendarLink.create({
    data: {
      id,
      user_id: user.id,
    },
  });

  return shortCodeToLink(id);
});

function shortCodeToLink(shortCode: string): string {
  return process.env.NODE_ENV === "production"
    ? `https://clocktracker.app/api/ical/${shortCode}`
    : `http://localhost:3000/api/ical/${shortCode}`;
}
