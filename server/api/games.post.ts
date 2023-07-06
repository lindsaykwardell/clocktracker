import type { User } from "@supabase/supabase-js";
import { PrismaClient, Game, Character } from "@prisma/client";

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const body = await readBody<
    (Game & { player_characters: Character[] }) | null
  >(handler);

  if (!user) {
    throw createError({
      status: 401,
      statusMessage: "Unauthorized",
    });
  }

  if (!body) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const prisma = new PrismaClient();
  const newGame: Game = await prisma.game.create({
    data: {
      ...body,
      date: new Date(body.date),
      user_id: user.id,
      player_characters: {
        create: [...body.player_characters],
      },
    },
  });

  return newGame;
});
