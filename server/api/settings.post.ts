import type { User } from "@supabase/supabase-js";
import { PrismaClient, UserSettings } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<Partial<UserSettings> | null>(handler);

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

  console.log(body);

  if (body.username) {
    const existingUser = await prisma.userSettings.findFirst({
      where: {
        username: body.username,
      },
    });

    if (existingUser && existingUser.user_id !== user.id) {
      throw createError({
        status: 409,
        statusMessage: "Username already exists",
      });
    }
  }

  const settings = await prisma.userSettings.update({
    where: {
      user_id: user.id,
    },
    data: {
      ...body,
    },
  });

  return settings;
});
