import type { User } from "@supabase/supabase-js";
import { PrismaClient, Game, Character, Token, Grimoire } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const user: User | null = handler.context.user;
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

  const newGame: Game = await prisma.game.create({
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
                alignment: token.alignment || Alignment.GOOD,
                is_dead: token.is_dead || false,
                order: token.order || index,
              })),
            },
          })),
        ],
      },
    },
  });

  return newGame;
});
