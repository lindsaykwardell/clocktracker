import { User } from "@supabase/supabase-js";
import { nanoid } from "nanoid";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      message: "Unauthorized",
    });
  }

  const userId = getUserId(user);
  if (!userId) {
    throw createError({
      status: 401,
      message: "Invalid user",
    });
  }

  const calendar = await prisma.sharedCalendarLink.findUnique({
    where: {
      user_id: userId,
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
      user_id: userId,
    },
  });

  return shortCodeToLink(id);
});

function shortCodeToLink(shortCode: string): string {
  return process.env.NODE_ENV === "production"
    ? `https://clocktracker.app/api/ical/${shortCode}`
    : `http://localhost:3000/api/ical/${shortCode}`;
}
