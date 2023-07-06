import type { User } from "@supabase/supabase-js";
import { PrismaClient, game } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const gameId = +(handler.context.params?.id || 0);

  if (!user) {
    return {
      status: 401,
      body: {
        message: "Unauthorized",
      },
    };
  }

  if (!gameId) {
    return {
      status: 400,
      body: {
        message: "Bad Request",
      },
    };
  }

  const prisma = new PrismaClient();
  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
    },
  });

  if (!game || game.user_id !== user.id) {
    return {
      status: 404,
      body: {
        message: "Not Found",
      },
    };
  }

  // delete the game
  await prisma.game.delete({
    where: {
      id: gameId,
    },
  });

  return game;
});
