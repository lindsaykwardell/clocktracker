import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const gameId = handler.context.params?.id;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!gameId) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const prisma = new PrismaClient();
  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
    },
  });

  if (!game || game.user_id !== user.id) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // delete the game
  await prisma.game.delete({
    where: {
      id: gameId,
    },
  });

  return game;
});
