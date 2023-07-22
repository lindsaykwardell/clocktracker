import type { User } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const gameId = handler.context.params?.id;

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
    include: {
      player_characters: {
        include: {
          role: {
            select: {
              token_url: true,
              type: true,
            },
          },
          related_role: {
            select: {
              token_url: true,
            }
          }
        },
      },
    },
  });

  if (!game) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  return game;
});
