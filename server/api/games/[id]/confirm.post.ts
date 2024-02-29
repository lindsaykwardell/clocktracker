import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { fetchGame } from "~/server/utils/fetchGames";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const gameId = handler.context.params?.id;

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      user_id: user.id,
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

  return fetchGame(game.id, user);
});
