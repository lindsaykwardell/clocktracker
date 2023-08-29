import type { User } from "@supabase/supabase-js";
import { PrismaClient, PrivacySetting } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const signedInUser = handler.context.user as User | null;
  const gameId = handler.context.params?.id;

  if (!gameId) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  const game = await prisma.game.findUnique({
    where: {
      id: gameId,
      user: !signedInUser
        ? { privacy: PrivacySetting.PUBLIC }
        : {
            OR: [
              {
                privacy: PrivacySetting.PUBLIC,
              },
              {
                privacy: PrivacySetting.PRIVATE,
                AND: {
                  OR: [
                    {
                      user_id: signedInUser.id,
                    },
                    {
                      friends: {
                        some: {
                          user_id: signedInUser.id,
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
    },
    include: {
      user: {
        select: {
          username: true
        }
      },
      player_characters: {
        include: {
          role: {
            select: {
              token_url: true,
              type: true,
              initial_alignment: true,
            },
          },
          related_role: {
            select: {
              token_url: true,
            },
          },
        },
      },
      grimoire: {
        include: {
          tokens: {
            include: {
              role: true,
              related_role: true,
            },
          },
        },
        orderBy: {
          id: "asc",
        }
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
