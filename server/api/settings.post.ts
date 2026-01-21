import type { User } from "@supabase/supabase-js";
import { UserSettings } from "@prisma/client";
import { addUserKofiLevel } from "../utils/addUserKofiLevel";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<Partial<UserSettings> | null>(handler);

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

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  if (body.username === "") {
    throw createError({
      status: 409,
      statusMessage: "Username is required",
    });
  }

  if (body.username) {
    // Make sure that there are no spaces in the username.
    body.username = body.username.replaceAll(" ", "");

    const existingUser = await prisma.userSettings.findFirst({
      where: {
        username: {
          equals: body.username,
          mode: "insensitive",
        },
      },
    });

    if (existingUser && existingUser.user_id !== userId) {
      throw createError({
        status: 409,
        statusMessage: "Username already exists",
      });
    }

    // Verify that the username contains only alphanumeric characters, underscores, and dashes.

    const usernameRegex = /^[a-zA-Z0-9\._-]*$/;

    if (!usernameRegex.test(body.username)) {
      throw createError({
        status: 409,
        statusMessage: "Username can only contain letters, numbers, periods, underscores, and dashes.",
      });
    }
  }

  const settings = await prisma.userSettings.update({
    where: {
      user_id: userId,
    },
    data: {
      ...body,
    },
  });

  return addUserKofiLevel(settings);
});
