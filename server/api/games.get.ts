import type { User } from "@supabase/supabase-js";
import { PrismaClient, Game, Character } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  const prisma = new PrismaClient();
  const games: (Game & { player_characters: Character[] })[] =
    await prisma.game.findMany({
      where: {
        user_id: user.id,
      },
      include: {
        player_characters: true,
      },
    });

  return games;
});
