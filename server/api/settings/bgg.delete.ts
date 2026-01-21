import type { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const userId = getUserId(user);
  if (!userId) {
    throw createError({
      status: 401,
      statusMessage: "Invalid user",
    });
  }

  await prisma.userSettings.update({
    where: {
      user_id: userId,
    },
    data: {
      bgg_username: null,
      bgg_cookies: [],
    },
  });

  return true;
});
