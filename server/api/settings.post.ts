import type { User } from "@supabase/supabase-js";
import { PrismaClient, UserSettings } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<UserSettings | null>(handler);

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const prisma = new PrismaClient();
  const settings = await prisma.userSettings.upsert({
    where: {
      user_id: user.id,
    },
    update: {
      ...body,
    },
    create: {
      ...body,
      user_id: user.id,
    },
  });

  return settings;
});
