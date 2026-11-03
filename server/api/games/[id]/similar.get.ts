import type { SupabaseUser as User } from "~/server/utils/supabaseUser";
import dayjs from "dayjs";
import { prisma } from "~/server/utils/prisma";

export default defineEventHandler(async (handler) => {
  const me: User | null = handler.context.user;
  const gameId = handler.context.params?.id;

  if (!gameId || !me) {
    throw createError({
      status: 400,
      statusMessage: "Bad Request",
    });
  }

  // Lightweight query to get just the fields needed for similarity matching
  const game = await prisma.game.findFirst({
    where: {
      id: gameId,
      deleted: false,
    },
    select: {
      date: true,
      community_name: true,
      location: true,
      storyteller: true,
      script: true,
      player_count: true,
      traveler_count: true,
      grimoire: {
        select: {
          tokens: {
            select: { player_name: true },
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

  const player_names: string[] = [
    ...new Set(
      game.grimoire.flatMap(({ tokens }) =>
        tokens.map((token) => token.player_name)
      )
    ),
  ];

  const similar_games = await prisma.game.findMany({
    where: {
      id: { not: gameId },
      deleted: false,
      user_id: me.id,
      date: {
        lte: dayjs(game.date).add(2, "days").startOf("day").toDate(),
        gte: dayjs(game.date).subtract(2, "days").endOf("day").toDate(),
      },
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
              { player_count: game.player_count },
              { player_count: null },
            ],
          },
        },
        {
          AND: {
            OR: [
              { traveler_count: game.traveler_count },
              { traveler_count: null },
            ],
          },
        },
      ],
    },
    take: 20,
    include: {
      ls_game: {
        select: {
          campaign: {
            select: {
              title: true,
              id: true,
            },
          },
        },
      },
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
              alternate_token_urls: true,
              type: true,
              initial_alignment: true,
              name: true,
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
        select: {
          tokens: {
            select: {
              alignment: true,
              player_name: true,
              role: {
                select: {
                  token_url: true,
                  type: true,
                  initial_alignment: true,
                  name: true,
                },
              },
              related_role: {
                select: {
                  token_url: true,
                },
              },
              player: {
                select: {
                  username: true,
                  display_name: true,
                },
              },
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
          icon: true,
        },
      },
      associated_script: {
        select: {
          version: true,
          script_id: true,
          is_custom_script: true,
          logo: true,
          background: true,
        },
      },
    },
  });

  return similar_games;
});
