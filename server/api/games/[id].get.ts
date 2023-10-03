import type { User } from "@supabase/supabase-js";
import { PrismaClient, PrivacySetting } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
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
      user: {
        OR: [
          {
            privacy: PrivacySetting.PUBLIC,
          },
          {
            privacy: PrivacySetting.PRIVATE,
            OR: [
              {
                user_id: me?.id || "",
              },
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
            ],
          },
          {
            privacy: PrivacySetting.FRIENDS_ONLY,
            OR: [
              {
                friends: {
                  some: {
                    user_id: me?.id || "",
                  },
                },
              },
              {
                user_id: me?.id || "",
              },
            ],
          },
          {
            privacy: PrivacySetting.PERSONAL,
            user_id: me?.id || "",
          },
        ],
      },
    },
    include: {
      user: {
        select: {
          username: true,
        },
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
        },
      },
      parent_game: {
        select: {
          user: {
            select: {
              username: true,
              display_name: true,
            },
          },
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
