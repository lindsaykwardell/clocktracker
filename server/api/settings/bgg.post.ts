import type { User } from "@supabase/supabase-js";
import { UserSettings } from "@prisma/client";
import axios from "axios";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<{ username: string; password: string } | null>(
    handler
  );

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

  const response = await axios
    .post(
      "https://www.boardgamegeek.com/login/api/v1",
      {
        credentials: {
          username: body.username,
          password: body.password,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    )
    .catch((e) => {
      throw createError({
        status: 401,
        statusMessage: "Unable to authenticate with BoardGameGeek",
      });
    });

  const cookies = [
    response.headers["set-cookie"]?.[0],
    response.headers["set-cookie"]?.[1],
  ];

  if (!cookies[0] || !cookies[1]) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  await prisma.userSettings.update({
    where: {
      user_id: userId,
    },
    data: {
      bgg_username: body.username,
      bgg_cookies: cookies.map((c) => c!),
    },
  });

  return true;
});
