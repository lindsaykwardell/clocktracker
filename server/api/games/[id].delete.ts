import type { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const gameId = handler.context.params?.id;
  const { untag } = getQuery(handler) as {
    untag: "true" | "false";
  };

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
    select: {
      user_id: true,
      grimoire: {
        include: {
          tokens: true,
        },
      },
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

  if (untag === "true") {
    // If the player requests to be untagged from the game, we need to remove them from
    // the grimoire.
    // With game_v2, we'll also take them off of the storyteller list, but that's hard right now.

    for (const grimoire of game.grimoire) {
      for (const token of grimoire.tokens) {
        if (token.player_id === user.id) {
          await prisma.token.update({
            where: {
              id: token.id,
            },
            data: {
              player_id: null,
              player_name: "",
            },
          });
        }
      }
    }
  }

  return game;
});
