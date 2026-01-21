import type { User } from "@supabase/supabase-js";
import { fetchGame } from "~/server/utils/fetchGames";
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

  const gameId = handler.context.params?.id;

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      user_id: userId,
      deleted: false,
    },
  });

  if (!game) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  await prisma.game.update({
    where: {
      id: game.id,
    },
    data: {
      waiting_for_confirmation: false,
    },
    select: {
      waiting_for_confirmation: true,
    },
  });

  return fetchGame(game.id, user as any);
});
