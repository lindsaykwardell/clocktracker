import type { User } from "@supabase/supabase-js";
import { PrismaClient, Game, Character, Grimoire, Token } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
  const gameId = handler.context.params?.id;
  const body = await readBody<
    | (Game & {
        player_characters: (Character & { role?: { token_url: string } })[];
        grimoire: Partial<Grimoire & { tokens: Partial<Token>[] }>[];
      })
    | null
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

  if (!gameId) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const existingGame = await prisma.game.findUnique({
    where: {
      id: gameId,
    },
    include: {
      player_characters: true,
    },
  });

  if (!existingGame || existingGame.user_id !== user.id) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  // delete removed characters
  await prisma.character.deleteMany({
    where: {
      id: {
        in: existingGame.player_characters.map((character) => character.id),
      },
    },
  });

  await prisma.grimoire.deleteMany({
    where: {
      game_id: gameId,
    },
  });

  // update the game
  const game = await prisma.game.update({
    where: {
      id: gameId,
    },
    data: {
      ...body,
      date: new Date(body.date),
      user_id: user.id,
      player_characters: {
        create: [...body.player_characters],
      },
      grimoire: {
        create: [
          ...body.grimoire.map((g) => ({
            ...g,
            tokens: {
              create: g.tokens?.map((token, index) => ({
                role_id: token.role_id,
                related_role_id: token.related_role_id,
                alignment: token.alignment || Alignment.NEUTRAL,
                is_dead: token.is_dead || false,
                order: token.order || index,
                player_name: token.player_name || "",
                player_id: token.player_id,
              })),
            },
          })),
        ],
      },
    },
  });

  return game;
});
