import type { User } from "@supabase/supabase-js";
import { PrismaClient, PrivacySetting } from "@prisma/client";
import { fetchGame } from "~/server/utils/fetchGames";

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

  const game = await fetchGame(gameId, me);

  if (!game || !me) {
    throw createError({
      status: 404,
      statusMessage: "Not Found",
    });
  }

  const player_names: string[] = [
    ...new Set(
      game.grimoire.flatMap(({ tokens }) =>
        tokens.map((token) => token.player_name)
      )
    ),
  ];

  const similar_games = await prisma.game.findMany({
    where: {
      id: {
        not: gameId,
      },
      deleted: false,
      user_id: me.id,
      date: game.date,
      parent_game_id: null,
      OR: [
        {
          community_name: {
            equals: game.community_name,
            mode: "insensitive",
          },
        },
        {
          location: {
            equals: game.location,
            mode: "insensitive",
          },
        },
        {
          storyteller: {
            equals: game.storyteller,
            mode: "insensitive",
          },
        },
        {
          script: {
            contains: game.script,
            mode: "insensitive",
          },
        },
        {
          grimoire: {
            some: {
              tokens: {
                some: {
                  player_name: {
                    in: player_names,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        },
        {
          AND: {
            OR: [
              {
                player_count: game.player_count,
              },
              {
                player_count: null,
              },
            ],
          },
        },
        {
          AND: {
            OR: [
              {
                traveler_count: game.traveler_count,
              },
              {
                traveler_count: null,
              },
            ],
          },
        },
      ],
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
      community: {
        select: {
          slug: true,
        },
      },
      associated_script: {
        select: {
          version: true,
        },
      },
    },
  });

  return similar_games;
});
