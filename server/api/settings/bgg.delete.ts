import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  await prisma.userSettings.update({
    where: {
      user_id: user.id,
    },
    data: {
      bgg_username: null,
      bgg_cookies: [],
    },
  });

  return true;
});
