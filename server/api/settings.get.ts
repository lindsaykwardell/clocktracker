import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const prisma = new PrismaClient();
  const settings = await prisma.userSettings.findFirst({
    where: {
      user_id: user.id,
    },
  });

  if (settings) return settings;

  const newSettings = await prisma.userSettings.create({
    data: {
      user_id: user.id,
      username: user.user_metadata.full_name,
    },
  });

  return newSettings;
});
