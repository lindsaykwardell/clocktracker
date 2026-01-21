import { FavoriteGame } from "@prisma/client";
import { User } from "@supabase/supabase-js";
import { prisma } from "~/server/utils/prisma";
import { getUserId } from "~/server/utils/getUserId";

export default defineEventHandler(
  async (
    handler
  ): Promise<{
    status: "deleted" | "added";
    data: {
      id: number;
      game_id: string;
    };
  }> => {
    const user: User | null = handler.context.user;
    const gameId = handler.context.params?.id;

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

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
      select: {
        id: true,
        user_id: true,
      },
    });

    if (!game) {
      throw createError({
        status: 404,
        statusMessage: "Not Found",
      });
    }

    if (game.user_id !== userId) {
      throw createError({
        status: 403,
        statusMessage: "Forbidden",
      });
    }

    // Check if it's already a favorite
    const existingFavorite = await prisma.favoriteGame.findFirst({
      where: {
        user_id: userId,
        game_id: game.id,
      },
      select: {
        id: true,
        game_id: true,
      },
    });

    if (existingFavorite) {
      // delete it
      await prisma.favoriteGame.delete({
        where: {
          id: existingFavorite.id,
        },
      });

      return {
        status: "deleted",
        data: existingFavorite,
      };
    } else {
      // add it
      const favorite = await prisma.favoriteGame.create({
        data: {
          user_id: userId,
          game_id: game.id,
        },
        select: {
          id: true,
          game_id: true,
        },
      });

      return {
        status: "added",
        data: favorite,
      };
    }
  }
);
