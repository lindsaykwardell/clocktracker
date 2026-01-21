import type { User } from "@supabase/supabase-js";
import { Alignment, PrivacySetting } from "@prisma/client";
import axios from "axios";
// @ts-ignore
import dayjs from "dayjs";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(async (handler) => {
  const user = handler.context.user as User | null;
  const gameId = handler.context.params?.id as string;

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

  const userSettings = await prisma.userSettings.findUnique({
    where: {
      user_id: userId,
    },
    select: {
      bgg_cookies: true,
      bgg_username: true,
      privacy: true,
    },
  });

  if (!userSettings?.bgg_cookies || !userSettings?.bgg_username) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      user_id: userId,
      deleted: false,
    },
    select: {
      bgg_id: true,
    },
  });

  if (!game) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  const response = await axios.post<{
    success: boolean;
  }>(
    "https://boardgamegeek.com/geekplay.php",
    {
      playid: game.bgg_id,
      ajax: 1,
      finalize: 1,
      action: "delete",
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Cookie: userSettings.bgg_cookies,
      },
    }
  );

  await prisma.game.update({
    where: {
      id: gameId,
    },
    data: {
      bgg_id: null,
    },
  });

  // update the cookies
  const cookies = [
    response.headers["set-cookie"]?.[0],
    response.headers["set-cookie"]?.[1],
  ].filter((c) => !!c) as string[];

  if (cookies[0] && cookies[1]) {
    await prisma.userSettings.update({
      where: {
        user_id: userId,
      },
      data: {
        bgg_cookies: cookies,
      },
    });
  }

  return true;
});
