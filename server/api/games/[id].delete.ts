import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      user_id: user.id,
    },
  });

  if (!game || game.user_id !== user.id) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // delete the game
  await prisma.game.update({
    where: {
      id: gameId,
    },
    data: {
      deleted: true,
      deleted_date: new Date(),
    },
  });

  return game;
});
